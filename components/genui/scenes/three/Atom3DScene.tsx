"use client";
import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { Group } from "three";
import { usePrefersReducedMotion } from "@/components/sims/useSimClock";
import { AtomModelScene } from "../AtomModelScene";
import { COLORS, Legend, NoWebGL, cloudPoints, nucleonRadius, packNucleus, useWebGL } from "./common";

const R_ATOM = 3;

function Nucleus({ Z, N, radius }: { Z: number; N: number; radius: number }) {
  const parts = useMemo(() => packNucleus(Z, N, radius), [Z, N, radius]);
  const r = nucleonRadius(Z + N, radius);
  return (
    <group>
      {parts.map((p, i) => (
        <mesh key={i} position={p.pos}>
          <sphereGeometry args={[r, 16, 12]} />
          <meshStandardMaterial color={p.kind === "p" ? COLORS.proton : COLORS.neutron} roughness={0.45} />
        </mesh>
      ))}
    </group>
  );
}

function Shell({ radius, count, tilt, speed, highlightLast }: { radius: number; count: number; tilt: [number, number]; speed: number; highlightLast?: boolean }) {
  const g = useRef<Group>(null);
  useFrame((_, dt) => {
    if (g.current) g.current.rotation.y += dt * speed;
  });
  const shown = Math.min(count, 32);
  return (
    <group rotation={[tilt[0], 0, tilt[1]]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.008, 6, 96]} />
        <meshBasicMaterial color="#94a3b8" transparent opacity={0.6} />
      </mesh>
      <group ref={g}>
        {Array.from({ length: shown }).map((_, k) => {
          const a = (k / shown) * Math.PI * 2;
          return (
            <mesh key={k} position={[radius * Math.cos(a), 0, radius * Math.sin(a)]}>
              <sphereGeometry args={[0.07, 12, 8]} />
              <meshStandardMaterial color={highlightLast && k === shown - 1 ? COLORS.highlight : COLORS.electron} emissive={COLORS.electron} emissiveIntensity={0.25} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

function Cloud({ shells }: { shells: number[] }) {
  const pts = useMemo(() => cloudPoints(shells, (i) => (R_ATOM * (i + 1)) / (shells.length + 0.4), Math.max(40, Math.round(2600 / Math.max(1, shells.reduce((a, b) => a + b, 0))))), [shells]);
  const g = useRef<Group>(null);
  useFrame((_, dt) => {
    if (g.current) g.current.rotation.y += dt * 0.08;
  });
  return (
    <group ref={g}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[pts, 3]} />
        </bufferGeometry>
        <pointsMaterial color={COLORS.electron} size={0.055} transparent opacity={0.7} depthWrite={false} />
      </points>
    </group>
  );
}

function Spin({ children, active }: { children: React.ReactNode; active: boolean }) {
  const g = useRef<Group>(null);
  useFrame((_, dt) => {
    if (active && g.current) g.current.rotation.y += dt * 0.25;
  });
  return <group ref={g}>{children}</group>;
}

/**
 * The atom in 3D from data: a dense nucleus (Z protons, N neutrons) and electrons either on Bohr
 * shells or as a probability cloud. The nucleus is drawn magnified by 10^zoomExp; at 1× it is
 * its true size relative to the atom (rN/rA) — far too small to see.
 */
export function Atom3DScene({ Z = 6, N = 6, shells = [2, 4], symbol = "C", view = "cloud", zoomExp = 4, rA = 67, rN = 2.75 }: { Z?: number; N?: number; shells?: number[]; symbol?: string; view?: string; zoomExp?: number; rA?: number; rN?: number }) {
  const gl = useWebGL();
  const reduced = usePrefersReducedMotion();
  const list = Array.isArray(shells) ? shells.map(Number) : [];
  const trueR = (R_ATOM * Number(rN)) / (Number(rA) * 1000);
  const shownR = Math.min(0.9, trueR * 10 ** Number(zoomExp));
  const capped = trueR * 10 ** Number(zoomExp) > 0.9;
  if (gl === false) return <NoWebGL><AtomModelScene Z={Z} N={N} shells={list} symbol={symbol} /></NoWebGL>;
  return (
    <div className="relative aspect-[16/10] w-full" data-scene="atom_3d" data-view={view}>
      {gl && (
        <Canvas camera={{ position: [0, 2.2, 7], fov: 45 }} dpr={[1, 2]} frameloop={reduced ? "demand" : "always"} aria-label={`ذرة ${symbol} ثلاثية الأبعاد`}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[4, 6, 5]} intensity={1.4} />
          <Spin active={!reduced}>
            {shownR > 0.004 ? (
              <Nucleus Z={Number(Z)} N={Number(N)} radius={shownR} />
            ) : (
              <mesh>
                <sphereGeometry args={[0.012, 8, 6]} />
                <meshBasicMaterial color={COLORS.proton} />
              </mesh>
            )}
          </Spin>
          {view === "orbits"
            ? list.map((count, i) => <Shell key={i} radius={(R_ATOM * (i + 1)) / (list.length + 0.4)} count={count} tilt={[0.35 * Math.sin(i * 2.1), 0.5 * Math.cos(i * 1.3)]} speed={reduced ? 0 : 0.9 / (i + 1)} highlightLast={i === list.length - 1 && count === 1} />)
            : <Cloud shells={list} />}
          <OrbitControls enablePan={false} minDistance={1.2} maxDistance={14} />
        </Canvas>
      )}
      <Legend
        items={[
          { color: COLORS.proton, label: `بروتون + (${Z})` },
          { color: COLORS.neutron, label: `نيوترون 0 (${N})` },
          { color: COLORS.electron, label: `إلكترون − (${Z})` },
        ]}
      />
      <p dir="rtl" className="pointer-events-none absolute bottom-2 start-2 end-2 text-center text-xs text-ink-3">
        {shownR <= 0.004 ? "النواة بحجمها الحقيقي: أصغر من إنها تبان! كبّرها من المنزلق." : capped ? "النواة متكبّرة جدًا عشان تبان — في الحقيقة أصغر بكتير." : `النواة متكبّرة ${Math.round(10 ** Number(zoomExp)).toLocaleString("en")}×`} · اسحب عشان تلف الذرة
      </p>
    </div>
  );
}
