import React, { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { loadFont as loadPS } from "@remotion/google-fonts/IBMPlexSans";
import { loadFont as loadPM } from "@remotion/google-fonts/IBMPlexMono";

const { fontFamily: ps } = loadPS("normal", { weights: ["600", "700"], subsets: ["latin"] });
const { fontFamily: pm } = loadPM("normal", { weights: ["400", "500"], subsets: ["latin"] });

const W = 1080, H = 1920, FOV = 30;
const C = { w: "#ECEEF1", grey: "#A3A8B0", or: "#FF5A2A" };
const COLS = 6, ROWS = 4, P = 1.18;
const KW = COLS * P, KD = ROWS * P;

// layers top -> bottom: assembled y, exploded y
const LAYERS = [
  { name: "Keycaps", spec: "PBT · DOUBLESHOT", a: 1.25, e: 8.6 },
  { name: "Switches", spec: "LINEAR · 45 G", a: 0.78, e: 6.4 },
  { name: "Plate", spec: "6061 ALUMINIUM", a: 0.52, e: 4.3 },
  { name: "Circuit board", spec: "HOT-SWAP · USB-C", a: 0.36, e: 2.3 },
  { name: "Case", spec: "CNC · ANODISED", a: 0, e: 0 },
];
const START = 26, STEP = 10;
const layerY = (k: number, f: number, fps: number) => {
  const s = spring({ frame: f - START - k * STEP, fps, config: { damping: 9, stiffness: 150, mass: 0.8 } });
  return LAYERS[k].a + (LAYERS[k].e - LAYERS[k].a) * s;
};

const camAt = (f: number) => {
  const u = interpolate(f, [0, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.4, 0, 0.2, 1) });
  const orbit = interpolate(f, [0, 140], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.3, 0, 0.3, 1) });
  const az = ((28 + orbit * 10) * Math.PI) / 180;
  const el = ((30 - u * 4) * Math.PI) / 180;
  const R = interpolate(u, [0, 1], [26, 47]);
  const tgt = new THREE.Vector3(interpolate(u, [0, 1], [0, 2.9]), interpolate(u, [0, 1], [0.6, 3.4]), 0);
  // shift target right in camera space so product sits left of centre
  const pos = new THREE.Vector3(tgt.x + R * Math.cos(el) * Math.sin(az), tgt.y + R * Math.sin(el), tgt.z + R * Math.cos(el) * Math.cos(az));
  return { pos, tgt };
};
const makeCam = (f: number) => {
  const { pos, tgt } = camAt(f);
  const c = new THREE.PerspectiveCamera(FOV, W / H, 0.5, 300);
  c.position.copy(pos); c.lookAt(tgt); c.updateMatrixWorld(); c.updateProjectionMatrix();
  return c;
};
const project = (c: THREE.PerspectiveCamera, p: THREE.Vector3) => { const v = p.clone().project(c); return { x: ((v.x + 1) / 2) * W, y: ((1 - v.y) / 2) * H }; };

const Keyboard: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const keys = useMemo(() => {
    const out: { x: number; z: number; col: string }[] = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const x = (c - (COLS - 1) / 2) * P, z = (r - (ROWS - 1) / 2) * P;
      const col = r === 0 && c === 0 ? C.or : (c === COLS - 1 || r === ROWS - 1) && (r + c) % 2 === 0 ? "#8F959C" : "#E9E2D2";
      out.push({ x, z, col });
    }
    return out;
  }, []);
  const ys = LAYERS.map((_, k) => layerY(k, f, fps));
  return (
    <group>
      {/* keycaps */}
      <group position={[0, ys[0], 0]}>
        {keys.map((k, i) => (
          <group key={i} position={[k.x, 0, k.z]}>
            <mesh castShadow receiveShadow position={[0, 0.25, 0]}><boxGeometry args={[1.02, 0.5, 1.02]} /><meshStandardMaterial color={k.col} roughness={0.55} /></mesh>
            <mesh castShadow position={[0, 0.53, 0]}><boxGeometry args={[0.84, 0.08, 0.84]} /><meshStandardMaterial color={k.col} roughness={0.45} /></mesh>
          </group>
        ))}
      </group>
      {/* switches */}
      <group position={[0, ys[1], 0]}>
        {keys.map((k, i) => (
          <group key={i} position={[k.x, 0, k.z]}>
            <mesh castShadow receiveShadow position={[0, 0.17, 0]}><boxGeometry args={[0.66, 0.34, 0.66]} /><meshStandardMaterial color="#17181B" roughness={0.4} /></mesh>
            <mesh castShadow position={[0, 0.42, 0]}><boxGeometry args={[0.2, 0.2, 0.2]} /><meshStandardMaterial color="#D0302B" roughness={0.35} /></mesh>
          </group>
        ))}
      </group>
      {/* plate */}
      <mesh castShadow receiveShadow position={[0, ys[2] + 0.05, 0]}><boxGeometry args={[KW + 0.2, 0.1, KD + 0.2]} /><meshStandardMaterial color="#5A5F68" metalness={0.6} roughness={0.32} /></mesh>
      {/* pcb + brass posts */}
      <group position={[0, ys[3], 0]}>
        <mesh castShadow receiveShadow position={[0, 0.04, 0]}><boxGeometry args={[KW + 0.1, 0.08, KD + 0.1]} /><meshStandardMaterial color="#1E6B47" roughness={0.6} /></mesh>
        {keys.map((k, i) => <mesh key={i} position={[k.x, 0.09, k.z]}><boxGeometry args={[0.3, 0.03, 0.3]} /><meshStandardMaterial color="#C9A44C" metalness={0.8} roughness={0.3} /></mesh>)}
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b], i) => <mesh key={i} castShadow position={[a * (KW / 2 - 0.3), 0.3, b * (KD / 2 - 0.3)]}><cylinderGeometry args={[0.11, 0.11, 0.5, 16]} /><meshStandardMaterial color="#C9A44C" metalness={0.85} roughness={0.25} /></mesh>)}
      </group>
      {/* case tray */}
      <group position={[0, ys[4], 0]}>
        <mesh castShadow receiveShadow position={[0, 0.12, 0]}><boxGeometry args={[KW + 0.7, 0.24, KD + 0.7]} /><meshStandardMaterial color="#8A9099" metalness={0.55} roughness={0.38} /></mesh>
        {[[0, KD / 2 + 0.3, KW + 0.7, 0.1], [0, -KD / 2 - 0.3, KW + 0.7, 0.1]].map(([x, z, w, d], i) => <mesh key={i} castShadow position={[x, 0.42, z]}><boxGeometry args={[w, 0.4, d]} /><meshStandardMaterial color="#8A9099" metalness={0.55} roughness={0.38} /></mesh>)}
        {[KW / 2 + 0.3, -KW / 2 - 0.3].map((x, i) => <mesh key={i} castShadow position={[x, 0.42, 0]}><boxGeometry args={[0.1, 0.4, KD + 0.7]} /><meshStandardMaterial color="#8A9099" metalness={0.55} roughness={0.38} /></mesh>)}
      </group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]}><planeGeometry args={[80, 80]} /><shadowMaterial opacity={0.35} /></mesh>
    </group>
  );
};

const Scene: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const { pos, tgt } = camAt(f);
  camera.fov = FOV; camera.position.copy(pos); camera.lookAt(tgt); camera.updateProjectionMatrix();
  return (
    <>
      <ambientLight intensity={0.7} />
      <hemisphereLight args={["#ffffff", "#20232a", 0.6]} />
      <directionalLight position={[-12, 30, 14]} intensity={2.2} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-radius={6}
        shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={14} shadow-camera-bottom={-14} shadow-bias={-0.0005} />
      <directionalLight position={[16, 10, -10]} intensity={0.9} color="#ffd9c7" />
      <Keyboard f={f} fps={fps} />
    </>
  );
};

export const Teardown: React.FC<{ title: string; spec: string }> = ({ title, spec }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cam = makeCam(f);
  const labelX = 700;
  const titleT = START + LAYERS.length * STEP + 12;
  const bar = interpolate(f, [titleT, titleT + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const words = title.split(" ");
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 50% at 40% 45%, #2A2D33 0%, #16181c 60%, #0A0A0C 100%)" }}>
      <ThreeCanvas width={W} height={H} shadows={{ type: THREE.PCFSoftShadowMap }} camera={{ fov: FOV, near: 0.5, far: 300 }} gl={{ antialias: true, alpha: true }}>
        <Scene f={f} fps={fps} />
      </ThreeCanvas>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {LAYERS.map((l, k) => {
          const t0 = START + k * STEP + 6;
          if (f < t0) return null;
          const y = layerY(k, f, fps) + (k === 0 ? 0.5 : k === 1 ? 0.3 : 0.1);
          const p = project(cam, new THREE.Vector3(KW / 2 + (k === 4 ? 0.35 : 0.05), y, KD / 2 + (k === 4 ? 0.35 : 0)));
          const ln = interpolate(f, [t0, t0 + 8], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
          const ex = labelX - 20;
          return (
            <g key={k}>
              <line x1={p.x} y1={p.y} x2={p.x + (ex - p.x) * ln} y2={p.y} stroke="#6F747C" strokeWidth={2} />
              <circle cx={p.x} cy={p.y} r={7} fill="#fff" />
            </g>
          );
        })}
      </svg>
      {LAYERS.map((l, k) => {
        const t0 = START + k * STEP + 10;
        const y = layerY(k, f, fps) + (k === 0 ? 0.5 : k === 1 ? 0.3 : 0.1);
        const p = project(cam, new THREE.Vector3(KW / 2 + (k === 4 ? 0.35 : 0.05), y, KD / 2 + (k === 4 ? 0.35 : 0)));
        const s = spring({ frame: f - t0, fps, config: { damping: 11, stiffness: 200 } });
        if (f < t0) return null;
        return (
          <div key={k} style={{ position: "absolute", left: labelX, top: p.y - 30, overflow: "hidden", height: 100 }}>
            <div style={{ transform: `translateY(${(1 - s) * 130}%)`, display: "flex", gap: 14, alignItems: "baseline" }}>
              <span style={{ fontFamily: pm, fontWeight: 500, fontSize: 28, color: C.or }}>{String(k + 1).padStart(2, "0")}</span>
              <div>
                <div style={{ fontFamily: ps, fontWeight: 600, fontSize: 38, color: C.w, lineHeight: 1.1 }}>{l.name}</div>
                <div style={{ fontFamily: pm, fontSize: 21, color: C.grey, letterSpacing: 1.5, marginTop: 4 }}>{l.spec}</div>
              </div>
            </div>
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 80, top: 1390 }}>
        <div style={{ width: 120 * bar, height: 8, background: C.or, marginBottom: 26 }} />
        <div style={{ display: "flex", gap: 20, overflow: "hidden" }}>
          {words.map((w, i) => {
            const s = spring({ frame: f - titleT - 4 - i * 3, fps, config: { damping: 12, stiffness: 200 } });
            return <span key={i} style={{ display: "inline-block", fontFamily: ps, fontWeight: 700, fontSize: 92, color: C.w, letterSpacing: -2, transform: `translateY(${(1 - s) * 110}%)` }}>{w}</span>;
          })}
        </div>
        <div style={{ overflow: "hidden" }}>
          <div style={{ fontFamily: pm, fontSize: 24, letterSpacing: 3, color: C.grey, marginTop: 12, transform: `translateY(${(1 - spring({ frame: f - titleT - 14, fps, config: { damping: 12 } })) * 110}%)` }}>{spec}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
