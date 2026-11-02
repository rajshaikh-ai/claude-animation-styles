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


const Card: React.FC<{ s: number; style: React.CSSProperties; children: React.ReactNode }> = ({ s, style, children }) => (
  <div style={{ position: "absolute", background: "#fff", borderRadius: 28, padding: 24, boxSizing: "border-box", boxShadow: "0 30px 60px rgba(30,45,70,0.18), 0 6px 14px rgba(30,45,70,0.12)", transform: `scale(${s})`, fontFamily: pj, ...style }}>{children}</div>
);
export const AppMockup: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sw = spring({ frame: f, fps, config: { damping: 12, stiffness: 60, mass: 1.3 } });
  const ry = interpolate(sw, [0, 1], [-62, -20]), rx = interpolate(sw, [0, 1], [18, 8]);
  const bal = 24860 * Easing.out(Easing.cubic)(cl((f - 14) / 40));
  const chart = cl((f - 18) / 34);
  const pts = [0, 12, 8, 22, 18, 30, 26, 40, 52, 48, 64, 72].map((v, i) => [30 + i * 46, 300 - v * 3]);
  const vis = pts.slice(0, Math.max(2, Math.ceil(chart * pts.length)));
  const c = (k: number) => spring({ frame: f - 56 - k * 15, fps, config: { damping: 10, stiffness: 160 } });
  const float = Math.sin(f * 0.05) * 8;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #f4f7fa 0%, #dfe6ee 45%, #cfd8e2 100%)", perspective: 2400 }}>
      <div style={{ position: "absolute", left: 300, top: 1540, width: 480, height: 60, borderRadius: "50%", background: "rgba(40,55,80,0.25)", filter: "blur(30px)", transform: `scaleX(${0.6 + sw * 0.4})` }} />
      <div style={{ position: "absolute", left: 250, top: 330 + float, width: 580, height: 1200, transformStyle: "preserve-3d", transform: `rotateY(${ry}deg) rotateX(${rx}deg) rotateZ(-3deg)` }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: 86, background: "linear-gradient(135deg,#d9dde3,#9aa1ab)", transform: "translateZ(-18px)" }} />
        <div style={{ position: "absolute", inset: 10, borderRadius: 78, background: "#0e1116" }} />
        <div style={{ position: "absolute", inset: 24, borderRadius: 66, background: "#fff", overflow: "hidden", padding: "90px 34px 0", boxSizing: "border-box" }}>
          <div style={{ position: "absolute", top: 22, left: "50%", marginLeft: -70, width: 140, height: 40, borderRadius: 20, background: "#0e1116" }} />
          <div style={{ fontWeight: 500, fontSize: 26, color: "#7a818c", fontFamily: pj }}>Good morning, Raj</div>
          <div style={{ fontWeight: 800, fontSize: 82, color: "#0e1116", fontFamily: pj, fontVariantNumeric: "tabular-nums", letterSpacing: -2, marginTop: 6 }}>${Math.round(bal).toLocaleString("en-US")}</div>
          <div style={{ display: "inline-block", background: "#e3f6ee", color: "#0e9f6e", fontWeight: 700, fontSize: 24, padding: "6px 14px", borderRadius: 14, fontFamily: pj, transform: `scale(${spring({ frame: f - 54, fps, config: { damping: 9 } })})` }}>▲ 12.4%</div>
          <svg width={520} height={330} style={{ marginTop: 10 }}>
            <path d={vis.map((p, i) => `${i ? "L" : "M"}${p[0]},${p[1]}`).join(" ")} stroke="#0e9f6e" strokeWidth={6} fill="none" strokeLinejoin="round" />
            <circle cx={vis[vis.length - 1][0]} cy={vis[vis.length - 1][1]} r={10} fill="#0e9f6e" />
          </svg>
          {["Studio rent", "Client payout", "Editing software"].map((t, i) => {
            const r = spring({ frame: f - 40 - i * 6, fps, config: { damping: 14 } });
            return (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 18, padding: "18px 0", borderBottom: "1px solid #eef0f3", transform: `translateY(${(1 - r) * 60}px)`, opacity: r > 0.02 ? 1 : 0, fontFamily: pj }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: ["#e3f6ee", "#eef0f6", "#fdf0e6"][i] }} />
                <div style={{ flex: 1, fontWeight: 700, fontSize: 26, color: "#0e1116" }}>{t}</div>
                <div style={{ fontWeight: 700, fontSize: 26, color: i === 1 ? "#0e9f6e" : "#0e1116" }}>{["-$1,200", "+$4,800", "-$49"][i]}</div>
              </div>
            );
          })}
        </div>
      </div>
      <Card s={c(0)} style={{ left: 90, top: 260, width: 520, transformOrigin: "80% 100%" }}><div style={{ fontWeight: 700, fontSize: 26 }}>Payment received</div><div style={{ fontSize: 22, color: "#7a818c", marginTop: 6 }}>+$4,800 from Linden & Pike</div></Card>
      <Card s={c(1)} style={{ right: 60, top: 820, width: 300, transformOrigin: "0% 50%" }}>
        <div style={{ fontWeight: 800, fontSize: 44 }}>$1,340</div><div style={{ fontSize: 20, color: "#7a818c" }}>saved this week</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 90, marginTop: 12 }}>{[40, 60, 35, 75, 90].map((h, i) => <div key={i} style={{ width: 34, height: h * cl(c(1) * 1.3 - i * 0.08), background: i === 4 ? "#0e9f6e" : "#dfe6ee", borderRadius: 6 }} />)}</div>
      </Card>
      <Card s={c(2)} style={{ left: 70, top: 1270, width: 330, display: "flex", alignItems: "center", gap: 18, transformOrigin: "30% 50%" }}>
        <svg width={86} height={86}><circle cx={43} cy={43} r={34} stroke="#e3f6ee" strokeWidth={12} fill="none" /><circle cx={43} cy={43} r={34} stroke="#0e9f6e" strokeWidth={12} fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - 0.72 * c(2)} transform="rotate(-90 43 43)" strokeLinecap="round" /></svg>
        <div><div style={{ fontWeight: 800, fontSize: 34 }}>72%</div><div style={{ fontSize: 20, color: "#7a818c" }}>savings goal</div></div>
      </Card>
    </AbsoluteFill>
  );
};

