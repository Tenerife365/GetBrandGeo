<?php
/**
 * GitHub webhook receiver for getbrandgeo.com  (pure-PHP, no shell, no git).
 *
 * This host has shell access disabled, so PHP's shell_exec/exec are unavailable
 * and a git-based deploy cannot run here. Instead this script deploys using only
 * PHP + HTTPS:
 *
 *   1. Verify the request is a genuine GitHub push (HMAC-SHA256 signature).
 *   2. Read the push payload, which lists exactly which files each commit
 *      added/modified.
 *   3. Answer GitHub with 202 and close the connection BEFORE doing any work.
 *   4. For every changed file under brandgeo/web/, download that one file from
 *      GitHub's raw endpoint (public repo, no auth needed), pinned to the pushed
 *      commit SHA, and write it into the live docroot.
 *
 * Step 3 is not cosmetic. GitHub abandons a webhook delivery after 10 seconds.
 * This script used to answer only after the whole fetch loop had finished, and
 * on this host the fixed cost of getting that far is already about 9.9 seconds:
 * on 2026-07-26 a one-file push was recorded OK at 9.89s and a two-file push in
 * the same minute timed out at 504 and deployed nothing at all. Answering first
 * takes the deploy off GitHub's clock entirely.
 *
 * Consequence worth knowing: GitHub reports 202 whether or not the copy
 * succeeded, so the delivery list is not evidence of a deploy. The public
 * status file written at the end of every run (deploy-status.json in the
 * docroot) is, and so is $LOGFILE on the server. See "Status file" below.
 *
 * Only changed web files are fetched (not the whole repo), so a normal push
 * transfers a handful of small files. Deletions are NOT propagated (removing a
 * file from the repo leaves the live copy in place, a safe default for a live
 * site). Anything outside brandgeo/web/ is ignored, and a short list of private
 * paths under it is never deployed either ($PRIVATE_PATTERNS).
 *
 * Pushes with 20 or more commits: GitHub caps the webhook payload's commits[]
 * at 20, so a bigger push used to deploy only the files of the first 20 and say
 * nothing. When the cap is hit this script now asks the public compare API for
 * the full file list of the before...after range. If that call fails it falls
 * back to commits[] and records truncated=true in the status file.
 *
 * Secret: loaded from $SECRET_OUTSIDE (outside the web root) when that file
 * exists, otherwise from deploy-secret.php next to this script. The outside
 * location is the intended one; the docroot copy is a fallback so that this
 * script can be deployed before the file is moved. The status file says which
 * one loaded. Either way the value must match the GitHub webhook secret.
 *
 * Self-overwrite: when deploy.php itself is in the push, the previous copy is
 * saved to $SELF_BACKUP first and, after the loop, this script GETs its own URL.
 * A healthy deployer answers 403 to an unsigned request; anything else means the
 * new copy is broken, so the backup is restored and rollback=true is recorded.
 *
 * Status file (public, no secrets): sha, started, finished, expected, deployed,
 * failed[], skipped[], truncated, source (commits|compare), secret_location,
 * sapi, finish_fn, rollback. The sha is public on GitHub already.
 *
 * Local testing: the four BRANDGEO_* environment variables below override the
 * production paths so the script can run under "php -S" against a temp docroot.
 * None is set in production.
 */

// --- Config ---------------------------------------------------------------
$OWNER_REPO = 'Tenerife365/GetBrandGeo';        // GitHub owner/repo (public)
$WEB_PREFIX = 'brandgeo/web/';                    // repo path that maps to docroot
$DEPLOYPATH = getenv('BRANDGEO_DEPLOYPATH') ?: '/home/getbran1/getbrandgeo.com/';  // live docroot (trailing slash)
$LOGFILE    = getenv('BRANDGEO_LOGFILE')    ?: '/home/getbran1/repositories/deploy.log';   // outside the web root
$SECRET_OUTSIDE = getenv('BRANDGEO_SECRET_OUTSIDE') ?: '/home/getbran1/repositories/deploy-secret.php';
$SELF_BACKUP    = dirname($LOGFILE) . '/deploy.php.prev';   // previous deployer, outside the web root
$SELF_URL   = getenv('BRANDGEO_SELF_URL') ?: 'https://getbrandgeo.com/deploy.php';
$STATUSFILE = $DEPLOYPATH . 'deploy-status.json';   // public, see header
$MAX_FILES  = 200;                                // sanity cap per push
$COMMIT_CAP = 20;                                 // GitHub's commits[] ceiling per push event
$PRIVATE_PATTERNS = [                             // never deployed, relative to the docroot
    '#^article-builder\.html$#',
    '#^images/_staging/#',
    '#\.bak$#',
    '#^deploy-secret\.php$#',
];

// --- Load the shared secret. Fail closed, no path leak. -------------------
$secretLocation = 'none';
if (is_file($SECRET_OUTSIDE)) {
    require $SECRET_OUTSIDE;
    $secretLocation = 'outside docroot';
} elseif (is_file(__DIR__ . '/deploy-secret.php')) {
    require __DIR__ . '/deploy-secret.php';
    $secretLocation = 'DOCROOT, move it';
} else {
    http_response_code(500); exit('Not configured');
}
if (!defined('DEPLOY_WEBHOOK_SECRET') || DEPLOY_WEBHOOK_SECRET === '') {
    http_response_code(500); exit('Not configured');
}

// --- Verify the request genuinely came from GitHub. -----------------------
$payload   = file_get_contents('php://input');
$sigHeader = $_SERVER['HTTP_X_HUB_SIGNATURE_256'] ?? '';
if ($payload === '' || $sigHeader === '') { http_response_code(403); exit('Forbidden'); }
$expected = 'sha256=' . hash_hmac('sha256', $payload, DEPLOY_WEBHOOK_SECRET);
if (!hash_equals($expected, $sigHeader)) { http_response_code(403); exit('Forbidden'); }

// --- Only act on pushes to main. ------------------------------------------
$event = json_decode($payload, true);
if (!is_array($event) || ($event['ref'] ?? '') !== 'refs/heads/main') {
    http_response_code(200); exit('Ignored');
}

$sha = $event['after'] ?? '';
if (!preg_match('/^[0-9a-f]{40}$/', $sha)) { http_response_code(200); exit('No commit'); }
$before = $event['before'] ?? '';
if (!preg_match('/^[0-9a-f]{40}$/', $before) || $before === str_repeat('0', 40)) { $before = ''; }

// --- Acknowledge now, copy afterwards. ------------------------------------
// Everything above this line is cheap and has already decided the request is a
// genuine push to main, so it is safe to answer. Everything below is the slow
// part and must not run on GitHub's 10 second clock. See the note at the top.
ignore_user_abort(true);          // keep going once the connection is released
@set_time_limit(120);             // the fetch loop can take a while on a big push
// Compression would make the Content-Length below a lie, and a client waiting
// for bytes that never come is exactly the hang this change exists to remove.
@ini_set('zlib.output_compression', '0');
http_response_code(202);
header('Content-Type: text/plain; charset=utf-8');
header('Connection: close');
$ack = "Accepted\n";
header('Content-Length: ' . strlen($ack));
echo $ack;
// Clear any buffering in front of us. Bounded: ob_end_flush() can refuse to
// pop a buffer it does not own, and an unbounded loop on that is a hang.
for ($i = 0; $i < 10 && ob_get_level() > 0; $i++) { @ob_end_flush(); }
@flush();
// Release the connection. php-fpm and LiteSpeed's lsapi each expose their own
// call for this; if neither exists, the Content-Length and Connection headers
// above are enough for the client to treat the response as complete.
$finishFn = 'none';
if (function_exists('fastcgi_finish_request')) {
    $finishFn = 'fastcgi_finish_request';
    fastcgi_finish_request();
} elseif (function_exists('litespeed_finish_request')) {
    $finishFn = 'litespeed_finish_request';
    litespeed_finish_request();
}

$started = gmdate('Y-m-d\TH:i:s\Z');

// --- Collect changed files under the web prefix. --------------------------
// commits[] is complete below GitHub's cap. At the cap the payload is a prefix
// of the push, so the compare API is asked for the whole range instead.
$commits = $event['commits'] ?? [];
$source = 'commits';
$truncated = false;
$changed = [];
if (count($commits) >= $COMMIT_CAP && $before !== '') {
    $full = compareFiles($OWNER_REPO, $before, $sha);
    if ($full !== null) {
        $source = 'compare';
        foreach ($full as $path) {
            if (strpos($path, $WEB_PREFIX) === 0) { $changed[$path] = true; }
        }
    } else {
        $truncated = true;   // fall through to the capped list, and say so
    }
}
if ($source === 'commits') {
    if (count($commits) >= $COMMIT_CAP) { $truncated = true; }
    foreach ($commits as $commit) {
        foreach (['added', 'modified'] as $k) {
            foreach (($commit[$k] ?? []) as $path) {
                if (strpos($path, $WEB_PREFIX) === 0) { $changed[$path] = true; }
            }
        }
    }
}
$changed = array_keys($changed);

$log = ['=== Deploy ' . $started . " sha=$sha files=" . count($changed)
      . " source=$source" . ($truncated ? ' TRUNCATED' : '')
      . " secret=$secretLocation finish=$finishFn sapi=" . php_sapi_name() . ' ==='];

$done = 0;
$failed = [];
$skipped = [];
$selfTouched = false;
foreach ($changed as $i => $path) {
    if ($i >= $MAX_FILES) { $log[] = "cap reached at $MAX_FILES"; $truncated = true; break; }
    $rel = substr($path, strlen($WEB_PREFIX));
    if ($rel === '' || strpos($rel, '..') !== false) {   // no traversal
        $log[] = "skipped (traversal): $rel";
        $skipped[] = $rel;
        continue;
    }
    if (isPrivate($rel, $PRIVATE_PATTERNS)) {
        $log[] = "skipped (private): $rel";
        $skipped[] = $rel;
        continue;
    }
    $rawUrl = "https://raw.githubusercontent.com/$OWNER_REPO/$sha/" . str_replace('%2F', '/', rawurlencode($path));
    $body = httpGet($rawUrl);
    if ($body === null) { $log[] = "FETCH FAIL: $rel"; $failed[] = $rel; continue; }
    $dest = $DEPLOYPATH . $rel;
    @mkdir(dirname($dest), 0755, true);
    $backedUp = false;
    if ($rel === 'deploy.php' && is_file($dest)) {
        // Keep the working deployer somewhere a broken one can be undone from.
        @mkdir(dirname($SELF_BACKUP), 0755, true);
        $backedUp = @copy($dest, $SELF_BACKUP);
        $log[] = $backedUp ? 'backup: deploy.php.prev written' : 'backup: could not write deploy.php.prev, self-check skipped';
    }
    // Write atomically: temp file then rename, so a reader never sees a half file.
    $tmp = $dest . '.tmp_' . getmypid();
    if (file_put_contents($tmp, $body) !== false && @rename($tmp, $dest)) {
        $log[] = "deployed: $rel (" . strlen($body) . 'b)';
        $done++;
        // Only a deployer that was actually replaced needs the self-check; a
        // failed write leaves the previous copy in place.
        if ($backedUp) { $selfTouched = true; }
    } else {
        @unlink($tmp);
        $log[] = "WRITE FAIL: $rel";
        $failed[] = $rel;
    }
}

// --- Self-check after overwriting the deployer. ---------------------------
// An unsigned GET must get 403 from a healthy deployer. A parse error gives
// 500, a blank page 200; either means the new copy cannot deploy the fix for
// itself, so the previous copy goes back.
$rollback = false;
if ($selfTouched) {
    $code = httpStatus($SELF_URL);
    if ($code === 0) { sleep(2); $code = httpStatus($SELF_URL); }   // one retry on a failed request, not on a wrong answer
    if ($code === 403) {
        $log[] = "self-check: deploy.php answers 403, ok";
    } else {
        $rollback = @copy($SELF_BACKUP, $DEPLOYPATH . 'deploy.php');
        $log[] = "self-check: deploy.php answered $code, " . ($rollback ? 'ROLLED BACK to deploy.php.prev' : 'ROLLBACK FAILED');
        $failed[] = 'deploy.php (self-check)';
    }
}

$log[] = "=== done: $done/" . count($changed) . ' file(s) ===';
@file_put_contents($LOGFILE, implode("\n", $log) . "\n", FILE_APPEND | LOCK_EX);

// --- Status file, the public success signal. ------------------------------
$status = [
    'sha'             => $sha,
    'before'          => $before,
    'started'         => $started,
    'finished'        => gmdate('Y-m-d\TH:i:s\Z'),
    'expected'        => count($changed),
    'deployed'        => $done,
    'failed'          => $failed,
    'skipped'         => $skipped,
    'truncated'       => $truncated,
    'source'          => $source,
    'commits_in_payload' => count($commits),
    'secret_location' => $secretLocation,
    'sapi'            => php_sapi_name(),
    'finish_fn'       => $finishFn,
    'rollback'        => $rollback,
];
$statusTmp = $STATUSFILE . '.tmp_' . getmypid();
if (file_put_contents($statusTmp, json_encode($status, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n") !== false) {
    @rename($statusTmp, $STATUSFILE);
}

// The 202 already went out above. Nothing left to say to a closed connection.
exit;

// --- Helpers ----------------------------------------------------------------

function isPrivate(string $rel, array $patterns): bool {
    foreach ($patterns as $re) { if (preg_match($re, $rel)) { return true; } }
    return false;
}

/** Full file list for before...after via the public compare API, or null. */
function compareFiles(string $ownerRepo, string $before, string $after): ?array {
    // Owner, repo and both shas are validated or fixed above, so this URL cannot
    // be steered by the payload to any other host or path.
    $url  = "https://api.github.com/repos/$ownerRepo/compare/$before...$after?per_page=250";
    $body = httpGet($url, ['Accept: application/vnd.github+json']);
    if ($body === null) { return null; }
    $data = json_decode($body, true);
    if (!is_array($data) || !isset($data['files']) || !is_array($data['files'])) { return null; }
    $out = [];
    foreach ($data['files'] as $f) {
        $st = $f['status'] ?? '';
        if (!in_array($st, ['added', 'modified', 'renamed', 'copied', 'changed'], true)) { continue; }
        if (isset($f['filename']) && is_string($f['filename'])) { $out[] = $f['filename']; }
    }
    return $out;
}

/** HTTP status of a GET, or 0 when the request itself failed. */
function httpStatus(string $url): int {
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_TIMEOUT        => 15,
            CURLOPT_USERAGENT      => 'BrandGEO-Deploy/1.1',
            CURLOPT_SSL_VERIFYPEER => true,
        ]);
        curl_exec($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        curl_close($ch);
        return $code;
    }
    $ctx = stream_context_create(['http' => [
        'timeout' => 15, 'ignore_errors' => true,
        'header' => "User-Agent: BrandGEO-Deploy/1.1\r\n",
    ]]);
    @file_get_contents($url, false, $ctx);
    if (isset($http_response_header[0]) && preg_match('#HTTP/\S+\s+(\d{3})#', $http_response_header[0], $m)) {
        return (int) $m[1];
    }
    return 0;
}

/** HTTPS GET helper: curl first, then allow_url_fopen fallback. */
function httpGet(string $url, array $headers = []): ?string {
    $headers[] = 'User-Agent: BrandGEO-Deploy/1.1';
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT        => 20,
            CURLOPT_HTTPHEADER     => $headers,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);
        $out  = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        curl_close($ch);
        return ($out !== false && $code === 200) ? $out : null;
    }
    if (ini_get('allow_url_fopen')) {
        $ctx = stream_context_create(['http' => [
            'timeout' => 20, 'header' => implode("\r\n", $headers) . "\r\n",
        ]]);
        $out = @file_get_contents($url, false, $ctx);
        return $out === false ? null : $out;
    }
    return null;
}
