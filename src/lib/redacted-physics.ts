export interface RedactedBlockState {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  targetVx: number;
  targetVy: number;
  nextTurnAt: number;
}

export interface Bounds {
  width: number;
  height: number;
}

export interface PointerPoint {
  x: number;
  y: number;
  active: boolean;
}

function rand(seed: number) {
  const x = Math.sin(seed * 999) * 10000;
  return x - Math.floor(x);
}

export function createInitialBlocks(width: number, height: number): RedactedBlockState[] {
  const specs = [
    { w: 168, h: 34, x: 0.16, y: 0.22 },
    { w: 112, h: 28, x: 0.63, y: 0.35 },
    { w: 214, h: 42, x: 0.28, y: 0.57 },
    { w: 92, h: 26, x: 0.72, y: 0.68 },
  ];
  return specs.map((s, id) => ({
    id,
    w: s.w,
    h: s.h,
    x: Math.max(0, Math.min(width - s.w, width * s.x)),
    y: Math.max(0, Math.min(height - s.h, height * s.y)),
    vx: (rand(id + 1) - 0.5) * 0.45,
    vy: (rand(id + 2) - 0.5) * 0.45,
    targetVx: (rand(id + 3) - 0.5) * 0.45,
    targetVy: (rand(id + 4) - 0.5) * 0.45,
    nextTurnAt: 4000 + rand(id + 5) * 3000,
  }));
}

export function stepBlocks(
  blocks: RedactedBlockState[],
  bounds: Bounds,
  pointer: PointerPoint,
  now: number,
  reducedMotion: boolean,
): RedactedBlockState[] {
  if (reducedMotion) return blocks;
  return blocks.map((block) => {
    let { x, y, vx, vy, targetVx, targetVy, nextTurnAt } = block;
    if (now >= nextTurnAt) {
      const a = rand(now * 0.001 + block.id * 11) * Math.PI * 2;
      const mag = rand(now * 0.002 + block.id * 17) * 0.4;
      targetVx = Math.cos(a) * mag;
      targetVy = Math.sin(a) * mag;
      nextTurnAt = now + 4000 + rand(now * 0.003 + block.id * 23) * 3000;
    }

    vx += (targetVx - vx) * 0.02;
    vy += (targetVy - vy) * 0.02;

    if (pointer.active) {
      const cx = x + block.w / 2;
      const cy = y + block.h / 2;
      const dx = cx - pointer.x;
      const dy = cy - pointer.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0.001 && dist < 100) {
        const force = (1 - dist / 100) * 0.3;
        vx += (dx / dist) * force;
        vy += (dy / dist) * force;
      }
    }

    const speed = Math.sqrt(vx * vx + vy * vy);
    if (speed > 0.55) {
      vx = (vx / speed) * 0.55;
      vy = (vy / speed) * 0.55;
    }

    x += vx;
    y += vy;

    if (x < 0) {
      x = 0;
      vx = Math.abs(vx) * 0.75;
      targetVx = Math.abs(targetVx);
    }
    if (x + block.w > bounds.width) {
      x = bounds.width - block.w;
      vx = -Math.abs(vx) * 0.75;
      targetVx = -Math.abs(targetVx);
    }
    if (y < 0) {
      y = 0;
      vy = Math.abs(vy) * 0.75;
      targetVy = Math.abs(targetVy);
    }
    if (y + block.h > bounds.height) {
      y = bounds.height - block.h;
      vy = -Math.abs(vy) * 0.75;
      targetVy = -Math.abs(targetVy);
    }

    return { ...block, x, y, vx, vy, targetVx, targetVy, nextTurnAt };
  });
}
