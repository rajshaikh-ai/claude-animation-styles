## 2. Product: Exploded Teardown
A real 3D product opens into its layers one beat at a time, and each part gets labelled as it lands. It suits any video where what's inside is the story, and every beat is a natural spot for a click sound. Use it for product launches, tech reviews, "what's inside" explainers.

### The look
- Palette: graphite ground with a soft lift behind the product (#2A2D33 in the middle, falling to #0A0A0C at the edges). Type is off-white #ECEEF1 with muted grey specs #A3A8B0. One orange accent, #FF5A2A, for the part numbers, the title bar and one standout part. The product keeps its own believable materials (here cream and grey keycaps, black switches with red stems, dark aluminium, a green circuit board, brass posts).
- Type: IBM Plex Sans SemiBold for the part names, IBM Plex Sans Bold for the title, IBM Plex Mono for the numbers and the one-line specs. The title is short, in sentence case ("21 keys, opened"), with a small mono caps spec line under it.
- Layout: the product sits left of centre at a high three-quarter angle, its layers stacked with even gaps. A label column runs down the right. Each label has an orange two-digit number, the part name and one short spec, and a thin grey leader line joins it to a white dot on the part's edge. The title block sits bottom left. The bottom fifth stays empty.
- Texture: soft studio light with real shadows falling between the layers and a little sheen on the metal. A faint grain in the background keeps the glow from banding. No outlines, no glow on the type.

### How it moves
- Frame one shows the product fully assembled, big and centred. In the first second the camera pulls back and slides it left to make room for the labels.
- The layers lift off from the top down, one every third of a second. Each lift is a fast spring that overshoots about 10% and settles before the next one finishes, with real motion blur while it moves fast. Each layer gets its own clean beat.
- As each layer arrives, its leader line draws out from the dot on the part, and the label rises out of a mask with a small overshoot.
- The camera orbits about 10 degrees across the whole shot and slows to rest at the end.
- The title builds last: the orange bar stretches out, the words rise one after another, then the spec line. It holds for over a second.

### Never
- Fade parts or labels on. Parts spring, lines draw and text rises.
- Move every layer at once, or space the beats unevenly. The steady rhythm is what makes it satisfying.
- Cross the leader lines, or let a label sit on top of the product.
- Fake the 3D with flat cut-outs, or add glows, lens flares or a busy background.

### Paste this into Claude (or Codex)

```
Build me a 5-second, 9:16 exploded-view teardown (1080x1920, 30 fps) in Remotion, using a real 3D scene. The product is [YOUR PRODUCT], modelled as 4 to 6 simple layers with believable materials and lit like a studio shot with soft shadows, on a dark graphite background with a soft glow (dither it so it never bands). Frame one shows it assembled and centred. The camera pulls back and left while the layers lift apart from the top down, one every 10 frames, each on a fast spring with about 10% overshoot and real motion blur. As each layer lands, a thin grey leader line draws from a dot on its edge to a label on the right: an orange two-digit number, the part name in IBM Plex Sans and a short spec in IBM Plex Mono. The camera orbits about 10 degrees overall. Last, "[YOUR TITLE]" builds bottom left under a short orange bar. No fades. Keep the bottom fifth empty.
```
