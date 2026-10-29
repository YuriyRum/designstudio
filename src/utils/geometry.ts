import { CanvasElement, GuideLine } from '../types/canvas';

export type HandleType = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'rotate';

export interface SnapResult {
  x: number;
  y: number;
  guides: GuideLine[];
}

export function calculateSnapping(
  currentElement: CanvasElement,
  allElements: CanvasElement[],
  canvasWidth: number,
  canvasHeight: number,
  snapThreshold: number = 6
): SnapResult {
  let snapX = currentElement.x;
  let snapY = currentElement.y;
  const width = currentElement.width;
  const height = currentElement.height;
  const guides: GuideLine[] = [];

  const currLeft = snapX;
  const currCenterX = snapX + width / 2;
  const currRight = snapX + width;

  const currTop = snapY;
  const currCenterY = snapY + height / 2;
  const currBottom = snapY + height;

  // 1. Snap to Canvas Center & Bounds
  // Horizontal center of canvas
  const canvasCenterX = canvasWidth / 2;
  if (Math.abs(currCenterX - canvasCenterX) <= snapThreshold) {
    snapX = canvasCenterX - width / 2;
    guides.push({ type: 'vertical', position: canvasCenterX });
  } else if (Math.abs(currLeft) <= snapThreshold) {
    snapX = 0;
    guides.push({ type: 'vertical', position: 0 });
  } else if (Math.abs(currRight - canvasWidth) <= snapThreshold) {
    snapX = canvasWidth - width;
    guides.push({ type: 'vertical', position: canvasWidth });
  }

  // Vertical center of canvas
  const canvasCenterY = canvasHeight / 2;
  if (Math.abs(currCenterY - canvasCenterY) <= snapThreshold) {
    snapY = canvasCenterY - height / 2;
    guides.push({ type: 'horizontal', position: canvasCenterY });
  } else if (Math.abs(currTop) <= snapThreshold) {
    snapY = 0;
    guides.push({ type: 'horizontal', position: 0 });
  } else if (Math.abs(currBottom - canvasHeight) <= snapThreshold) {
    snapY = canvasHeight - height;
    guides.push({ type: 'horizontal', position: canvasHeight });
  }

  // 2. Snap to other elements (only if not already snapped)
  for (const other of allElements) {
    if (other.id === currentElement.id || other.hidden) continue;

    const oLeft = other.x;
    const oCenterX = other.x + other.width / 2;
    const oRight = other.x + other.width;
    const oTop = other.y;
    const oCenterY = other.y + other.height / 2;
    const oBottom = other.y + other.height;

    // Check X snap points: Left to Left, Center to Center, Right to Right
    if (Math.abs(currCenterX - oCenterX) <= snapThreshold) {
      snapX = oCenterX - width / 2;
      guides.push({ type: 'vertical', position: oCenterX });
    } else if (Math.abs(currLeft - oLeft) <= snapThreshold) {
      snapX = oLeft;
      guides.push({ type: 'vertical', position: oLeft });
    } else if (Math.abs(currRight - oRight) <= snapThreshold) {
      snapX = oRight - width;
      guides.push({ type: 'vertical', position: oRight });
    }

    // Check Y snap points: Top to Top, Center to Center, Bottom to Bottom
    if (Math.abs(currCenterY - oCenterY) <= snapThreshold) {
      snapY = oCenterY - height / 2;
      guides.push({ type: 'horizontal', position: oCenterY });
    } else if (Math.abs(currTop - oTop) <= snapThreshold) {
      snapY = oTop;
      guides.push({ type: 'horizontal', position: oTop });
    } else if (Math.abs(currBottom - oBottom) <= snapThreshold) {
      snapY = oBottom - height;
      guides.push({ type: 'horizontal', position: oBottom });
    }
  }

  return { x: snapX, y: snapY, guides };
}

export function rotatePoint(x: number, y: number, cx: number, cy: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const nx = cos * (x - cx) - sin * (y - cy) + cx;
  const ny = sin * (x - cx) + cos * (y - cy) + cy;
  return { x: nx, y: ny };
}

export function fitCanvasToViewport(
  canvasWidth: number,
  canvasHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  padding: number = 80
): number {
  const availW = Math.max(viewportWidth - padding, 200);
  const availH = Math.max(viewportHeight - padding, 200);
  const scaleW = availW / canvasWidth;
  const scaleH = availH / canvasHeight;
  const fitScale = Math.min(scaleW, scaleH);
  // Round to clean percentage
  return Math.max(0.1, Math.min(fitScale, 3.0));
}
