"use client";
import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { InstancedMesh, Object3D, type Group, type Material, type Mesh, type Points } from "three";
import { usePrefersReducedMotion } from "@/components/sims/useSimClock";
import { rng } from "@/lib/workbench/algebra";
import { AtomModelScene } from "../AtomModelScene";
import { COLORS, Legend, NoWebGL, nucleonRadius, packNucleus, useWebGL } from "./common";

interface Level {
  key: string;
  title: string;
  caption: string;
  sizeM: number;
  scaleLabel: string;
}

/** Fades and scales a level's group as the zoom progress passes it (zooming "through" it). */
function Stage({ index, progress, children }: { index: number; progress: React.RefObject<number>; children: React.ReactNode }) {
  const g = useRef<Group>(null);
  useFrame(() => {
    const d = (progress.current ?? 0) - index;
    const grp = g.current;
    if (!grp) return;
    grp.visible = Math.abs(d) < 0.98;
    grp.scale.setScalar(Math.pow(12, d));
    const op = Math.max(0, 1 - Math.abs(d) * 1.1);
    grp.traverse((o) => {
      const m = (o as Mesh).material as Material | undefined;
      if (m) {
        m.transparent = true;
        m.opacity = op * ((m.userData.baseOpacity as number | undefined) ?? 1);
      }
    });
  });
  return <group ref={g}>{children}</group>;
}

function Wire() {
  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      <mesh>
        <cylinderGeometry args={[0.55, 0.55, 7, 48]} />
        <meshStandardMaterial color={COLORS.copper} metalness={0.85} roughness={0.28} />
      </mesh>
      <mesh position={[0, -2.8, 0]}>
        <cylinderGeometry args={[0.75, 0.75, 2.2, 48, 1, true]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} side={2} />
      </mesh>
      <mesh position={[0, 0, 0.56]}>
        <sphereGeometry args={[0.08, 16, 12]} />
        <meshBasicMaterial color={COLORS.highlight} />
      </mesh>
    </group>
  );
}

function Crystal({ animate }: { animate: boolean }) {
  const cells = 3;
  const atoms = useMemo(() => {
    const set = new Map<string, [number, number, number]>();
    const basis = [
      [0, 0, 0],
      [0.5, 0.5, 0],
      [0.5, 0, 0.5],
      [0, 0.5, 0.5],
    ];
    for (let i = 0; i <= cells; i++)
      for (let j = 0; j <= cells; j++)
        for (let k = 0; k <= cells; k++)
          for (const [a, b, c] of basis) {
            const p: [number, number, number] = [i + a, j + b, k + c];
            if (p.some((v) => v > cells)) continue;
            set.set(p.join(","), p);
          }
    return [...set.values()].map(([x, y, z]) => [x - cells / 2, y - cells / 2, z - cells / 2] as [number, number, number]);
  }, []);
  const inst = useRef<InstancedMesh>(null);
  useEffect(() => {
    const o = new Object3D();
    atoms.forEach((p, i) => {
      o.position.set(...p);
      o.updateMatrix();
      inst.current?.setMatrixAt(i, o.matrix);
    });
    if (inst.current) inst.current.instanceMatrix.needsUpdate = true;
  }, [atoms]);
  // Free electrons (one per atom in reality; a sample here) drifting between the ions.
  const free = useMemo(() => {
    const r = rng(29);
    return Float32Array.from({ length: 160 * 3 }, () => (r() - 0.5) * cells);
  }, []);
  const pts = useRef<Points>(null);
  const t = useRef(0);
  useFrame((_, dt) => {
    if (!animate || !pts.current) return;
    t.current += dt;
    const a = pts.current.geometry.attributes.position;
    for (let i = 0; i < a.count; i++) {
      let x = a.getX(i) + dt * 0.45 + Math.sin(t.current * 3 + i) * dt * 0.6;
      if (x > cells / 2) x -= cells;
      a.setX(i, x);
      a.setY(i, a.getY(i) + Math.cos(t.current * 2.3 + i * 1.7) * dt * 0.4);
    }
    a.needsUpdate = true;
  });
  return (
    <group rotation={[0.45, 0.6, 0]} scale={0.95}>
      <instancedMesh ref={inst} args={[undefined, undefined, atoms.length]}>
        <sphereGeometry args={[0.24, 20, 14]} />
        <meshStandardMaterial color={COLORS.copper} metalness={0.6} roughness={0.35} />
      </instancedMesh>
      <points ref={pts}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[free, 3]} />
        </bufferGeometry>
        <pointsMaterial color={COLORS.free} size={0.14} />
      </points>
    </group>
  );
}

function CuAtom({ shells, Z, N, animate }: { shells: number[]; Z: number; N: number; animate: boolean }) {
  const g = useRef<Group>(null);
  useFrame((_, dt) => {
    if (animate && g.current) g.current.children.forEach((c, i) => (c.rotation.y += dt * (0.8 / (i + 1))));
  });
  const nuc = useMemo(() => packNucleus(Z, N, 0.22), [Z, N]);
  return (
    <group rotation={[0.35, 0, 0.1]}>
      {nuc.map((p, i) => (
        <mesh key={i} position={p.pos}>
          <sphereGeometry args={[nucleonRadius(Z + N, 0.22), 10, 8]} />
          <meshStandardMaterial color={p.kind === "p" ? COLORS.proton : COLORS.neutron} />
        </mesh>
      ))}
      <group ref={g}>
        {shells.map((count, i) => {
          const r = 0.7 + i * 0.75;
          return (
            <group key={i} rotation={[0.3 * Math.sin(i * 2), 0, 0.3 * Math.cos(i * 1.4)]}>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[r, 0.008, 6, 96]} />
                <meshBasicMaterial color="#94a3b8" />
              </mesh>
              {Array.from({ length: count }).map((_, k) => {
                const a = (k / count) * Math.PI * 2;
                const lone = i === shells.length - 1 && count === 1;
                return (
                  <mesh key={k} position={[r * Math.cos(a), 0, r * Math.sin(a)]}>
                    <sphereGeometry args={[lone ? 0.11 : 0.065, 12, 8]} />
                    <meshStandardMaterial color={lone ? COLORS.highlight : COLORS.electron} emissive={lone ? COLORS.highlight : COLORS.electron} emissiveIntensity={lone ? 0.6 : 0.2} />
                  </mesh>
                );
              })}
            </group>
          );
        })}
      </group>
    </group>
  );
}

function CuNucleus({ Z, N, animate }: { Z: number; N: number; animate: boolean }) {
  const parts = useMemo(() => packNucleus(Z, N, 1.9), [Z, N]);
  const g = useRef<Group>(null);
  useFrame((_, dt) => {
    if (animate && g.current) g.current.rotation.y += dt * 0.3;
  });
  return (
    <group ref={g}>
      {parts.map((p, i) => (
        <mesh key={i} position={p.pos}>
          <sphereGeometry args={[nucleonRadius(Z + N, 1.9), 18, 14]} />
          <meshStandardMaterial color={p.kind === "p" ? COLORS.proton : COLORS.neutron} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function Progress({ target, progress, animate }: { target: number; progress: React.RefObject<number>; animate: boolean }) {
  useFrame((_, dt) => {
    const p = progress.current ?? 0;
    progress.current = animate ? p + (target - p) * Math.min(1, dt * 2.5) : target;
  });
  return null;
}

/** Zoom from a copper wire into its crystal, one atom, and finally the nucleus — all from the Cu record. */
export function CopperZoomScene({
  level = 0,
  levels = [],
  shells = [2, 8, 18, 1],
  Z = 29,
  N = 34,
}: {
  level?: number;
  levels?: Level[];
  latticePm?: number;
  shells?: number[];
  Z?: number;
  N?: number;
}) {
  const gl = useWebGL();
  const reduced = usePrefersReducedMotion();
  const progress = useRef(Number(level));
  const L = Math.max(0, Math.min(3, Math.round(Number(level))));
  const info = levels[L];
  if (gl === false)
    return (
      <NoWebGL>
        <AtomModelScene Z={Number(Z)} N={Number(N)} shells={shells} symbol="Cu" />
      </NoWebGL>
    );
  return (
    <div data-scene="copper_zoom" data-level={L}>
      <div className="relative aspect-[16/10] w-full bg-slate-950">
        {gl && (
          <Canvas camera={{ position: [0, 0, 7.5], fov: 45 }} dpr={[1, 2]}>
            <color attach="background" args={["#0b1020"]} />
            <ambientLight intensity={0.55} />
            <directionalLight position={[4, 5, 6]} intensity={1.6} />
            <pointLight position={[-4, -2, 3]} intensity={10} color="#fde68a" />
            <Progress target={L} progress={progress} animate={!reduced} />
            <Stage index={0} progress={progress}>
              <Wire />
            </Stage>
            <Stage index={1} progress={progress}>
              <Crystal animate={!reduced} />
            </Stage>
            <Stage index={2} progress={progress}>
              <CuAtom shells={shells.map(Number)} Z={Number(Z)} N={Number(N)} animate={!reduced} />
            </Stage>
            <Stage index={3} progress={progress}>
              <CuNucleus Z={Number(Z)} N={Number(N)} animate={!reduced} />
            </Stage>
            <OrbitControls enablePan={false} enableZoom={false} />
          </Canvas>
        )}
        {L >= 1 && (
          <Legend
            items={
              L === 1
                ? [
                    { color: COLORS.copper, label: "أيون نحاس (+)" },
                    { color: COLORS.free, label: "إلكترون حر" },
                  ]
                : L === 2
                  ? [
                      { color: COLORS.proton, label: "النواة (+29)" },
                      { color: COLORS.electron, label: "إلكترون" },
                      { color: COLORS.highlight, label: "إلكترون 4s الحر" },
                    ]
                  : [
                      { color: COLORS.proton, label: `${Z} بروتون` },
                      { color: COLORS.neutron, label: `${N} نيوترون` },
                    ]
            }
          />
        )}
      </div>
      {info && (
        <div dir="rtl" className="bg-slate-900 px-3 py-2 text-white" data-zoom-caption>
          <div className="flex items-center justify-between gap-2">
            <p className="font-bold">{info.title}</p>
            <span className="flex items-center gap-1.5 text-xs" dir="ltr">
              <span className="inline-block h-1 w-10 rounded bg-white" /> {info.scaleLabel}
            </span>
          </div>
          <p className="text-xs leading-5 text-slate-200">{info.caption}</p>
        </div>
      )}
    </div>
  );
}
