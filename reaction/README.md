# Client reaction reel

The client's first look at the Signal Room launch film and website, recut as a 46-second
Instagram reel (9:16, 1080×1920, 30fps).

## Source
`public/react/src.mp4` is the phone video (the WhatsApp copy: 576×1024, 30fps, about 175 kbps).
It is client footage, so it stays out of git (`public/react/` is ignored). Drop the original
camera file in the same place and re-run for a sharper result.

## Pipeline
```
reaction/prep.sh      deblock (uspp) -> lanczos 1080x1920 -> CAS sharpen -> grade.cube -> warm halation
reaction/slomo.sh     4x motion-interpolated slow-mo for the hook, cheer, reveal and verdict ranges
reaction/grade_lut.py the film grade, baked to a 65^3 .cube
audio/reel_mix.py     room audio re-cut to the edit + SFX + score -> reel_music.wav / reel_nomusic.wav (-14 LUFS)
src/reaction/*        Remotion composition "ReactionReel" (edit list in edl.json)
scripts/render_reel.sh   everything above + film grain + final encodes -> deliverables/reaction-reel/
```
`src/reaction/edl.json` is the single edit list. The picture and the audio script both read it, so
re-timing a shot keeps the sound in sync. Preview on the ungraded file with `--props='{"raw":true}'`.
Note: Remotion seeks the WhatsApp original badly after about 45s, so use the graded file for real renders.

## Story (30fps frames)
| frames | beat | what's on screen |
|---|---|---|
| 0-90 | hook | group laugh -> speed ramp -> freeze ("we showed our client their new website"), PAUSE |
| 90-120 | rewind | VHS rewind back to the start of the day, timecode running backwards |
| 120-240 | launch day | greeting, walking in, the curved monitor |
| 240-540 | the launch film | RAR black hole and logo slam on their screen, laughing, pointing, the end card |
| 540-630 | the cheer | music drop, slow-mo cheer |
| 630-900 | the website | preloader static and heartbeat, white flash to the red homepage, laughs |
| 900-1020 | every. single. page. | browsing montage, a shutter click on every cut |
| 1020-1170 | the verdict | big smile to camera, hand on head, freeze ("mind = blown.") |
| 1170-1260 | ending | the last laugh ("this is why we do what we do.") |
| 1260-1380 | end card | Signal Room red, logo slam, signalroom.studio, RAR credit |

## Seedance inserts (proposed, not generated)
Optional new camera angles via Seedance on Higgsfield. They wait on approval and nothing has been
generated yet. See the proposal in the delivery notes.
