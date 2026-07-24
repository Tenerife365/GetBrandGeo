<?php
/**
 * GitHub webhook receiver for getbrandgeo.com.
 *
 * Fixes two problems in the previous version of this file:
 *  1. It only ran `git pull` into the repository clone (/home/getbran1/
 *     repositories/GetBrandGeo), which never copied anything into the live
 *     docroot (/home/getbran1/getbrandgeo.com/). That copy step is what
 *     .cpanel.yml's deploy tasks do, but a plain `git pull` does not trigger
 *     them -- only cPanel's own "Deploy" action does. This file now performs
 *     that same diff-based copy itself, so a push actually goes live.
 *  2. It had no verification the request came from GitHub, and it echoed raw
 *     git/shell output to the caller. Now it requires a valid HMAC-SHA256
 *     signature (GitHub's X-Hub-Signature-256 header) and logs to a file
 *     outside the web root instead of the HTTP response.
 *
 * Only files under brandgeo/web/ that changed since the last successful run
 * are copied (honouring "upload only what changed, nothing else"). Deletions
 * are intentionally NOT propagated -- removing a file from the repo leaves the
 * live copy in place, which is the safe default for a site with live users.
 *
 * One-time setup:
 *  - Upload deploy-secret.php next to this file (it is git-ignored, so a pull
 *    never carries it). It must define DEPLOY_WEBHOOK_SECRET.
 *  - In GitHub (repo Settings > Webhooks): payload URL = this file, content
 *    type = application/json, secret = the SAME value, event = push only.
 */

// --- Load the shared secret (never committed). Fail closed, no path leak. ---
$secretFile = __DIR__ . '/deploy-secret.php';
if (!is_file($secretFile)) {
    http_response_code(500);
    exit('Not configured');
}
require $secretFile; // defines DEPLOY_WEBHOOK_SECRET
if (!defined('DEPLOY_WEBHOOK_SECRET') || DEPLOY_WEBHOOK_SECRET === '') {
    http_response_code(500);
    exit('Not configured');
}

$GIT_DIR    = '/home/getbran1/repositories/GetBrandGeo/.git';
$WORK_TREE  = '/home/getbran1/repositories/GetBrandGeo';
$DEPLOYPATH = '/home/getbran1/getbrandgeo.com/';
// Own marker, distinct from .cpanel.yml's, so the two deploy paths never
// corrupt each other's state if both ever run.
$MARKER     = $DEPLOYPATH . '.last_webhook_deploy_commit';
$LOGFILE    = '/home/getbran1/repositories/deploy.log'; // outside the web root
$LOCKFILE   = '/home/getbran1/repositories/deploy.lock';

function respond(int $code, string $msg): void {
    http_response_code($code);
    echo $msg;
    exit;
}

// --- Verify the request genuinely came from GitHub. ---
$payload = file_get_contents('php://input');
$sigHeader = $_SERVER['HTTP_X_HUB_SIGNATURE_256'] ?? '';
if ($payload === '' || $sigHeader === '') {
    respond(403, 'Forbidden');
}
$expected = 'sha256=' . hash_hmac('sha256', $payload, DEPLOY_WEBHOOK_SECRET);
if (!hash_equals($expected, $sigHeader)) {
    respond(403, 'Forbidden');
}

// --- Only deploy for pushes to main. ---
$event = json_decode($payload, true);
if (($event['ref'] ?? '') !== 'refs/heads/main') {
    respond(200, 'Ignored (not main)');
}

// --- Serialise runs so two near-simultaneous pushes can't interleave. ---
$lock = fopen($LOCKFILE, 'c');
if ($lock === false || !flock($lock, LOCK_EX | LOCK_NB)) {
    respond(202, 'Busy'); // another deploy is already running; it will pick up HEAD
}

function run(string $cmd): string {
    return shell_exec($cmd . ' 2>&1') ?? '';
}

$git = 'git --git-dir=' . escapeshellarg($GIT_DIR) . ' --work-tree=' . escapeshellarg($WORK_TREE);
$log = ['=== Deploy run: ' . gmdate('Y-m-d\TH:i:s\Z') . ' ==='];

$log[] = run("$git pull origin main");

// First run (no marker): copy every file currently tracked under brandgeo/web/.
// Subsequent runs: only files added/copied/modified/renamed since last time.
if (is_file($MARKER)) {
    $prev = trim((string) file_get_contents($MARKER));
    $changed = run("$git diff --name-only --diff-filter=ACMR " . escapeshellarg($prev) . ' HEAD -- brandgeo/web/');
} else {
    $changed = run("$git ls-tree -r --name-only HEAD -- brandgeo/web/");
}

$count = 0;
foreach (preg_split('/\r?\n/', trim($changed)) as $file) {
    $file = trim($file);
    if ($file === '' || strpos($file, 'brandgeo/web/') !== 0) {
        continue; // never write outside brandgeo/web/
    }
    $rel  = substr($file, strlen('brandgeo/web/'));
    if ($rel === '' || strpos($rel, '..') !== false) {
        continue; // paranoia: no path traversal
    }
    $src  = $WORK_TREE . '/' . $file;
    $dest = $DEPLOYPATH . $rel;
    if (!is_file($src)) {
        $log[] = "skip (not a file after pull): $rel";
        continue;
    }
    @mkdir(dirname($dest), 0755, true);
    if (copy($src, $dest)) {
        $log[] = "deployed: $rel";
        $count++;
    } else {
        $log[] = "FAILED to copy: $rel";
    }
}
if ($count === 0) {
    $log[] = 'no changed files under brandgeo/web/';
}

$head = trim(run("$git rev-parse HEAD"));
if ($head !== '') {
    file_put_contents($MARKER, $head);
}
$log[] = "=== Deploy complete ($count file(s)): $head ===";
file_put_contents($LOGFILE, implode("\n", $log) . "\n", FILE_APPEND | LOCK_EX);

flock($lock, LOCK_UN);
fclose($lock);

respond(202, 'Accepted');
