import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadIT } from "@remotion/google-fonts/InterTight";
import { loadFont as loadMono } from "@remotion/google-fonts/IBMPlexMono";

const { fontFamily: it } = loadIT("normal", { weights: ["500", "600", "800"], subsets: ["latin"] });
const { fontFamily: mono } = loadMono("normal", { weights: ["400", "500"], subsets: ["latin"] });

const C = { bg: "#0A0B0D", w: "#F4F5F6", grey: "#8B9098", dark: "#4A4F57", line: "#E9EBEE", or: "#FF5B1F" };
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const N = 45, EV = 26, FINAL = 3.6;
const DATA = Array.from({ length: N }, (_, i) => {
  const n = Math.sin(i * 2.3) * 0.012 + Math.sin(i * 0.7) * 0.01;
  if (i <= EV) return 0.3 + i * 0.0065 + n;
  const u = (i - EV) / (N - 1 - EV);
  const base = 0.3 + EV * 0.0065;
  return i === N - 1 ? FINAL : base + (FINAL - base) * Math.pow(u, 1.5) + n * 3;
});
const label = (i: number) => `${MONTHS[i % 12]} ${2022 + Math.floor(i / 12)}`;

// chart geometry
const X0 = 70, X1 = 900, Y0 = 1430, Y1 = 900, VMAX = 4;
const TOTALM = 48; // through Dec 2025 (last 3 months hatched)
const xi = (i: number) => X0 + (i / (TOTALM - 1)) * (X1 - X0);
const yv = (v: number) => Y0 - (v / VMAX) * (Y0 - Y1);

export const StatChart: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  // tip position in data index (float)
  const tip = interpolate(f, [0, 52, 66, 112], [3, EV - 1.5, EV + 2.5, N - 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.3, 0.1, 0.35, 1),
  });
  const ti = Math.floor(tip), fr = tip - ti;
  const vTip = ti >= N - 1 ? DATA[N - 1] : DATA[ti] + (DATA[ti + 1] - DATA[ti]) * fr;
  const pts: [number, number][] = [];
  for (let i = 0; i <= Math.min(ti, N - 1); i++) pts.push([xi(i), yv(DATA[i])]);
  if (ti < N - 1) pts.push([xi(tip), yv(vTip)]);
  const pre = pts.filter((p, idx) => idx <= EV || p[0] <= xi(EV));
  const after = tip > EV ? [[xi(EV), yv(DATA[EV])] as [number, number], ...pts.filter((p) => p[0] > xi(EV))] : [];
  const path = (ps: [number, number][]) => ps.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const fillPath = pts.length > 1 ? `${path(pts)} L${pts[pts.length - 1][0]},${Y0} L${X0},${Y0} Z` : "";
  const evF = 59; // frame the tip crosses the event (approx)
  const passed = tip >= EV;
  const evPop = spring({ frame: f - evF, fps, config: { damping: 8, stiffness: 200 } });
  const dotSwell = passed ? 1 + 0.6 * Math.max(0, 1 - (f - evF) / 8) : 1;
  const leader = interpolate(f, [evF + 2, evF + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const co = (k: number) => spring({ frame: f - evF - 8 - k * 4, fps, config: { damping: 14, stiffness: 220 } });
  const landed = f >= 112;
  const chip = spring({ frame: f - 112, fps, config: { damping: 9, stiffness: 220 } });
  const ping = interpolate(f, [113, 133], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tag = spring({ frame: f - 116, fps, config: { damping: 14, stiffness: 180 } });
  const shown = landed ? FINAL : vTip;
  const tipX = pts[pts.length - 1][0], tipY = pts[pts.length - 1][1];
  const curMonth = label(Math.min(N - 1, Math.round(tip)));

  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: it, color: C.w }}>
      {/* header */}
      <div style={{ position: "absolute", top: 86, left: 70, right: 70, display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 26, borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 34, height: 34, background: C.w, clipPath: "polygon(50% 0,100% 100%,0 100%)" }} />
          <span style={{ fontFamily: mono, fontWeight: 500, fontSize: 26, letterSpacing: 4 }}>KESTREL CLOUD</span>
        </div>
        <span style={{ fontFamily: mono, fontSize: 21, letterSpacing: 2, color: C.grey }}>ARR · USD · MONTHLY</span>
      </div>
      <div style={{ position: "absolute", top: 210, left: 70, fontSize: 40, fontWeight: 500, color: C.grey }}>Annual recurring revenue</div>
      <div style={{ position: "absolute", top: 250, left: 62, display: "flex", alignItems: "flex-start", fontWeight: 800, letterSpacing: -12, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
        <span style={{ fontSize: 120, marginTop: 40, letterSpacing: 0, marginRight: 8 }}>$</span>
        <span style={{ fontSize: 330 }}>{shown.toFixed(1)}</span>
        <span style={{ fontSize: 220, marginTop: 92, marginLeft: 16, letterSpacing: 0 }}>B</span>
      </div>
      <div style={{ position: "absolute", top: 640, left: 70, right: 70, display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ background: C.or, color: C.bg, fontFamily: mono, fontWeight: 500, fontSize: 26, padding: "8px 16px", borderRadius: 6, transform: `scale(${chip})`, transformOrigin: "left center" }}>▲ +666%</div>
        <div style={{ fontSize: 30, color: C.grey, fontWeight: 500, opacity: landed ? 1 : 0 }}>since the agents launched</div>
        <div style={{ marginLeft: "auto", fontFamily: mono, fontSize: 24, letterSpacing: 2, color: C.grey }}>● {curMonth}</div>
      </div>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="fl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity="0.13" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
          <pattern id="hatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="14" stroke="rgba(255,255,255,0.12)" strokeWidth="3" /></pattern>
        </defs>
        {[0, 1, 2, 3, 4].map((v) => (
          <g key={v}>
            <line x1={X0} x2={X1} y1={yv(v)} y2={yv(v)} stroke="rgba(255,255,255,0.07)" />
            <text x={X1 + 20} y={yv(v) + 8} fill={C.grey} fontFamily={mono} fontSize={22}>${v}B</text>
          </g>
        ))}
        {[2022, 2023, 2024, 2025].map((y, k) => (
          <g key={y}>
            <line x1={xi(k * 12)} x2={xi(k * 12)} y1={Y1} y2={Y0} stroke="rgba(255,255,255,0.07)" />
            <text x={xi(k * 12)} y={Y0 + 44} fill={C.grey} fontFamily={mono} fontSize={22} letterSpacing={2}>{y}</text>
          </g>
        ))}
        <rect x={xi(N - 1) + 4} y={Y1} width={X1 - xi(N - 1) - 4} height={Y0 - Y1} fill="url(#hatch)" />
        {fillPath && <path d={fillPath} fill="url(#fl)" />}
        <path d={path(pre)} stroke={C.line} strokeWidth={4} fill="none" strokeLinejoin="round" />
        {after.length > 1 && <path d={path(after)} stroke={C.or} strokeWidth={7} fill="none" strokeLinejoin="round" />}
        {/* dashed cursor */}
        {!landed && <line x1={tipX} x2={tipX} y1={Y1 - 20} y2={Y0} stroke="rgba(255,255,255,0.25)" strokeDasharray="6 8" />}
        {passed && (
          <>
            <circle cx={xi(EV)} cy={yv(DATA[EV])} r={16 * evPop} fill="none" stroke={C.or} strokeWidth={4} />
            <line x1={xi(EV)} x2={xi(EV)} y1={yv(DATA[EV]) - 20} y2={yv(DATA[EV]) - 20 - 190 * leader} stroke={C.or} strokeWidth={2} />
          </>
        )}
        <circle cx={tipX} cy={tipY} r={11 * dotSwell} fill={passed ? C.or : C.w} />
        {landed && <circle cx={tipX} cy={tipY} r={12 + 50 * ping} fill="none" stroke={C.or} strokeWidth={3} opacity={1 - ping} />}
      </svg>
      {/* callout */}
      {passed && (
        <div style={{ position: "absolute", left: xi(EV) - 260, top: yv(DATA[EV]) - 330, width: 380, overflow: "hidden" }}>
          {[
            <div key="a" style={{ fontFamily: mono, fontSize: 22, color: C.or, letterSpacing: 2 }}>MAR 2024</div>,
            <div key="b" style={{ fontSize: 34, fontWeight: 600 }}>Kestrel Agents launch</div>,
            <div key="c" style={{ fontSize: 26, color: C.grey, fontWeight: 500 }}>Revenue curve bends upward</div>,
          ].map((el, k) => <div key={k} style={{ overflow: "hidden" }}><div style={{ transform: `translateY(${(1 - co(k)) * 110}%)` }}>{el}</div></div>)}
        </div>
      )}
      {/* value tag */}
      <div style={{ position: "absolute", left: X1 + 8, top: yv(FINAL) - 22, overflow: "hidden", width: 160 }}>
        <div style={{ background: C.or, color: C.bg, fontFamily: mono, fontWeight: 500, fontSize: 24, padding: "6px 10px", borderRadius: 4, display: "inline-block", transform: `translateX(${(1 - tag) * -120}%)` }}>$3.6B</div>
      </div>
      <div style={{ position: "absolute", top: 1510, left: 70, fontFamily: mono, fontSize: 19, letterSpacing: 2, color: C.dark }}>SOURCE: KESTREL CLOUD INVESTOR LETTER · ILLUSTRATIVE</div>
    </AbsoluteFill>
  );
};
