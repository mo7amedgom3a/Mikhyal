"use client";
import dynamic from "next/dynamic";
import type { ComponentType } from "react";

const loading = () => <div className="aspect-[16/10] w-full animate-pulse rounded-[12px] bg-surface" />;

/**
 * Scene components the generated UI may reference by name. Each one is provided by a library in
 * /ai/libraries (svg-scenes, canvas-particles); the server rejects specs naming anything else.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const SCENES: Record<string, ComponentType<any>> = {
  atom_model: dynamic(() => import("./AtomModelScene").then((m) => m.AtomModelScene), { ssr: false, loading }),
  plum_pudding: dynamic(() => import("./PlumPuddingScene").then((m) => m.PlumPuddingScene), { ssr: false, loading }),
  energy_levels: dynamic(() => import("./EnergyLevelsScene").then((m) => m.EnergyLevelsScene), { ssr: false, loading }),
  model_gallery: dynamic(() => import("./ModelGalleryScene").then((m) => m.ModelGalleryScene), { ssr: false, loading }),
  // three.js scenes: separate chunks, loaded only when a spec uses them.
  atom_3d: dynamic(() => import("./three/Atom3DScene").then((m) => m.Atom3DScene), { ssr: false, loading }),
  nucleus_3d: dynamic(() => import("./three/Nucleus3DScene").then((m) => m.Nucleus3DScene), { ssr: false, loading }),
  copper_zoom: dynamic(() => import("./three/CopperZoomScene").then((m) => m.CopperZoomScene), { ssr: false, loading }),
  rutherford_scattering: dynamic(() => import("./RutherfordScene").then((m) => m.RutherfordScene), { ssr: false, loading }),
};
