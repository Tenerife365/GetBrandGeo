#!/usr/bin/env python3
"""
compose_music.py -- BrandGEO original music library for reel/shorts campaigns.

Composes four 60.000s seamlessly-loopable instrumental beds from scratch with
numpy + the wave stdlib module. No samples, no third-party audio, no AI music
service. Everything below is synthesised from oscillators and noise, so the
output is original work owned outright by BrandGEO and is cleared for
commercial use including paid advertising.

    tension-minor     loss aversion / status threat   100 BPM  C minor
    build-resolve     curiosity gap                   120 BPM  A minor -> C major
    clean-utility     utility / concrete proof        120 BPM  F major
    contrarian-drive  contrarian                      100 BPM  D dorian

Design notes that matter for the "is this music or is it a drone" question:

  * Musical time.  Every event time is derived from bars and beats, never from
    wall-clock seconds.  Both tempos divide 60.000s into a whole number of bars
    AND a whole number of samples per bar (100 BPM -> 25 bars of 115200
    samples; 120 BPM -> 30 bars of 96000 samples), so bar 0 of the next loop
    lands exactly on sample 0.

  * Chords move.  Every track runs a 5- or 6-chord progression with one chord
    per bar, so the harmony changes every 2.4s (100 BPM) or 2.0s (120 BPM).
    Nothing is held for the length of the track.

  * Seamless by construction, not by crossfade.  Note tails, delay taps and the
    reverb all wrap modulo the loop length (np.roll / circular FFT
    convolution), and every LFO completes a whole number of cycles across the
    loop.  The signal is genuinely periodic with period N, so x[0] follows
    x[N-1] with no discontinuity.

  * Filters without scipy.  There is no scipy here, so the "filter" is additive:
    each harmonic gets its own time-varying gain computed from a 4-pole
    lowpass magnitude response at that harmonic's frequency.  That is a real
    moving filter, fully vectorised, and it is inherently antialiased because
    harmonics above 0.45*SR are simply never generated.

Usage:
    python scripts/compose_music.py            # render, normalise, encode, verify
    python scripts/compose_music.py --verify   # re-measure existing files only
"""

from __future__ import annotations

import argparse
import json
import math
import os
import subprocess
import sys
import wave

import numpy as np

SR = 48000
DURATION = 60.0
N = int(round(SR * DURATION))  # 2,880,000 samples exactly

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT_DIR = os.path.join(ROOT, "assets", "audio", "music")

TARGET_I = -16.0
TARGET_TP = -1.5
TARGET_LRA = 11.0

NYQ_LIMIT = 0.45 * SR  # hard ceiling for any generated partial


# --------------------------------------------------------------------------
# theory
# --------------------------------------------------------------------------

QUALITIES = {
    "min": [0, 3, 7],
    "maj": [0, 4, 7],
    "min7": [0, 3, 7, 10],
    "maj7": [0, 4, 7, 11],
    "min9": [0, 3, 7, 10, 14],
    "maj9": [0, 4, 7, 11, 14],
    "sus2": [0, 2, 7],
    "sus4": [0, 5, 7],
    "maj6": [0, 4, 7, 9],
    "dom7": [0, 4, 7, 10],
}


def hz(midi: float) -> float:
    return 440.0 * (2.0 ** ((midi - 69.0) / 12.0))


def voicing(root: int, quality: str, centre: int = 67, lo: int = 55, hi: int = 81):
    """Close pad voicing: place each chord tone in the octave nearest `centre`."""
    out = []
    for iv in QUALITIES[quality]:
        pc = (root + iv) % 12
        best, bestd = None, 1e9
        for octv in range(2, 8):
            m = pc + 12 * octv
            if m < lo or m > hi:
                continue
            d = abs(m - centre)
            if d < bestd:
                best, bestd = m, d
        if best is not None and best not in out:
            out.append(best)
    return sorted(out)


def arp_tones(root: int, quality: str, lo: int = 69):
    """Ascending chord tones starting at or above `lo`, for the plucked layer."""
    out = []
    for iv in QUALITIES[quality]:
        pc = (root + iv) % 12
        m = pc
        while m < lo:
            m += 12
        out.append(m)
    return sorted(set(out))


# --------------------------------------------------------------------------
# primitives
# --------------------------------------------------------------------------


def adsr(n: int, a: float, d: float, s: float, r: float) -> np.ndarray:
    """Sample-accurate ADSR over n samples. a/d/r in seconds, s in 0..1.

    A raw sine gated on and off clicks; nothing in this file is ever gated
    without passing through here, so every note has a real attack and release.
    """
    na = max(1, int(a * SR))
    nd = max(1, int(d * SR))
    nr = max(1, int(r * SR))
    env = np.zeros(n, dtype=np.float64)
    if n <= 0:
        return env
    na = min(na, n)
    # attack: raised-cosine, no corner at the top
    env[:na] = 0.5 - 0.5 * np.cos(np.linspace(0.0, np.pi, na, endpoint=False))
    rem = n - na
    if rem > 0:
        nd = min(nd, rem)
        env[na:na + nd] = 1.0 - (1.0 - s) * (np.arange(nd) / max(1, nd))
        rem2 = n - na - nd
        if rem2 > 0:
            env[na + nd:] = s
    # release: exponential-ish tail applied over the last nr samples
    nr = min(nr, n)
    tail = np.exp(-np.linspace(0.0, 5.0, nr))
    env[n - nr:] *= tail
    return env


def add_wrapped(buf: np.ndarray, start: int, sig: np.ndarray) -> None:
    """Add `sig` into `buf` at `start`, wrapping past the end back to sample 0.

    This is the single reason the loop has no seam: a note that starts in the
    last bar does not get truncated, its tail lands at the top of the loop
    exactly where the same note's tail would land on the second play-through.
    """
    n = buf.shape[0]
    L = sig.shape[0]
    start %= n
    if L == 0:
        return
    if start + L <= n:
        buf[start:start + L] += sig
        return
    first = n - start
    buf[start:] += sig[:first]
    rest = sig[first:]
    while rest.shape[0] >= n:
        buf += rest[:n]
        rest = rest[n:]
    if rest.shape[0]:
        buf[:rest.shape[0]] += rest


def slice_wrapped(arr: np.ndarray, start: int, length: int) -> np.ndarray:
    n = arr.shape[0]
    start %= n
    if start + length <= n:
        return arr[start:start + length]
    idx = (np.arange(length) + start) % n
    return arr[idx]


def lp_gain(freqs: np.ndarray, cutoff, order: int = 4) -> np.ndarray:
    """Magnitude response of an `order`-pole lowpass at `freqs` for `cutoff`.

    Used per-harmonic, so `cutoff` may be an array the same length as the note.
    """
    return 1.0 / np.sqrt(1.0 + (freqs / cutoff) ** (2 * order))


def pad_note(f0: float, n: int, cutoff: np.ndarray, rng: np.random.Generator,
             harmonics: int = 12, detune_cents: float = 0.0,
             a=0.35, d=0.6, s=0.72, r=0.9, tilt=1.15) -> np.ndarray:
    """Sawtooth-ish pad voice through a moving lowpass, additive.

    Harmonic k gets amplitude (1/k^tilt) * |H_lp(k*f0, fc(t))|.  Because fc is
    an array, the brightness genuinely opens and closes across the note.
    """
    f = f0 * (2.0 ** (detune_cents / 1200.0))
    t = np.arange(n, dtype=np.float64) / SR
    out = np.zeros(n, dtype=np.float64)
    for k in range(1, harmonics + 1):
        fk = f * k
        if fk >= NYQ_LIMIT:
            break
        g = (1.0 / (k ** tilt)) * lp_gain(np.full(n, fk), cutoff, order=4)
        out += g * np.sin(2.0 * np.pi * fk * t + rng.uniform(0.0, 2.0 * np.pi))
    return out * adsr(n, a, d, s, r)


def pluck(f0: float, n: int, rng: np.random.Generator, harmonics: int = 14,
          decay: float = 0.55, bright: float = 0.9, a=0.004, r=0.12) -> np.ndarray:
    """Plucked/mallet mid. Higher harmonics decay faster, which is what makes
    a pluck read as a pluck rather than as a gated sine."""
    t = np.arange(n, dtype=np.float64) / SR
    out = np.zeros(n, dtype=np.float64)
    for k in range(1, harmonics + 1):
        fk = f0 * k
        if fk >= NYQ_LIMIT:
            break
        tau = decay / (k ** bright)
        amp = (1.0 / (k ** 1.05)) * np.exp(-t / max(tau, 0.01))
        out += amp * np.sin(2.0 * np.pi * fk * t + rng.uniform(0.0, 2.0 * np.pi))
    env = adsr(n, a, 0.02, 1.0, r)
    return out * env


def sub_note(f0: float, n: int, a=0.012, d=0.15, s=0.85, r=0.10,
             drive: float = 0.22) -> np.ndarray:
    """Sub bass: fundamental plus a small 2nd/3rd so it survives a phone
    speaker that cannot reproduce 45-70 Hz at all."""
    t = np.arange(n, dtype=np.float64) / SR
    x = np.sin(2.0 * np.pi * f0 * t)
    x += drive * np.sin(2.0 * np.pi * 2.0 * f0 * t + 0.4)
    x += 0.45 * drive * np.sin(2.0 * np.pi * 3.0 * f0 * t + 1.1)
    return x * adsr(n, a, d, s, r)


def bass_note(f0: float, n: int, rng: np.random.Generator, harmonics: int = 10,
              cutoff: float = 900.0) -> np.ndarray:
    """Mid-bass reinforcement an octave up from the sub, filtered saw."""
    t = np.arange(n, dtype=np.float64) / SR
    out = np.zeros(n, dtype=np.float64)
    for k in range(1, harmonics + 1):
        fk = f0 * k
        if fk >= NYQ_LIMIT:
            break
        g = (1.0 / k) * float(lp_gain(np.array([fk]), cutoff, order=2)[0])
        out += g * np.sin(2.0 * np.pi * fk * t + rng.uniform(0, 2 * np.pi))
    return out * adsr(n, 0.008, 0.12, 0.7, 0.09)


def kick(n: int = None, f_start=118.0, f_end=44.0, pitch_tau=0.035,
         amp_tau=0.16, click=0.35, rng: np.random.Generator = None) -> np.ndarray:
    n = n or int(0.42 * SR)
    t = np.arange(n, dtype=np.float64) / SR
    f = f_end + (f_start - f_end) * np.exp(-t / pitch_tau)
    phase = 2.0 * np.pi * np.cumsum(f) / SR
    body = np.sin(phase) * np.exp(-t / amp_tau)
    if rng is not None and click > 0:
        cn = int(0.006 * SR)
        c = rng.standard_normal(cn) * np.exp(-np.arange(cn) / (0.0012 * SR))
        c = np.diff(c, prepend=0.0)
        body[:cn] += click * c / (np.max(np.abs(c)) + 1e-9)
    # start from and return to exactly zero, so a kick landing on sample 0 of
    # the loop cannot put a step at the wrap point
    body[:48] *= np.linspace(0.0, 1.0, 48)
    body[-256:] *= np.linspace(1.0, 0.0, 256)
    return body


def _hp(x: np.ndarray, times: int = 2) -> np.ndarray:
    for _ in range(times):
        x = np.diff(x, prepend=x[0])
    return x


def _lp_box(x: np.ndarray, w: int) -> np.ndarray:
    """Centred moving average via cumsum, so cost is O(n) not O(n*w)."""
    if w <= 1:
        return x
    n = x.shape[0]
    half = w // 2
    padded = np.concatenate((np.full(half, x[0]), x, np.full(w - half, x[-1])))
    c = np.cumsum(padded, dtype=np.float64)
    c = np.concatenate(([0.0], c))
    return (c[w:w + n] - c[:n]) / w


def hat(rng: np.random.Generator, dur=0.055, hp=3, tone=0.0) -> np.ndarray:
    n = int(dur * SR)
    x = rng.standard_normal(n)
    x = _hp(x, hp)
    if tone > 0:
        t = np.arange(n) / SR
        x += tone * np.sin(2 * np.pi * 8200 * t)
    env = np.exp(-np.arange(n) / (dur * 0.3 * SR))
    env[:24] *= np.linspace(0.0, 1.0, 24)
    x *= env
    return x / (np.max(np.abs(x)) + 1e-9)


def clap(rng: np.random.Generator, dur=0.22) -> np.ndarray:
    n = int(dur * SR)
    out = np.zeros(n)
    for i, off in enumerate([0, 0.009, 0.019, 0.030]):
        s = int(off * SR)
        L = n - s
        b = rng.standard_normal(L)
        b = _hp(b, 2)
        b = _lp_box(b, 5)
        b *= np.exp(-np.arange(L) / (0.012 * SR)) * (1.0 - 0.15 * i)
        out[s:] += b
    tail = rng.standard_normal(n)
    tail = _lp_box(_hp(tail, 2), 7)
    out += 0.55 * tail * np.exp(-np.arange(n) / (0.055 * SR))
    out[:32] *= np.linspace(0.0, 1.0, 32)
    out[-256:] *= np.linspace(1.0, 0.0, 256)
    return out / (np.max(np.abs(out)) + 1e-9)


def rim(rng: np.random.Generator, dur=0.09) -> np.ndarray:
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * 1750 * t) + 0.6 * np.sin(2 * np.pi * 2630 * t)
    x += 0.5 * _hp(rng.standard_normal(n), 2)
    x *= np.exp(-t / 0.014)
    x[:16] *= np.linspace(0, 1, 16)
    return x / (np.max(np.abs(x)) + 1e-9)


# --------------------------------------------------------------------------
# bus processing (all circular, so the loop stays seamless)
# --------------------------------------------------------------------------


def wrapped_delay(x: np.ndarray, delay: int, feedback: float, taps: int = 7,
                  damp: float = 0.35) -> np.ndarray:
    """Circular feedback delay. np.roll wraps, so tap n of the last bar lands
    at the top of the loop, which is where it belongs."""
    out = np.zeros_like(x)
    g = 1.0
    y = x
    for i in range(1, taps + 1):
        g *= feedback
        y = _lp_box(y, 3) if damp > 0 else y
        out += g * np.roll(y, delay * i)
    return out


def make_ir(rng: np.random.Generator, seconds=1.6, predelay=0.022,
            hp_times=1, lp_w=4) -> np.ndarray:
    L = int(seconds * SR)
    ir = rng.standard_normal(L)
    ir *= np.exp(-np.arange(L) / (seconds * 0.30 * SR))
    ir = _hp(ir, hp_times)
    ir = _lp_box(ir, lp_w)
    pd = int(predelay * SR)
    ir = np.concatenate((np.zeros(pd), ir))
    ir /= np.sqrt(np.sum(ir ** 2)) + 1e-12
    return ir


def circ_reverb(x: np.ndarray, ir: np.ndarray) -> np.ndarray:
    """Circular convolution via rFFT: reverb tail wraps to the loop start."""
    n = x.shape[0]
    X = np.fft.rfft(x, n=n)
    H = np.fft.rfft(ir, n=n)
    return np.fft.irfft(X * H, n=n)


def ducker(n: int, hits: np.ndarray, depth: float, release: float,
           attack: float = 0.006) -> np.ndarray:
    """Sidechain envelope. 1.0 normally, dips to (1-depth) on each kick and
    recovers over `release`. This is most of what makes a bed sound produced."""
    na = max(1, int(attack * SR))
    nr = max(2, int(release * SR))
    shape = np.concatenate((
        np.linspace(0.0, 1.0, na),
        np.exp(-np.linspace(0.0, 4.2, nr)),
    ))
    d = np.zeros(n)
    for h in hits:
        h = int(h) % n
        L = shape.shape[0]
        if h + L <= n:
            d[h:h + L] = np.maximum(d[h:h + L], shape)
        else:
            first = n - h
            d[h:] = np.maximum(d[h:], shape[:first])
            rest = shape[first:][:n]
            d[:rest.shape[0]] = np.maximum(d[:rest.shape[0]], rest)
    return 1.0 - depth * d


def pan(mono: np.ndarray, p: float) -> np.ndarray:
    """Equal-power pan. p = -1 hard left, 0 centre, +1 hard right."""
    ang = (p + 1.0) * 0.25 * np.pi
    return np.stack((mono * math.cos(ang), mono * math.sin(ang)), axis=1)


def haas(mono: np.ndarray, ms: float, side: int = 1, gain: float = 0.8) -> np.ndarray:
    """Wrapped Haas delay: a few ms on one side only. Widens without phasing
    the centre, and wraps so it does not break the loop."""
    d = int(ms * 0.001 * SR)
    delayed = np.roll(mono, d) * gain
    if side > 0:
        return np.stack((mono, delayed), axis=1)
    return np.stack((delayed, mono), axis=1)


# --------------------------------------------------------------------------
# track specifications
# --------------------------------------------------------------------------
#
# Chord progressions below are ordinary diatonic motion, which is not
# copyrightable subject matter. Every melodic figure is generated from the
# chord tones of the bar it sits in by the step-patterns further down, so no
# phrase here is a transcription or approximation of any existing recording.

TRACKS = {
    "tension-minor": dict(
        bpm=100, bars=25, seed=20260729,
        key="C minor",
        # i  -  VI - III -  VII -  iv        (one chord per bar, 5-bar cycle x5)
        prog=[(48, "min9"), (44, "maj7"), (51, "maj"), (46, "sus2"), (53, "min7")],
        pad_cut=(420.0, 1.35, 3.0),   # base Hz, octaves of LFO swing, LFO cycles per loop
        arp_pat="0...3.....5...2." ,
        arp_pat_b="0..2..4..2..5..3",
        kick_pat="x.......x..x....",
        hat_pat="..x...x...x...x.",
        clap_pat="........x.......",
        rim_pat="",
        arp_oct=0, arp_level=0.30, pad_level=0.50, sub_level=0.95, bass_level=0.30,
        duck_depth=0.42, duck_rel=0.30,
        rev_send=0.30, delay_16ths=3, delay_fb=0.34,
        arp_note_16ths=3.0,
    ),
    "build-resolve": dict(
        bpm=120, bars=30, seed=771103,
        key="A minor resolving to C major",
        # 6-bar cycle x5; the final cycle is replaced (see resolve_prog)
        prog=[(45, "min7"), (41, "maj7"), (48, "maj"), (43, "maj"), (40, "min7"), (41, "maj7")],
        resolve_prog=[(41, "maj7"), (43, "sus4"), (43, "maj"), (45, "min7"), (41, "maj9"), (48, "maj9")],
        pad_cut=(360.0, 1.7, 2.0),
        arp_pat="0...4...2...5...",
        arp_pat_b="0.2.4.2.5.2.4.1.",
        kick_pat="x...x...x...x...",
        hat_pat="..x...x...x...x.",
        clap_pat="....x.......x...",
        rim_pat="",
        arp_oct=0, arp_level=0.28, pad_level=0.52, sub_level=0.95, bass_level=0.28,
        duck_depth=0.46, duck_rel=0.28,
        rev_send=0.34, delay_16ths=3, delay_fb=0.32,
        arp_note_16ths=2.5,
    ),
    "clean-utility": dict(
        bpm=120, bars=30, seed=445566,
        key="F major",
        # F - Bb - Gm - C - Bb  (5-bar cycle x6)
        prog=[(41, "maj9"), (46, "maj7"), (43, "min7"), (48, "maj6"), (46, "maj7")],
        pad_cut=(900.0, 0.85, 2.0),
        arp_pat="0.2.4.2.5.3.4.2.",
        arp_pat_b="0...2...4...2...",
        kick_pat="x...x...x...x...",
        hat_pat="..x...x...x...x.",
        clap_pat="....x.......x...",
        rim_pat="",
        arp_oct=0, arp_level=0.22, pad_level=0.40, sub_level=0.88, bass_level=0.26,
        duck_depth=0.34, duck_rel=0.24,
        rev_send=0.22, delay_16ths=6, delay_fb=0.22,
        arp_note_16ths=2.0,
    ),
    "contrarian-drive": dict(
        bpm=100, bars=25, seed=909091,
        key="D dorian",
        # Dm7 - C - Bb - F - Gm7   (5-bar cycle x5)
        prog=[(50, "min7"), (48, "maj"), (46, "maj9"), (53, "maj"), (43, "min7")],
        pad_cut=(520.0, 1.5, 5.0),
        arp_pat="0..0.3..0.4..2..",
        arp_pat_b="0.03.0.3.02.0.4.",
        kick_pat="x.....x...x.....",
        hat_pat="x.xxx.xx.xxx.xx.",
        clap_pat="....x.......x...",
        rim_pat="...x......x.....",
        arp_oct=0, arp_level=0.32, pad_level=0.38, sub_level=0.95, bass_level=0.36,
        duck_depth=0.50, duck_rel=0.26,
        rev_send=0.24, delay_16ths=3, delay_fb=0.36,
        arp_note_16ths=1.6,
    ),
}


def arrangement(name: str, bar: int) -> dict:
    """Per-bar layer gains. This is what creates loudness range: a bed whose
    LRA is 1.5 LU is a bed with no arrangement."""
    g = dict(pad=1.0, sub=1.0, bass=1.0, arp=1.0, kick=1.0, hat=1.0,
             clap=1.0, rim=1.0, lead=0.0, arp_b=0.0, cut_mul=1.0)

    if name == "tension-minor":
        if bar < 2:
            g.update(kick=0.0, hat=0.0, clap=0.0, arp=0.0, bass=0.0, sub=0.55, cut_mul=0.55)
        elif bar < 5:
            g.update(hat=0.5, clap=0.0, arp=0.45, bass=0.6, cut_mul=0.75)
        elif bar < 10:
            g.update(arp_b=0.0)
        elif bar < 15:
            g.update(arp_b=1.0, cut_mul=1.15)
        elif bar < 18:                      # breakdown: drums out, harmony exposed
            g.update(kick=0.0, hat=0.0, clap=0.0, bass=0.0, arp=0.55,
                     sub=0.5, cut_mul=0.5)
        else:
            g.update(arp_b=1.0, cut_mul=1.2)

    elif name == "build-resolve":
        if bar < 6:                          # cycle 1: pad only
            g.update(kick=0.0, hat=0.0, clap=0.0, arp=0.0, bass=0.0,
                     sub=0.45 if bar < 2 else 0.75, cut_mul=0.70)
        elif bar < 12:                       # cycle 2: + pluck, soft hats
            g.update(kick=0.0, clap=0.0, hat=0.35, arp=0.7, bass=0.5, cut_mul=0.65)
        elif bar < 18:                       # cycle 3: + kick, clap
            g.update(hat=0.7, arp=0.9, cut_mul=0.85)
        elif bar < 24:                       # cycle 4: full
            g.update(arp_b=1.0, cut_mul=1.05)
        else:                                # cycle 5: RESOLVE, last 12.000s
            g.update(arp_b=1.0, lead=1.0, cut_mul=1.45, clap=0.8)
            if bar >= 28:                    # thin the drums into the landing
                g.update(hat=0.35, clap=0.0, arp_b=0.0)
            if bar == 29:
                g.update(kick=0.35, arp=0.5)

    elif name == "clean-utility":
        if bar < 3:
            g.update(kick=0.0, clap=0.0, hat=0.45, bass=0.0, sub=0.5,
                     arp=0.6, cut_mul=0.7)
        elif bar < 5:
            g.update(clap=0.0, bass=0.7, cut_mul=0.85)
        elif bar < 15:
            g.update(arp_b=0.0)
        elif bar < 18:                       # short lift-out so text can breathe
            g.update(kick=0.0, clap=0.0, bass=0.0, arp=0.5, sub=0.55, cut_mul=0.6)
        elif bar < 25:
            g.update(cut_mul=1.1)
        else:
            g.update(cut_mul=1.15, arp_b=0.6)

    elif name == "contrarian-drive":
        if bar < 2:
            g.update(kick=0.0, clap=0.0, rim=0.0, hat=0.5, arp=0.0,
                     bass=0.0, sub=0.6, cut_mul=0.5)
        elif bar < 5:
            g.update(clap=0.0, arp=0.6, bass=0.7, cut_mul=0.8)
        elif bar < 13:
            pass
        elif bar < 16:                       # pad drops, rhythm exposed
            g.update(pad=0.15, arp=0.6, clap=0.0, cut_mul=0.6)
        elif bar < 20:
            g.update(arp_b=1.0, cut_mul=1.2)
        elif bar < 22:                       # 2-bar suspension
            g.update(kick=0.0, hat=0.35, clap=0.0, rim=0.0, bass=0.0,
                     sub=0.45, arp=0.4, cut_mul=0.55)
        else:
            g.update(arp_b=1.0, cut_mul=1.3)

    return g


# --------------------------------------------------------------------------
# renderer
# --------------------------------------------------------------------------


def render(name: str) -> tuple[np.ndarray, dict]:
    spec = TRACKS[name]
    rng = np.random.default_rng(spec["seed"])

    bars = spec["bars"]
    bpm = spec["bpm"]
    spb = N // bars                    # samples per bar, exact integer
    assert spb * bars == N, f"{name}: {bars} bars does not divide {N} samples"
    s16 = spb // 16                    # samples per sixteenth, exact integer
    assert s16 * 16 == spb

    prog = spec["prog"]
    resolve_prog = spec.get("resolve_prog")

    # ---- global moving-filter curve for the pad (integer LFO cycles) -----
    base, swing, cycles = spec["pad_cut"]
    tt = np.arange(N) / N
    cut = base * (2.0 ** (swing * np.sin(2.0 * np.pi * cycles * tt)))
    cut2 = base * (2.0 ** (0.45 * swing * np.sin(2.0 * np.pi * (cycles + 2) * tt + 1.9)))
    cut = np.sqrt(cut * cut2)          # two integer-cycle LFOs, still periodic

    # per-bar cutoff multiplier from the arrangement, smoothed
    cutmul = np.ones(N)
    for b in range(bars):
        cutmul[b * spb:(b + 1) * spb] = arrangement(name, b)["cut_mul"]
    cutmul = np.concatenate((cutmul, cutmul, cutmul))
    cutmul = _lp_box(cutmul, int(0.25 * SR))[N:2 * N]   # wrap-safe smoothing
    cut = cut * cutmul

    # ---- buses -----------------------------------------------------------
    b_sub = np.zeros(N)
    b_bass = np.zeros(N)
    b_pad_l = np.zeros(N)
    b_pad_r = np.zeros(N)
    b_arp_l = np.zeros(N)
    b_arp_r = np.zeros(N)
    b_lead = np.zeros(N)
    b_kick = np.zeros(N)
    b_perc_l = np.zeros(N)
    b_perc_r = np.zeros(N)

    kick_hits = []

    kick_s = kick(rng=rng)
    hat_a = hat(rng, dur=0.050, hp=3)
    hat_b = hat(rng, dur=0.11, hp=2, tone=0.05)     # slightly open
    clap_s = clap(rng)
    rim_s = rim(rng)

    def bar_chord(b):
        if resolve_prog is not None and b >= bars - len(resolve_prog):
            return resolve_prog[b - (bars - len(resolve_prog))]
        return prog[b % len(prog)]

    for b in range(bars):
        g = arrangement(name, b)
        root, qual = bar_chord(b)
        b0 = b * spb

        # ---------------- pad: two detuned voices, panned apart ----------
        if g["pad"] > 0.001:
            notes = voicing(root, qual)
            hold = int(spb * 1.06)
            cslice = slice_wrapped(cut, b0, hold)
            for i, m in enumerate(notes):
                f = hz(m)
                lvl = g["pad"] * spec["pad_level"] * (0.95 ** i)
                vl = pad_note(f, hold, cslice, rng, detune_cents=-6.5)
                vr = pad_note(f, hold, cslice, rng, detune_cents=+6.5)
                # spread the voices of the chord across the stereo field
                p = -0.62 + 1.24 * (i / max(1, len(notes) - 1))
                add_wrapped(b_pad_l, b0, vl * lvl * math.cos((p + 1) * 0.25 * math.pi))
                add_wrapped(b_pad_r, b0, vr * lvl * math.sin((p + 1) * 0.25 * math.pi))

        # ---------------- sub + mid bass (mono, centred) -----------------
        # Fold by octaves, never clamp. Clamping silently rewrites the pitch
        # class and collapses different chords onto the same bass note, which
        # is exactly what a per-bar FFT of an earlier render caught.
        sub_m = root - 12
        while sub_m < 28:
            sub_m += 12
        while sub_m > 41:
            sub_m -= 12
        if g["sub"] > 0.001:
            hold = int(spb * 0.96)
            add_wrapped(b_sub, b0,
                        sub_note(hz(sub_m), hold) * g["sub"] * spec["sub_level"])
        if g["bass"] > 0.001:
            # eighth-note bass figure on the root, with one octave lift
            steps = [0, 6, 10] if name != "clean-utility" else [0, 8]
            for si, st in enumerate(steps):
                m = sub_m + 12 + (12 if (si == len(steps) - 1 and name == "contrarian-drive") else 0)
                L = int(s16 * 3.2)
                add_wrapped(b_bass, b0 + st * s16,
                            bass_note(hz(m), L, rng) * g["bass"] * spec["bass_level"])

        # ---------------- plucked / arpeggiated mid, ping-pong panned ----
        tones = arp_tones(root, qual)
        for pat_key, gain_key, octshift in (("arp_pat", "arp", 0), ("arp_pat_b", "arp_b", 12)):
            pat = spec.get(pat_key, "")
            gg = g[gain_key] if gain_key in g else 0.0
            if not pat or gg <= 0.001:
                continue
            for step, ch in enumerate(pat):
                if ch == ".":
                    continue
                idx = int(ch)
                m = tones[idx % len(tones)] + 12 * (idx // len(tones)) + octshift
                L = int(s16 * spec["arp_note_16ths"])
                v = pluck(hz(m), L, rng,
                          decay=0.5 if octshift == 0 else 0.34,
                          bright=0.85)
                lvl = gg * spec["arp_level"] * (0.72 if octshift else 1.0)
                # alternate the pan per step so the figure moves across the field
                p = 0.55 if (step // 2) % 2 == 0 else -0.55
                if octshift:
                    p = -p
                st = b0 + step * s16
                lr = pan(v * lvl, p)
                add_wrapped(b_arp_l, st, lr[:, 0])
                add_wrapped(b_arp_r, st, lr[:, 1])

        # ---------------- resolve lead (build-resolve only) --------------
        if g["lead"] > 0.001:
            # simple chord-tone descent, one note per half bar
            hi = [t + 12 for t in tones]
            seq = [hi[len(hi) - 1 - (b % len(hi))], hi[(b + 2) % len(hi)]]
            for j, m in enumerate(seq):
                L = int(spb * 0.55)
                v = pluck(hz(m), L, rng, decay=0.9, bright=0.7, a=0.03, r=0.25)
                add_wrapped(b_lead, b0 + j * (spb // 2), v * g["lead"] * 0.20)

        # ---------------- percussion -------------------------------------
        for step, ch in enumerate(spec["kick_pat"]):
            if ch == "x" and g["kick"] > 0.001:
                st = b0 + step * s16
                add_wrapped(b_kick, st, kick_s * g["kick"] * 0.92)
                kick_hits.append(st)
        for step, ch in enumerate(spec["hat_pat"]):
            if ch == "x" and g["hat"] > 0.001:
                st = b0 + step * s16
                src = hat_b if step % 8 == 6 else hat_a
                lvl = g["hat"] * (0.15 if step % 4 == 2 else 0.11)
                p = 0.30 if step % 2 == 0 else -0.34
                lr = pan(src * lvl, p)
                add_wrapped(b_perc_l, st, lr[:, 0])
                add_wrapped(b_perc_r, st, lr[:, 1])
        for step, ch in enumerate(spec["clap_pat"]):
            if ch == "x" and g["clap"] > 0.001:
                st = b0 + step * s16
                lr = pan(clap_s * g["clap"] * 0.26, 0.10)
                add_wrapped(b_perc_l, st, lr[:, 0])
                add_wrapped(b_perc_r, st, lr[:, 1])
        for step, ch in enumerate(spec.get("rim_pat", "")):
            if ch == "x" and g["rim"] > 0.001:
                st = b0 + step * s16
                lr = pan(rim_s * g["rim"] * 0.13, -0.45)
                add_wrapped(b_perc_l, st, lr[:, 0])
                add_wrapped(b_perc_r, st, lr[:, 1])

    # ---- sidechain -------------------------------------------------------
    hits = np.array(sorted(set(kick_hits))) if kick_hits else np.array([], dtype=int)
    if hits.size:
        duck = ducker(N, hits, spec["duck_depth"], spec["duck_rel"])
        duck_soft = ducker(N, hits, spec["duck_depth"] * 0.55, spec["duck_rel"] * 0.85)
    else:
        duck = np.ones(N)
        duck_soft = np.ones(N)

    b_sub *= duck
    b_bass *= duck
    b_pad_l *= duck_soft
    b_pad_r *= duck_soft
    b_arp_l *= duck_soft
    b_arp_r *= duck_soft

    # ---- delay on the arp (circular, ping-ponged) ------------------------
    dly = spec["delay_16ths"] * s16
    d_l = wrapped_delay(b_arp_r, dly, spec["delay_fb"], taps=6)
    d_r = wrapped_delay(b_arp_l, dly, spec["delay_fb"], taps=6)
    b_arp_l = b_arp_l + 0.42 * d_l
    b_arp_r = b_arp_r + 0.42 * d_r

    # ---- pad width: Haas on one side only --------------------------------
    padw = haas(b_pad_l, ms=11.0, side=+1, gain=0.55)
    b_pad_l = b_pad_l + 0.0
    b_pad_r = b_pad_r + 0.45 * padw[:, 1]

    # ---- mix -------------------------------------------------------------
    L = b_sub + b_bass + b_kick + b_pad_l + b_arp_l + b_perc_l + 0.5 * b_lead
    R = b_sub + b_bass + b_kick + b_pad_r + b_arp_r + b_perc_r + 0.5 * b_lead

    # ---- reverb send (circular convolution -> tail wraps the loop) -------
    irL = make_ir(np.random.default_rng(spec["seed"] + 1))
    irR = make_ir(np.random.default_rng(spec["seed"] + 2))
    send_l = b_pad_l * 0.7 + b_arp_l * 0.9 + 0.6 * b_lead
    send_r = b_pad_r * 0.7 + b_arp_r * 0.9 + 0.6 * b_lead
    L += spec["rev_send"] * circ_reverb(send_l, irL)
    R += spec["rev_send"] * circ_reverb(send_r, irR)

    st = np.stack((L, R), axis=1)
    st -= st.mean(axis=0, keepdims=True)          # DC removal
    peak = float(np.max(np.abs(st)))
    st *= (0.89 / peak) if peak > 0 else 1.0

    meta = dict(bpm=bpm, bars=bars, samples_per_bar=spb, samples_per_16th=s16,
                key=spec["key"], chords_per_cycle=len(prog),
                chord_seconds=round(spb / SR, 4),
                kick_hits=int(hits.size), peak_before_norm=peak)
    return st, meta


# --------------------------------------------------------------------------
# io + measurement
# --------------------------------------------------------------------------


def write_wav24(path: str, x: np.ndarray, rng: np.random.Generator) -> None:
    """24-bit PCM with TPDF dither."""
    q = 1.0 / (2 ** 23)
    dither = (rng.random(x.shape) - rng.random(x.shape)) * q
    y = np.clip(x + dither, -1.0, 1.0 - q)
    i32 = np.round(y * (2 ** 23 - 1)).astype(np.int32)
    raw = i32.view(np.uint8).reshape(-1, 4)[:, :3].tobytes()
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(3)
        w.setframerate(SR)
        w.writeframes(raw)


def read_f32(path: str) -> np.ndarray:
    p = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-acodec",
         "pcm_f32le", "-ac", "2", "-ar", str(SR), "-"],
        capture_output=True, check=True)
    return np.frombuffer(p.stdout, dtype="<f4").reshape(-1, 2).astype(np.float64)


def loudnorm_measure(path: str) -> dict:
    p = subprocess.run(
        ["ffmpeg", "-v", "info", "-i", path, "-af",
         f"loudnorm=I={TARGET_I}:TP={TARGET_TP}:LRA={TARGET_LRA}:print_format=json",
         "-f", "null", "-"],
        capture_output=True, text=True)
    err = p.stderr
    s = err.rfind("{")
    e = err.rfind("}")
    if s < 0 or e < 0:
        raise RuntimeError("loudnorm produced no JSON:\n" + err[-2000:])
    return json.loads(err[s:e + 1])


def probe(path: str) -> dict:
    p = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries",
         "format=duration:stream=sample_rate,channels,codec_name,duration",
         "-of", "json", path], capture_output=True, text=True, check=True)
    return json.loads(p.stdout)


def analyse(path: str) -> dict:
    x = read_f32(path)
    L, R = x[:, 0], x[:, 1]
    n = x.shape[0]

    # stereo
    diff = L - R
    ndiff = int(np.count_nonzero(np.abs(diff) > 1e-7))
    corr = float(np.corrcoef(L, R)[0, 1])
    mid = 0.5 * (L + R)
    side = 0.5 * (L - R)
    mid_rms = float(np.sqrt(np.mean(mid ** 2)))
    side_rms = float(np.sqrt(np.mean(side ** 2)))

    # ---- loop seam ------------------------------------------------------
    # A seamless loop does NOT mean x[0] == x[-1]; if the music is still
    # playing at the wrap, those two samples SHOULD differ by one sample's
    # worth of slew. The real question is whether the wrap step is ordinary
    # compared with the steps immediately either side of it. So: build the
    # actual two-loop concatenation a player would produce, and compare the
    # step at the join against the local distribution of steps around it.
    inner = np.abs(np.diff(x, axis=0))
    inner_rms = float(np.sqrt(np.mean(inner ** 2)))
    inner_p999 = float(np.percentile(inner, 99.9))
    wrap = np.abs(x[0] - x[-1])
    wrap_max = float(np.max(wrap))

    w = int(0.010 * SR)                       # +/- 10 ms around the join
    local = np.concatenate((inner[-w:], inner[:w]))
    local_med = float(np.median(np.max(local, axis=1)))
    local_p95 = float(np.percentile(np.max(local, axis=1), 95))
    local_max = float(np.max(local))

    def db(v):
        return 20.0 * math.log10(max(v, 1e-12))

    return dict(
        samples=n,
        duration_s=round(n / SR, 6),
        peak_dbfs=round(db(float(np.max(np.abs(x)))), 2),
        rms_dbfs=round(db(float(np.sqrt(np.mean(x ** 2)))), 2),
        lr_correlation=round(corr, 4),
        lr_differing_samples=ndiff,
        lr_differing_pct=round(100.0 * ndiff / n, 2),
        side_to_mid_db=round(db(side_rms) - db(mid_rms), 2),
        seam_delta_L=round(float(wrap[0]), 8),
        seam_delta_R=round(float(wrap[1]), 8),
        seam_delta_dbfs=round(db(wrap_max), 2),
        seam_local_median_delta=round(local_med, 8),
        seam_local_p95_delta=round(local_p95, 8),
        seam_local_max_delta=round(local_max, 8),
        seam_vs_local_p95=round(wrap_max / max(local_p95, 1e-12), 4),
        seam_vs_local_max=round(wrap_max / max(local_max, 1e-12), 4),
        interior_delta_rms=round(inner_rms, 8),
        interior_delta_p999=round(inner_p999, 8),
        seam_vs_interior_p999=round(wrap_max / max(inner_p999, 1e-12), 4),
    )


def process(name: str, report: dict) -> None:
    spec = TRACKS[name]
    os.makedirs(OUT_DIR, exist_ok=True)
    wav = os.path.join(OUT_DIR, f"{name}.wav")
    m4a = os.path.join(OUT_DIR, f"{name}.m4a")
    tmp = os.path.join(OUT_DIR, f".{name}.raw.wav")

    print(f"[{name}] rendering {DURATION}s @ {spec['bpm']} BPM ...", flush=True)
    x, meta = render(name)
    drng = np.random.default_rng(spec["seed"] + 99)
    write_wav24(tmp, x, drng)

    # -- loudnorm pass 1: measure ----------------------------------------
    m1 = loudnorm_measure(tmp)
    mi = float(m1["input_i"])
    mtp = float(m1["input_tp"])
    mlra = float(m1["input_lra"])
    print(f"[{name}] pass1  I={mi:+.2f} LUFS  TP={mtp:+.2f} dBTP  LRA={mlra:.2f} LU")

    # -- loudnorm pass 2: apply the linear gain --------------------------
    # Linear gain only. A dynamic-mode normaliser would re-shape the envelope
    # and destroy the loop seam; a scalar keeps the file sample-exact and
    # leaves LRA untouched.
    gain_i = TARGET_I - mi
    gain_tp = TARGET_TP - mtp
    gain = min(gain_i, gain_tp)
    limited_by = "true-peak" if gain_tp < gain_i else "integrated"
    y = x * (10.0 ** (gain / 20.0))
    write_wav24(wav, y, np.random.default_rng(spec["seed"] + 100))
    os.remove(tmp)
    print(f"[{name}] pass2  applied {gain:+.2f} dB linear (bound by {limited_by})")

    # -- verification -----------------------------------------------------
    m2 = loudnorm_measure(wav)
    a = analyse(wav)
    pr = probe(wav)

    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", wav, "-c:a", "aac", "-b:a", "192k",
         "-ar", str(SR), "-ac", "2", "-movflags", "+faststart", m4a],
        check=True)
    pm = probe(m4a)

    report[name] = dict(
        meta=meta,
        gain_applied_db=round(gain, 3),
        gain_bound_by=limited_by,
        measured=dict(
            I=round(float(m2["input_i"]), 2),
            TP=round(float(m2["input_tp"]), 2),
            LRA=round(float(m2["input_lra"]), 2),
            threshold=round(float(m2["input_thresh"]), 2),
        ),
        pre_norm=dict(I=round(mi, 2), TP=round(mtp, 2), LRA=round(mlra, 2)),
        analysis=a,
        wav=dict(path=os.path.relpath(wav, ROOT),
                 duration=float(pr["format"]["duration"]),
                 codec=pr["streams"][0]["codec_name"],
                 sample_rate=pr["streams"][0]["sample_rate"],
                 channels=pr["streams"][0]["channels"],
                 bytes=os.path.getsize(wav)),
        m4a=dict(path=os.path.relpath(m4a, ROOT),
                 duration=float(pm["format"]["duration"]),
                 codec=pm["streams"][0]["codec_name"],
                 bytes=os.path.getsize(m4a)),
    )
    r = report[name]["measured"]
    print(f"[{name}] final  I={r['I']:+.2f} LUFS  TP={r['TP']:+.2f} dBTP  "
          f"LRA={r['LRA']:.2f} LU  seam={a['seam_delta_dbfs']:.1f} dBFS  "
          f"corr(L,R)={a['lr_correlation']:.4f}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="render a single track by name")
    ap.add_argument("--verify", action="store_true",
                    help="re-measure existing files without re-rendering")
    args = ap.parse_args()

    names = [args.only] if args.only else list(TRACKS)
    report: dict = {}

    if args.verify:
        for nm in names:
            wav = os.path.join(OUT_DIR, f"{nm}.wav")
            report[nm] = dict(measured=loudnorm_measure(wav), analysis=analyse(wav),
                              probe=probe(wav))
    else:
        for nm in names:
            process(nm, report)

    out = os.path.join(OUT_DIR, "_render_report.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    print("\nreport ->", os.path.relpath(out, ROOT))
    return 0


if __name__ == "__main__":
    sys.exit(main())
