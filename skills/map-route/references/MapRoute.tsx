import React, { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", { weights: ["500", "600", "700", "800"], subsets: ["latin"] });

export type MapRouteProps = { place: string; minutes: number; distance: string };

// ---------- palette (from the card) ----------
const C = {
  bld: "#F7F7F5", bldTall: "#EEF0F3", land: "#ECEAE4", street: "#FBFBFA", haze: "#E4E9EE",
  water: "#8EC6EE", park: "#C9E5BD", tree: "#9FCF8E", main: "#FFE3A3", route: "#1A73E8",
  pin: "#EA4335", ink: "#121417", grey: "#6B737C", green: "#1F9D55",
};

const W = 1080, H = 1920, FOV = 36, S = 12, SW = 2.4; // street spacing / width

// ---------- deterministic randomness ----------
const rng = (seed: number) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// ---------- route along the street grid (invented city) ----------
const ROUTE: [number, number][] = [[-12, 30], [-12, 24], [0, 24], [0, -12], [12, -12], [12, -21]];
const DEST = new THREE.Vector3(12, 0, -21);
const segLens = ROUTE.slice(1).map((p, i) => Math.hypot(p[0] - ROUTE[i][0], p[1] - ROUTE[i][1]));
const TOTAL = segLens.reduce((a, b) => a + b, 0);

const PARKS: [number, number][] = [[-2, -2], [1, 1], [-3, 2], [2, -4], [-1, -4]]; // block indices
const RIVER_J = 0; // block row between z=0 and z=12 is the river
const LABELS = [
  { text: "Fern Park", pos: new THREE.Vector3(-18, 0, -18), at: 30 },
  { text: "Larkspur", pos: new THREE.Vector3(18, 0, 18), at: 40 },
  { text: "Willow River", pos: new THREE.Vector3(15, 0, 6), at: 50 },
];

// ---------- camera: rises and backs away first, then pans and narrows on the destination ----------
const bez = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, u: number) =>
  a.clone().multiplyScalar((1 - u) ** 2).add(b.clone().multiplyScalar(2 * u * (1 - u))).add(c.clone().multiplyScalar(u * u));
const START = { pos: new THREE.Vector3(-12, 4.2, 40), tgt: new THREE.Vector3(-12, 0.6, 18) };
const END_T = new THREE.Vector3(1, 0, 23);
const ELEV = (55 * Math.PI) / 180, DIST = 128;
const END = { pos: END_T.clone().add(new THREE.Vector3(0, Math.sin(ELEV) * DIST, Math.cos(ELEV) * DIST)), tgt: END_T };
const camAt = (f: number) => {
  const u = interpolate(f, [0, 112], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.42, 0, 0.12, 1) });
  const pos = bez(START.pos, new THREE.Vector3(-30, 46, 78), END.pos, u);
  const tgt = bez(START.tgt, START.tgt.clone().add(new THREE.Vector3(0, -1, 2)), END.tgt, u); // target moves late: lift first, pan after
  return { pos, tgt };
};
const makeCam = (f: number) => {
  const { pos, tgt } = camAt(f);
  const cam = new THREE.PerspectiveCamera(FOV, W / H, 0.5, 900);
  cam.position.copy(pos); cam.lookAt(tgt); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
  return cam;
};
const project = (cam: THREE.PerspectiveCamera, p: THREE.Vector3) => {
  const v = p.clone().project(cam);
  return { x: ((v.x + 1) / 2) * W, y: ((1 - v.y) / 2) * H, z: v.z };
};
// world size that keeps a constant pixel size at point p
const worldPerPx = (cam: THREE.PerspectiveCamera, p: THREE.Vector3) =>
  (2 * cam.position.distanceTo(p) * Math.tan(((FOV / 2) * Math.PI) / 180)) / H;

// ---------- city ----------
const City: React.FC = () => {
  const data = useMemo(() => {
    const r = rng(7);
    const low: THREE.Matrix4[] = [], tall: THREE.Matrix4[] = [], skirt: THREE.Matrix4[] = [], trees: THREE.Matrix4[] = [];
    const parks: [number, number][] = [];
    const m = new THREE.Matrix4();
    for (let i = -9; i < 9; i++) for (let j = -9; j < 9; j++) {
      const x0 = i * S + SW / 2, z0 = j * S + SW / 2, size = S - SW;
      if (j === RIVER_J) continue;
      if (PARKS.some(([a, b]) => a === i && b === j)) {
        parks.push([x0 + size / 2, z0 + size / 2]);
        for (let k = 0; k < 9; k++) {
          const s = 0.9 + r() * 0.7;
          trees.push(new THREE.Matrix4().compose(new THREE.Vector3(x0 + 1.2 + r() * (size - 2.4), s, z0 + 1.2 + r() * (size - 2.4)), new THREE.Quaternion(), new THREE.Vector3(s, s, s)));
        }
        continue;
      }
      for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) {
        const lot = size / 2;
        const w = lot - 0.6 - r() * 0.9, d = lot - 0.6 - r() * 0.9;
        const storeys = 1 + Math.floor(r() * 3);
        const h = storeys * 1.25;
        const cx = x0 + lot * a + lot / 2, cz = z0 + lot * b + lot / 2;
        m.compose(new THREE.Vector3(cx, h / 2, cz), new THREE.Quaternion(), new THREE.Vector3(w, h, d));
        (storeys === 3 ? tall : low).push(m.clone());
        skirt.push(new THREE.Matrix4().compose(new THREE.Vector3(cx, 0.004, cz), new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)), new THREE.Vector3(w + 0.7, d + 0.7, 1)));
      }
    }
    return { low, tall, skirt, trees, parks };
  }, []);

  const inst = (mats: THREE.Matrix4[]) => (mesh: THREE.InstancedMesh | null) => {
    if (!mesh) return;
    mats.forEach((mm, k) => mesh.setMatrixAt(k, mm));
    mesh.instanceMatrix.needsUpdate = true;
  };
  const strips: React.ReactNode[] = [];
  for (let k = -9; k <= 9; k++) {
    const bridge = k === 0 || k === -3 || k === 3;
    const col = k === 0 ? C.main : C.street;
    const em = k === 0 ? "#6b5a2e" : "#000000";
    if (bridge) strips.push(<mesh key={"x" + k} rotation={[-Math.PI / 2, 0, 0]} position={[k * S, 0.01, 0]} receiveShadow><planeGeometry args={[SW, 18 * S]} /><meshStandardMaterial color={col} emissive={em} roughness={1} /></mesh>);
    else {
      strips.push(<mesh key={"xa" + k} rotation={[-Math.PI / 2, 0, 0]} position={[k * S, 0.01, (S + 9 * S) / 2]} receiveShadow><planeGeometry args={[SW, 9 * S - S + SW]} /><meshStandardMaterial color={col} roughness={1} /></mesh>);
      strips.push(<mesh key={"xb" + k} rotation={[-Math.PI / 2, 0, 0]} position={[k * S, 0.01, -9 * S / 2]} receiveShadow><planeGeometry args={[SW, 9 * S + SW]} /><meshStandardMaterial color={col} roughness={1} /></mesh>);
    }
    strips.push(<mesh key={"z" + k} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.009, k * S]} receiveShadow><planeGeometry args={[18 * S, SW]} /><meshStandardMaterial color={C.street} roughness={1} /></mesh>);
  }
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[600, 600]} /><meshStandardMaterial color={C.land} roughness={1} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, S / 2]}><planeGeometry args={[600, S - SW - 0.4]} /><meshStandardMaterial color={C.water} roughness={0.6} /></mesh>
      {data.parks.map(([x, z], k) => (
        <mesh key={k} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.007, z]} receiveShadow><planeGeometry args={[S - SW, S - SW]} /><meshStandardMaterial color={C.park} roughness={1} /></mesh>
      ))}
      {strips}
      <instancedMesh ref={inst(data.skirt)} args={[undefined, undefined, data.skirt.length]}>
        <planeGeometry args={[1, 1]} /><meshBasicMaterial color="#DEDCD5" transparent opacity={0.55} depthWrite={false} />
      </instancedMesh>
      <instancedMesh ref={inst(data.low)} args={[undefined, undefined, data.low.length]} castShadow receiveShadow>
        <boxGeometry /><meshStandardMaterial color={C.bld} roughness={1} />
      </instancedMesh>
      <instancedMesh ref={inst(data.tall)} args={[undefined, undefined, data.tall.length]} castShadow receiveShadow>
        <boxGeometry /><meshStandardMaterial color={C.bldTall} roughness={1} />
      </instancedMesh>
      <instancedMesh ref={inst(data.trees)} args={[undefined, undefined, data.trees.length]} castShadow>
        <sphereGeometry args={[1, 16, 12]} /><meshStandardMaterial color={C.tree} roughness={1} />
      </instancedMesh>
    </group>
  );
};

// ---------- route ribbon: constant on-screen width, rounded joins, drawn on top ----------
const ribbon = (cam: THREE.PerspectiveCamera, len: number, px: number) => {
  const pts: THREE.Vector3[] = [];
  const corners: THREE.Vector3[] = [];
  let acc = 0;
  for (let s = 0; s < segLens.length && acc < len; s++) {
    const [ax, az] = ROUTE[s], [bx, bz] = ROUTE[s + 1];
    const take = Math.min(segLens[s], len - acc);
    const n = Math.max(2, Math.ceil(take / 0.5));
    for (let k = 0; k <= n; k++) {
      const t = (take / segLens[s]) * (k / n);
      pts.push(new THREE.Vector3(ax + (bx - ax) * t, 0.05, az + (bz - az) * t));
    }
    corners.push(new THREE.Vector3(ax, 0.05, az));
    acc += take;
    if (acc >= len) corners.push(pts[pts.length - 1].clone());
    pts.push(new THREE.Vector3(NaN, 0, 0)); // segment break
  }
  const pos: number[] = [];
  const half = (p: THREE.Vector3) => (worldPerPx(cam, p) * px) / 2;
  for (let k = 0; k < pts.length - 1; k++) {
    const a = pts[k], b = pts[k + 1];
    if (isNaN(a.x) || isNaN(b.x)) continue;
    const dir = b.clone().sub(a).normalize();
    const nrm = new THREE.Vector3(-dir.z, 0, dir.x);
    const a1 = a.clone().addScaledVector(nrm, half(a)), a2 = a.clone().addScaledVector(nrm, -half(a));
    const b1 = b.clone().addScaledVector(nrm, half(b)), b2 = b.clone().addScaledVector(nrm, -half(b));
    pos.push(...a1.toArray(), ...b1.toArray(), ...a2.toArray(), ...a2.toArray(), ...b1.toArray(), ...b2.toArray());
  }
  for (const c of corners) {
    const r = half(c);
    for (let k = 0; k < 20; k++) {
      const t0 = (k / 20) * Math.PI * 2, t1 = ((k + 1) / 20) * Math.PI * 2;
      pos.push(c.x, c.y, c.z, c.x + Math.cos(t1) * r, c.y, c.z + Math.sin(t1) * r, c.x + Math.cos(t0) * r, c.y, c.z + Math.sin(t0) * r);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  return g;
};

const disc = (c: THREE.Vector3, r: number, inner = 0) => {
  const g = inner > 0 ? new THREE.RingGeometry(inner, r, 48) : new THREE.CircleGeometry(r, 48);
  g.rotateX(-Math.PI / 2);
  g.translate(c.x, 0.06, c.z);
  return g;
};

const Scene: React.FC<{ f: number }> = ({ f }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const { pos, tgt } = camAt(f);
  camera.fov = FOV; camera.near = 0.5; camera.far = 900;
  camera.position.copy(pos); camera.lookAt(tgt); camera.updateProjectionMatrix();
  const cam = makeCam(f);

  const prog = f < 6 ? 0.07 : interpolate(f, [6, 96], [0.07, 1], { extrapolateRight: "clamp", easing: Easing.bezier(0.33, 0.05, 0.2, 1) });
  const len = TOTAL * prog;
  const casing = useMemo(() => ribbon(cam, len, 34), [f]);
  const line = useMemo(() => ribbon(cam, len, 22), [f]);

  const top = { depthTest: false, depthWrite: false } as const;

  return (
    <>
      <color attach="background" args={[C.haze]} />
      <fog attach="fog" args={[C.haze, 90, 300]} />
      <hemisphereLight args={["#ffffff", C.land, 1.25]} />
      <directionalLight position={[-50, 90, 35]} intensity={1.9} castShadow
        shadow-mapSize-width={4096} shadow-mapSize-height={4096} shadow-bias={-0.0004} shadow-radius={5}
        shadow-camera-left={-90} shadow-camera-right={90} shadow-camera-top={90} shadow-camera-bottom={-90} shadow-camera-far={300} />
      <City />
      <mesh geometry={casing} renderOrder={10}><meshBasicMaterial color="#ffffff" {...top} side={THREE.DoubleSide} /></mesh>
      <mesh geometry={line} renderOrder={11}><meshBasicMaterial color={C.route} {...top} side={THREE.DoubleSide} /></mesh>
    </>
  );
};

// ---------- 2D overlay pieces ----------
const halo = "0 0 3px #fff, 0 0 3px #fff, 0 0 6px #fff, 0 0 10px rgba(255,255,255,0.9)";

const Pin: React.FC<{ f: number; fps: number; x: number; y: number; place: string }> = ({ f, fps, x, y, place }) => {
  const t0 = 94;
  if (f < t0) return null;
  const fall = interpolate(f, [t0, t0 + 8], [-260, 0], { extrapolateRight: "clamp", easing: Easing.in(Easing.quad) });
  const sq = f >= t0 + 8 ? spring({ frame: f - t0 - 8, fps, config: { damping: 9, stiffness: 260, mass: 0.6 } }) : 0;
  const squash = f >= t0 + 8 ? 1 - 0.16 * Math.sin(Math.min(1, (f - t0 - 8) / 6) * Math.PI) * (1 - sq * 0.4) : 1;
  const lab = spring({ frame: f - (t0 + 13), fps, config: { damping: 10, stiffness: 220 } });
  const shadowS = interpolate(fall, [-260, 0], [0.4, 1]);
  return (
    <>
      <div style={{ position: "absolute", left: x - 26 * shadowS, top: y - 8, width: 52 * shadowS, height: 16, borderRadius: "50%", background: "rgba(18,20,23,0.22)", filter: "blur(3px)" }} />
      <svg width={84} height={112} viewBox="0 0 84 112" style={{ position: "absolute", left: x - 42, top: y - 108 + fall, transformOrigin: "50% 100%", transform: `scale(${2 - squash}, ${squash})`, overflow: "visible" }}>
        <path d="M42 108 C42 108 8 66 8 40 A34 34 0 1 1 76 40 C76 66 42 108 42 108 Z" fill={C.pin} stroke="#fff" strokeWidth={6} />
        <circle cx={42} cy={40} r={12} fill="#fff" />
      </svg>
      {f >= t0 + 13 && (
        <div style={{ position: "absolute", left: x, top: y - 196, transform: `translateX(-50%) scale(${lab})`, transformOrigin: "50% 100%", fontFamily, fontWeight: 700, fontSize: 46, color: C.pin, textShadow: halo, whiteSpace: "nowrap", letterSpacing: -0.5 }}>
          {place}
        </div>
      )}
    </>
  );
};

const Odometer: React.FC<{ value: number; size: number }> = ({ value, size }) => {
  const a = Math.ceil(value - 1e-6), frac = a - value; // counting down: new number drops in from above
  const style: React.CSSProperties = { position: "absolute", left: 0, right: 0, height: size, lineHeight: `${size}px` };
  return (
    <div style={{ position: "relative", height: size, overflow: "hidden", fontVariantNumeric: "tabular-nums", minWidth: size * 1.25 }}>
      <div style={{ ...style, top: frac * size }}>{a}</div>
      <div style={{ ...style, top: (frac - 1) * size }}>{a - 1}</div>
    </div>
  );
};

const TripCard: React.FC<{ f: number; fps: number; minutes: number; distance: string; place: string }> = ({ f, fps, minutes, distance, place }) => {
  const t0 = 112;
  if (f < t0) return null;
  const s = spring({ frame: f - t0, fps, config: { damping: 11, stiffness: 140, mass: 0.9 } });
  const y = interpolate(s, [0, 1], [520, 0]);
  const val = interpolate(f, [t0 + 4, t0 + 22], [minutes + 2, minutes], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <div style={{ position: "absolute", left: 48, right: 48, top: 1176, height: 330, transform: `translateY(${y}px)`, background: "#fff", borderRadius: 44, boxShadow: "0 18px 50px rgba(18,20,23,0.16), 0 2px 6px rgba(18,20,23,0.08)", padding: "40px 48px", boxSizing: "border-box", fontFamily, color: C.ink, display: "flex", alignItems: "center" }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 16, fontWeight: 800, fontSize: 120, letterSpacing: -5, lineHeight: 1 }}>
          <Odometer value={val} size={120} />
          <span style={{ fontSize: 64, letterSpacing: -2, paddingBottom: 10 }}>min</span>
        </div>
        <div style={{ marginTop: 18, fontWeight: 500, fontSize: 34, color: C.grey }}>
          {distance} · <span style={{ color: C.green, fontWeight: 600 }}>Fastest route</span>
        </div>
        <div style={{ marginTop: 6, fontWeight: 500, fontSize: 28, color: C.grey, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 600 }}>to {place}</div>
      </div>
      <div style={{ width: 176, height: 176, borderRadius: 88, background: C.route, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 52 }}>Go</div>
    </div>
  );
};

export const MapRoute: React.FC<MapRouteProps> = ({ place, minutes, distance }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cam = makeCam(f);
  const pinPt = project(cam, DEST);
  return (
    <AbsoluteFill style={{ background: C.haze }}>
      <ThreeCanvas width={W} height={H} shadows={{ type: THREE.PCFSoftShadowMap }} camera={{ fov: FOV, near: 0.5, far: 900 }} gl={{ antialias: true }}>
        <Scene f={f} />
      </ThreeCanvas>
      {LABELS.map((l) => {
        if (f < l.at) return null;
        const p = project(cam, l.pos);
        const s = spring({ frame: f - l.at, fps, config: { damping: 10, stiffness: 240 } });
        return (
          <div key={l.text} style={{ position: "absolute", left: p.x, top: p.y, transform: `translate(-50%,-50%) scale(${s})`, fontFamily, fontWeight: 600, fontSize: 30, color: C.grey, textShadow: halo, whiteSpace: "nowrap" }}>
            {l.text}
          </div>
        );
      })}
      {(() => {
        const d = project(cam, new THREE.Vector3(ROUTE[0][0], 0.05, ROUTE[0][1]));
        const pt = (f % 36) / 36;
        return (
          <>
            {f < 72 && <div style={{ position: "absolute", left: d.x, top: d.y, width: 40 + 150 * pt, height: 40 + 150 * pt, transform: "translate(-50%,-50%)", borderRadius: "50%", background: C.route, opacity: 0.3 * (1 - pt) }} />}
            <div style={{ position: "absolute", left: d.x, top: d.y, width: 46, height: 46, transform: "translate(-50%,-50%)", borderRadius: "50%", background: C.route, border: "8px solid #fff", boxShadow: "0 3px 10px rgba(18,20,23,0.25)" }} />
          </>
        );
      })()}
      <Pin f={f} fps={fps} x={pinPt.x} y={pinPt.y} place={place} />
      <TripCard f={f} fps={fps} minutes={minutes} distance={distance} place={place} />
    </AbsoluteFill>
  );
};
