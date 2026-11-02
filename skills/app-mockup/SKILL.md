---
name: app-mockup
description: "Builds the 'App Mockup' reel animation (a launch-film phone shot: a CSS 3D phone running a real-looking app screen swings into place while floating UI cards pop out) as a 5-second 9:16 Remotion video, and can cut it into the user's own video. Use when the user types /app-mockup or asks for a app mockup, app launch, SaaS ad, phone product shot."
---

# /app-mockup: App Mockup

Style recipe by Shaan Johari (@viashaan), packaged as a command. Makes a launch-film phone shot: a CSS 3D phone running a real-looking app screen swings into place while floating UI cards pop out.

## 1. Read the request
- Fill the recipe's placeholders from what the user typed after `/app-mockup` and from the conversation:
  - [MY APP NAME]
  - [MY MAIN NUMBER] = the big number on the home screen
  - [MY 3 ROWS] = three activity/list rows
  - [MY BRAND COLOUR] = one accent (default green #0e9f6e)
  - [CARD 1], [CARD 2], [CARD 3] = notification, stat card, progress card
- Fill anything missing with sensible, believable values that fit their topic. Ask one short question only when the app name ([MY APP NAME]) is missing entirely and nothing in the conversation suggests it.
- If the user attached a video or gave a path to one, they want the clip edited into it (step 6). Otherwise deliver the standalone clip.
- The user is usually not technical: do the work, keep replies short, and never ask them to run commands.

## 2. Read the recipe
Read `references/card.md` in this skill's folder in full. Its **The look**, **How it moves** and **Never** sections are the spec: exact hex colours, the named free fonts, the layout, the timing and the things to avoid. The fenced prompt at the end is the brief. Follow the card over your own taste.

## 3. Set up the studio (first time only)
Work in a writable folder named `reel-studio` (inside the current working directory, or the user's project when running locally). This skill's own folder may be read-only, so never build inside it. If `reel-studio/package.json` does not exist, run there:
```
npm init -y
npm i remotion@4 @remotion/cli@4 @remotion/three@4 @remotion/google-fonts@4 three@0.169 @react-three/fiber@8 react@18 react-dom@18
```
Then create `src/index.ts` (`registerRoot(Root)`) and `src/Root.tsx`. `Root.tsx` holds one `<Composition>` per style; keep the ones already there and add or replace only `AppMockup`.

## 4. Build the style
- A tested build of this style is in `references/AppMockup.tsx` (it renders the example from the demo reel). If `reel-studio/src/styles/AppMockup.tsx` does not exist yet, copy it there, swap its example text and data for the user's values (move them into props), and keep its layout, timing and motion unless the user asks for a different look or the check stills show a problem.
- Write it as `reel-studio/src/styles/AppMockup.tsx`, registered as composition id `AppMockup`: 1080x1920, 30 fps, 150 frames (5 s) unless the user asks for another length.
- Take every piece of user text as props (with the user's values as `defaultProps`), so new words only need a new render, not new code.
- Load fonts with `@remotion/google-fonts/<FontName>` and call `loadFont()`.
- Drive every motion from `useCurrentFrame()` with `spring()` / `interpolate()` and easing curves. Seed any randomness so frames are repeatable. No CSS transitions, no opacity fades unless the card allows them.
- Where the card says real 3D, use `@remotion/three` (`ThreeCanvas`) with real meshes, lights and shadows, never flat cut-outs.

## 5. Check, then render
1. Render 4 stills spread across the clip (one early, two mid-motion, one in the final hold):
   `npx remotion still src/index.ts AppMockup out/app-mockup_f60.png --frame=60`
   Look at each PNG yourself against the card's **Never** list and layout (bottom fifth calm, nothing cut off, text readable, no fades). Fix and re-check before the full render.
2. Render: `npx remotion render src/index.ts AppMockup out/app-mockup.mp4`
3. If a still or render fails with a WebGL context error, add `--gl=swangle` (Linux or cloud) or `--gl=angle` (Windows, Mac) to both the still and render commands. If Remotion cannot download its browser, add `--browser-executable=` with the path to an installed Chrome (for example `/usr/bin/google-chrome`). 3D styles take a few minutes to render on a machine with no GPU; run the render in the background if your tools allow it.
4. For 2D pieces that sit on 3D points (labels, pins), project the point with the same camera maths each frame and draw them as absolutely positioned HTML over the canvas.

## 6. Edit it into the user's video (when they gave one)
Run the script in this skill's `scripts/` folder (use `python` instead of `python3` on Windows):
```
python3 <this skill's folder>/scripts/edit_video.py <their video> reel-studio/out/app-mockup.mp4 <their video name>_app-mockup.mp4 --mode insert --at <seconds>
```
- `insert` (default): cuts to the clip at `--at`, then their video resumes; their audio keeps playing underneath.
- `pip`: shows the clip as a rounded card in the top half over their video from `--at`, so they stay visible below.
- `prepend` / `append`: clip before or after their video.
If they said where ("at 4 seconds", "at the start", "as a card over me"), use that. If they gave no placement, ask one short question with those choices. The output keeps their video's resolution and audio.

## 7. Deliver
Send the finished MP4 to the user (with SendUserFile when that tool exists, otherwise give its path). Say in one line what was made, that it's a draft to watch before posting, and that a click or whoosh sound on each beat (in CapCut) makes it land. For changes, reuse the card's "How it moves" and "Never" wording, edit, and re-render.
