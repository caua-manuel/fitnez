// Descanso por carimbo: o tempo restante sai sempre de endsAt e do relógio, nunca de contagem de ticks.
export function restRemaining(endsAt: number, now: number): number {
 return Math.max(0, Math.ceil((endsAt - now) / 1000));
}

export function adjustRest(endsAt: number, deltaSec: number, now: number): number {
 return Math.max(now, endsAt + deltaSec * 1000);
}
