/**
 * 元素管理器
 * 管理画布上所有元素的生命周期和查询
 */

import type { IElement } from '@canvas/elements';
import type { BoundingBox } from '@canvas/math';
import type { Point } from '@canvas/math';
import { SpatialIndex } from './SpatialIndex';

/**
 * 元素管理器类
 */
export class ElementManager {
  private elements: Map<string, IElement> = new Map();
  private spatialIndex: SpatialIndex;
  private zIndexOrder: string[] = []; // 维护绘制顺序（后面的在上层）

  constructor(spatialIndex: SpatialIndex) {
    this.spatialIndex = spatialIndex;
  }

  /**
   * 添加元素
   */
  add(element: IElement): void {
    this.elements.set(element.id, element);
    this.zIndexOrder.push(element.id);
    this.spatialIndex.insert(element);
  }

  /**
   * 移除元素
   */
  remove(id: string): boolean {
    const element = this.elements.get(id);
    if (!element) {
      return false;
    }

    this.elements.delete(id);
    const index = this.zIndexOrder.indexOf(id);
    if (index !== -1) {
      this.zIndexOrder.splice(index, 1);
    }
    this.spatialIndex.remove(element);
    return true;
  }

  /**
   * 更新元素（需要更新空间索引）
   */
  update(element: IElement): void {
    if (!this.elements.has(element.id)) {
      return;
    }

    this.elements.set(element.id, element);
    this.spatialIndex.update(element);
  }

  /**
   * 获取元素
   */
  get(id: string): IElement | null {
    return this.elements.get(id) || null;
  }

  /**
   * 获取所有元素（按绘制顺序）
   */
  getAll(): IElement[] {
    return this.zIndexOrder
      .map((id) => this.elements.get(id))
      .filter((el): el is IElement => el !== undefined);
  }

  /**
   * 根据边界框查询元素
   */
  queryByBounds(bounds: BoundingBox): IElement[] {
    return this.spatialIndex.query(bounds);
  }

  /**
   * 根据点查询元素（返回最上层的）
   */
  queryByPoint(point: Point): IElement | null {
    return this.spatialIndex.queryPoint(point);
  }

  /**
   * 清除所有元素
   */
  clear(): void {
    this.elements.clear();
    this.zIndexOrder = [];
    this.spatialIndex.clear();
  }

  /**
   * 获取元素数量
   */
  getCount(): number {
    return this.elements.size;
  }

  /**
   * 更新空间索引的边界（当画布大小改变时）
   */
  updateSpatialBounds(bounds: BoundingBox): void {
    const allElements = this.getAll();
    this.spatialIndex.rebuild(bounds, allElements);
  }
}

