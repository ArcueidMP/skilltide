// Mux a rendered picture with the soundtrack (and optional soft subtitles) into a delivery MP4.
//   node tools/mux.mjs build/render/clean-video.mp4 out/SkillTide-demo-1080p60.mp4 [--softsubs]
import { spawnSync } from "node:child_process";
import fs from "node:fs";

const [video, output] = process.argv.slice(2);
const softsubs = process.argv.includes("--softsubs");
fs.mkdirSync("out", { recursive: true });
const args = ["-y", "-loglevel", "error", "-i", video, "-i", "build/audio/mix.wav"];
if (softsubs) args.push("-i", "out/skilltide-demo.srt");
args.push("-map", "0:v", "-map", "1:a");
if (softsubs) args.push("-map", "2:s", "-c:s", "mov_text", "-metadata:s:s:0", "language=eng", "-metadata:s:s:0", "title=English");
args.push(
  "-c:v", "copy",
  // +3 dB to about -16 LUFS, with a peak limiter at -1.4 dBFS for the loudest speech peaks.
  "-af", "volume=3dB,alimiter=level_in=1:level_out=1:limit=0.85:attack=5:release=80:level=0",
  "-c:a", "aac", "-b:a", "320k", "-ar", "48000",
  "-metadata:s:a:0", "language=eng",
  "-metadata", "title=SkillTide — demo film",
  "-movflags", "+faststart",
  output,
);
const run = spawnSync("ffmpeg", args, { stdio: "inherit" });
if (run.status) process.exit(run.status);
const probe = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration,size,bit_rate:stream=codec_type,codec_name,width,height,r_frame_rate", "-of", "compact", output], { encoding: "utf8" });
console.log(probe.stdout.trim());
