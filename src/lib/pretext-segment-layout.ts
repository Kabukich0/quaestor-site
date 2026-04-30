import {
  layoutNextLineRange,
  materializeLineRange,
  type LayoutCursor,
  type PreparedTextWithSegments,
} from "@chenglou/pretext";

export interface ObstacleRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SegmentLine {
  x: number;
  y: number;
  width: number;
  text: string;
  paragraphIndex: number;
  lastInParagraph: boolean;
}

interface Slot {
  left: number;
  right: number;
}

export interface PreparedParagraph {
  prepared: PreparedTextWithSegments;
  paragraphIndex: number;
}

const MIN_SLOT_WIDTH = 96;

export function carveSlots(base: Slot, blocked: Slot[]): Slot[] {
  let slots = [base];
  for (const block of blocked) {
    const next: Slot[] = [];
    for (const slot of slots) {
      if (block.right <= slot.left || block.left >= slot.right) {
        next.push(slot);
        continue;
      }
      if (block.left > slot.left) next.push({ left: slot.left, right: block.left });
      if (block.right < slot.right) next.push({ left: block.right, right: slot.right });
    }
    slots = next;
  }
  return slots.filter((slot) => slot.right - slot.left >= MIN_SLOT_WIDTH);
}

export function obstacleSlotsForLine(
  columnWidth: number,
  y: number,
  lineHeight: number,
  obstacles: ObstacleRect[],
): Slot[] {
  const blocked: Slot[] = [];
  for (const obstacle of obstacles) {
    if (y + lineHeight <= obstacle.y || y >= obstacle.y + obstacle.h) continue;
    blocked.push({
      left: Math.max(0, obstacle.x - 14),
      right: Math.min(columnWidth, obstacle.x + obstacle.w + 14),
    });
  }
  blocked.sort((a, b) => a.left - b.left);
  return carveSlots({ left: 0, right: columnWidth }, blocked);
}

export function layoutSegmentedParagraphs(params: {
  paragraphs: PreparedParagraph[];
  columnWidth: number;
  lineHeight: number;
  paragraphGap: number;
  obstacles: ObstacleRect[];
  maxHeight: number;
}): SegmentLine[] {
  const lines: SegmentLine[] = [];
  let y = 0;

  for (const paragraph of params.paragraphs) {
    let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };
    while (y + params.lineHeight <= params.maxHeight) {
      const slots = obstacleSlotsForLine(
        params.columnWidth,
        y,
        params.lineHeight,
        params.obstacles,
      );
      if (!slots.length) {
        y += params.lineHeight;
        continue;
      }

      let paragraphDone = false;
      for (const slot of slots) {
        const range = layoutNextLineRange(
          paragraph.prepared,
          cursor,
          Math.max(1, slot.right - slot.left),
        );
        if (range === null) {
          paragraphDone = true;
          break;
        }
        const line = materializeLineRange(paragraph.prepared, range);
        const nextIsDone = range.end.segmentIndex >= paragraph.prepared.segments.length;
        lines.push({
          x: Math.round(slot.left),
          y: Math.round(y),
          width: Math.round(slot.right - slot.left),
          text: line.text,
          paragraphIndex: paragraph.paragraphIndex,
          lastInParagraph: nextIsDone,
        });
        cursor = range.end;
        if (nextIsDone) {
          paragraphDone = true;
          break;
        }
      }

      y += params.lineHeight;
      if (paragraphDone) break;
    }
    y += params.paragraphGap;
  }

  return lines;
}
