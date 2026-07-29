"""
BrandGEO local preview server with a live editor overlay.

WHY THIS EXISTS
  Reviewing the site through a console snippet works but is clumsy. This serves
  the same files and injects a small editor panel so you can click an element,
  type an instruction, tweak theme tokens live, and send the lot back to Claude.

THE SAFETY PROPERTY THAT MATTERS
  `deploy.php` copies every changed file under `brandgeo/web/` to the cPanel
  docroot. So the overlay is NEVER written into that directory. It is injected
  into the HTML response in memory, on the way out. Nothing under `brandgeo/web/`
  is touched, which means the editor cannot ship no matter what gets committed.

  Everything this server adds lives at paths starting `/__`, which no real page
  references.

ROUTES ADDED
  GET  /__editor.js   the overlay, read from editor.js next to this file
  POST /__notes       append a note; Claude reads notes.json directly
  GET  /__notes       read them back
  POST /__reset       clear them, guarded, see below

WHY /__reset IS GUARDED
  notes.json sits next to this file, so every instance of this server shares it
  no matter which port it runs on. A reset fired from the port in front of the
  dashboard therefore deletes notes typed against the marketing site. That has
  already destroyed a set of real notes once. So:
    - the request must carry {"confirm": "delete-all-notes"}, and
    - a timestamped copy is written into notes-backups/ before anything is
      cleared, so a mistake is recoverable rather than final.
  Nothing else on the wire can trigger it, which is the point.

USAGE
  Started via .claude/launch.json entry "brandgeo-web-editor", or by hand:
      python docs/growth/local-preview/devserver.py 8900
  Then open http://localhost:8900

  Bind is 127.0.0.1 only. Nothing is exposed off this machine.
"""

import argparse
import json
import os
import sys
import threading
import urllib.error
import urllib.request
from datetime import datetime, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
NOTES = os.path.join(HERE, "notes.json")
BACKUPS = os.path.join(HERE, "notes-backups")
EDITOR = os.path.join(HERE, "editor.js")

# The exact string /__reset demands. Anything else is refused with a 400.
RESET_CONFIRM = "delete-all-notes"

# ThreadingHTTPServer means two browser tabs can POST at once. Without this the
# read-modify-write below can lose a note or hand out a duplicate id.
_LOCK = threading.Lock()

# Set by main(). WEB is the static root; PROXY, when set, means we sit in front
# of a framework dev server (Astro, Next, Vite) instead of serving files.
WEB = os.path.join(ROOT, "brandgeo", "web")
PROXY = None

EDITOR_TAG = b'<script src="/__editor.js" defer></script>'


def _inject(body):
    """Put the overlay tag before the LAST </body>, not the first.

    The first one is not necessarily the real one. brandgeo-dashboard's
    index.html carries a comment reading "Placed before </body> rather than in
    <head>", and a first-match replace lands the script tag inside that comment,
    where it never executes. The overlay was silently dead on the whole
    dashboard because of it. rfind on a lowercased copy also survives </BODY>.
    """
    i = body.lower().rfind(b"</body>")
    if i == -1:
        return body + b"\n" + EDITOR_TAG + b"\n"
    return body[:i] + EDITOR_TAG + b"\n" + body[i:]


def _read_notes():
    if not os.path.exists(NOTES):
        return []
    try:
        with open(NOTES, encoding="utf-8") as fh:
            return json.load(fh)
    except (json.JSONDecodeError, OSError):
        return []


def _dump(path, items):
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(items, fh, indent=2, ensure_ascii=False)
        fh.write("\n")


def _write_notes(items):
    # Write beside the target and rename over it, so a crash mid-write cannot
    # leave the owner with a truncated or empty notes.json.
    tmp = NOTES + ".tmp"
    _dump(tmp, items)
    os.replace(tmp, NOTES)


def _next_id(items):
    # len(items) + 1 collides as soon as anything is ever removed by hand.
    highest = 0
    for note in items:
        try:
            highest = max(highest, int(note.get("id") or 0))
        except (TypeError, ValueError):
            continue
    return highest + 1


def _backup_notes():
    """Copy the current notes.json into notes-backups/, timestamped.

    Returns (relative_path, count) or (None, 0) when there was nothing to save.
    """
    items = _read_notes()
    if not items:
        return None, 0
    os.makedirs(BACKUPS, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    path = os.path.join(BACKUPS, f"notes-{stamp}.json")
    suffix = 1
    while os.path.exists(path):
        path = os.path.join(BACKUPS, f"notes-{stamp}-{suffix}.json")
        suffix += 1
    _dump(path, items)
    return os.path.relpath(path, HERE).replace(os.sep, "/"), len(items)


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=WEB, **kw)

    def log_message(self, fmt, *args):
        # Quiet the per-request noise; only the notes matter in the log.
        if "__notes" in (args[0] if args else ""):
            super().log_message(fmt, *args)

    # ── the overlay ──────────────────────────────────────────────────────────
    def _serve_editor(self):
        try:
            with open(EDITOR, "rb") as fh:
                body = fh.read()
        except OSError:
            self.send_error(404, "editor.js not found next to devserver.py")
            return
        self.send_response(200)
        self.send_header("Content-Type", "application/javascript; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _send_json(self, obj, code=200):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path.split("?")[0] == "/__editor.js":
            return self._serve_editor()
        if self.path.split("?")[0] == "/__notes":
            return self._send_json(_read_notes())
        if PROXY:
            return self._proxy_get()
        return super().do_GET()

    # ── proxy mode, for framework dev servers (Astro, Next, Vite) ────────────
    def _proxy_get(self):
        """Fetch upstream and inject the overlay into HTML responses.

        Static-file mode cannot work in front of a framework that renders on
        request. Proxying keeps the same guarantee: the overlay is added on the
        way out, so nothing is written into the site source and it cannot ship.

        HMR websockets are NOT proxied. Run the framework dev server on its own
        port and open it directly when you want hot reload; open this port when
        you want the editor. One refresh is a small price for a zero-touch
        overlay.
        """
        url = PROXY.rstrip("/") + self.path
        req = urllib.request.Request(url, headers={"Accept": self.headers.get("Accept", "*/*")})
        try:
            with urllib.request.urlopen(req, timeout=20) as up:
                body = up.read()
                ctype = up.headers.get("Content-Type", "application/octet-stream")
                status = up.status
        except urllib.error.HTTPError as e:
            body, ctype, status = e.read(), e.headers.get("Content-Type", "text/plain"), e.code
        except urllib.error.URLError as e:
            msg = f"upstream {PROXY} unreachable: {e.reason}".encode()
            self.send_response(502)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.send_header("Content-Length", str(len(msg)))
            self.end_headers()
            self.wfile.write(msg)
            return

        if "text/html" in ctype:
            body = _inject(body)

        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        path = self.path.split("?")[0]
        if path not in ("/__notes", "/__reset"):
            return self.send_error(405, "POST is only accepted on /__notes and /__reset")

        length = int(self.headers.get("Content-Length") or 0)
        if length > 256 * 1024:
            return self.send_error(413, "note too large")
        raw = self.rfile.read(length) if length else b""
        try:
            payload = json.loads(raw or b"{}")
        except json.JSONDecodeError:
            return self.send_error(400, "body must be JSON")

        if path == "/__reset":
            return self._reset(payload)

        with _LOCK:
            items = _read_notes()
            incoming = payload if isinstance(payload, list) else [payload]
            for note in incoming:
                if not isinstance(note, dict):
                    continue
                note["received_at"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
                note["id"] = _next_id(items)
                items.append(note)
            _write_notes(items)
            total = len(items)
        return self._send_json({"ok": True, "count": total})

    def _reset(self, payload):
        """Clear notes.json, but only deliberately, and never without a copy."""
        confirm = None
        if isinstance(payload, dict):
            confirm = payload.get("confirm")
        if confirm is None:
            from urllib.parse import parse_qs, urlparse
            confirm = (parse_qs(urlparse(self.path).query).get("confirm") or [None])[0]

        if confirm != RESET_CONFIRM:
            existing = len(_read_notes())
            return self._send_json({
                "ok": False,
                "error": (
                    f'refused: /__reset needs {{"confirm": "{RESET_CONFIRM}"}}. '
                    f"{existing} note(s) left untouched. notes.json is shared by every "
                    "preview server on this machine regardless of port, so an "
                    "unconfirmed reset here would delete notes taken elsewhere."
                ),
                "count": existing,
            }, code=400)

        with _LOCK:
            backup, archived = _backup_notes()
            _write_notes([])
        return self._send_json({"ok": True, "count": 0, "archived": archived, "backup": backup})

    # ── inject the overlay into HTML on the way out ──────────────────────────
    def send_head(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            for index in ("index.html", "index.htm"):
                candidate = os.path.join(path, index)
                if os.path.exists(candidate):
                    path = candidate
                    break

        if not path.endswith((".html", ".htm")) or not os.path.exists(path):
            return super().send_head()

        try:
            with open(path, "rb") as fh:
                body = fh.read()
        except OSError:
            return super().send_head()

        body = _inject(body)

        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        # No caching, so an edit is one refresh away rather than a cache-bust dance.
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.end_headers()

        import io
        return io.BytesIO(body)


def main():
    global WEB, PROXY
    ap = argparse.ArgumentParser(description="Local preview server with an editor overlay.")
    ap.add_argument("port", nargs="?", type=int, default=8900)
    ap.add_argument("--root", help="static directory to serve (default: brandgeo/web)")
    ap.add_argument("--proxy", help="proxy an existing dev server instead, e.g. http://localhost:4321 "
                                    "for Astro. Use this for any framework that renders on request.")
    args = ap.parse_args()

    PROXY = args.proxy
    if args.root:
        WEB = os.path.abspath(args.root)
    if not PROXY and not os.path.isdir(WEB):
        sys.exit(f"web root not found: {WEB}. Pass --root or --proxy.")
    if not os.path.exists(NOTES):
        _write_notes([])

    port = args.port
    srv = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print(f"proxying {PROXY}" if PROXY else f"serving {WEB}")
    print(f"  http://localhost:{port}   (overlay injected in-flight, nothing written to the site source)")
    print(f"  notes -> {NOTES}")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\nstopped")


if __name__ == "__main__":
    main()
