import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { loadFont as loadCas } from "@remotion/google-fonts/LibreCaslonText";
import { loadFont as loadPM } from "@remotion/google-fonts/IBMPlexMono";
import { loadFont as loadIT } from "@remotion/google-fonts/InterTight";
import { loadFont as loadMk } from "@remotion/google-fonts/PermanentMarker";

const { fontFamily: cas } = loadCas("normal", { weights: ["400", "700"], subsets: ["latin"] });
const { fontFamily: pm } = loadPM("normal", { weights: ["500"], subsets: ["latin"] });
const { fontFamily: it } = loadIT("normal", { weights: ["800"], subsets: ["latin"] });
const { fontFamily: mk } = loadMk("normal", { weights: ["400"], subsets: ["latin"] });

const C = { paper: "#F4F2EC", ink: "#151515", grey: "#55524B", red: "#D4231B", yel: "#FFE024", tape: "rgba(230,217,180,0.82)" };
const cl = (v: number) => Math.max(0, Math.min(1, v));

// a landing piece of paper: returns transform + shadow
const land = (f: number, start: number, from: [number, number], rot: number) => {
  const t = cl((f - start) / 13);
  const fall = t * t; // accelerates as it drops
  const after = f - start - 13;
  const hop = after >= 0 ? Math.max(0, Math.sin(after * 0.9) * Math.exp(-after * 0.45)) * 0.012 : 0;
  const skid = after >= 0 ? (1 - Math.exp(-after * 0.5)) * 6 : 0;
  const rOver = after >= 0 ? rot * (1 + 0.1 * Math.exp(-after * 0.35) * Math.cos(after * 0.6)) : rot * 1.6;
  const lift = 1 - fall; // 1 high -> 0 landed
  const x = from[0] * (1 - fall) + skid, y = from[1] * (1 - fall);
  const s = 1 + 0.14 * lift + hop;
  const sh = `${4 + lift * 40}px ${6 + lift * 60}px ${10 + lift * 50}px rgba(0,0,0,${0.35 - lift * 0.15}), 0 1px 1px rgba(0,0,0,${0.55 * (1 - lift)})`;
  return { transform: `translate(${x}px, ${y}px) scale(${s}) rotate(${rOver}deg)`, boxShadow: sh, visible: f >= start - 1 };
};

const Grain: React.FC<{ id: string; op: number; freq?: number }> = ({ id, op, freq = 0.9 }) => (
  <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: op, mixBlendMode: "multiply", pointerEvents: "none" }}>
    <filter id={id}><feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves={2} seed={4} /><feColorMatrix type="saturate" values="0" /></filter>
    <rect width="100%" height="100%" filter={`url(#${id})`} />
  </svg>
);

const Tape: React.FC<{ f: number; at: number; x: number; y: number; r: number }> = ({ f, at, x, y, r }) => {
  if (f < at) return null;
  const t = cl((f - at) / 6);
  const s = 1.35 - 0.35 * Easing.in(Easing.quad)(t) + (t >= 1 ? 0 : 0);
  const squash = f - at >= 6 && f - at < 9 ? 0.96 : 1;
  return <div style={{ position: "absolute", left: x, top: y, width: 170, height: 52, background: C.tape, transform: `rotate(${r}deg) scale(${s}, ${s * squash})`, boxShadow: "0 2px 4px rgba(0,0,0,0.15)", clipPath: "polygon(2% 8%, 98% 0, 100% 92%, 0 100%)" }} />;
};

export const PaperDesk: React.FC = () => {
  const f = useCurrentFrame();
  const s1 = land(f, 2, [-500, -900], -3);
  const s2 = land(f, 12, [600, 900], 3);
  const lb = land(f, 24, [-700, 200], -6);
  // camera: slow push with jolts, still for last second
  const push = interpolate(f, [0, 118], [1, 1.07], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.3, 0, 0.3, 1) });
  const jolt = [15, 25, 37].reduce((a, t) => a + (f >= t ? Math.exp(-(f - t) * 0.5) * Math.sin((f - t) * 1.6) * 4 : 0), 0);
  const drift = f < 118 ? Math.sin(f * 0.05) * 3 : Math.sin(118 * 0.05) * 3;
  const roll = interpolate(f, [0, 118], [-0.5, 0.5], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // marker
  const circ = cl((f - 46) / 16);
  const note = "38% MORE STAY!";
  const nChars = Math.floor(cl((f - 62) / 18) * note.length);
  const shaft = cl((f - 80) / 6), vee = cl((f - 86) / 5);
  // chart data
  const withC = [100, 86, 79, 75, 72, 70, 69, 68];
  const without = [100, 72, 58, 50, 45, 42, 40, 39];
  const cx = (i: number) => 60 + i * 86, cy = (v: number) => 420 - (v - 30) * 3.3;
  const pl = (d: number[]) => d.map((v, i) => `${i ? "L" : "M"}${cx(i)},${cy(v)}`).join(" ");
  const lines = ["Viewers who could read along were", "far more likely to stay to the final", "second than those who could not."];
  const hl = (k: number) => cl((f - 94 - k * 9) / 8);

  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #327354 0%, #2D684C 50%, #245A40 100%)", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${drift}px, ${jolt + 70}px) scale(${push}) rotate(${roll}deg)` }}>
        {/* mat grid */}
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          {Array.from({ length: 40 }, (_, i) => <line key={`v${i}`} x1={i * 54} x2={i * 54} y1={0} y2={1920} stroke="#ECE8B4" strokeOpacity={i % 5 === 0 ? 0.28 : 0.11} strokeWidth={i % 5 === 0 ? 2 : 1} />)}
          {Array.from({ length: 40 }, (_, i) => <line key={`h${i}`} y1={i * 54} y2={i * 54} x1={0} x2={1080} stroke="#ECE8B4" strokeOpacity={i % 5 === 0 ? 0.28 : 0.11} strokeWidth={i % 5 === 0 ? 2 : 1} />)}
          {Array.from({ length: 8 }, (_, i) => <text key={`t${i}`} x={i * 270 + 6} y={30} fill="#ECE8B4" fillOpacity={0.45} fontFamily={pm} fontSize={20}>{i * 5}</text>)}
          {Array.from({ length: 14 }, (_, i) => <text key={`l${i}`} x={8} y={i * 270 + 24} fill="#ECE8B4" fillOpacity={0.45} fontFamily={pm} fontSize={20}>{i * 5}</text>)}
          <line x1={120} y1={1680} x2={620} y2={1610} stroke="#1d4a35" strokeWidth={2} strokeOpacity={0.5} />
          <line x1={700} y1={1500} x2={980} y2={1760} stroke="#1d4a35" strokeWidth={1.5} strokeOpacity={0.4} />
        </svg>
        <Grain id="matg" op={0.18} freq={0.6} />
        {/* sheet 1: chart */}
        {s1.visible && (
          <div style={{ position: "absolute", left: 110, top: 300, width: 800, height: 650, background: C.paper, transform: s1.transform, boxShadow: s1.boxShadow, padding: "40px 46px", boxSizing: "border-box" }}>
            <Grain id="p1" op={0.16} />
            <div style={{ fontFamily: pm, fontSize: 17, letterSpacing: 3, color: C.grey }}>FIG. 1 · VIEWERS STILL WATCHING, BY SECOND</div>
            <div style={{ fontFamily: cas, fontWeight: 700, fontSize: 46, color: C.ink, marginTop: 12, lineHeight: 1.1 }}>Captions keep people watching</div>
            <svg width={720} height={460} style={{ position: "absolute", left: 40, top: 160 }}>
              {[40, 60, 80, 100].map((v) => <g key={v}><line x1={50} x2={690} y1={cy(v)} y2={cy(v)} stroke="#ccc8bd" /><text x={0} y={cy(v) + 6} fontFamily={pm} fontSize={16} fill={C.grey}>{v}%</text></g>)}
              {withC.map((_, i) => <text key={i} x={cx(i) - 6} y={448} fontFamily={pm} fontSize={16} fill={C.grey}>{i}s</text>)}
              <path d={pl(without)} stroke="#8d897f" strokeWidth={4} fill="none" strokeDasharray="10 8" />
              <path d={pl(withC)} stroke={C.ink} strokeWidth={5} fill="none" />
              <text x={470} y={cy(withC[5]) - 16} fontFamily={cas} fontSize={20} fill={C.ink}>with captions</text>
              <text x={470} y={cy(without[5]) + 34} fontFamily={cas} fontSize={20} fill={C.grey}>without</text>
            </svg>
          </div>
        )}
        {/* sheet 2: quote */}
        {s2.visible && (
          <div style={{ position: "absolute", left: 230, top: 1000, width: 720, height: 430, background: C.paper, transform: s2.transform, boxShadow: s2.boxShadow, padding: "40px 46px", boxSizing: "border-box" }}>
            <Grain id="p2" op={0.16} />
            <div style={{ fontFamily: pm, fontSize: 17, letterSpacing: 3, color: C.grey }}>FIG. 2 · FROM THE VIEWING STUDY</div>
            <div style={{ fontFamily: cas, fontSize: 31, lineHeight: "50px", color: C.ink, marginTop: 22 }}>
              {lines.map((l, k) => (
                <div key={k} style={{ position: "relative", whiteSpace: "nowrap" }}>
                  <div style={{ position: "absolute", left: -6, top: 8, height: 38, width: `calc(${hl(k) * 100}% + 12px)`, background: C.yel, mixBlendMode: "multiply", clipPath: "polygon(1% 0, 100% 6%, 98% 100%, 0 94%)", opacity: hl(k) > 0 ? 0.92 : 0 }} />
                  <span style={{ position: "relative" }}>{l}</span>
                </div>
              ))}
            </div>
            <div style={{ fontFamily: pm, fontSize: 16, letterSpacing: 2, color: C.grey, marginTop: 26 }}>ILLUSTRATIVE DATA · 1,200 REELS</div>
          </div>
        )}
        {/* cut-out label */}
        {lb.visible && (
          <div style={{ position: "absolute", left: 70, top: 880, background: "#fff", padding: "14px 26px", transform: lb.transform, boxShadow: lb.boxShadow, fontFamily: it, fontWeight: 800, fontSize: 64, letterSpacing: -2, color: C.ink }}>THE CAPTIONS</div>
        )}
        <Tape f={f} at={36} x={30} y={872} r={-38} />
        <Tape f={f} at={40} x={440} y={930} r={30} />
        {/* marker */}
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <path d="M 790 718 C 880 700, 915 760, 900 820 C 885 885, 760 900, 720 850 C 685 800, 715 730, 810 712" stroke={C.red} strokeWidth={9} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - circ} opacity={circ > 0 ? 0.95 : 0} />
          <path d="M 560 300 C 640 420, 700 560, 760 690" stroke={C.red} strokeWidth={8} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - shaft} opacity={shaft > 0 ? 1 : 0} />
          <path d="M 722 655 L 762 696 L 778 640" stroke={C.red} strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - vee} opacity={vee > 0 ? 1 : 0} />
        </svg>
        <div style={{ position: "absolute", left: 250, top: 200, fontFamily: mk, fontSize: 60, color: C.red, transform: "rotate(-5deg)", whiteSpace: "nowrap" }}>{note.slice(0, nChars)}</div>
      </AbsoluteFill>
      <Grain id="film" op={0.1} freq={1.2} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)" }} />
    </AbsoluteFill>
  );
};
