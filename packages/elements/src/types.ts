/**
 * 元素类型定义
 */

import type { Point, BoundingBox } from '@canvas/math';

/** 图形类型 */
export const ElementType = {
  RECTANGLE: 'rectangle',
  PATH: 'path',
} as const;

export type ElementType = typeof ElementType[keyof typeof ElementType];

/** 图形样式 */
export interface ElementStyle {
  /** 填充颜色 */
  fillColor?: string;
  /** 描边颜色 */
  strokeColor?: string;
  /** 描边宽度 */
  strokeWidth?: number;
  /** 透明度 (0-1) */
  opacity?: number;
}

/** 变换矩阵（用于缩放和平移） */
export interface Transform {
  /** X 轴缩放 */
  scaleX: number;
  /** Y 轴缩放 */
  scaleY: number;
  /** X 轴平移 */
  translateX: number;
  /** Y 轴平移 */
  translateY: number;
}

/** 基础元素接口 */
export interface IElement {
  /** 唯一标识符 */
  id: string;
  /** 元素类型 */
  type: ElementType;
  /** X 坐标 */
  x: number;
  /** Y 坐标 */
  y: number;
  /** 样式 */
  style: ElementStyle;
  /** 是否被选中 */
  selected?: boolean;
  /** 获取边界框 */
  getBoundingBox(): BoundingBox;
  /** 检查点是否在元素内 */
  containsPoint(point: Point): boolean;
  /** 渲染元素 */
  render(ctx: CanvasRenderingContext2D, transform?: Transform): void;
  /** 克隆元素 */
  clone(): IElement;
}

