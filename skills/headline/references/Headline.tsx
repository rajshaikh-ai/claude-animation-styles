import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadNews } from "@remotion/google-fonts/Newsreader";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: news } = loadNews("normal", { weights: ["400", "700", "800"], subsets: ["latin"] });
const { fontFamily: inter } = loadInter("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] });

const C = { bg: "#15181C", card: "#E9EAEC", paper: "#FCFCFA", ink: "#16181B", body: "#26292D", grey: "#6A6F76", rule: "#D9DBDE", red: "#C1272D", lime: "#C9F52A", lime2: "#B8E81A", blue: "#2F7BF5" };

const rng = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

// body lines, with [start,end) char ranges to highlight
const LINES: { t: string; hl?: [number, number] }[] = [
  { t: "hen Linden & Pike, a small video studio," },
  { t: "began testing an AI editing assistant last" },
  { t: "spring, it expected modest savings. By autumn,", hl: [36, 46] },
  { t: "the studio was shipping three times as many", hl: [0, 43] },
  { t: "videos a week with the same two people,", hl: [0, 39] },
  { t: "according to figures shared with the Courier." },
  { t: "Clients noticed the difference first, the" },
  { t: "founders said, long before the invoices did." },
];

const BgWall: React.FC<{ f: number }> = ({ f }) => {
  const r = rng(11);
  const cards = [] as React.ReactNode[];
  for (let row = -1; row < 7; row++) for (let col = -1; col < 4; col++) {
    const x = col * 380 + (row % 2) * 160 + f * 0.6;
    const y = row * 330 - f * 0.35;
    const rot = (r() - 0.5) * 10;
    const photo = r() > 0.4;
    cards.push(
      <div key={`${row}_${col}`} style={{ position: "absolute", left: x, top: y, width: 300, height: 290, background: C.card, transform: `rotate(${rot}deg)`, borderRadius: 4, padding: 20, boxSizing: "border-box", opacity: 0.32 }}>
        {photo && <div style={{ height: 120, background: ["#7C8794", "#8A7F72", "#6E7F76"][Math.floor(r() * 3)], marginBottom: 14 }} />}
        {[0, 1, 2, 3, 4].map((i) => <div key={i} style={{ height: 14, width: `${60 + r() * 40}%`, background: "#9AA0A8", marginBottom: 10 }} />)}
      </div>,
    );
  }
  return <AbsoluteFill style={{ filter: "blur(9px)", transform: "rotate(-8deg) scale(1.25)" }}>{cards}</AbsoluteFill>;
};

export const Headline: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  // fly-in
  const s = spring({ frame: f, fps, config: { damping: 14, stiffness: 70, mass: 1.4 } });
  const sPrev = spring({ frame: f - 1, fps, config: { damping: 14, stiffness: 70, mass: 1.4 } });
  const vel = Math.abs(s - sPrev);
  const tx = interpolate(s, [0, 1], [520, 0]);
  const ty = interpolate(s, [0, 1], [1500, 0]);
  const rx = interpolate(s, [0, 1], [58, 14]);
  const ry = interpolate(s, [0, 1], [-30, -9]);
  const rz = interpolate(s, [0, 1], [14, 3]);
  const blur = Math.min(10, vel * 120);
  // dolly toward paragraph
  const d = interpolate(f, [18, 100], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.45, 0, 0.2, 1) });
  const camS = interpolate(d, [0, 1], [0.92, 1.42]);
  const camY = interpolate(d, [0, 1], [0, -230]);
  const camX = interpolate(d, [0, 1], [0, 25]);
  // highlighter: three hl lines between 62 and 100
  const hlLines = LINES.map((l, i) => (l.hl ? i : -1)).filter((i) => i >= 0);
  const hlStart = 58, perLine = 12, gap = 3;
  const hlProg = (k: number) => {
    const st = hlStart + k * (perLine + gap);
    return interpolate(f, [st, st + perLine], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.2, 0.7, 0.4, 1) });
  };
  const hlEnd = hlStart + hlLines.length * (perLine + gap);
  const post = spring({ frame: f - hlEnd - 10, fps, config: { damping: 9, stiffness: 160 } });
  const postTilt = spring({ frame: f - hlEnd - 14, fps, config: { damping: 10, stiffness: 120 } });

  const charW = 15.6; // approx px per char in body (not used for layout, layout uses spans)
  void charW;
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <filter id="rough"><feTurbulence type="fractalNoise" baseFrequency="0.04 0.5" numOctaves="2" seed="3" /><feDisplacementMap in="SourceGraphic" scale="9" /></filter>
      </svg>
      <div style={{ position: "absolute", inset: 0, transform: `translate(${camX * 0.3}px, ${camY * 0.25}px) scale(${1 + (camS - 0.92) * 0.25})` }}>
        <BgWall f={f} />
      </div>
      <AbsoluteFill style={{ perspective: 1800, transform: `translate(${camX}px, ${camY}px) scale(${camS})` }}>
        <div style={{ position: "absolute", left: 120, top: 330, width: 840, height: 1180, transformStyle: "preserve-3d", transform: `translate(${tx}px, ${ty}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`, filter: `blur(${blur}px)` }}>
          <div style={{ position: "absolute", inset: 0, background: C.paper, boxShadow: "0 60px 90px rgba(0,0,0,0.55), 0 12px 30px rgba(0,0,0,0.4)", padding: "46px 52px", boxSizing: "border-box", color: C.ink }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: inter, fontSize: 15, color: C.grey, letterSpacing: 1, textTransform: "uppercase", fontWeight: 600 }}>
              <span>Tuesday, March 4</span><span>Business Edition</span>
            </div>
            <div style={{ fontFamily: news, fontWeight: 800, fontSize: 74, letterSpacing: -2.5, textAlign: "center", marginTop: 8, lineHeight: 1 }}>The Harbor Courier</div>
            <div style={{ borderTop: `2px solid ${C.ink}`, borderBottom: `1px solid ${C.rule}`, marginTop: 14, padding: "8px 0", display: "flex", justifyContent: "center", gap: 30, fontFamily: inter, fontSize: 16, fontWeight: 500, color: C.body }}>
              {["World", "Business", "Markets", "Tech", "Opinion", "Arts"].map((n, i) => <span key={n} style={{ fontWeight: i === 1 ? 700 : 500 }}>{n}</span>)}
            </div>
            <div style={{ fontFamily: inter, fontSize: 15, fontWeight: 700, color: C.red, marginTop: 26, letterSpacing: 1.5 }}>BUSINESS / MEDIA</div>
            <div style={{ fontFamily: news, fontWeight: 700, fontSize: 56, lineHeight: 1.04, letterSpacing: -1, marginTop: 10 }}>
              A two-person studio let<br />AI edit its videos. Then<br />its output tripled.
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 22, fontFamily: inter, fontSize: 16, color: C.grey, borderBottom: `1px solid ${C.rule}`, paddingBottom: 18 }}>
              <div style={{ width: 38, height: 38, borderRadius: 19, background: "#B9B3A8" }} />
              <div><div style={{ color: C.body, fontWeight: 600 }}>By Nadia Ferrante</div><div>Mar 4, 2025 · 4 min read</div></div>
            </div>
            <div style={{ position: "relative", marginTop: 22, fontFamily: news, fontSize: 30, lineHeight: "45px", color: C.body }}>
              <div style={{ position: "absolute", left: 0, top: 4, fontFamily: news, fontWeight: 800, fontSize: 104, lineHeight: "90px", color: C.ink }}>W</div>
              {LINES.map((l, i) => {
                const k = hlLines.indexOf(i);
                const indent = i < 2 ? 112 : 0;
                if (!l.hl) return <div key={i} style={{ paddingLeft: indent, whiteSpace: "nowrap" }}>{l.t}</div>;
                const [a, b] = l.hl;
                const p = hlProg(k);
                return (
                  <div key={i} style={{ paddingLeft: indent, whiteSpace: "nowrap" }}>
                    {l.t.slice(0, a)}
                    <span style={{ position: "relative", display: "inline-block" }}>
                      <span style={{ position: "absolute", left: -4, top: 6, bottom: 2, width: `calc(${p * 100}% + ${p * 8}px)`, background: `linear-gradient(180deg, ${C.lime} 0%, ${C.lime2} 18%, ${C.lime} 40%, ${C.lime} 80%, ${C.lime2} 100%)`, mixBlendMode: "multiply", filter: "url(#rough)", clipPath: "polygon(0 8%, 100% 0, calc(100% - 6px) 100%, 0 96%)", opacity: p > 0 ? 0.95 : 0 }} />
                      <span style={{ position: "relative" }}>{l.t.slice(a, b)}</span>
                    </span>
                    {l.t.slice(b)}
                  </div>
                );
              })}
            </div>
          </div>
          {/* quoted post */}
          <div style={{ position: "absolute", right: 40, bottom: 150, width: 500, background: "#fff", borderRadius: 22, padding: 26, boxSizing: "border-box", boxShadow: "0 40px 70px rgba(0,0,0,0.45), 0 8px 20px rgba(0,0,0,0.25)", transform: `translateZ(60px) scale(${post}) rotate(${interpolate(postTilt, [0, 1], [-14, -4])}deg)`, transformOrigin: "20% 80%", fontFamily: inter }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 54, height: 54, borderRadius: 27, background: "linear-gradient(135deg,#c9b7a2,#8d7b6a)" }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 22, color: C.ink, display: "flex", alignItems: "center", gap: 6 }}>Dana Whitfield
                  <svg width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill={C.blue} /><path d="M7 12.5l3 3 7-7" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <div style={{ fontSize: 18, color: C.grey }}>@danawrites</div>
              </div>
            </div>
            <div style={{ fontSize: 25, lineHeight: 1.35, color: C.ink, marginTop: 14, fontWeight: 500 }}>Same two people. Three times the videos. That paragraph is the whole story.</div>
          </div>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.65) 100%)" }} />
    </AbsoluteFill>
  );
};
