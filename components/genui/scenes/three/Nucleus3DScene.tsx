"use client";
import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { Group } from "three";
import { usePrefersReducedMotion } from "@/components/sims/useSimClock";
import { AtomModelScene } from "../AtomModelScene";
import { COLORS, Legend, NoWebGL, nucleonRadius, packNucleus, useWebGL } from "./common";

function Packed({ Z, N, spin }: { Z: number; N: number; spin: boolean }) {
  const A = Z + N;
  // Real nuclear radius grows as A^(1/3): keep that scaling on screen (He ≈ 0.95, Au ≈ 3.5 units).
  const R = 0.6 * Math.cbrt(A);
  const parts = useMemo(() => packNucleus(Z, N, R), [Z, N, R]);
  const r = nucleonRadius(A, R);
  const g = useRef<Group>(null);
  useFrame((_, dt) => {
    if (spin && g.current) g.current.rotation.y += dt * 0.3;
  });
  return (
    <group ref={g}>
      {parts.map((p, i) => (
        <mesh key={i} position={p.pos}>
          <sphereGeometry args={[r, 18, 14]} />
          <meshStandardMaterial color={p.kind === "p" ? COLORS.proton : COLORS.neutron} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

/** A nucleus up close: Z protons and N neutrons packed together; size follows 1.2·A^⅓ fm. */
export function Nucleus3DScene({ Z = 29, N = 34, symbol = "Cu" }: { Z?: number; N?: number; symbol?: string }) {
  const gl = useWebGL();
  const reduced = usePrefersReducedMotion();
  const z = Number(Z);
  const n = Number(N);
  if (gl === false) return <NoWebGL><AtomModelScene Z={z} N={n} shells={[]} symbol={String(symbol)} /></NoWebGL>;
  return (
    <div className="relative aspect-[16/10] w-full" data-scene="nucleus_3d">
      {gl && (
        <Canvas camera={{ position: [0, 1.5, 9], fov: 45 }} dpr={[1, 2]} frameloop={reduced ? "demand" : "always"}>
          <ambientLight intensity={0.55} />
          <directionalLight position={[5, 6, 4]} intensity={1.5} />
          <pointLight position={[-5, -3, 2]} intensity={12} color="#fde68a" />
          <Packed Z={z} N={n} spin={!reduced} />
          <OrbitControls enablePan={false} minDistance={3} maxDistance={18} />
        </Canvas>
      )}
      <Legend
        items={[
          { color: COLORS.proton, label: `${z} بروتون (+)` },
          { color: COLORS.neutron, label: `${n} نيوترون (0)` },
        ]}
      />
      <p dir="rtl" className="pointer-events-none absolute bottom-2 start-2 end-2 text-center text-xs text-ink-3">
        نواة {symbol}: قطرها حوالي {(2 * 1.2 * Math.cbrt(z + n)).toFixed(1)} فمتومتر (10⁻¹⁵ m) · اسحب عشان تلفّها
      </p>
    </div>
  );
}
