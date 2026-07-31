#!/usr/bin/env python3
"""
cloud_voice_clone.py - voiceover connector for the AskMyWebsite[AI] video pipeline.

Implements the two-stage gate:

  Stage 1  --mode sample   two takes of the sample block, one per tone config,
                           written to assets/samples/sample_A.wav and sample_B.wav.
                           Execution stops here until a take is approved.

  Stage 2  --mode full     the whole script in the approved configuration, written to
                           assets/audio/voiceover_<timestamp>.wav, then linked into the
                           Remotion composition's <Audio> src.

Two backends, because the channel has not settled the question yet:

  elevenlabs   Leo, licensed, and already the voice on the published demo clip.
               Env: ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID
  gradio       any Gradio TTS/clone Space. Speed and reference-audio parameter names
               differ per Space, so they are passed through with --extra.
               Env: GRADIO_SPACE, HF_TOKEN (optional, for private Spaces)

For the calibration decision, Sample A and Sample B can come from different backends:

    python scripts/cloud_voice_clone.py --mode sample \
        --script content/.../video/voiceover.md \
        --take-a elevenlabs --take-b gradio

Dependencies:
    urllib + wave are stdlib. gradio_client is only imported if that backend is used:
        pip install gradio_client
    Loudness normalisation shells out to ffmpeg when it is on PATH, and is skipped with
    a warning when it is not. Never publish an un-normalised take.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request
import wave
from pathlib import Path

# Project house targets. Mobile feed loudness, mono, per the audio protocol.
LUFS_TARGET = -16.0
TRUE_PEAK = -1.5
SAMPLE_RATE = 24000          # what we request from cloud backends; Piper keeps its own

# The two tone configurations the gate always compares.
#
# `speed`, `stability` and `style` are the cloud-backend knobs. Piper has no equivalent,
# so each tone carries an explicit `piper` block instead of deriving one, which would be
# guesswork dressed up as a formula. length_scale is inverse speed: larger is slower.
# Lower noise reads flatter and steadier, which is what the analytical take wants.
TONES = {
    "A": {
        "label": "energetic operator",
        "speed": 1.00, "stability": 0.38, "style": 0.45,
        "piper": {"length_scale": 1.00, "noise_scale": 0.75, "noise_w_scale": 0.85},
    },
    "B": {
        "label": "deep analytical",
        "speed": 0.95, "stability": 0.62, "style": 0.20,
        "piper": {"length_scale": 1.05, "noise_scale": 0.55, "noise_w_scale": 0.70},
    },
}


# --------------------------------------------------------------------- backends

class BackendError(RuntimeError):
    pass


def synth_piper(text: str, tone: dict, extra: dict) -> tuple[bytes, int]:
    """Local Piper. No account, no network, no rate limit.

    Returns PCM at the voice model's own rate rather than forcing SAMPLE_RATE, because
    resampling here would need ffmpeg and Piper's output is already clean.

    Voice model resolution order: --extra voice=<path>, then PIPER_VOICE, then the single
    .onnx in --extra voice_dir / PIPER_VOICE_DIR / assets/voices.
    """
    try:
        from piper import PiperVoice
        from piper.config import SynthesisConfig
    except ImportError:
        raise BackendError("piper-tts is not installed. Run: pip install piper-tts")

    model = extra.get("voice") or os.environ.get("PIPER_VOICE")
    if not model:
        vdir = Path(extra.get("voice_dir")
                    or os.environ.get("PIPER_VOICE_DIR")
                    or "assets/voices")
        found = sorted(vdir.glob("*.onnx")) if vdir.is_dir() else []
        if not found:
            raise BackendError(
                f"No Piper voice model found in {vdir}/. Download one, for example:\n"
                f"    python -m piper.download_voices en_GB-alan-medium "
                f"--download-dir {vdir}\n"
                f"Then check the voice's MODEL_CARD licence before publishing.")
        if len(found) > 1:
            names = ", ".join(p.stem for p in found)
            raise BackendError(
                f"{len(found)} voice models in {vdir}/ ({names}). "
                f"Pick one with --extra voice=<path>.")
        model = str(found[0])

    if not Path(model).is_file():
        raise BackendError(f"Piper voice model not found: {model}")

    voice = PiperVoice.load(model)
    cfg = SynthesisConfig(
        speaker_id=int(extra["speaker"]) if "speaker" in extra else None,
        normalize_audio=True,
        **tone["piper"],
    )

    buf, rate = bytearray(), None
    for chunk in voice.synthesize(text, syn_config=cfg):
        if chunk.sample_channels != 1 or chunk.sample_width != 2:
            raise BackendError(
                f"Unexpected Piper output format: {chunk.sample_channels}ch "
                f"{chunk.sample_width * 8}-bit. Expected mono 16-bit.")
        rate = rate or chunk.sample_rate
        buf += chunk.audio_int16_bytes
    if not buf:
        raise BackendError("Piper produced no audio. Check the text is not empty.")
    return bytes(buf), rate


def synth_elevenlabs(text: str, tone: dict, extra: dict) -> tuple[bytes, int]:
    """Returns raw PCM s16le at SAMPLE_RATE."""
    key = os.environ.get("ELEVENLABS_API_KEY")
    voice = os.environ.get("ELEVENLABS_VOICE_ID") or extra.get("voice_id")
    if not key:
        raise BackendError("ELEVENLABS_API_KEY is not set.")
    if not voice:
        raise BackendError("ELEVENLABS_VOICE_ID is not set (the Leo voice id).")

    url = (f"https://api.elevenlabs.io/v1/text-to-speech/{voice}"
           f"?output_format=pcm_{SAMPLE_RATE}")
    payload = {
        "text": text,
        "model_id": extra.get("model_id", "eleven_multilingual_v2"),
        "voice_settings": {
            "stability": tone["stability"],
            "similarity_boost": float(extra.get("similarity_boost", 0.8)),
            "style": tone["style"],
            "speed": tone["speed"],
            "use_speaker_boost": True,
        },
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode(),
        headers={"xi-api-key": key, "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            return r.read(), SAMPLE_RATE
    except urllib.error.HTTPError as e:
        raise BackendError(f"ElevenLabs {e.code}: {e.read().decode(errors='replace')[:400]}")


def synth_gradio(text: str, tone: dict, extra: dict) -> tuple[bytes, int]:
    """Calls a Gradio TTS Space and returns raw PCM s16le at SAMPLE_RATE.

    Parameter names vary per Space. Inspect the target with `client.view_api()` and pass
    the right ones through --extra, for example:
        --extra api_name=/generate --extra speed_key=speed --extra ref_audio=assets/ref/leo.wav
    """
    try:
        from gradio_client import Client, handle_file
    except ImportError:
        raise BackendError("gradio_client is not installed. Run: pip install gradio_client")

    space = os.environ.get("GRADIO_SPACE") or extra.get("space")
    if not space:
        raise BackendError("GRADIO_SPACE is not set (the Space id or full URL).")

    client = Client(space, hf_token=os.environ.get("HF_TOKEN"))
    kwargs = {extra.get("text_key", "text"): text}
    kwargs[extra.get("speed_key", "speed")] = tone["speed"]
    if ref := extra.get("ref_audio"):
        if not Path(ref).is_file():
            raise BackendError(f"reference audio not found: {ref}")
        kwargs[extra.get("ref_key", "reference_audio")] = handle_file(ref)
    if seed := extra.get("seed"):
        kwargs["seed"] = int(seed)

    result = client.predict(api_name=extra.get("api_name", "/predict"), **kwargs)
    out = result[0] if isinstance(result, (list, tuple)) else result
    if not (isinstance(out, str) and Path(out).is_file()):
        raise BackendError(f"Space returned something that is not an audio path: {out!r}")
    return transcode_to_pcm(Path(out))


BACKENDS = {"piper": synth_piper, "elevenlabs": synth_elevenlabs, "gradio": synth_gradio}


# ----------------------------------------------------------------------- audio

def ffmpeg_bin() -> str | None:
    """Locates ffmpeg even when PATH is stale.

    On Windows, `winget install` updates the user PATH but already-running processes keep
    the old block until they restart, so a freshly installed ffmpeg is invisible to any
    shell spawned from a parent that started earlier. Rather than make everyone restart,
    fall back to the known package roots. FFMPEG_BIN overrides everything.
    """
    if override := os.environ.get("FFMPEG_BIN"):
        return override if Path(override).is_file() else None
    if found := shutil.which("ffmpeg"):
        return found
    roots = [
        Path(os.environ.get("LOCALAPPDATA", "")) / "Microsoft/WinGet/Packages",
        Path("C:/ProgramData/chocolatey/bin"),
        Path(os.environ.get("USERPROFILE", "")) / "scoop/shims",
    ]
    for root in roots:
        if root.is_dir():
            for exe in root.glob("**/ffmpeg.exe"):
                return str(exe)
    return None


def have_ffmpeg() -> bool:
    return ffmpeg_bin() is not None


def transcode_to_pcm(src: Path) -> bytes:
    """Normalises whatever the Space handed back into mono PCM at SAMPLE_RATE."""
    if not have_ffmpeg():
        raise BackendError("ffmpeg is needed to transcode the Space output and is not on PATH.")
    proc = subprocess.run(
        [ffmpeg_bin(), "-v", "error", "-i", str(src), "-f", "s16le",
         "-acodec", "pcm_s16le", "-ac", "1", "-ar", str(SAMPLE_RATE), "-"],
        capture_output=True,
    )
    if proc.returncode != 0:
        raise BackendError(f"ffmpeg transcode failed: {proc.stderr.decode(errors='replace')[:400]}")
    return proc.stdout


def write_wav(pcm: bytes, path: Path, rate: int) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(pcm)


def normalise(path: Path, rate: int) -> bool:
    """Two-pass-free loudnorm to the house target. Returns False if skipped."""
    if not have_ffmpeg():
        print("WARNING: ffmpeg not on PATH, skipping loudness normalisation.\n"
              f"         Target is {LUFS_TARGET} LUFS / {TRUE_PEAK} dBTP. Do not publish "
              "an un-normalised take.", file=sys.stderr)
        return False
    tmp = path.with_suffix(".norm.wav")
    proc = subprocess.run(
        [ffmpeg_bin(), "-v", "error", "-y", "-i", str(path),
         "-af", f"loudnorm=I={LUFS_TARGET}:TP={TRUE_PEAK}:LRA=11",
         "-ar", str(rate), "-ac", "1", str(tmp)],
        capture_output=True,
    )
    if proc.returncode != 0:
        print(f"WARNING: loudnorm failed, keeping the raw take. "
              f"{proc.stderr.decode(errors='replace')[:200]}", file=sys.stderr)
        tmp.unlink(missing_ok=True)
        return False
    tmp.replace(path)
    return True


def duration_s(path: Path) -> float:
    with wave.open(str(path), "rb") as w:
        return w.getnframes() / float(w.getframerate())


# ---------------------------------------------------------------------- script

def read_script(path: Path, block: str) -> str:
    """Pulls a fenced block out of a voiceover.md.

    `full`   the ``` fenced block under "## Full read".
    `sample` the hook plus the script's hardest-to-pronounce line, which is what the gate
             compares. Tone alone is not enough: the data line is where TTS mangles
             acronyms and quantities. Our VO scripts spell numerals out, so a plain digit
             test finds nothing and the line has to be scored on number words and
             acronyms too.
    """
    text = path.read_text(encoding="utf-8")
    fences = re.findall(r"```(?:text)?\s*\n(.*?)```", text, re.S)
    if not fences:
        raise SystemExit(f"No fenced read block found in {path}")
    full = fences[0].strip()
    if block == "full":
        return full
    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", full.replace("\n", " ")) if s.strip()]
    hook = sentences[:2]
    rest = sentences[2:]
    if not rest:
        return " ".join(hook)

    NUM_WORDS = (r"\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|dozen|"
                 r"hundred|thousand|half|third|quarter|percent|minutes?|seconds?)\b")

    def score(s: str) -> int:
        return (3 * len(re.findall(r"\d", s))
                + 3 * len(re.findall(r"\b[A-Z]{2,}\d*\b", s))
                + 2 * len(re.findall(NUM_WORDS, s, re.I)))

    hardest = max(rest, key=score)
    return " ".join(hook + ([hardest] if score(hardest) else []))


# ------------------------------------------------------------------------- cli

def parse_extra(pairs: list[str]) -> dict:
    out = {}
    for p in pairs or []:
        if "=" not in p:
            raise SystemExit(f"--extra expects key=value, got: {p}")
        k, v = p.split("=", 1)
        out[k.strip()] = v.strip()
    return out


def check() -> int:
    print("backend readiness\n")

    try:
        import piper  # noqa: F401
        piper_lib = True
    except ImportError:
        piper_lib = False
    vdir = Path(os.environ.get("PIPER_VOICE_DIR") or "assets/voices")
    voices = sorted(vdir.glob("*.onnx")) if vdir.is_dir() else []
    print(f"  piper        piper-tts={'installed' if piper_lib else 'MISSING'}  "
          f"voices={', '.join(v.stem for v in voices) if voices else f'NONE in {vdir}/'}")

    el_key = bool(os.environ.get("ELEVENLABS_API_KEY"))
    el_voice = bool(os.environ.get("ELEVENLABS_VOICE_ID"))
    print(f"  elevenlabs   key={'set' if el_key else 'MISSING'}  "
          f"voice_id={'set' if el_voice else 'MISSING'}")
    gr_space = os.environ.get("GRADIO_SPACE")
    try:
        import gradio_client  # noqa: F401
        gr_lib = "installed"
    except ImportError:
        gr_lib = "MISSING (pip install gradio_client)"
    print(f"  gradio       space={gr_space or 'MISSING'}  gradio_client={gr_lib}")
    ff = ffmpeg_bin()
    print(f"  ffmpeg       {ff or 'MISSING (no normalisation)'}"
          + ("  [found off-PATH, restart your shell to clean this up]"
             if ff and not shutil.which("ffmpeg") else ""))
    ready = [n for n, ok in (("piper", piper_lib and bool(voices)),
                             ("elevenlabs", el_key and el_voice),
                             ("gradio", bool(gr_space) and gr_lib == "installed")) if ok]
    print(f"\nready: {', '.join(ready) if ready else 'none'}")
    if piper_lib and not voices:
        print(f"\nPiper is installed but has no voice model. Download a male voice:\n"
              f"    python -m piper.download_voices en_GB-alan-medium --download-dir {vdir}\n"
              f"Check the voice's MODEL_CARD licence before publishing.")
    return 0 if ready else 1


def main() -> int:
    ap = argparse.ArgumentParser(description="AskMyWebsite[AI] voiceover connector.")
    ap.add_argument("--mode", choices=["sample", "full", "check"], default="check")
    ap.add_argument("--script", type=Path, help="path to a voiceover.md")
    ap.add_argument("--text", help="literal text, instead of --script")
    ap.add_argument("--take-a", default="piper", choices=list(BACKENDS),
                    help="backend for sample A (default piper)")
    ap.add_argument("--take-b", default="piper", choices=list(BACKENDS),
                    help="backend for sample B (default piper)")
    ap.add_argument("--voice-a", help="piper model for sample A, overrides --extra voice")
    ap.add_argument("--voice-b", help="piper model for sample B, overrides --extra voice")
    ap.add_argument("--backend", choices=list(BACKENDS),
                    help="full mode: the approved backend")
    ap.add_argument("--tone", choices=["A", "B"], help="full mode: the approved tone")
    ap.add_argument("--samples-dir", type=Path, default=Path("assets/samples"))
    ap.add_argument("--audio-dir", type=Path, default=Path("assets/audio"))
    ap.add_argument("--extra", action="append", help="backend passthrough, key=value")
    args = ap.parse_args()

    if args.mode == "check":
        return check()

    extra = parse_extra(args.extra)
    if args.text:
        text = args.text
    elif args.script:
        text = read_script(args.script, "sample" if args.mode == "sample" else "full")
    else:
        raise SystemExit("Pass --script or --text.")

    if args.mode == "sample":
        print(f"sample block ({len(text.split())} words):\n  {text}\n")
        made = []
        for tone_key, backend, voice in (("A", args.take_a, args.voice_a),
                                         ("B", args.take_b, args.voice_b)):
            tone = TONES[tone_key]
            out = args.samples_dir / f"sample_{tone_key}.wav"
            # Per-take voice, so the first gate can compare two different voices rather
            # than two tone settings of the same one. Voice is the bigger decision.
            take_extra = {**extra, "voice": voice} if voice else extra
            try:
                pcm, rate = BACKENDS[backend](text, tone, take_extra)
            except BackendError as e:
                print(f"  sample {tone_key} ({backend}): FAILED. {e}", file=sys.stderr)
                continue
            write_wav(pcm, out, rate)
            normalise(out, rate)
            made.append(out)
            tag = Path(voice).stem if voice else backend
            print(f"  sample {tone_key}  {tag:<20} {tone['label']:<20} "
                  f"{tone['speed']}x  {duration_s(out):.1f}s  ->  {out}")

        if not made:
            print("\nNo samples produced. Fix the backend configuration and re-run.",
                  file=sys.stderr)
            return 1

        print(f"\nSTAGE 1 GATE. Samples are in {args.samples_dir}/.")
        print("Play sample_A.wav and sample_B.wav. Which take should the full render use?")
        print("Reply with the take, or 'regen' for new takes. Nothing is attached to any")
        print("composition until a take is approved.")
        return 0

    # full
    if not args.backend or not args.tone:
        raise SystemExit("Full mode needs the approved --backend and --tone from the gate.")
    tone = TONES[args.tone]
    out = args.audio_dir / f"voiceover_{time.strftime('%Y%m%d-%H%M%S')}.wav"
    pcm, rate = BACKENDS[args.backend](text, tone, extra)
    write_wav(pcm, out, rate)
    normed = normalise(out, rate)
    print(f"wrote {out}  ({duration_s(out):.1f}s, {args.backend}, tone {args.tone} "
          f"{tone['label']}, {'normalised' if normed else 'NOT normalised'})")
    print("\nNext: point the composition's <Audio src={staticFile(...)}> at this file "
          "and re-render.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
