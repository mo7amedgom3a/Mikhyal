import { Eye, Gauge, GitBranch, Grid3x3, Layers, Lightbulb, ListChecks, MessageCircleHeart, Network, Rocket, RotateCcw, Sigma, SlidersHorizontal, Sparkles, TriangleAlert, Waypoints, type LucideIcon, type LucideProps } from "lucide-react";

const ICONS: Record<string, LucideIcon> = { Eye, Gauge, GitBranch, Grid3x3, Layers, Lightbulb, ListChecks, MessageCircleHeart, Network, Rocket, RotateCcw, Sigma, SlidersHorizontal, TriangleAlert, Waypoints };

export function FeatureIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = ICONS[name] ?? Sparkles;
  return <Icon aria-hidden {...props} />;
}
