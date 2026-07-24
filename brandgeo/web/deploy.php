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
 *   3. For every changed file under brandgeo/web/, download that one file from
 *      GitHub's raw endpoint (public repo, no auth needed), pinned to the pushed
 *      commit SHA, and write it into the live docroot.
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

http_response_code(202);
exit('Accepted');

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
