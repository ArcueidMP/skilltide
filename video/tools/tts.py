# Synthesise the narration line by line with Kokoro (local, Apache-2.0 weights).
import json, sys, numpy as np, soundfile as sf
from pathlib import Path
from kokoro_onnx import Kokoro

VOICE = sys.argv[1] if len(sys.argv) > 1 else "af_heart"
SPEED = float(sys.argv[2]) if len(sys.argv) > 2 else 1.0
only = set(sys.argv[3].split(",")) if len(sys.argv) > 3 else None
out = Path("build/vo"); out.mkdir(parents=True, exist_ok=True)
k = Kokoro("models/kokoro-v1.0.onnx", "models/voices-v1.0.bin")
lines = json.load(open("narration.json", encoding="utf-8"))
# Names espeak gets wrong: Kavin is "KUH-vin" (Tamil), Johor is "JOH-hor".
FIXES = [("kˈævɪn", "kˈʌvɪn"), ("dʒˈoʊhɚ", "dʒˈoʊhɔːɹ")]
index_path = out / "vo.json"
index = json.load(open(index_path)) if index_path.exists() else {}

def trim(x, sr, pad=0.04, thresh_db=-48):
    env = np.abs(x)
    win = int(sr * 0.01)
    level = np.convolve(env, np.ones(win) / win, mode="same")
    on = np.where(level > 10 ** (thresh_db / 20))[0]
    if not len(on): return x
    a = max(0, on[0] - int(pad * sr)); b = min(len(x), on[-1] + int(pad * sr))
    return x[a:b]

for line in lines:
    if only and line["id"] not in only: continue
    phonemes = k.tokenizer.phonemize(line["say"], "en-us")
    for wrong, right in FIXES:
        phonemes = phonemes.replace(wrong, right)
    samples, sr = k.create(phonemes, voice=VOICE, speed=SPEED, lang="en-us", is_phonemes=True)
    samples = trim(np.asarray(samples, dtype=np.float32), sr)
    sf.write(out / f"{line['id']}.wav", samples, sr, subtype="FLOAT")
    index[line["id"]] = {"dur": round(len(samples) / sr, 3), "sr": sr, "scene": line["scene"], "voice": VOICE, "speed": SPEED}
    print(line["id"], line["scene"], round(len(samples) / sr, 2))
json.dump(index, open(index_path, "w"), indent=1)
total = sum(v["dur"] for v in index.values())
print("total speech", round(total, 1), "s")
