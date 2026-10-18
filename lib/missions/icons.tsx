import { CarFront, Droplets, Lightbulb, Rocket, Route, Truck, type LucideIcon, type LucideProps } from "lucide-react";

export const MISSION_ICONS: Record<string, LucideIcon> = { CarFront, Truck, Route, Lightbulb, Droplets, Rocket };

export function MissionIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = MISSION_ICONS[name] ?? Lightbulb;
  return <Icon aria-hidden {...props} />;
}
