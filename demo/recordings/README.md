# Demo recordings

> Insurance. Live computer-use demos slip ~20–30% of the time (per
> [`research/winning-tips.md`](../../../research/winning-tips.md)).
> Anything here is what you fall back to if the live demo dies.

## What goes here

| File | When recorded | Length | Use |
|------|---------------|--------|-----|
| `authmatic-happy-path.mp4` | End of build window (H+5:00) | ~95s | Full pitch fallback |
| `rtrvr-form-fill.mp4` | After Rtrvr is wired (H+3:00) | ~30s | Embed in `/run/:id` audit page |
| `authmatic-second-drug.mp4` | If time permits | ~60s | Q&A "does it work on Metformin?" |

## Recording protocol

1. Open the demo browser at `localhost:3000`, fresh state
   (`bash scripts/reset.sh` first).
2. Start QuickTime → File → New Screen Recording → record window
   (just the browser, not the whole desktop — no notifications to clip).
3. Drop the prescription PDF. Let the run complete. Click through to
   `/run/:id`. Click the receipt URL.
4. Stop recording the moment the receipt page loads.
5. Trim head and tail in QuickTime (Cmd-T).
6. Save as `.mp4` here, named per the table above.

## Playback in the pitch

- Don't preload — open the file at T-2 min so it's warm in QuickTime.
- Play in fullscreen (`Cmd-F`); the mouse cursor must not be visible
  on screen during playback or it confuses viewers.
- Narrate live over it — judges accept this if you announce
  ("I'll cut to a recording because conference WiFi is fragile").

## Why this folder is in `.gitignore`

MP4s are large and re-recorded often. Commit them only if you want to
preserve a specific take (rename it `authmatic-final.mp4` to opt in;
default-ignored pattern is `*.mp4` / `*.mov` in `.gitignore`).
