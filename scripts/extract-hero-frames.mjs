import { execFileSync } from "node:child_process";
import { rmSync, mkdirSync, copyFileSync } from "node:fs";
import { join } from "node:path";
import ffmpeg from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";

const input = "design/video/kling_20260926_VIDEO_Crie_um_v__1201_0.mp4";
const outputDir = "public/media/hero-frames";
const frameCount = 182;

if (!ffmpeg) {
  throw new Error("ffmpeg-static did not provide a binary path.");
}

const ffprobe = ffprobeStatic.path;
const metadata = JSON.parse(execFileSync(ffprobe, [
  "-v", "error",
  "-show_entries", "format=duration",
  "-of", "json",
  input,
], { encoding: "utf8" }));

const duration = Number(metadata.format?.duration || 0);
if (!duration) {
  throw new Error("Could not read video duration.");
}

const fps = frameCount / duration;
rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });

execFileSync(ffmpeg, [
  "-y",
  "-i", input,
  "-vf", `fps=${fps.toFixed(6)},scale=1920:-2:flags=lanczos`,
  "-vframes", String(frameCount),
  "-c:v", "libwebp",
  "-compression_level", "5",
  "-q:v", "72",
  join(outputDir, "frame-%04d.webp"),
], { stdio: "inherit" });

copyFileSync(join(outputDir, "frame-0001.webp"), "public/media/hero-poster.webp");
console.log(`Generated ${frameCount} frames from ${duration.toFixed(2)}s video at ${fps.toFixed(3)} fps.`);
