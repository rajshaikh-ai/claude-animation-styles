## 6. Finance and data: Stat Chart
The terminal-dark money graphic from finance documentaries and business news: one huge number, one line chart, one moment that changed everything. The number counts up as the line draws, and the line turns orange at the event that made the difference. It suits any video that turns a result into a story. Use it for finance and business explainers, growth recaps, client results.

### The look
- Palette:
  - near-black background #0A0B0D, faint white grid lines at about 7% opacity
  - white #F4F5F6 for the number and headlines, grey #8B9098 for labels, dark grey #4A4F57 for the source line
  - the line is soft white #E9EBEE before the event and one hot orange #FF5B1F after it. Orange is the only colour in the frame.
- Type:
  - The hero number is Inter Tight ExtraBold, huge and tightly spaced, with tabular figures so every digit is the same width. The dollar sign is small and raised, the unit letter is two thirds size.
  - Labels and the callout are Inter Tight Medium and SemiBold, sentence case.
  - Everything that is data (dates, axis values, the header line, the price tag, the source) is IBM Plex Mono in caps with a little letter spacing.
- Layout:
  - A thin header row on top: an invented company's small logo and name on the left, the metric's fine print on the right, a hairline under it.
  - Below it, a one-line label, then the number filling the top half of the frame.
  - Under the number, an orange delta chip with a triangle and a short grey line of text, and a live date on the right.
  - The chart fills the bottom half: year ticks along the base, values on the right, a hatched strip for the months not reported yet, and one callout with a thin leader line pointing at the event.
- Texture: none. Flat black, crisp lines, a faint white fill under the line that fades toward the bottom.

### How it moves
- The number is the line. It always shows the value under the line's tip, so it creeps while the line is flat, takes off at the event, and slows right down as it lands on the final figure. Tabular figures, no rolling or bouncing digits.
- The line draws left to right with its head leading: a small dot rides the tip, the fill follows just behind it, and a faint dashed cursor and the date in the corner scrub along with it. It is already moving on the first frame, slows a touch into the event, speeds up the rise, then eases gently into the last month.
- The colour switch happens exactly at the event. The dot swells for a moment and turns orange, the line after that point is orange and thicker, a ring marker pops onto the event, the leader line draws up, and the callout's three lines snap up into place one after another.
- The landing: when the count reaches its final value the delta chip pops with a small overshoot. When the line reaches the last month, a ring pings around the end dot and the value tag slides out of the axis. Then everything holds for well over a second.

### Never
- A counter that rolls, jiggles in width, or overshoots past the real number.
- A rainbow of series, gradients on the line, or a glow behind it.
- The orange appearing anywhere before the event it stands for.
- Real companies, real logos, or numbers that look like real filings.

### Paste this into Claude (or Codex)

```
Build me a 5-second, 9:16 animation (1080x1920, 30 fps) in Remotion of a business-documentary stat graphic. Use my company [MY COMPANY], my metric "[MY METRIC LABEL]", and my data: [MY MONTHLY VALUES], ending on [MY FINAL NUMBER]. The key event is "[MY EVENT]" in [MONTH YEAR], with the line "[ONE-LINE IMPACT]" and a delta chip of "[MY % CHANGE]".

Near-black background (#0A0B0D), white Inter Tight, data labels in IBM Plex Mono caps, one accent: orange #FF5B1F. A huge tabular-figure counter shows the value under the line's tip as the line draws left to right, a small dot leading and the fill following. At the event the line turns orange, a ring marker pops on, a leader line draws up and the callout snaps in. When the count lands, pop the chip with a small overshoot, then ping the end point and hold the last second.
```
