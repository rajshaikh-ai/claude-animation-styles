## 8. Tutorials: Screen-Recording Zoom
The screen-recording zoom from polished tutorials and product walkthroughs: the whole app window floats on a soft backdrop, then the camera glides in on the exact button that matters while the cursor travels to it and clicks. It turns any "click here, then here" into something that feels produced rather than recorded. Use it for tutorials, SaaS demos, "how I did it" tech reels.

### The look
- Palette:
  - backdrop: a pale mint wash, #E3EFE9 glowing in the top left, #B8D7D6 on the right, settling to #9CC4BD at the bottom, with a fine film grain over it
  - the app is dark: window #1B1C20, title bar #212227, panels #26272C to #2A2B31, hairlines #33353B
  - text is off-white #ECEEF1 for values and soft grey #9A9FA8 for labels
  - one accent: a blue primary button #3D7BFA (a slight top-to-bottom gradient), plus a red playhead #FF5A4E in the timeline
- Type:
  - Inter for the whole interface: SemiBold for titles, buttons and values, Medium for labels, sentence case.
  - JetBrains Mono for timecodes and file sizes only.
  - The step pill is Inter SemiBold, near-black on a white pill, with the step number in a black circle.
- Layout:
  - Wide shot: the full window centred with plenty of backdrop around it, rounded corners and a deep, soft shadow.
  - Close shot: the window runs off the left and bottom edges, the target button sits in the lower right third, and the window's top right corner still shows the backdrop so you never lose the sense of a screen.
  - The step pill sits in the lower middle of the frame, over the app, above the bottom fifth.
- Texture: grain on the backdrop only. The interface itself is clean and pin sharp.

### How it moves
- Frame one is the wide shot. The whole window and the cursor are already there, so it reads before anything moves.
- The cursor leads and the camera follows. The cursor glides along a gentle curve (never a straight line) and eases into the button. The camera starts a beat later and zooms about 2x toward the button on one soft spring with no wobble, landing a little after the cursor does.
- Real motion blur on the move. The zoom smears outward from the button, the edges blur most, and the button itself stays sharp. The moving cursor streaks too. Everything is pin sharp again at rest, and the text is drawn at full resolution, never a stretched screenshot.
- The click is a small physical moment. The button darkens as the cursor arrives, the cursor dips, the button presses to 95% and springs back, and a white ring springs out from the click point with a faint ripple travelling past it.
- The step pill pops in last, scaling up from small with a slight overshoot, its number popping a beat after it. Then the frame holds for well over a second.

### Never
- Zooming a flat screenshot, so the text goes soft at the end of the zoom.
- Linear zooms or cursors that travel in straight lines at constant speed.
- A zoom that bounces or overshoots, or several small zooms fighting each other.
- Real app names, real logos, or a real person's files on screen.

### Paste this into Claude (or Codex)

```
Build me a 5-second, 9:16 animation (1080x1920, 30 fps) in Remotion in the style of a polished screen-recording tutorial. Recreate this screen from my product as a real, crisp interface (not a screenshot): [DESCRIBE MY APP SCREEN]. The step is "[STEP NUMBER] · [MY STEP, e.g. Click Publish]" and the target is the [MY BUTTON] button.

Dark app window with a deep soft shadow, floating on a pale mint backdrop with fine grain. Inter for the interface, one blue accent for the primary button. Frame one shows the whole window. The cursor glides on a gentle curve to the button while the camera zooms about 2x toward it on one smooth spring, with real motion blur during the move and sharp text at rest. On the click, the button presses to 95%, and a white ring springs out. Then a white step pill pops in and the shot holds.
```
