/**
 * 基础元素抽象类
 * 所有元素类型的基类，提供通用功能
 */

import type { Point, BoundingBox } from '@canvas/math';
import type { ElementStyle, Transform, IElement, ElementType } from './types';

export abstract class BaseElement implements IElement {
  public id: string;
  public x: number;
  public y: number;
  public style: ElementStyle;
  public selected?: boolean;

  constructor(id: string, x: number, y: number, style: ElementStyle = {}) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.style = {
      fillColor: '#3b82f6',
      strokeColor: '#1e40af',
      strokeWidth: 2,
      opacity: 1,
      ...style,
    };
    this.selected = false;
  }

  /** 获取元素类型（由子类实现） */
  abstract get type(): ElementType;

  /** 获取边界框（由子类实现） */
  abstract getBoundingBox(): BoundingBox;

  /** 检查点是否在元素内（由子类实现） */
  abstract containsPoint(point: Point): boolean;

  /** 渲染元素（由子类实现） */
  abstract render(ctx: CanvasRenderingContext2D, transform?: Transform): void;

  /** 克隆元素（由子类实现） */
  abstract clone(): IElement;

  /**
   * 应用变换到点坐标
   */
  protected applyTransform(point: Point, transform?: Transform): Point {
    if (!transform) {
      return point;
    }
    return {
      x: point.x * transform.scaleX + transform.translateX,
      y: point.y * transform.scaleY + transform.translateY,
    };
  }

  /**
   * 应用逆变换到点坐标（从屏幕坐标转换为画布坐标）
   */
  protected applyInverseTransform(point: Point, transform?: Transform): Point {
    if (!transform) {
      return point;
    }
    return {
      x: (point.x - transform.translateX) / transform.scaleX,
      y: (point.y - transform.translateY) / transform.scaleY,
    };
  }
}

