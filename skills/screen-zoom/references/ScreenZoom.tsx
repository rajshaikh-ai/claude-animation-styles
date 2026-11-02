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


export const ScreenZoom: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const target = { x: 840, y: 1080 };
  const curT = Easing.bezier(0.45, 0, 0.2, 1)(cl((f - 12) / 40));
  const cx = interpolate(curT, [0, 1], [300, target.x]) + Math.sin(curT * Math.PI) * 120;
  const cy = interpolate(curT, [0, 1], [700, target.y]) - Math.sin(curT * Math.PI) * 60;
  const z = spring({ frame: f - 20, fps, config: { damping: 30, stiffness: 50 } });
  const zoom = 1 + z * 1.0;
  const ox = interpolate(z, [0, 1], [0, 540 - target.x]), oy = interpolate(z, [0, 1], [0, 1000 - target.y]);
  const click = f - 56;
  const press = click >= 0 && click < 8 ? 0.95 + 0.05 * (click / 8) : 1;
  const ring = cl(click / 14);
  const pill = spring({ frame: f - 74, fps, config: { damping: 10, stiffness: 180 } });
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 15% 10%, #E3EFE9 0%, #B8D7D6 55%, #9CC4BD 100%)", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, transform: `translate(${ox}px, ${oy}px) scale(${zoom})`, transformOrigin: `${target.x}px ${target.y}px` }}>
        <div style={{ position: "absolute", left: 90, top: 620, width: 900, height: 640, background: "#1B1C20", borderRadius: 24, boxShadow: "0 50px 100px rgba(20,40,40,0.35)", overflow: "hidden", fontFamily: inter }}>
          <div style={{ height: 52, background: "#212227", display: "flex", alignItems: "center", gap: 10, padding: "0 20px" }}>{["#FF5F57", "#FEBC2E", "#28C840"].map((c) => <div key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c }} />)}<span style={{ color: "#9A9FA8", fontSize: 18, marginLeft: 16 }}>Weekend recap v3</span></div>
          <div style={{ display: "flex", gap: 16, padding: 20 }}>
            <div style={{ width: 300, height: 380, borderRadius: 14, background: "linear-gradient(180deg,#7fa6c9,#3f5f7f 60%,#2b3a4a)" }} />
            <div style={{ flex: 1, background: "#26272C", borderRadius: 14, padding: 22, color: "#ECEEF1" }}>
              <div style={{ fontWeight: 600, fontSize: 26 }}>Export</div>
              {[["Format", "MP4"], ["Resolution", "1080 × 1920"], ["Frame rate", "30 fps"], ["Size", "48.2 MB"]].map(([a, b]) => (
                <div key={a} style={{ display: "flex", justifyContent: "space-between", marginTop: 20, fontSize: 19 }}><span style={{ color: "#9A9FA8", fontWeight: 500 }}>{a}</span><span style={{ fontFamily: a === "Size" ? jb : inter, fontWeight: 600 }}>{b}</span></div>
              ))}
            </div>
          </div>
          <div style={{ height: 90, margin: "0 20px", background: "#2A2B31", borderRadius: 10, position: "relative" }}>
            <div style={{ position: "absolute", left: 210, top: 0, bottom: 0, width: 3, background: "#FF5A4E" }} />
          </div>
          <div style={{ position: "absolute", left: target.x - 90 - 95, top: target.y - 620 - 32, width: 190, height: 64, borderRadius: 14, background: f >= 50 ? "linear-gradient(#2f66d8,#2858c0)" : "linear-gradient(#4A85FF,#3D7BFA)", color: "#fff", fontWeight: 600, fontSize: 24, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${press})` }}>Export</div>
        </div>
        {click >= 0 && <div style={{ position: "absolute", left: target.x, top: target.y, width: 40 + ring * 140, height: 40 + ring * 140, borderRadius: "50%", border: "4px solid #fff", transform: "translate(-50%,-50%)", opacity: 1 - ring }} />}
        <svg width={44} height={58} style={{ position: "absolute", left: cx, top: cy + (click >= 0 && click < 6 ? 4 : 0), filter: "drop-shadow(0 3px 4px rgba(0,0,0,0.35))" }} viewBox="0 0 22 29"><path d="M1 1 L1 23 L7 17 L11 27 L15 25 L11 16 L19 16 Z" fill="#fff" stroke="#111" strokeWidth={1.6} strokeLinejoin="round" /></svg>
      </div>
      <div style={{ position: "absolute", left: "50%", top: 1380, transform: `translateX(-50%) scale(${pill})`, background: "#fff", borderRadius: 40, padding: "14px 30px 14px 14px", display: "flex", alignItems: "center", gap: 14, fontFamily: inter, fontWeight: 600, fontSize: 32, color: "#111", boxShadow: "0 10px 30px rgba(0,0,0,0.15)" }}>
        <span style={{ width: 50, height: 50, borderRadius: 25, background: "#111", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${spring({ frame: f - 78, fps, config: { damping: 9 } })})` }}>2</span>Click Export
      </div>
    </AbsoluteFill>
  );
};

