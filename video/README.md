# SkillTide demo film

A five-minute, 1080p60 film of SkillTide, rendered frame by frame from an HTML/three.js composition.
- The app footage is the real static build of this repository, captured as layered screenshots.
- The island chart is drawn from the real dataset: an island's height is the role's AI outlook (sea level is 35, one contour per 5 points).

## What is in git

- `comp/`: the composition, with one module per scene in `comp/scenes/`.
- `tools/`: the capture, data export, narration, timeline, audio, render and mux steps.
- `narration.json`: the narration lines and their subtitles.
- `assets/`: the exported numbers (`data.json`), the rendered synthetic CV and the captured app screens.
- `build/timeline.json` and `build/sfx.json`: the scene and word timings and the sound cues of the released cut.
- `out/`: the subtitles (`skilltide-demo.srt`), the narration script with timestamps, and a poster frame.

These are not in git:
- the rendered MP4s and the audio stems, which are too large for GitHub;
- `node_modules/`, `.venv/` and `models/`;
- everything else under `build/`.

## Setup

Run all commands from `video/` unless a step says otherwise.

```bash
npm ci
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements.txt
mkdir -p models
curl -L -o models/kokoro-v1.0.onnx https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
curl -L -o models/voices-v1.0.bin https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
```

The film also needs:
- the repository's own `npm ci`, which provides the fonts and, through `npm run build:static`, the app the capture records;
- Chrome at `C:/Program Files/Google/Chrome/Application/chrome.exe`;
- ffmpeg on the PATH.

Optional pronunciation check: download `models/ggml-base.en.bin` from `huggingface.co/ggerganov/whisper.cpp`. You can then transcribe each narration clip with ffmpeg's `whisper` filter.

## Rebuild

Start `node tools/serve.mjs` in the background and keep it running. It serves the composition on port 5199 and the app's static export on port 4175.

1. `node tools/capture.mjs`: screenshots every app state in Kavin's story. Run `npm run build:static` at the repository root first.
2. `npx tsx video/tools/export-data.mts`, from the repository root: exports outlooks, matches and the pathway into `assets/data.json`.
3. `node tools/render-cv.mjs`: renders the synthetic CV page and the positions of its text with pdf.js.
4. `.venv/Scripts/python tools/tts.py af_heart 1.0`: synthesises the narration locally with Kokoro.
5. `node tools/timeline.mjs`: fits the narration to a 96 BPM grid of exactly 300 s.
6. `node tools/export-sfx.mjs`, then `.venv/Scripts/python tools/audio.py`: writes the sound cues, then the score, the effects and the mix.
7. `node tools/render.mjs --workers 4 --name clean`. Add `--subs` for the subtitled picture.
8. `node tools/srt.mjs`, then `node tools/mux.mjs build/render/clean-video.mp4 out/SkillTide-demo-1080p60.mp4 --softsubs`.

To check a single frame, run `node tools/still.mjs <seconds> [--subs]`. It writes to `build/stills/`.

## Sources and disclosure

Everything on screen comes from SkillTide's public data, its synthetic sample CV and its synthetic student. If the weekly refresh changes the numbers, re-run steps 1 and 2 and check the narration against the new figures before rendering again.

- **Narration:** a synthetic voice from Kokoro-82M (Apache-2.0 weights), run locally.
- **Music and effects:** synthesised in `tools/audio.py`.
- **"Next" section:** the items marked "concept · not built yet" are not built.
