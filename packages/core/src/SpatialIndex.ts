/**
 * 空间索引系统 - 四叉树实现
 * 用于快速查找指定区域内的元素，优化大量元素时的性能
 */

import type { IElement } from '@canvas/elements';
import type { BoundingBox } from '@canvas/math';
import type { Point } from '@canvas/math';
import { rectsIntersect, pointInRect } from '@canvas/math';

/**
 * 四叉树节点
 */
class QuadTreeNode {
  /** 节点边界 */
  public bounds: BoundingBox;
  /** 存储的元素 */
  public elements: IElement[] = [];
  /** 子节点 */
  public children: QuadTreeNode[] | null = null;
  /** 最大容量（超过后分裂） */
  private readonly maxElements: number = 10;
  /** 最大深度 */
  private readonly maxDepth: number = 5;
  /** 当前深度 */
  private depth: number;

  constructor(bounds: BoundingBox, depth: number = 0) {
    this.bounds = bounds;
    this.depth = depth;
  }

  /**
   * 分裂节点为四个子节点
   */
  private split(): void {
    const { x, y, width, height } = this.bounds;
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const newDepth = this.depth + 1;

    this.children = [
      // 左上
      new QuadTreeNode(
        { x, y, width: halfWidth, height: halfHeight },
        newDepth
      ),
      // 右上
      new QuadTreeNode(
        { x: x + halfWidth, y, width: halfWidth, height: halfHeight },
        newDepth
      ),
      // 左下
      new QuadTreeNode(
        { x, y: y + halfHeight, width: halfWidth, height: halfHeight },
        newDepth
      ),
      // 右下
      new QuadTreeNode(
        {
          x: x + halfWidth,
          y: y + halfHeight,
          width: halfWidth,
          height: halfHeight,
        },
        newDepth
      ),
    ];
  }

  /**
   * 插入元素
   */
  insert(element: IElement): void {
    const elementBounds = element.getBoundingBox();

    // 如果元素不在当前节点边界内，不插入
    if (!rectsIntersect(this.bounds, elementBounds)) {
      return;
    }

    // 如果有子节点，尝试插入到子节点
    if (this.children) {
      for (const child of this.children) {
        child.insert(element);
      }
      return;
    }

    // 添加到当前节点
    this.elements.push(element);

    // 如果超过容量且未达到最大深度，分裂节点
    if (
      this.elements.length > this.maxElements &&
      this.depth < this.maxDepth
    ) {
      this.split();

      // 将当前元素重新分配到子节点
      const elementsToRedistribute = [...this.elements];
      this.elements = [];

      for (const el of elementsToRedistribute) {
        for (const child of this.children!) {
          child.insert(el);
        }
      }
    }
  }

  /**
   * 查询指定区域内的所有元素
   */
  query(bounds: BoundingBox): IElement[] {
    const results: IElement[] = [];
    const seen = new Set<string>(); // 使用 Set 去重，避免横跨多个象限的元素被重复渲染

    // 如果查询区域与当前节点不相交，返回空
    if (!rectsIntersect(this.bounds, bounds)) {
      return results;
    }

    // 如果有子节点，递归查询子节点
    if (this.children) {
      for (const child of this.children) {
        const childResults = child.query(bounds);
        for (const element of childResults) {
          // 去重：如果元素已经在结果中，跳过
          if (!seen.has(element.id)) {
            seen.add(element.id);
            results.push(element);
          }
        }
      }
    } else {
      // 检查当前节点的元素是否在查询区域内
      for (const element of this.elements) {
        const elementBounds = element.getBoundingBox();
        if (rectsIntersect(bounds, elementBounds)) {
          // 去重：如果元素已经在结果中，跳过
          if (!seen.has(element.id)) {
            seen.add(element.id);
            results.push(element);
          }
        }
      }
    }

    return results;
  }

  /**
   * 查询指定点处的元素（从后往前，返回最上层的）
   */
  queryPoint(point: Point): IElement | null {
    // 如果点不在当前节点边界内，返回 null
    if (!pointInRect(point, this.bounds)) {
      return null;
    }

    // 如果有子节点，递归查询子节点
    if (this.children) {
      // 从后往前查询（后绘制的在上层）
      for (let i = this.children.length - 1; i >= 0; i--) {
        const result = this.children[i].queryPoint(point);
        if (result) {
          return result;
        }
      }
    } else {
      // 从后往前检查当前节点的元素（后绘制的在上层）
      for (let i = this.elements.length - 1; i >= 0; i--) {
        const element = this.elements[i];
        if (element.containsPoint(point)) {
          return element;
        }
      }
    }

    return null;
  }

  /**
   * 清除所有元素
   */
  clear(): void {
    this.elements = [];
    if (this.children) {
      for (const child of this.children) {
        child.clear();
      }
      this.children = null;
    }
  }

  /**
   * 移除指定元素
   */
  remove(element: IElement): boolean {
    const elementBounds = element.getBoundingBox();

    // 如果元素不在当前节点边界内，返回 false
    if (!rectsIntersect(this.bounds, elementBounds)) {
      return false;
    }

    // 如果有子节点，尝试从子节点移除
    if (this.children) {
      let removed = false;
      for (const child of this.children) {
        if (child.remove(element)) {
          removed = true;
        }
      }
      return removed;
    }

    // 从当前节点移除
    const index = this.elements.indexOf(element);
    if (index !== -1) {
      this.elements.splice(index, 1);
      return true;
    }

    return false;
  }
}

/**
 * 空间索引管理器
 */
export class SpatialIndex {
  private root: QuadTreeNode;

  constructor(bounds: BoundingBox) {
    this.root = new QuadTreeNode(bounds);
  }

  /**
   * 插入元素
   */
  insert(element: IElement): void {
    this.root.insert(element);
  }

  /**
   * 查询指定区域内的所有元素
   */
  query(bounds: BoundingBox): IElement[] {
    return this.root.query(bounds);
  }

  /**
   * 查询指定点处的元素
   */
  queryPoint(point: Point): IElement | null {
    return this.root.queryPoint(point);
  }

  /**
   * 清除所有元素
   */
  clear(): void {
    this.root.clear();
  }

  /**
   * 移除指定元素
   */
  remove(element: IElement): void {
    this.root.remove(element);
  }

  /**
   * 更新索引（移除后重新插入）
   */
  update(element: IElement): void {
    this.remove(element);
    this.insert(element);
  }

  /**
   * 重新构建索引（当画布大小改变时）
   */
  rebuild(bounds: BoundingBox, elements: IElement[]): void {
    this.root = new QuadTreeNode(bounds);
    for (const element of elements) {
      this.root.insert(element);
    }
  }
}

