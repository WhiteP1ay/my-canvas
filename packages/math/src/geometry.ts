/**
 * 几何计算工具
 */

import type { Point } from './point';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 检查点是否在矩形内
 */
export function pointInRect(point: Point, rect: BoundingBox): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

/**
 * 检查两个矩形是否相交
 */
export function rectsIntersect(a: BoundingBox, b: BoundingBox): boolean {
  return !(
    a.x + a.width < b.x ||
    b.x + b.width < a.x ||
    a.y + a.height < b.y ||
    b.y + b.height < a.y
  );
}

/**
 * 检查矩形 a 是否包含矩形 b
 */
export function rectContains(
  container: BoundingBox,
  contained: BoundingBox
): boolean {
  return (
    container.x <= contained.x &&
    container.y <= contained.y &&
    container.x + container.width >= contained.x + contained.width &&
    container.y + container.height >= contained.y + contained.height
  );
}

/**
 * 扩展边界框（添加内边距）
 */
export function expandBounds(bounds: BoundingBox, padding: number): BoundingBox {
  return {
    x: bounds.x - padding,
    y: bounds.y - padding,
    width: bounds.width + padding * 2,
    height: bounds.height + padding * 2,
  };
}

/**
 * 合并多个边界框
 */
export function mergeBounds(boxes: BoundingBox[]): BoundingBox {
  if (boxes.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = boxes[0].x;
  let minY = boxes[0].y;
  let maxX = boxes[0].x + boxes[0].width;
  let maxY = boxes[0].y + boxes[0].height;

  for (let i = 1; i < boxes.length; i++) {
    const box = boxes[i];
    minX = Math.min(minX, box.x);
    minY = Math.min(minY, box.y);
    maxX = Math.max(maxX, box.x + box.width);
    maxY = Math.max(maxY, box.y + box.height);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

