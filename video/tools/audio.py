"""Soundtrack for the SkillTide film: score, sound effects and narration, mixed to one WAV.

Everything is synthesised here (numpy/scipy); the narration comes from build/vo (Kokoro).
Section changes land on the same beat grid the picture uses (build/timeline.json), and
effects land on the cues the scenes registered (build/sfx.json).
"""
import json
import numpy as np
from pathlib import Path
from scipy import signal
import soundfile as sf

SR = 48000
ROOT = Path(__file__).resolve().parent.parent
timeline = json.load(open(ROOT / "build/timeline.json", encoding="utf-8"))
cues = json.load(open(ROOT / "build/sfx.json", encoding="utf-8"))
DUR = timeline["duration"]
N = int(round(DUR * SR))
BEAT = timeline["beat"]
BAR = BEAT * 4
rng = np.random.default_rng(7)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def stereo(x, pan=0.0):
    a = (pan + 1) * np.pi / 4
    return np.stack([x * np.cos(a), x * np.sin(a)], axis=1)


def place(bus, x, t, gain=1.0):
    """Add a mono or stereo clip into a stereo bus at time t (seconds)."""
    if x.ndim == 1:
        x = stereo(x)
    i = int(round(t * SR))
    if i >= len(bus) or i + len(x) <= 0:
        return
    j0 = max(0, -i)
    j1 = min(len(x), len(bus) - i)
    bus[i + j0:i + j1] += x[j0:j1] * gain


def lp(x, hz, order=2):
    sos = signal.butter(order, hz, btype="low", fs=SR, output="sos")
    return signal.sosfilt(sos, x, axis=0)


def hp(x, hz, order=2):
    sos = signal.butter(order, hz, btype="high", fs=SR, output="sos")
    return signal.sosfilt(sos, x, axis=0)


def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], btype="band", fs=SR, output="sos")
    return signal.sosfilt(sos, x, axis=0)


def env_adsr(n, a, d, s, r, total):
    t = np.arange(n) / SR
    e = np.where(t < a, t / max(a, 1e-4), 1.0)
    e = np.where((t >= a) & (t < a + d), 1 - (1 - s) * (t - a) / max(d, 1e-4), e)
    e = np.where(t >= a + d, s, e)
    rel = np.clip((t - total) / max(r, 1e-4), 0, 1)
    return e * (1 - rel)


def impulse_response(seconds=3.2, decay=2.6, damp=0.45):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    out = []
    for ch in range(2):
        noise = rng.standard_normal(n)
        bright = noise * np.exp(-t * decay * 2.2)
        dark = lp(noise, 2200) * np.exp(-t * decay)
        ir = bright * damp + dark * (1 - damp)
        for k in range(6):  # a few early reflections
            d = int((0.011 + 0.017 * k + 0.004 * ch) * SR)
            ir[d] += 0.5 * (0.7 ** k)
        ir[:int(0.004 * SR)] *= np.linspace(0, 1, int(0.004 * SR))
        out.append(ir / np.sqrt(np.sum(ir ** 2)))
    return np.stack(out, axis=1)


IR = impulse_response()


def reverb(x, wet=0.3):
    l = signal.fftconvolve(x[:, 0], IR[:, 0])[: len(x)]
    r = signal.fftconvolve(x[:, 1], IR[:, 1])[: len(x)]
    return x * (1 - wet) + np.stack([l, r], axis=1) * wet * 3.0


# ----------------------------------------------------------------------------- instruments

def saw(freq, n, phase=0.0):
    ph = (phase + np.arange(n) * freq / SR) % 1.0
    return 2 * ph - 1


def pad_note(freq, dur, cutoff, attack=0.9, release=1.4):
    n = int((dur + release) * SR)
    voices = []
    for i, cents in enumerate((-8, 0, 7)):
        f = freq * 2 ** (cents / 1200)
        v = saw(f, n, phase=rng.random())
        voices.append((v, (-0.6, 0.0, 0.6)[i]))
    sub = np.sin(2 * np.pi * freq / 2 * np.arange(n) / SR) * 0.35
    e = env_adsr(n, attack, 0.8, 0.85, release, dur)
    out = np.zeros((n, 2))
    for v, pan in voices:
        out += stereo(lp(v, cutoff, 2) * e, pan)
    out += stereo(sub * e)
    return out * 0.16


def pluck(freq, dur=0.9, bright=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for k in range(1, 9):
        if freq * k > 15000:
            break
        tau = 0.55 / (1 + 0.38 * (k - 1)) * (0.7 + 0.3 * bright)
        x += (1 / k ** 1.25) * np.sin(2 * np.pi * freq * k * t * (1 + 0.0004 * k * k)) * np.exp(-t / tau)
    x *= np.minimum(1, t / 0.002)
    return x * 0.5


def bass_note(freq, dur):
    n = int((dur + 0.08) * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * freq * t) + 0.18 * np.sin(4 * np.pi * freq * t) + 0.05 * np.sin(6 * np.pi * freq * t)
    e = env_adsr(n, 0.008, 0.25, 0.7, 0.08, dur)
    return np.tanh(1.4 * x * e) * 0.5


def kick():
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    f = 46 + 70 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * np.exp(-t * 7.5)
    click = hp(rng.standard_normal(n), 3000) * np.exp(-t * 300) * 0.15
    return (x + click) * 0.85


def hat(open_=False):
    n = int((0.16 if open_ else 0.05) * SR)
    t = np.arange(n) / SR
    x = hp(rng.standard_normal(n), 6500, 4) * np.exp(-t * (18 if open_ else 70))
    return x * 0.36


def snap():
    n = int(0.18 * SR)
    t = np.arange(n) / SR
    x = bp(rng.standard_normal(n), 1400, 5200) * np.exp(-t * 32) + 0.25 * np.sin(2 * np.pi * 1850 * t) * np.exp(-t * 60)
    return x * 0.32


# ----------------------------------------------------------------------------- harmony

CHORDS = {
    "Bm9": (35, [50, 54, 57, 61, 47]), "Gmaj7": (43, [47, 50, 54, 57]), "Em9": (40, [55, 59, 62, 66]),
    "Dmaj7/A": (33, [50, 54, 57, 61]), "A6sus": (33, [52, 57, 62, 66]), "Bm": (35, [50, 54, 59]),
    "G": (43, [50, 55, 59]), "F#sus4": (42, [59, 61, 66]), "F#7": (42, [58, 61, 64]),
    "D": (38, [54, 57, 62, 64]), "A/C#": (37, [52, 57, 61]), "Bm7": (35, [50, 54, 57]),
    "Gmaj9": (31, [54, 57, 59, 62]), "D/F#": (42, [57, 62, 66]), "A7sus4": (33, [62, 64, 67]),
    "A": (33, [52, 57, 61]), "Dmaj9": (38, [54, 57, 61, 64]),
}

SECTIONS = {
    "open": dict(prog=[("Bm9", 2), ("Gmaj7", 2), ("Em9", 2), ("Dmaj7/A", 2), ("A6sus", 1)], cutoff=1100, pad=1.0, bass=0.0, arp=0.0, drums=0, ocean=1.0),
    "problem": dict(prog=[("Bm", 1), ("G", 1), ("Em9", 1), ("F#sus4", 0.5), ("F#7", 0.5)], cutoff=1300, pad=0.8, bass=0.55, bass_style="pulse", arp=0.0, drums=1, ocean=0.25),
    "approach": dict(prog=[("D", 1), ("A/C#", 1), ("Bm7", 1), ("Gmaj9", 1)], cutoff=1700, pad=0.75, bass=0.6, bass_style="half", arp=0.7, arp_style="8", drums=2, ocean=0.1),
    "profile": dict(prog=[("Gmaj9", 1), ("D/F#", 1), ("Em9", 1), ("A7sus4", 1)], cutoff=1900, pad=0.6, bass=0.7, bass_style="groove", arp=0.75, arp_style="16", drums=3, ocean=0.0),
    "radar": dict(prog=[("Gmaj9", 1), ("D/F#", 1), ("Em9", 1), ("A7sus4", 1)], cutoff=2000, pad=0.6, bass=0.7, bass_style="groove", arp=0.8, arp_style="16", drums=3, ocean=0.0),
    "match": dict(prog=[("Gmaj9", 1), ("D/F#", 1), ("Em9", 1), ("A7sus4", 1)], cutoff=2100, pad=0.6, bass=0.72, bass_style="groove", arp=0.8, arp_style="16", drums=3, ocean=0.0),
    "replay": dict(prog=[("Bm9", 2), ("Gmaj7", 2), ("Em9", 2), ("F#7", 1.5), ("Bm9", 1), ("A6sus", 2)], cutoff=2400, pad=0.95, bass=0.4, bass_style="whole", arp=0.5, arp_style="sparse", drums=0, ocean=0.35),
    "scenario": dict(prog=[("Bm7", 1), ("Gmaj9", 1), ("D", 1), ("A", 1)], cutoff=1800, pad=0.7, bass=0.65, bass_style="half", arp=0.6, arp_style="8", drums=2, ocean=0.0),
    "pathway": dict(prog=[("Gmaj9", 1), ("D/F#", 1), ("Em9", 1), ("A7sus4", 1)], cutoff=2100, pad=0.6, bass=0.72, bass_style="groove", arp=0.8, arp_style="16", drums=3, ocean=0.0),
    "cohort": dict(prog=[("D", 1), ("A/C#", 1), ("Bm7", 1), ("Gmaj9", 1)], cutoff=1900, pad=0.75, bass=0.5, bass_style="half", arp=0.7, arp_style="8", drums=1, ocean=0.0),
    "engine": dict(prog=[("Bm7", 1), ("Gmaj9", 1), ("D", 1), ("A", 1)], cutoff=2000, pad=0.55, bass=0.75, bass_style="eighths", arp=0.85, arp_style="16", drums=4, ocean=0.0),
    "future": dict(prog=[("Gmaj9", 1), ("A6sus", 1), ("Bm9", 1), ("D/F#", 1), ("Gmaj9", 1), ("A7sus4", 1), ("Gmaj9", 1), ("A7sus4", 1.5)], cutoff=2600, pad=0.8, bass=0.7, bass_style="eighths", arp=0.9, arp_style="16up", drums=4, ocean=0.0, build=True),
    "close": dict(prog=[("Dmaj9", 8)], cutoff=1500, pad=1.0, bass=0.5, bass_style="whole", arp=0.35, arp_style="sparse", drums=0, ocean=1.0),
}

pad_bus = np.zeros((N, 2))
bass_bus = np.zeros((N, 2))
arp_bus = np.zeros((N, 2))
drum_bus = np.zeros((N, 2))
ocean_bus = np.zeros((N, 2))
fx_bus = np.zeros((N, 2))

ARP = {
    "8": [0, 2, 1, 3, 2, 1, 3, 2],
    "16": [0, 2, 3, 1, 2, 3, 1, 2, 0, 2, 3, 1, 3, 2, 1, 2],
    "16up": [0, 1, 2, 3, 1, 2, 3, 4, 2, 3, 4, 5, 3, 4, 5, 6],
    "sparse": [0, None, None, 2, None, None, 1, None],
}

for scene in timeline["scenes"]:
    sec = SECTIONS[scene["id"]]
    t0, t1 = scene["start"], scene["end"]
    # Lay out the chord progression, looping or cutting it to fit the scene.
    chords = []
    t = t0
    while t < t1 - 1e-6:
        for name, bars in sec["prog"]:
            if t >= t1 - 1e-6:
                break
            d = min(bars * BAR, t1 - t)
            chords.append((t, d, name))
            t += d
    for ci, (ct, cd, name) in enumerate(chords):
        root, notes = CHORDS[name]
        progress = (ct - t0) / max(1e-6, t1 - t0)
        cutoff = 1.7 * sec["cutoff"] * (1 + (0.9 * progress if sec.get("build") else 0))
        for n in notes:
            place(pad_bus, pad_note(midi(n), cd, cutoff), ct, sec["pad"] * 0.55)
        # Bass.
        style = sec.get("bass_style", "whole")
        if sec["bass"] > 0:
            f = midi(root + 12 if root < 36 else root)
            if style == "whole":
                place(bass_bus, bass_note(f, cd * 0.95), ct, sec["bass"])
            elif style == "half":
                for k in np.arange(0, cd - 1e-6, BEAT * 2):
                    place(bass_bus, bass_note(f, BEAT * 1.8), ct + k, sec["bass"])
            elif style == "pulse":
                for k in np.arange(0, cd - 1e-6, BEAT / 2):
                    place(bass_bus, bass_note(f, BEAT * 0.4), ct + k, sec["bass"] * (0.9 if int(round(k / (BEAT / 2))) % 2 == 0 else 0.55))
            elif style == "eighths":
                for k in np.arange(0, cd - 1e-6, BEAT / 2):
                    oct_ = 2 if int(round(k / (BEAT / 2))) % 4 == 3 else 1
                    place(bass_bus, bass_note(f * oct_, BEAT * 0.42), ct + k, sec["bass"] * 0.8)
            elif style == "groove":
                pattern = [(0, 1.4, 1), (1.5, 0.45, 0.6), (2, 0.9, 0.9), (3.5, 0.45, 0.65)]
                for b0 in np.arange(0, cd - 1e-6, BAR):
                    for beat, length, vel in pattern:
                        if b0 + beat * BEAT < cd:
                            place(bass_bus, bass_note(f, BEAT * length), ct + b0 + beat * BEAT, sec["bass"] * vel)
        # Arpeggio of chord tones.
        if sec["arp"] > 0:
            pat = ARP[sec.get("arp_style", "8")]
            step = BEAT / 4 if sec.get("arp_style", "8").startswith("16") else BEAT / 2
            tones = sorted(notes)
            tones = tones + [x + 12 for x in tones]
            k = 0
            for s0 in np.arange(0, cd - 1e-6, step):
                idx = pat[k % len(pat)]
                k += 1
                if idx is None:
                    continue
                n = tones[idx % len(tones)] + 12
                vel = (0.9 if k % 4 == 1 else 0.6) * (0.85 + 0.3 * rng.random())
                x = pluck(midi(n), 0.7, bright=0.8)
                pan = -0.45 if k % 2 else 0.45
                place(arp_bus, stereo(x, pan), ct + s0, sec["arp"] * vel * 0.35)
    # Drums: 0 none, 1 hats only, 2 light, 3 groove, 4 driving.
    level = sec["drums"]
    if level:
        for b0 in np.arange(t0, t1 - 1e-6, BAR):
            for s in range(16):
                tt = b0 + s * BEAT / 4
                if tt >= t1 - 0.02:
                    break
                fade = min(1.0, (tt - t0) / (2 * BAR)) if scene["id"] in ("problem", "approach") else 1.0
                if level >= 1 and s % 2 == 0:
                    place(drum_bus, stereo(hat(), 0.3), tt, (0.55 if s % 4 == 0 else 0.35) * fade)
                if level >= 3 and s % 2 == 1:
                    place(drum_bus, stereo(hat(), -0.3), tt, 0.18 * fade)
                if level >= 2 and s in (0, 8):
                    place(drum_bus, kick(), tt, 0.7 * fade)
                if level >= 3 and s == 10:
                    place(drum_bus, kick(), tt, 0.35)
                if level >= 4 and s in (4, 12):
                    place(drum_bus, kick(), tt, 0.55)
                if level >= 3 and s in (4, 12):
                    place(drum_bus, stereo(snap(), 0.1), tt, 0.5)
    # Ocean bed.
    if sec["ocean"] > 0:
        n = int((t1 - t0 + 2) * SR)
        tt = np.arange(n) / SR
        brown = np.cumsum(rng.standard_normal(n)) * 0.02
        brown = hp(brown, 25)
        swell = 0.55 + 0.45 * np.sin(2 * np.pi * tt / 7.3 + 1.0) * np.sin(2 * np.pi * tt / 11.9)
        body = lp(brown, 650) * swell
        foam = hp(rng.standard_normal(n), 2500) * np.clip(np.sin(2 * np.pi * tt / 7.3 + 1.0), 0, 1) ** 6 * 0.05
        x = stereo(body * 0.9 + foam, -0.2) + stereo(lp(np.roll(brown, 9000), 520) * swell * 0.8, 0.3)
        e = np.minimum(1, tt / 1.5) * np.minimum(1, (t1 - t0 + 2 - tt) / 1.5)
        place(ocean_bus, x * e[:, None], t0 - 1, sec["ocean"] * 0.5)

# A riser into the close and a crash on the downbeat.
close = next(s for s in timeline["scenes"] if s["id"] == "close")
n = int(2 * BAR * SR)
tt = np.arange(n) / SR
riser = bp(rng.standard_normal(n), 400, 6000) * (tt / tt[-1]) ** 2.5 * 0.25
place(fx_bus, stereo(riser), close["start"] - 2 * BAR, 0.5)


# ----------------------------------------------------------------------------- sound effects

def sweep_noise(dur, f0, f1, q=1.6):
    n = int(dur * SR)
    x = rng.standard_normal(n)
    out = np.zeros(n)
    hop = 512
    zi = None
    for i in range(0, n, hop):
        k = i / n
        fc = f0 * (f1 / f0) ** k
        lo, hi = fc / q, min(fc * q, SR / 2 - 100)
        sos = signal.butter(2, [lo, hi], btype="band", fs=SR, output="sos")
        if zi is None:
            zi = signal.sosfilt_zi(sos) * 0
        seg, zi = signal.sosfilt(sos, x[i:i + hop], zi=zi)
        out[i:i + hop] = seg
    return out


def fx(kind):
    if kind == "whoosh":
        d = 1.15
        x = sweep_noise(d, 250, 2600)
        t = np.arange(len(x)) / SR
        e = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.6
        y = x * e * 0.55
        pan = np.linspace(-0.6, 0.6, len(y))
        return np.stack([y * np.cos((pan + 1) * np.pi / 4), y * np.sin((pan + 1) * np.pi / 4)], axis=1)
    if kind == "swish":
        d = 0.5
        x = hp(sweep_noise(d, 1200, 5000), 800)
        t = np.arange(len(x)) / SR
        return x * np.exp(-t * 6) * np.minimum(1, t / 0.03) * 0.5
    if kind == "click":
        n = int(0.06 * SR)
        t = np.arange(n) / SR
        return (bp(rng.standard_normal(n), 2000, 7000) * np.exp(-t * 180) * 0.5 + np.sin(2 * np.pi * 2600 * t) * np.exp(-t * 120) * 0.25)
    if kind == "tick":
        f = midi(rng.choice([86, 88, 90, 93, 95]))
        return pluck(f, 0.35, 1.0) * 0.55
    if kind == "pop":
        n = int(0.16 * SR)
        t = np.arange(n) / SR
        f = 820 + 380 * np.minimum(1, t / 0.05)
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 28) * 0.4
    if kind == "ping":
        n = int(2.6 * SR)
        t = np.arange(n) / SR
        f = 1318.5 * (1 - 0.006 * np.minimum(1, t / 1.5))
        ph = 2 * np.pi * np.cumsum(f) / SR
        x = (np.sin(ph) + 0.28 * np.sin(2 * ph) + 0.08 * np.sin(3.01 * ph)) * np.exp(-t * 2.1) * np.minimum(1, t / 0.004)
        return x * 0.38
    if kind == "stamp":
        n = int(0.32 * SR)
        t = np.arange(n) / SR
        return np.sin(2 * np.pi * 95 * t) * np.exp(-t * 22) * 0.8 + bp(rng.standard_normal(n), 300, 2400) * np.exp(-t * 60) * 0.35
    if kind == "fill":
        d = 1.4
        x = sweep_noise(d, 300, 900, 1.3)
        t = np.arange(len(x)) / SR
        return x * np.sin(np.pi * np.clip(t / d, 0, 1)) * 0.25
    if kind == "count":
        out = np.zeros(int(1.6 * SR))
        times = 1.5 * (np.linspace(0, 1, 14) ** 1.6)
        for i, tt in enumerate(times):
            p = pluck(midi(84 + (i % 3) * 2), 0.12, 1.0) * 0.28
            i0 = int(tt * SR)
            out[i0:i0 + len(p)] += p[: len(out) - i0]
        return out
    if kind == "scan":
        d = 2.3
        n = int(d * SR)
        t = np.arange(n) / SR
        f = 520 + 600 * t / d
        x = np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * t))
        return lp(x, 2500) * np.sin(np.pi * t / d) ** 0.7 * 0.12
    if kind == "rise":
        out = np.zeros(int(1.6 * SR))
        for i, n_ in enumerate([62, 66, 69, 74, 78]):
            p = pluck(midi(n_ + 12), 0.9, 1.0) * 0.4
            i0 = int(i * 0.11 * SR)
            out[i0:i0 + len(p)] += p[: len(out) - i0]
        return out
    if kind in ("rewind", "forward"):
        d = 1.6
        x = sweep_noise(d, 3000, 300) if kind == "rewind" else sweep_noise(d, 300, 3000)
        t = np.arange(len(x)) / SR
        tone = np.sin(2 * np.pi * np.cumsum(np.linspace(880, 330, len(x)) if kind == "rewind" else np.linspace(330, 880, len(x))) / SR) * 0.15
        return (x * 0.4 + tone) * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.2
    if kind == "draw":
        d = 2.0
        n = int(d * SR)
        t = np.arange(n) / SR
        x = bp(rng.standard_normal(n), 2500, 6500) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 5.5 * t)))
        return x * np.sin(np.pi * t / d) * 0.08
    if kind == "swell":
        d = 4.0
        x = sweep_noise(d, 180, 1400, 1.4)
        t = np.arange(len(x)) / SR
        return x * (np.sin(np.pi * 0.5 * np.clip(t / 2.8, 0, 1)) * np.clip((d - t) / 1.2, 0, 1)) * 0.35
    if kind == "tide":
        d = 4.5
        n = int(d * SR)
        t = np.arange(n) / SR
        x = lp(np.cumsum(rng.standard_normal(n)) * 0.03, 500)
        x = hp(x, 30)
        return x * np.sin(np.pi * t / d) ** 1.5 * 0.9
    raise ValueError(kind)


for cue in cues:
    x = fx(cue["type"])
    place(fx_bus, x, cue["t"], cue["gain"])

# ----------------------------------------------------------------------------- narration

vo = np.zeros((N, 2))
for line in timeline["lines"]:
    data, sr = sf.read(ROOT / f"build/vo/{line['id']}.wav", dtype="float32")
    x = signal.resample_poly(data, SR // 8000 * 1, sr // 8000 * 1) if sr != SR else data
    x = hp(x, 70)
    place(vo, x, line["start"], 1.0)


def lufs(x):
    """Integrated loudness (ITU-R BS.1770, 48 kHz K-weighting, gated)."""
    b1, a1 = [1.53512485958697, -2.69169618940638, 1.19839281085285], [1.0, -1.69065929318241, 0.73248077421585]
    b2, a2 = [1.0, -2.0, 1.0], [1.0, -1.99004745483398, 0.99007225036621]
    y = signal.lfilter(b2, a2, signal.lfilter(b1, a1, x, axis=0), axis=0)
    blk, hop = int(0.4 * SR), int(0.1 * SR)
    ms = np.array([np.sum(np.mean(y[i:i + blk] ** 2, axis=0)) for i in range(0, len(y) - blk, hop)])
    ms = ms[ms > 10 ** ((-70 + 0.691) / 10)]
    rel = 10 * np.log10(np.mean(ms)) - 0.691 - 10
    ms = ms[10 * np.log10(ms) - 0.691 > rel]
    return 10 * np.log10(np.mean(ms)) - 0.691


def compress(x, threshold_db=-26, ratio=3.0, attack=0.004, release=0.09):
    """Feed-forward RMS compressor on the summed signal; returns the processed stereo signal."""
    mono = np.mean(x, axis=1)
    rms = np.sqrt(np.convolve(mono ** 2, np.ones(int(0.008 * SR)) / int(0.008 * SR), mode="same") + 1e-12)
    level = 20 * np.log10(rms)
    over = np.maximum(level - threshold_db, 0)
    gr = -over * (1 - 1 / ratio)
    a_c, r_c = np.exp(-1 / (attack * SR)), np.exp(-1 / (release * SR))
    smooth = np.empty_like(gr)
    g = 0.0
    for i, v in enumerate(gr):
        c = a_c if v < g else r_c
        g = c * g + (1 - c) * v
        smooth[i] = g
    return x * (10 ** (smooth / 20))[:, None]


def gain_to(x, target):
    return x * 10 ** ((target - lufs(x)) / 20)


vo = compress(vo)
vo = gain_to(vo, -19.0)
vo_mono = vo[:, 0]

# Ducking envelope from the narration.
level = np.abs(vo_mono)
win = int(0.03 * SR)
level = np.convolve(level, np.ones(win) / win, mode="same")
active = (level > 0.004).astype(float)
att, rel = int(0.12 * SR), int(0.5 * SR)
duck = signal.lfilter([1 / rel], [1, -(1 - 1 / rel)], active)
duck = np.maximum(duck, signal.lfilter([1 / att], [1, -(1 - 1 / att)], active))
duck = np.clip(duck * 1.6, 0, 1)

# ----------------------------------------------------------------------------- mix

music = reverb(pad_bus, 0.35) * 0.9 + bass_bus * 0.75 + reverb(arp_bus, 0.38) * 0.85 + reverb(drum_bus, 0.12) * 0.65 + ocean_bus * 0.9
music = hp(music, 30)
# A gentle high shelf so the bed does not sound muffled under the voice.
music = music + 0.9 * hp(music, 3200)
music = gain_to(music, -24.0)
music_gain = 10 ** (-10.0 * duck / 20)
music *= music_gain[:, None]
effects = gain_to(reverb(fx_bus, 0.3), -27.0)
effects *= (10 ** (-6.0 * duck / 20))[:, None]
mix = music + effects + vo
for name, x in [("narration", vo), ("music (ducked)", music), ("effects", effects), ("mix", mix)]:
    print(f"{name:16s} {lufs(x):6.1f} LUFS  peak {20 * np.log10(np.max(np.abs(x)) + 1e-12):6.1f} dBFS")
bands = [(20, 60), (60, 250), (250, 2000), (2000, 8000), (8000, 20000)]
spec_f, spec_p = signal.welch(np.mean(music, axis=1), SR, nperseg=8192)
print("music band energy (dB):", " ".join(f"{lo}-{hi}:{10*np.log10(np.sum(spec_p[(spec_f>=lo)&(spec_f<hi)])+1e-20):.1f}" for lo, hi in bands))

# End: fade the last second, as the picture fades to paper.
fade = np.ones(N)
k = int(1.2 * SR)
fade[-k:] = np.linspace(1, 0, k) ** 1.5
mix *= fade[:, None]
music *= fade[:, None]
effects *= fade[:, None]

def soft_limit(x, ceiling=0.89):
    return ceiling * np.tanh(x / ceiling)

out = ROOT / "build/audio"
out.mkdir(parents=True, exist_ok=True)
sf.write(out / "mix.wav", soft_limit(mix).astype(np.float32), SR, subtype="PCM_24")
sf.write(out / "music.wav", soft_limit(music).astype(np.float32), SR, subtype="PCM_24")
sf.write(out / "sfx.wav", soft_limit(effects).astype(np.float32), SR, subtype="PCM_24")
sf.write(out / "narration.wav", soft_limit(vo).astype(np.float32), SR, subtype="PCM_24")
print("wrote", out, "duration", N / SR, "peak", float(np.max(np.abs(mix))))
