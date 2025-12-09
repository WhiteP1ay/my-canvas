/**
 * 路径元素类（用于手绘笔触）
 */

import { BaseElement } from './BaseElement';
import { ElementType } from './types';
import type { Point, BoundingBox } from '@canvas/math';
import type { ElementStyle, Transform, ElementType as ElementTypeValue, IElement } from './types';
import { pointToLineDistance } from '@canvas/math';

export class Path extends BaseElement {
  public points: Point[];

  constructor(id: string, points: Point[], style?: ElementStyle) {
    // 计算路径的中心点作为 x, y
    const center = Path.calculateCenter(points);
    super(id, center.x, center.y, style);
    this.points = points;
  }

  get type(): ElementTypeValue {
    return ElementType.PATH;
  }

  /**
   * 计算点集的中心点
   */
  private static calculateCenter(points: Point[]): Point {
    if (points.length === 0) {
      return { x: 0, y: 0 };
    }
    const sum = points.reduce(
      (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
      { x: 0, y: 0 }
    );
    return {
      x: sum.x / points.length,
      y: sum.y / points.length,
    };
  }

  /**
   * 添加点到路径
   */
  addPoint(point: Point): void {
    this.points.push(point);
    // 更新中心点
    const center = Path.calculateCenter(this.points);
    this.x = center.x;
    this.y = center.y;
  }

  getBoundingBox(): BoundingBox {
    if (this.points.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    let minX = this.points[0].x;
    let minY = this.points[0].y;
    let maxX = this.points[0].x;
    let maxY = this.points[0].y;

    for (const point of this.points) {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }

    const strokeWidth = this.style.strokeWidth || 2;
    const padding = strokeWidth / 2;

    return {
      x: minX - padding,
      y: minY - padding,
      width: maxX - minX + padding * 2,
      height: maxY - minY + padding * 2,
    };
  }

  containsPoint(point: Point): boolean {
    // 对于路径，检查点是否在路径附近（容差范围内）
    const tolerance = (this.style.strokeWidth || 2) * 2;
    
    for (let i = 0; i < this.points.length - 1; i++) {
      const p1 = this.points[i];
      const p2 = this.points[i + 1];
      
      // 计算点到线段的距离
      const distance = pointToLineDistance(point, p1, p2);
      if (distance <= tolerance) {
        return true;
      }
    }
    
    return false;
  }

  render(ctx: CanvasRenderingContext2D, transform?: Transform): void {
    if (this.points.length < 2) {
      return;
    }

    ctx.save();

    // 应用样式
    if (this.style.opacity !== undefined) {
      ctx.globalAlpha = this.style.opacity;
    }

    // 应用变换
    if (transform) {
      ctx.translate(transform.translateX, transform.translateY);
      ctx.scale(transform.scaleX, transform.scaleY);
    }

    // 绘制路径
    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    
    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }

    // 设置样式
    if (this.style.strokeColor && this.style.strokeWidth) {
      ctx.strokeStyle = this.style.strokeColor;
      ctx.lineWidth = this.style.strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // 如果选中，使用更粗的描边
      if (this.selected) {
        ctx.lineWidth = (this.style.strokeWidth || 2) * 2;
        ctx.strokeStyle = '#f59e0b'; // 选中时使用橙色
      }
      
      ctx.stroke();
    }

    ctx.restore();
  }

  clone(): IElement {
    const cloned = new Path(
      this.id + '_clone',
      this.points.map(p => ({ ...p })),
      { ...this.style }
    );
    cloned.selected = this.selected;
    return cloned;
  }
}

