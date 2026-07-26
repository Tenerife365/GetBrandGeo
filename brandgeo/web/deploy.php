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
 * Consequence worth knowing: GitHub now reports 202 whether or not the copy
 * succeeded, so the delivery list is no longer evidence of a deploy. $LOGFILE
 * below, and the Last-Modified header on the live file, are.
 *
 * Only changed web files are fetched (not the whole repo), so a normal push
 * transfers a handful of small files. Deletions are NOT propagated (removing a
 * file from the repo leaves the live copy in place — safe default for a live
 * site). Anything outside brandgeo/web/ is ignored.
 *
 * Secret lives in deploy-secret.php next to this file (git-ignored, uploaded to
 * the server by hand). It must match the GitHub webhook secret.
 */

// --- Config ---------------------------------------------------------------
$OWNER_REPO = 'Tenerife365/GetBrandGeo';        // GitHub owner/repo (public)
$WEB_PREFIX = 'brandgeo/web/';                    // repo path that maps to docroot
$DEPLOYPATH = '/home/getbran1/getbrandgeo.com/';  // live docroot (trailing slash)
$LOGFILE    = '/home/getbran1/repositories/deploy.log';   // outside the web root
$MAX_FILES  = 200;                                // sanity cap per push

// --- Load the shared secret. Fail closed, no path leak. -------------------
$secretFile = __DIR__ . '/deploy-secret.php';
if (!is_file($secretFile)) { http_response_code(500); exit('Not configured'); }
require $secretFile; // defines DEPLOY_WEBHOOK_SECRET
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
if (function_exists('fastcgi_finish_request')) {
    fastcgi_finish_request();
} elseif (function_exists('litespeed_finish_request')) {
    litespeed_finish_request();
}

// --- Collect changed files under the web prefix across all commits. -------
$changed = [];
foreach (($event['commits'] ?? []) as $commit) {
    foreach (['added', 'modified'] as $k) {
        foreach (($commit[$k] ?? []) as $path) {
            if (strpos($path, $WEB_PREFIX) === 0) { $changed[$path] = true; }
        }
    }
}
$changed = array_keys($changed);

$log = ['=== Deploy ' . gmdate('Y-m-d\TH:i:s\Z') . " sha=$sha files=" . count($changed) . ' ==='];

$done = 0;
foreach ($changed as $i => $path) {
    if ($i >= $MAX_FILES) { $log[] = "cap reached at $MAX_FILES"; break; }
    $rel = substr($path, strlen($WEB_PREFIX));
    if ($rel === '' || strpos($rel, '..') !== false) { continue; } // no traversal
    $rawUrl = "https://raw.githubusercontent.com/$OWNER_REPO/$sha/" . str_replace('%2F', '/', rawurlencode($path));
    $body = httpGet($rawUrl);
    if ($body === null) { $log[] = "FETCH FAIL: $rel"; continue; }
    $dest = $DEPLOYPATH . $rel;
    @mkdir(dirname($dest), 0755, true);
    // Write atomically: temp file then rename, so a reader never sees a half file.
    $tmp = $dest . '.tmp_' . getmypid();
    if (file_put_contents($tmp, $body) !== false && rename($tmp, $dest)) {
        $log[] = "deployed: $rel (" . strlen($body) . 'b)';
        $done++;
    } else {
        @unlink($tmp);
        $log[] = "WRITE FAIL: $rel";
    }
}
$log[] = "=== done: $done/" . count($changed) . ' file(s) ===';
@file_put_contents($LOGFILE, implode("\n", $log) . "\n", FILE_APPEND | LOCK_EX);

// The 202 already went out above. Nothing left to say to a closed connection.
exit;

// --- HTTPS GET helper: curl first, then allow_url_fopen fallback. ---------
function httpGet(string $url): ?string {
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT        => 20,
            CURLOPT_USERAGENT      => 'BrandGEO-Deploy/1.0',
            CURLOPT_SSL_VERIFYPEER => true,
        ]);
        $out  = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        curl_close($ch);
        return ($out !== false && $code === 200) ? $out : null;
    }
    if (ini_get('allow_url_fopen')) {
        $ctx = stream_context_create(['http' => [
            'timeout' => 20, 'header' => "User-Agent: BrandGEO-Deploy/1.0\r\n",
        ]]);
        $out = @file_get_contents($url, false, $ctx);
        return $out === false ? null : $out;
    }
    return null;
}
