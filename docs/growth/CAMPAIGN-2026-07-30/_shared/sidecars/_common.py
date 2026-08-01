# Shared helpers for the sidecar generators.
#
# A sidecar is a .txt file sitting beside a postable asset, carrying ONLY the
# text that gets pasted at posting time. No headings, no counts, no commentary.
# The naming contract is documented in _shared/sidecars/README.md and in each
# channel folder's PAIRING.md.

import os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))


def write(rel_path, text):
    """Write one sidecar. Trailing newline, LF endings, UTF-8, no BOM."""
    path = os.path.join(ROOT, rel_path)
    body = text.strip("\n") + "\n"
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(body)
    return path


def unwrap(text):
    """Undo the 78-column hard wrapping that markdown source uses.

    Paragraph breaks (blank lines) survive. Line breaks inside a paragraph are
    a formatting artefact of the .md file and become spaces, because a sidecar
    is pasted into a composer where those breaks would be real.
    Words are never changed.
    """
    out = []
    for para in text.strip("\n").split("\n\n"):
        lines = [ln.strip() for ln in para.split("\n") if ln.strip()]
        out.append(" ".join(lines))
    return "\n\n".join(out)


def unquote(text):
    """Strip a markdown blockquote prefix, then unwrap."""
    lines = []
    for ln in text.split("\n"):
        if ln.startswith("> "):
            lines.append(ln[2:])
        elif ln.strip() == ">":
            lines.append("")
        else:
            lines.append(ln)
    return unwrap("\n".join(lines))
