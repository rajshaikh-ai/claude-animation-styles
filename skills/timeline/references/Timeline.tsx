import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadPJ } from "@remotion/google-fonts/PlusJakartaSans";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadJB } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadSG } from "@remotion/google-fonts/SchibstedGrotesk";

const { fontFamily: pj } = loadPJ("normal", { weights: ["500", "700", "800"], subsets: ["latin"] });
const { fontFamily: inter } = loadInter("normal", { weights: ["500", "600"], subsets: ["latin"] });
const { fontFamily: jb } = loadJB("normal", { weights: ["600"], subsets: ["latin"] });
const { fontFamily: sg } = loadSG("normal", { weights: ["500", "700", "800"], subsets: ["latin"] });
const cl = (v: number) => Math.max(0, Math.min(1, v));
const ck = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;


const MS = [
  { y: 2019, t: "One laptop", d: "First video, 212 views", at: 0.12 },
  { y: 2021, t: "First 10K", d: "Daily posting begins", at: 0.38 },
  { y: 2023, t: "Studio opens", d: "A real desk, real lights", at: 0.64 },
  { y: 2025, t: "40 cities", d: "Workshops on tour", at: 0.9, now: true },
];
export const Timeline: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = interpolate(f, [0, 100], [0.04, 0.93], { ...ck, easing: Easing.bezier(0.35, 0.05, 0.25, 1) });
  const cam = Easing.bezier(0.4, 0, 0.2, 1)(cl(f / 120));
  const A = { x: 230, y: 380 }, B = { x: 600, y: 1500 };
  const pt = (u: number) => ({ x: A.x + (B.x - A.x) * u, y: A.y + (B.y - A.y) * u });
  const head = pt(p);
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg,#F5F6F8,#E3E6EB)", overflow: "hidden", fontFamily: sg }}>
      <div style={{ position: "absolute", left: 70, top: 110, zIndex: 3 }}>
        <div style={{ fontFamily: jb, fontWeight: 600, fontSize: 22, letterSpacing: 3, color: "#6A717C" }}>■ ARC STUDIO · 2019 TO NOW</div>
        <div style={{ fontWeight: 800, fontSize: 70, letterSpacing: -2, color: "#0E1116", lineHeight: 1.05, marginTop: 10 }}>From one laptop to <span style={{ color: "#2442F5" }}>40 cities</span></div>
      </div>
      <div style={{ position: "absolute", inset: 0, perspective: 1600 }}>
        <div style={{ position: "absolute", inset: 0, transformOrigin: "50% 60%", transform: `rotateX(${interpolate(cam, [0, 1], [52, 40])}deg) scale(${interpolate(cam, [0, 1], [1.45, 1.05])}) translateY(${interpolate(cam, [0, 1], [-260, 80])}px) rotateZ(${interpolate(cam, [0, 1], [-8, 0])}deg)` }}>
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
            {Array.from({ length: 24 }, (_, i) => <line key={i} x1={0} x2={1080} y1={i * 90} y2={i * 90} stroke="#c9ced6" strokeOpacity={0.5} />)}
            {Array.from({ length: 14 }, (_, i) => <line key={`v${i}`} y1={0} y2={1920} x1={i * 90} x2={i * 90} stroke="#c9ced6" strokeOpacity={0.5} />)}
            <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="#B7BEC8" strokeWidth={10} strokeLinecap="round" />
            <line x1={A.x} y1={A.y} x2={head.x} y2={head.y} stroke="#2442F5" strokeWidth={10} strokeLinecap="round" />
            {Array.from({ length: 7 }, (_, i) => {
              const u = 0.12 + i * 0.13; const q = pt(u); const done = p >= u; const yr = 2019 + i; const key = i % 2 === 0;
              return <g key={i}><line x1={q.x - 26} x2={q.x + 26} y1={q.y} y2={q.y} stroke={done ? "#2442F5" : "#B7BEC8"} strokeWidth={5} />
                <text x={q.x - 50} y={q.y + (key ? 22 : 12)} textAnchor="end" fontFamily={sg} fontWeight={800} fontSize={key ? 64 : 34} fill={done ? "#0E1116" : key ? "#9aa1ab" : "#B7BEC8"}>{yr}</text></g>;
            })}
            <circle cx={head.x} cy={head.y} r={16} fill="#2442F5" /><circle cx={head.x} cy={head.y} r={30} fill="#2442F5" fillOpacity={0.18} />
          </svg>
        </div>
      </div>
      {MS.map((m, i) => {
        const tf = interpolate(m.at, [0.04, 0.93], [0, 100]) * 0.72 + 8;
        const s = spring({ frame: f - tf, fps, config: { damping: 9, stiffness: 150 } });
        const x = 360 + i * 120, y = 540 + i * 270;
        const now = !!m.now;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, width: now ? 470 : 400, transformOrigin: "50% 100%", transform: `perspective(900px) rotateX(${(1 - s) * 85}deg) scale(${now ? 1.08 : 1})`, background: now ? "#2442F5" : "#fff", color: now ? "#fff" : "#0E1116", borderRadius: 20, padding: 20, display: "flex", gap: 18, boxShadow: "0 20px 40px rgba(14,17,22,0.14), 0 3px 8px rgba(14,17,22,0.08)", opacity: f >= tf ? 1 : 0 }}>
            <div style={{ width: 92, height: 92, borderRadius: 14, background: now ? "rgba(255,255,255,0.25)" : ["#dfe3ea", "#e8e3da", "#dde6e1"][i] }} />
            <div>
              <div style={{ fontFamily: jb, fontWeight: 600, fontSize: 20, letterSpacing: 2, color: now ? "#cdd5ff" : "#6A717C" }}>{m.y}</div>
              <div style={{ fontWeight: 700, fontSize: 34 }}>{m.t}</div>
              <div style={{ fontWeight: 500, fontSize: 22, color: now ? "#dfe4ff" : "#6A717C" }}>{m.d}</div>
            </div>
            {now && <div style={{ position: "absolute", top: -18, right: -14, background: "#0E1116", color: "#fff", fontFamily: jb, fontWeight: 600, fontSize: 20, padding: "6px 14px", borderRadius: 14, transform: `scale(${spring({ frame: f - tf - 5, fps, config: { damping: 9 } })})` }}>NOW</div>}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
