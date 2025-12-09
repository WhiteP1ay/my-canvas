/**
 * 坐标变换工具
 */

import type { Point } from './point';
import type { BoundingBox } from './geometry';

export interface Transform {
  scaleX: number;
  scaleY: number;
  translateX: number;
  translateY: number;
}

/**
 * 应用变换到点坐标（画布坐标 → 屏幕坐标）
 */
export function applyTransform(point: Point, transform: Transform): Point {
  return {
    x: point.x * transform.scaleX + transform.translateX,
    y: point.y * transform.scaleY + transform.translateY,
  };
}

/**
 * 应用逆变换到点坐标（屏幕坐标 → 画布坐标）
 */
export function applyInverseTransform(
  point: Point,
  transform: Transform
): Point {
  return {
    x: (point.x - transform.translateX) / transform.scaleX,
    y: (point.y - transform.translateY) / transform.scaleY,
  };
}

/**
 * 变换边界框
 */
export function transformBounds(
  bounds: BoundingBox,
  transform: Transform
): BoundingBox {
  const topLeft = applyTransform({ x: bounds.x, y: bounds.y }, transform);
  const bottomRight = applyTransform(
    { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
    transform
  );

  return {
    x: topLeft.x,
    y: topLeft.y,
    width: bottomRight.x - topLeft.x,
    height: bottomRight.y - topLeft.y,
  };
}

