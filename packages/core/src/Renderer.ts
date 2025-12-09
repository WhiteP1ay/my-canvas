/**
 * 渲染引擎
 * 负责将元素渲染到 Canvas 上，支持脏矩形优化以提高性能
 */

import type { IElement, Transform } from '@canvas/elements';
import type { BoundingBox, Point } from '@canvas/math';
import { transformBounds } from '@canvas/math';
import { SpatialIndex } from './SpatialIndex';

/**
 * 脏矩形区域（需要重绘的区域）
 */
interface DirtyRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 渲染器类
 */
export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private spatialIndex: SpatialIndex;
  private transform: Transform;
  
  /** 是否启用脏矩形优化 */
  private enableDirtyRects: boolean = true;
  /** 脏矩形列表 */
  private dirtyRegions: DirtyRegion[] = [];
  /** 是否需要全量重绘 */
  private needsFullRedraw: boolean = true;
  /** 背景颜色 */
  private backgroundColor: string = '#ffffff';

  constructor(canvas: HTMLCanvasElement, spatialIndex: SpatialIndex) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('无法获取 Canvas 2D 上下文');
    }
    this.ctx = context;
    this.spatialIndex = spatialIndex;
    
    // 初始化变换矩阵
    this.transform = {
      scaleX: 1,
      scaleY: 1,
      translateX: 0,
      translateY: 0,
    };

    // 设置高质量渲染
    this.setupHighQualityRendering();
  }

  /**
   * 设置高质量渲染（抗锯齿等）
   */
  private setupHighQualityRendering(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();

    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
  }

  /**
   * 设置变换矩阵
   */
  setTransform(transform: Transform): void {
    this.transform = transform;
    // 不触发全量重绘，而是标记视口区域为脏
    // 这样在下次渲染时会使用视口裁剪
    const viewportBounds = this.getViewportBounds();
    this.markDirtyRegion(viewportBounds);
  }

  /**
   * 获取当前视口边界（画布坐标）
   */
  private getViewportBounds(): BoundingBox {
    const dpr = window.devicePixelRatio || 1;
    const width = this.canvas.width / dpr;
    const height = this.canvas.height / dpr;
    
    // 将屏幕坐标转换为画布坐标
    return {
      x: (0 - this.transform.translateX) / this.transform.scaleX,
      y: (0 - this.transform.translateY) / this.transform.scaleY,
      width: width / this.transform.scaleX,
      height: height / this.transform.scaleY,
    };
  }

  /**
   * 获取变换矩阵
   */
  getTransform(): Transform {
    return { ...this.transform };
  }

  /**
   * 标记整个画布为脏（需要全量重绘）
   */
  markDirty(): void {
    this.needsFullRedraw = true;
  }

  /**
   * 检查是否有脏区域需要重绘
   */
  hasDirtyRegions(): boolean {
    return this.needsFullRedraw || this.dirtyRegions.length > 0;
  }

  /**
   * 标记指定区域为脏
   */
  markDirtyRegion(bounds: BoundingBox): void {
    if (!this.enableDirtyRects) {
      this.needsFullRedraw = true;
      return;
    }

    const transformedBounds = transformBounds(bounds, this.transform);
    this.dirtyRegions.push({
      x: transformedBounds.x,
      y: transformedBounds.y,
      width: transformedBounds.width,
      height: transformedBounds.height,
    });
  }

  /**
   * 清除画布
   */
  private clearCanvas(region?: DirtyRegion): void {
    if (region) {
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.rect(region.x, region.y, region.width, region.height);
      this.ctx.clip();
      this.ctx.fillStyle = this.backgroundColor;
      this.ctx.fillRect(region.x, region.y, region.width, region.height);
      this.ctx.restore();
    } else {
      this.ctx.fillStyle = this.backgroundColor;
      const width = this.canvas.width / (window.devicePixelRatio || 1);
      const height = this.canvas.height / (window.devicePixelRatio || 1);
      this.ctx.fillRect(0, 0, width, height);
    }
  }

  /**
   * 渲染所有元素
   * @param elements 要渲染的元素列表（仅在需要时使用，已废弃，使用空间索引查询）
   * @param forceFullRedraw 强制全量重绘（用于临时预览）
   */
  render(_elements: IElement[], forceFullRedraw: boolean = false): void {
    if (this.needsFullRedraw || forceFullRedraw) {
      this.clearCanvas();
      
      // 使用视口裁剪：只渲染可见元素
      const viewportBounds = this.getViewportBounds();
      const visibleElements = this.spatialIndex.query(viewportBounds);
      this.renderElements(visibleElements);
      
      this.needsFullRedraw = false;
      this.dirtyRegions = [];
      return;
    }

    if (this.dirtyRegions.length === 0) {
      return;
    }

    // 对每个脏矩形区域进行重绘
    for (const region of this.dirtyRegions) {
      const expandedRegion: DirtyRegion = {
        x: Math.max(0, region.x - 2),
        y: Math.max(0, region.y - 2),
        width: region.width + 4,
        height: region.height + 4,
      };

      this.clearCanvas(expandedRegion);

      // 查询该区域内的元素
      const bounds: BoundingBox = {
        x: (expandedRegion.x - this.transform.translateX) / this.transform.scaleX,
        y: (expandedRegion.y - this.transform.translateY) / this.transform.scaleY,
        width: expandedRegion.width / this.transform.scaleX,
        height: expandedRegion.height / this.transform.scaleY,
      };

      const elementsInRegion = this.spatialIndex.query(bounds);

      // 渲染该区域内的元素
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.rect(expandedRegion.x, expandedRegion.y, expandedRegion.width, expandedRegion.height);
      this.ctx.clip();
      this.renderElements(elementsInRegion);
      this.ctx.restore();
    }

    this.dirtyRegions = [];
  }

  /**
   * 渲染元素列表
   */
  private renderElements(elements: IElement[]): void {
    for (const element of elements) {
      element.render(this.ctx, this.transform);
    }
  }

  /**
   * 渲染临时路径（用于画笔预览）
   */
  renderTempPath(points: Point[]): void {
    if (points.length < 2) {
      return;
    }

    this.ctx.save();
    
    // 应用变换：points 是画布坐标，需要转换为屏幕坐标
    this.ctx.translate(this.transform.translateX, this.transform.translateY);
    this.ctx.scale(this.transform.scaleX, this.transform.scaleY);

    // 绘制路径
    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y);
    }

    // 设置样式
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2 / Math.max(this.transform.scaleX, this.transform.scaleY); // 考虑缩放
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.stroke();

    this.ctx.restore();
  }

  /**
   * 渲染临时矩形（用于矩形预览）
   */
  renderTempRectangle(start: Point, end: Point): void {
    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);
    const w = Math.abs(end.x - start.x);
    const h = Math.abs(end.y - start.y);

    this.ctx.save();
    this.ctx.translate(this.transform.translateX, this.transform.translateY);
    this.ctx.scale(this.transform.scaleX, this.transform.scaleY);

    this.ctx.setLineDash([5, 5]);
    this.ctx.strokeStyle = '#3b82f6';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, w, h);

    this.ctx.restore();
  }

  /**
   * 调整画布大小
   */
  resize(): void {
    this.setupHighQualityRendering();
    this.markDirty();
  }
}

