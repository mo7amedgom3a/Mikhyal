import { Cable, CarFront, Droplets, Lightbulb, MoveUpRight, Package, Rocket, Route, Scale, Triangle, Truck, type LucideIcon, type LucideProps } from "lucide-react";

export const MISSION_ICONS: Record<string, LucideIcon> = { CarFront, Truck, Route, Lightbulb, Droplets, Rocket, Triangle, MoveUpRight, Cable, Scale, Package };

export function MissionIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = MISSION_ICONS[name] ?? Lightbulb;
  return <Icon aria-hidden {...props} />;
}
