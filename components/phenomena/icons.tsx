import { Magnet, Orbit, Rocket, Shuffle, Snowflake, Sun, Thermometer, Waves, Waypoints, Atom, type LucideIcon, type LucideProps } from "lucide-react";

const ICONS: Record<string, LucideIcon> = { Magnet, Waypoints, Sun, Thermometer, Snowflake, Shuffle, Waves, Orbit, Rocket };

export function PhenomenonIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = ICONS[name] ?? Atom;
  return <Icon aria-hidden {...props} />;
}
