/**
 * 矩形元素类
 */

import { BaseElement } from './BaseElement';
import { ElementType } from './types';
import type { Point, BoundingBox } from '@canvas/math';
import type { ElementStyle, Transform, ElementType as ElementTypeValue, IElement } from './types';

export class Rectangle extends BaseElement {
  public width: number;
  public height: number;

  constructor(
    id: string,
    x: number,
    y: number,
    width: number,
    height: number,
    style?: ElementStyle
  ) {
    super(id, x, y, style);
    this.width = width;
    this.height = height;
  }

  get type(): ElementTypeValue {
    return ElementType.RECTANGLE;
  }

  getBoundingBox(): BoundingBox {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }

  containsPoint(point: Point): boolean {
    return (
      point.x >= this.x &&
      point.x <= this.x + this.width &&
      point.y >= this.y &&
      point.y <= this.y + this.height
    );
  }

  render(ctx: CanvasRenderingContext2D, transform?: Transform): void {
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

    // 绘制填充
    if (this.style.fillColor) {
      ctx.fillStyle = this.style.fillColor;
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    // 绘制描边
    if (this.style.strokeColor && this.style.strokeWidth) {
      ctx.strokeStyle = this.style.strokeColor;
      ctx.lineWidth = this.style.strokeWidth;
      
      // 如果选中，使用更粗的描边
      if (this.selected) {
        ctx.lineWidth = (this.style.strokeWidth || 2) * 2;
        ctx.strokeStyle = '#f59e0b'; // 选中时使用橙色
      }
      
      ctx.strokeRect(this.x, this.y, this.width, this.height);
    }

    ctx.restore();
  }

  clone(): IElement {
    const cloned = new Rectangle(
      this.id + '_clone',
      this.x,
      this.y,
      this.width,
      this.height,
      { ...this.style }
    );
    cloned.selected = this.selected;
    return cloned;
  }
}

