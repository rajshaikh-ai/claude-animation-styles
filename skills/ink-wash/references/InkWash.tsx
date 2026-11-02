import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadSC } from "@remotion/google-fonts/CormorantSC";
import { loadFont as loadCG } from "@remotion/google-fonts/CormorantGaramond";

const { fontFamily: sc } = loadSC("normal", { weights: ["600"], subsets: ["latin"] });
const { fontFamily: cg } = loadCG("italic", { weights: ["500"], subsets: ["latin"] });

const W = 1080, H = 1920;
const PAPER = "#EEEAE0", INK = "27,26,24", RED = "#B8352A";
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => 1 - Math.pow(1 - clamp(v), 3);
const prog = (f: number, a: number, b: number) => clamp((f - a) / (b - a));
const hash = (n: number) => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };
const noise1 = (x: number) => { const i = Math.floor(x), fr = x - i; const u = fr * fr * (3 - 2 * fr); return hash(i) * (1 - u) + hash(i + 1) * u; };
const fbm = (x: number) => noise1(x) * 0.6 + noise1(x * 2.3 + 7) * 0.28 + noise1(x * 5.1 + 3) * 0.12;

let grain: HTMLCanvasElement | null = null;
const getGrain = () => {
  if (grain) return grain;
  grain = document.createElement("canvas"); grain.width = W / 2; grain.height = H / 2;
  const g = grain.getContext("2d")!; const im = g.createImageData(W / 2, H / 2);
  let s = 9;
  for (let i = 0; i < im.data.length; i += 4) {
    s = (s * 16807) % 2147483647; const r = s / 2147483647;
    const v = r < 0.5 ? 0 : 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = Math.floor(Math.abs(r - 0.5) * 34);
  }
  g.putImageData(im, 0, 0);
  // fibres
  g.strokeStyle = "rgba(120,110,90,0.08)"; g.lineWidth = 0.6;
  for (let i = 0; i < 260; i++) { const x = hash(i) * W / 2, y = hash(i + 99) * H / 2, a = hash(i + 7) * 6.28, l = 6 + hash(i + 3) * 18; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + 3, y + Math.sin(a) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  return grain;
};

type Range = { base: number; amp: number; seed: number; alpha: number; mist: number; start: number; end: number; freq: number };
const RANGES: Range[] = [
  { base: 900, amp: 170, seed: 3, alpha: 0.16, mist: 220, start: -6, end: 34, freq: 0.0042 },
  { base: 1010, amp: 210, seed: 11, alpha: 0.3, mist: 240, start: 6, end: 48, freq: 0.0036 },
  { base: 1130, amp: 150, seed: 23, alpha: 0.5, mist: 230, start: 18, end: 60, freq: 0.0052 },
];
const ridgeY = (r: Range, x: number) => r.base - r.amp * Math.pow(fbm(x * r.freq + r.seed), 1.6) * 1.6 + 40;

const draw = (ctx: CanvasRenderingContext2D, f: number) => {
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
  // ---- mountains: wash spreads left to right behind a ragged front ----
  RANGES.forEach((r, ri) => {
    const p = ease(prog(f, r.start, r.end));
    const front = -80 + p * (W + 200);
    for (let x = 0; x < W; x += 3) {
      const yTop = ridgeY(r, x);
      const fy = front + (fbm(x * 0.01 + ri * 5 + yTop * 0.01) - 0.5) * 120;
      if (x > fy) continue;
      const wet = clamp(1 - (fy - x) / 70) * 0.5 * (1 - p * 0.6);
      const a = r.alpha * (1 + wet);
      const g = ctx.createLinearGradient(0, yTop, 0, yTop + r.mist);
      g.addColorStop(0, `rgba(${INK},${a})`); g.addColorStop(0.35, `rgba(${INK},${a * 0.55})`); g.addColorStop(1, `rgba(${INK},0)`);
      ctx.fillStyle = g; ctx.fillRect(x, yTop, 3.4, r.mist);
    }
    // dry-brush ridge line
    ctx.strokeStyle = `rgba(${INK},${0.25 + ri * 0.2})`;
    for (let x = 0; x < Math.min(W, front - 20); x += 5) {
      if (hash(x * 0.37 + ri * 13) < 0.22) continue;
      ctx.lineWidth = 1 + hash(x + ri) * (1.5 + ri);
      ctx.beginPath(); ctx.moveTo(x, ridgeY(r, x) + 1); ctx.lineTo(x + 5, ridgeY(r, x + 5) + 1); ctx.stroke();
    }
  });
  // ---- sun ----
  const sp = spring({ frame: f - 34, fps: 30, config: { damping: 9, stiffness: 120 } });
  if (sp > 0.001) {
    const cx = 760, cy = 700, R = 44 * sp;
    ctx.beginPath();
    for (let a = 0; a <= 64; a++) { const t = (a / 64) * Math.PI * 2; const rr = R * (1 + (noise1(a * 0.7 + f * 0.08) - 0.5) * 0.08 * (1.2 - Math.min(1, sp))); ctx.lineTo(cx + Math.cos(t) * rr, cy + Math.sin(t) * rr); }
    const g = ctx.createRadialGradient(cx - 8, cy - 8, R * 0.1, cx, cy, R);
    g.addColorStop(0, "rgba(196,62,46,0.95)"); g.addColorStop(0.8, "rgba(184,53,42,0.9)"); g.addColorStop(1, "rgba(184,53,42,0.6)");
    ctx.fillStyle = g; ctx.fill();
  }
  // ---- cliff on the right, spreads downward ----
  const cp = ease(prog(f, 28, 62));
  const cliffTop = 1080, cliffBot = 1620;
  const cliffX = (y: number) => 760 + 150 * Math.pow((y - cliffTop) / (cliffBot - cliffTop), 0.6) - 120 * Math.sin(((y - cliffTop) / 540) * Math.PI) + (fbm(y * 0.02) - 0.5) * 60;
  const frontY = cliffTop - 40 + cp * (cliffBot - cliffTop + 160);
  for (let y = cliffTop; y < cliffBot; y += 3) {
    const fyy = frontY + (fbm(y * 0.01 + 4) - 0.5) * 30;
    if (y > fyy) break;
    const x0 = cliffX(y);
    const wet = clamp(1 - (fyy - y) / 60) * 0.25;
    const fade = clamp((cliffBot - y) / 200);
    const g = ctx.createLinearGradient(x0, 0, W, 0);
    g.addColorStop(0, `rgba(${INK},${(0.82 + wet) * fade})`); g.addColorStop(0.25, `rgba(${INK},${(0.6 + wet) * fade})`); g.addColorStop(1, `rgba(${INK},${(0.35 + wet) * fade})`);
    ctx.fillStyle = g; ctx.fillRect(x0, y, W - x0, 3.4);
  }
  // cliff outline + texture strokes
  const op = ease(prog(f, 26, 46));
  ctx.strokeStyle = `rgba(${INK},0.95)`; ctx.lineWidth = 6; ctx.lineCap = "round";
  ctx.beginPath(); for (let y = cliffTop; y < cliffTop + op * (cliffBot - cliffTop); y += 6) ctx.lineTo(cliffX(y) - 4, y); ctx.stroke();
  const tp = prog(f, 48, 82);
  for (let i = 0; i < 46; i++) {
    const k = clamp(tp * 46 - i); if (k <= 0) break;
    const y = cliffTop + 30 + hash(i * 3.1) * 480, x = cliffX(y) + 20 + hash(i * 1.7) * 180;
    ctx.lineWidth = 2 + hash(i) * 4; ctx.strokeStyle = `rgba(238,234,224,${0.35 + hash(i + 5) * 0.3})`;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 26 * ease(k), y + 34 * ease(k)); ctx.stroke();
  }
  // pine: trunk, branch, needles
  const pt = ease(prog(f, 66, 82));
  const tx0 = 850, ty0 = cliffTop + 12;
  if (pt > 0) {
  ctx.strokeStyle = `rgba(${INK},1)`; ctx.lineWidth = 9;
  ctx.beginPath(); ctx.moveTo(tx0, ty0); ctx.quadraticCurveTo(tx0 - 30, ty0 - 120 * pt, tx0 - 70 * pt, ty0 - 220 * pt); ctx.stroke();
  const bt = ease(prog(f, 76, 88));
  if (bt > 0) { ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(tx0 - 40, ty0 - 150); ctx.lineTo(tx0 - 40 - 150 * bt, ty0 - 170 - 20 * bt); ctx.stroke(); }
  }
  const clusters = [[tx0 - 70, ty0 - 225], [tx0 - 120, ty0 - 182], [tx0 - 175, ty0 - 190], [tx0 - 30, ty0 - 170]];
  clusters.forEach(([cx, cy], ci) => {
    const np = ease(prog(f, 82 + ci * 3, 94 + ci * 3));
    if (np <= 0) return;
    ctx.lineWidth = 2.4;
    for (let n = 0; n < 16; n++) {
      const a = Math.PI + (n / 15) * Math.PI + (hash(n + ci) - 0.5) * 0.3, l = (26 + hash(n * 2 + ci) * 22) * np;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * l * 1.4, cy + Math.sin(a) * l * 0.45 - 4); ctx.stroke();
    }
  });
  // ---- river: thin broken strokes ----
  const rp = prog(f, 50, 92);
  ctx.strokeStyle = `rgba(${INK},0.45)`; ctx.lineWidth = 1.6;
  for (let i = 0; i < 34; i++) {
    const k = clamp(rp * 34 - i * 0.7); if (k <= 0) continue;
    const y = 1300 + hash(i * 5.3) * 230, x = 60 + hash(i * 2.9) * 620, l = 40 + hash(i) * 120;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + l * ease(k), y + 1); ctx.stroke();
  }
  // boat + figure, drifting
  const bp = ease(prog(f, 58, 72));
  if (bp > 0) {
    const bx = 380 + f * 0.35, by = 1405;
    ctx.fillStyle = `rgba(${INK},0.9)`;
    ctx.beginPath(); ctx.moveTo(bx - 46 * bp, by); ctx.quadraticCurveTo(bx, by + 14 * bp, bx + 46 * bp, by - 4); ctx.lineTo(bx + 30 * bp, by + 6); ctx.lineTo(bx - 30 * bp, by + 6); ctx.fill();
    ctx.fillRect(bx - 4, by - 26 * bp, 6, 26 * bp);
    ctx.beginPath(); ctx.arc(bx - 1, by - 30 * bp, 5 * bp, 0, 7); ctx.fill();
    ctx.fillStyle = RED; ctx.fillRect(bx - 4, by - 18 * bp, 6, 4 * bp);
    ctx.strokeStyle = `rgba(${INK},0.8)`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx + 4, by - 20 * bp); ctx.lineTo(bx + 46 * bp, by + 14); ctx.stroke();
  }
  // drifting mist
  for (let m = 0; m < 3; m++) {
    const y = 1000 + m * 150, x = ((f * (0.6 + m * 0.3) + m * 300) % 1400) - 300;
    ctx.save(); ctx.translate(x + 300, y); ctx.scale(1, 0.3);
    const g = ctx.createRadialGradient(0, 0, 10, 0, 0, 300);
    g.addColorStop(0, "rgba(238,234,224,0.55)"); g.addColorStop(1, "rgba(238,234,224,0)");
    ctx.fillStyle = g; ctx.fillRect(-300, -300, 600, 600); ctx.restore();
  }
  ctx.drawImage(getGrain(), 0, 0, W, H);
};

const Brush: React.FC<{ p: number; dir: "down" | "right"; children: React.ReactNode; style?: React.CSSProperties }> = ({ p, dir, children, style }) => {
  const pct = p * 130 - 15;
  const mask = `linear-gradient(${dir === "down" ? "180deg" : "90deg"}, #000 ${pct}%, rgba(0,0,0,0.4) ${pct + 6}%, transparent ${pct + 14}%)`;
  return <div style={{ ...style, WebkitMaskImage: mask, maskImage: mask }}>{children}</div>;
};

export const InkWash: React.FC<{ title1: string; title2: string; subtitle: string; chapter: string }> = ({ title1, title2, subtitle, chapter }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => { const c = ref.current; if (c) draw(c.getContext("2d")!, f); }, [f]);
  const seal = spring({ frame: f - 112, fps, config: { damping: 11, stiffness: 260 } });
  const sealS = interpolate(seal, [0, 1], [1.6, 1]);
  const t1 = prog(f, 84, 100), t2 = prog(f, 92, 108), sub = prog(f, 100, 112), ch = prog(f, 104, 114);
  const vert: React.CSSProperties = { writingMode: "vertical-rl", fontFamily: sc, fontWeight: 600, fontSize: 64, letterSpacing: 22, color: "#1B1A18", lineHeight: 1 };
  return (
    <AbsoluteFill>
      <canvas ref={ref} width={W} height={H} style={{ position: "absolute", inset: 0 }} />
      <div style={{ position: "absolute", top: 170, left: 130, display: "flex", flexDirection: "row-reverse", gap: 34 }}>
        <Brush p={t1} dir="down" style={vert}>{title1}</Brush>
        <Brush p={t2} dir="down" style={{ ...vert, marginTop: 80 }}>{title2}</Brush>
      </div>
      <Brush p={sub} dir="down" style={{ position: "absolute", top: 180, left: 340, writingMode: "vertical-rl", fontFamily: cg, fontStyle: "italic", fontSize: 34, color: "#3a3833", display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ width: 12, height: 12, background: RED, display: "inline-block" }} />{subtitle}
      </Brush>
      <Brush p={ch} dir="right" style={{ position: "absolute", top: 108, left: 130, fontFamily: sc, fontSize: 26, letterSpacing: 8, color: "#8a8478" }}>{chapter}</Brush>
      {f >= 112 && (
        <div style={{ position: "absolute", top: 850, left: 140, width: 96, height: 96, background: RED, transform: `scale(${sealS * 1.12 > 1.12 ? sealS : seal < 0.98 ? 1.12 - seal * 0.12 : 1}) rotate(${interpolate(seal, [0, 1], [-8, -3])}deg)`, display: "flex", alignItems: "center", justifyContent: "center", border: "4px solid #EEEAE0", outline: `3px solid ${RED}`, opacity: 0.92 }}>
          <span style={{ fontFamily: sc, fontWeight: 600, fontSize: 46, color: "#F2E9DA", letterSpacing: 2 }}>RS</span>
        </div>
      )}
    </AbsoluteFill>
  );
};
