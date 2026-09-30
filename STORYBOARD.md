# Signalroom × RiseAboveReality — launch film storyboard

**Spec:** 1920×1080 master (rendered from 2× captures, so every UI shot is supersampled), 60fps, ~50s, 120 BPM
(1 beat = 30 frames, 1 bar = 2s). Cuts land on beats / 8ths / 16ths.

**Rule of the edit:** *fast between shots, smooth within them.* Transitions are 4–8 frame whips, channel
flips, tape wipes and color mattes. Inside a shot the camera glides with long eases so the site is readable.

**Narrative:** RAR's world → *tunes in* to Signalroom's frequency → the site → back out through the
"Built by RiseAboveReality" credit in the site footer → RAR × Signalroom lockup.

## Brand systems
| | RiseAboveReality | Signalroom |
|---|---|---|
| Ground | `#050507` near-black | `#121010` ink / `#F9ECD4` cream |
| Accent | `#5AC8FF` electric blue, `#1E62FF` cobalt, `#EEF4FF` ice | `#EE2D36` red, `#E4FE2A` lime, `#FDB714` amber, `#F4A7C0` pink |
| Type | Clash Display (caps, tracked) + Satoshi | Inter Tight Black (lowercase, tight) + Shrikhand |
| Motif | event horizon ring, light streaks | TV static, traffic light, caution tape, vintage stickers |

## Beats (as built — see src/Film.tsx)
| Frames @60 | Time | Section | What happens |
|---|---|---|---|
| 0–256 | 0:00–0:04 | **RAR cold open** | RiseAboveReality's own WebGL black hole (captured live from riseabovereality.com) materialises; `RISE ABOVE REALITY` + mark on the hit; `INTRODUCING` dives into RAR's light-streak section; interference → CRT off |
| 262–480 | 0:04–0:08 | **Tune in** | Signalroom's real preloader: "no signal", traffic light red/amber/green landed on beats, CRT reveal |
| 480–570 | 0:08–0:09.5 | **Drop / logo slam** | Sticker logo slams on red, "new website — on air", URL types on |
| 570–840 | 0:09.5–0:14 | **The hero** | Pull back into a floating browser; stickers lift off; headline scramble on hover; "Book a call" hover; scroll into the tape |
| 840–1020 | 0:14–0:17 | **Who we are** | Tape marquee → about copy |
| 1020–1080 | 0:17–0:18 | **Noise flurry** | 16th-note chaos of feed-noise words |
| 1080–1440 | 0:18–0:24 | **Noise → signal** | Tape wipe → site's TV + traffic light, our headings on the beat: stop / wait / go |
| 1440–1800 | 0:24–0:30 | **What we do** | Six full-bleed service cards stacking, one per 2 beats, stickers slap in |
| 1800–1920 | 0:30–0:32 | **Proof** | The real stacking-cards scroll on the site |
| 1920–2220 | 0:32–0:37 | **What we bring** | Push into the retro TV, CH+ flips on the beat |
| 2220–2520 | 0:37–0:42 | **Why signalroom?** | Title slam + four tilted cards whip in |
| 2520–2880 | 0:42–0:48 | **Every screen** | Desktop → tablet → phone morph, then three phones scrolling |
| 2880–3180 | 0:48–0:53 | **Let's build** | CTA hover, scroll to footer, push into "Built by RiseAboveReality ↗" |
| 3180–3480 | 0:53–0:58 | **Lockup** | RISE ABOVE REALITY × signalroom over the black hole, now live + URLs |

## Content exclusions
- **Selected Work** section and its photos — placeholder (client instruction).
- Testimonials — names read "Client Name / Brand Name" (placeholder). Excluded unless the client confirms real ones.
- Nav "Work" / "Journal" pages — not shown.
