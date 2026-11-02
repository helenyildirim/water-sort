#!/usr/bin/env python3
"""Generates the game's sound effects. Run: python3 scripts/make-sounds.py"""
import math
import os
import struct
import wave

RATE = 22050
OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'sounds')


def write(name, samples):
    peak = max(1.0, max(abs(s) for s in samples))
    with wave.open(os.path.join(OUT, name), 'wb') as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(RATE)
        f.writeframes(b''.join(struct.pack('<h', int(s / peak * 32000)) for s in samples))


def note(freq, dur, decay=7.0, vol=0.6):
    out = []
    fade = int(0.012 * RATE)
    n = int(dur * RATE)
    for i in range(n):
        t = i / RATE
        v = math.sin(2 * math.pi * freq * t) + 0.22 * math.sin(4 * math.pi * freq * t)
        edge = min(1.0, i / max(1, fade), (n - i) / max(1, fade))
        out.append(v * math.exp(-decay * t) * edge * vol)
    return out


def join(notes, gap):
    step = int(gap * RATE)
    size = step * (len(notes) - 1) + max(len(n) for n in notes)
    out = [0.0] * size
    for k, track in enumerate(notes):
        for i, v in enumerate(track):
            out[k * step + i] += v
    return out


def pour():
    out = []
    phase = 0.0
    n = int(0.42 * RATE)
    for i in range(n):
        t = i / RATE
        freq = 260 + 520 * (t / 0.42) ** 1.4 + 70 * math.sin(2 * math.pi * 17 * t)
        phase += 2 * math.pi * freq / RATE
        edge = min(1.0, i / 300, (n - i) / 900)
        out.append(math.sin(phase) * 0.35 * edge)
    return out


os.makedirs(OUT, exist_ok=True)
write('select.wav', note(880, 0.07, decay=30, vol=0.4))
write('pour.wav', pour())
write('invalid.wav', note(170, 0.16, decay=14))
write('complete.wav', join([note(660, 0.2), note(990, 0.3)], 0.09))
write('win.wav', join([note(523, 0.28), note(659, 0.28), note(784, 0.28), note(1047, 0.55, decay=4)], 0.12))
