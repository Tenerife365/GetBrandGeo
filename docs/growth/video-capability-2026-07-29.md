# Video render capability on this machine

**Date:** 2026-07-29
**Question:** can this machine render video end to end, without a system ffmpeg?

---

## Verdict

**CAN RENDER.**

A 5 second 1080x1920 H.264 MP4 was rendered from a React composition and written to
disk. It was probed and confirmed. A PNG still was rendered from the same
composition. Nothing was installed system wide and no system ffmpeg exists on this
box.

The hypothesis was correct. Remotion v4 ships its own ffmpeg. It does not look for
a system one.

**One caveat that matters, and it is not optional.** The first render failed, twice,
with a misleading error. Remotion's Chrome Headless Shell downloader silently
extracts an incomplete archive on this machine. There is a one time manual fix,
documented in full below. Without it Remotion cannot render here at all. Anyone
setting this up on a second machine will hit the same wall.

---

## Evidence

### Environment before

- `node v24.16.0`, `npm 11.18.0`
- `where ffmpeg` returns `INFO: Could not find files for the given pattern(s).`
- Chrome 150.0.7871.187 present at `C:\Program Files\Google\Chrome\Application\`,
  not used by the render, see the browser note below

### Install

Project location, nothing written inside the repo:

```
C:\Users\const\AppData\Local\Temp\claude\C--Users-const-Constantin-Daniel-Goane-BrandGEO\ad488ff6-d2d4-4a12-bdff-cdd6c4bcfd64\scratchpad\remotion-test
```

Dependencies pinned at Remotion `4.0.386`, React 19:
`remotion`, `@remotion/cli`, `@remotion/google-fonts`, `react`, `react-dom`,
plus `typescript` and `@types/react`.

```
npm install --no-audit --no-fund
```

Result: `added 183 packages in 27s`, exit code 0. Measured wall time **27.7 seconds**.

### Disk footprint, measured

| Item | Size |
|---|---|
| `node_modules` immediately after install | **182.4 MB** (14,423 files) |
| `node_modules` after Chrome Headless Shell was fetched and extracted | **578.1 MB** |
| of which `node_modules\.remotion` (Chrome shell plus its 107 MB zip) | 340.4 MB |
| of which `@remotion/compositor-win32-x64-msvc` (the ffmpeg payload) | 45.6 MB |
| whole project directory including outputs | **579.4 MB** |

Well inside the 2 GB stop condition. The 107 MB zip is retained after extraction
and can be deleted to recover space, taking the total to roughly 470 MB.

### The render

```
npx remotion render MetricCounter out/metric.mp4 --codec=h264
```

Exit code 0. Tail of the output:

```
Composition          MetricCounter
Codec                h264
Output               out/metric.mp4
Concurrency          8x
...
Rendered 150/150
Encoded 150/150
+                    out/metric.mp4 499.9 kB
```

**Cold render wall time, including webpack bundling: 29.5 seconds.**
**Warm re-render with the bundle cached: 17.8 seconds.**

That is roughly 5.6x realtime cold and 3.6x realtime warm for a 5 second vertical
clip, at 8x concurrency. This is a fast answer, not a slow one. A 30 second clip
should land near 90 to 110 seconds.

### The still

```
npx remotion still MetricCounter out/frame-90.png --frame=90
```

Exit code 0. **14.7 seconds** wall, almost all of it webpack bundling. Two extra
stills were rendered at frames 0 and 149 to confirm the animation endpoints.

### Output files, measured

| File | Bytes | Size |
|---|---|---|
| `out/metric.mp4` | 499,937 | 488.2 KB |
| `out/metric2.mp4` (warm re-render) | 499,937 | 488.2 KB |
| `out/frame-90.png` | 61,171 | 59.7 KB |
| `out/frame-000.png` | 47,856 | 46.7 KB |
| `out/frame-149.png` | 55,456 | 54.2 KB |

The two MP4s are byte identical in size across separate runs, so the render is
deterministic.

### Probe of the MP4, using Remotion's own bundled ffprobe

```
node_modules\@remotion\compositor-win32-x64-msvc\ffprobe.exe -v error \
  -show_entries format=duration,size,bit_rate,format_name \
  -show_entries stream=codec_name,profile,width,height,r_frame_rate,nb_frames,pix_fmt \
  out\metric.mp4
```

```
[STREAM]
codec_name=h264
profile=100
width=1080
height=1920
pix_fmt=yuvj420p
r_frame_rate=30/1
nb_frames=150
[/STREAM]
[STREAM]
codec_name=aac
[/STREAM]
[FORMAT]
format_name=mov,mp4,m4a,3gp,3g2,mj2
duration=5.056000
size=499937
bit_rate=791039
[/FORMAT]
```

Resolution, frame rate and frame count are exactly as specified. 150 frames at
30 fps is **5.000 seconds of video**. The container reports **5.056 seconds**
because Remotion adds a silent AAC track by default, which is slightly longer than
the video track. Pass `--muted` if a bare video track is wanted.

### The composition actually animates

Frame 0 reads `0%` with an empty rail. Frame 90 reads `46%`. Frame 149 reads `47%`
with the rail complete. The value is driven by `useCurrentFrame()` through
`interpolate` with `Easing.out(Easing.cubic)`, so it decelerates into 47 rather
than counting linearly. Canvas is `#0a0b0e`, figure is `#a78bfa`, type is Inter.
All three stills were visually inspected, not assumed.

---

## Where the ffmpeg binary came from

```
C:\Users\const\AppData\Local\Temp\claude\C--Users-const-Constantin-Daniel-Goane-BrandGEO\ad488ff6-d2d4-4a12-bdff-cdd6c4bcfd64\scratchpad\remotion-test\node_modules\@remotion\compositor-win32-x64-msvc\ffmpeg.exe
```

It is genuinely self contained. The package ships `ffmpeg.exe`, `ffprobe.exe`,
Remotion's own Rust compositor `remotion.exe`, and every shared library they need
alongside them: `avcodec-60/61.dll`, `avformat-60/61.dll`, `avutil-58/59.dll`,
`avfilter-9/10.dll`, `swscale-7/8.dll`, `swresample-4/5.dll`, `libvpx-1.dll`,
`libstdc++-6.dll`, `libwinpthread-1.dll`, `libgcc_s_seh-1.dll`, `msvcr100.dll`,
`zlib1.dll`. Nothing is resolved from `PATH` or from a system install.

Run directly, outside Remotion, it works:

```
> ffmpeg.exe -version
ffmpeg version n7.1 Copyright (c) 2000-2024 the FFmpeg developers
built with gcc 10-win32 (GCC) 20220113
configuration: --prefix=remotion --target-os=mingw32 --arch=x86_64 ...
  --enable-encoder=libx264 --enable-encoder=libx265 --enable-libvpx ...
libavcodec     61. 19.100
```

Exit code 0. The `--prefix=remotion` in the configuration string confirms this is
Remotion's own build, not a system binary that happened to be found. It is a
deliberately trimmed FFmpeg 7.1: most encoders, decoders, muxers and filters are
disabled, with libx264, libx265, libvpx, libopus, libmp3lame, prores and gif kept.
That covers every format short form video needs.

**Consequence worth stating plainly:** this also gives the project a usable
standalone ffmpeg and ffprobe at a known path, for any task unrelated to Remotion.
The "no ffmpeg on this box" constraint is now solved as a side effect.

---

## Every error encountered

### 1. BLOCKER, worked around. Chrome Headless Shell extracts incompletely and fails silently.

This is the finding that matters. It cost two failed renders and it will recur on
any fresh install.

**First render attempt.** Remotion downloaded the browser, reported success, then
exited **code 0 having produced no file at all**:

```
Downloading Chrome Headless Shell https://www.remotion.dev/chrome-headless-shell
Getting Headless Shell - 9.5 Mb/102.3 Mb
...
Getting Headless Shell - 95.4 Mb/102.3 Mb
Got Headless Shell

EXITCODE=0
```

`out/` did not exist. A zero exit code with no output is the worst possible failure
mode, because any script or CI step would treat it as a pass.

**Second attempt** downloaded again and then threw:

```
TypeError: No browser found for rendering frames! Please open a GitHub issue and
describe how you reached this error: https://remotion.dev/issue
    at getLocalBrowserExecutable (node_modules\@remotion\renderer\dist\get-local-browser-executable.js:31:15)
    at Object.internalOpenBrowser (node_modules\@remotion\renderer\dist\open-browser.js:67:89)
EXITCODE=1
```

**Root cause, established by measurement not by guessing.** The downloaded zip is
intact. Opened with `System.IO.Compression.ZipFile` it reports **125 entries,
238.1 MB uncompressed**, including
`chrome-headless-shell-win64/chrome-headless-shell.exe` at 177,228,288 bytes.
Nothing is wrong with the download.

Remotion's own extractor had written only **2 of those 125 files**:
`ABOUT` and `LICENSE.headless_shell`. Those are precisely the first two entries in
the archive, and precisely the only two that sit at the top level of the extracted
folder. Extraction stopped at the third entry,
`chrome-headless-shell-win64/PrivacySandboxAttestationsPreloaded/manifest.json`,
which is the first entry that requires creating a nested subdirectory. So
Remotion's unzip is failing to create nested directories on this Windows box and is
swallowing the resulting error rather than reporting it.

**The fix, one line, one time per install.** Extracting the same zip with the
platform's own unzip works perfectly:

```powershell
$b = "<project>\node_modules\.remotion\chrome-headless-shell"
Remove-Item "$b\win64" -Recurse -Force -ErrorAction SilentlyContinue
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory("$b\chrome-headless-shell-win64.zip", "$b\win64")
```

Result: **125 of 125 files in 2.4 seconds**, `chrome-headless-shell.exe` present at
177,228,288 bytes. Every render after that worked first time, with no flags and no
further intervention.

Note the two argument overload is required. Passing a third `$true` overwrite
argument fails on the .NET Framework build available here with
`Cannot convert argument "entryNameEncoding"`. Delete the target directory first
instead.

**If this recurs and the manual extract is unwanted**, the supported alternative is
to point Remotion at the Chrome already installed on this machine:

```
npx remotion render MetricCounter out/metric.mp4 --codec=h264 \
  --browser-executable="C:\Program Files\Google\Chrome\Application\chrome.exe"
```

That path was confirmed to exist but was not exercised, because the manual extract
solved it and keeping the pinned headless shell is the more reproducible option.

### 2. Cosmetic. npm blocked esbuild's postinstall.

```
npm warn allow-scripts 1 package has install scripts not yet covered by allowScripts:
npm warn allow-scripts   esbuild@0.25.0 (postinstall: node install.js)
```

This is npm 11's script sandboxing, and it is exactly the class of native binary
failure the brief warned about. **It did not break anything.** npm still installed
the platform package through `optionalDependencies`, and
`node_modules\@esbuild\win32-x64\esbuild.exe` is present at 10.01 MB. Webpack
bundling ran to 100 percent on every invocation. No action needed, but do not
"fix" this warning by approving scripts, it is not the problem.

### 3. Real, needs a decision. The render requires internet for fonts.

```
[Tab 0, @remotion/google-fonts/dist/esm/Inter.mjs:95] Made 126 network requests to
load fonts for Inter. Consider loading fewer weights and subsets by passing options
to loadFont().
```

`@remotion/google-fonts` fetches Inter from Google at render time, and it does so
**per browser tab**. At 8x concurrency that is 8 tabs each making up to 126
requests, so roughly a thousand font requests per render. It worked, but it means
the render is not offline capable and is at the mercy of Google's CDN.

Fix before this goes into any repeatable pipeline: either narrow the request with
`loadFont('normal', { weights: ['500','700'], subsets: ['latin'] })`, or drop the
package entirely, vendor the two Inter weights as local `.woff2` files, and load
them with `@remotion/fonts`. The second option is the right one for production.

### 4. Cosmetic. Unrequested silent audio track.

The MP4 carries an AAC stream that was never asked for, which is why the container
duration reads 5.056 seconds against 5.000 seconds of video. Harmless for social
uploads. Pass `--muted` to drop it.

---

## What this means for BrandGEO

Motion graphics can be produced here, locally, at no marginal cost, in React, from
live data. Remotion compositions take props, so a metric card like the one rendered
in this test can be driven straight from `ai_results` rather than hand animated.
Vertical 1080x1920 is the format every short form channel takes, and it rendered
natively at that size.

The economics are good. Under 30 seconds cold and under 18 seconds warm for a 5
second clip, on this hardware, at 8x concurrency. No subscription, no upload, no
external service, no per render fee.

Three things to settle before building on it:

1. **Pin the Chrome Headless Shell fix into a setup script.** A silent exit code 0
   with no output file is a trap. Any automation must assert that the output file
   exists rather than trusting the exit code.
2. **Vendor Inter locally.** A thousand font requests per render against a third
   party CDN is not a foundation.
3. **Decide where `node_modules` lives.** 578 MB, and it must stay out of the repo.
   A sibling directory to the repo, git ignored, is the obvious answer.

## Reproduction

Everything above is reproducible from the scratch directory, which was left in
place:

```
C:\Users\const\AppData\Local\Temp\claude\C--Users-const-Constantin-Daniel-Goane-BrandGEO\ad488ff6-d2d4-4a12-bdff-cdd6c4bcfd64\scratchpad\remotion-test
```

Source is four files: `src/index.ts`, `src/Root.tsx`, `src/MetricCounter.tsx`,
`remotion.config.ts`. Rendered outputs are in `out/`. Nothing was written anywhere
under the BrandGEO repo except this report.
