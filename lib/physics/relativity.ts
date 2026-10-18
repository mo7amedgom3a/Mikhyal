/** Special relativity time dilation: Δt = γ Δt₀, γ = 1 / √(1 − v²/c²). β = v/c. */

export function gamma(beta: number): number {
  if (beta >= 1) return Infinity;
  return 1 / Math.sqrt(1 - beta * beta);
}

export function dilatedTime(properTime: number, beta: number): number {
  return gamma(beta) * properTime;
}

export function betaForGamma(g: number): number {
  return Math.sqrt(1 - 1 / (g * g));
}
