/**
 * Canvas 主引擎
 * 整合所有模块，提供统一的 API
 */

import type { IElement, Transform } from '@canvas/elements';
import type { BoundingBox } from '@canvas/math';
import type { Point } from '@canvas/math';
import { SpatialIndex } from './SpatialIndex';
import { ElementManager } from './ElementManager';
import { Renderer } from './Renderer';
import { InteractionManager, InteractionMode } from './InteractionManager';

/**
 * Canvas 引擎类
 */
export class CanvasEngine {
  private canvas: HTMLCanvasElement;
  private spatialIndex: SpatialIndex;
  private elementManager: ElementManager;
  private renderer: Renderer;
  private interactionManager: InteractionManager;
  
  private transform: Transform;
  private animationFrameId: number | null = null;
  
  /** 临时路径点（用于画笔预览） */
  private tempPathPoints: Point[] | null = null;
  /** 临时矩形（用于矩形预览） */
  private tempRectangle: { start: Point; end: Point } | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    
    // 初始化变换矩阵
    this.transform = {
      scaleX: 1,
      scaleY: 1,
      translateX: 0,
      translateY: 0,
    };

    // 初始化空间索引（使用画布大小作为边界）
    const bounds: BoundingBox = {
      x: -10000,
      y: -10000,
      width: 20000,
      height: 20000,
    };
    this.spatialIndex = new SpatialIndex(bounds);

    // 初始化各个管理器
    this.elementManager = new ElementManager(this.spatialIndex);
    this.renderer = new Renderer(canvas, this.spatialIndex);
    this.renderer.setTransform(this.transform);
    this.interactionManager = new InteractionManager(this.spatialIndex, this.transform);

    // 设置交互管理器回调
    this.setupInteractionCallbacks();

    // 绑定事件
    this.setupEventListeners();

    // 开始渲染循环
    this.startRenderLoop();
  }

  /**
   * 设置交互管理器回调
   */
  private setupInteractionCallbacks(): void {
    this.interactionManager.setCallbacks({
      onElementSelected: (element) => {
        // 清除其他元素的选中状态
        this.elementManager.getAll().forEach((el) => {
          if (el !== element) {
            el.selected = false;
          }
        });
        this.renderer.markDirty();
        // 注意：外部回调通过 onElementSelected 方法设置
      },
      onElementMoved: (element) => {
        this.renderer.markDirtyRegion(element.getBoundingBox());
      },
      onPathDrawing: (points: Point[]) => {
        // 实时更新路径预览
        this.tempPathPoints = points;
        // 有临时预览时，强制全量重绘以确保预览可见
        this.renderer.markDirty();
      },
      onPathComplete: () => {
        // 路径绘制完成，清除临时预览
        this.tempPathPoints = null;
        this.renderer.markDirty();
      },
      onRectangleDrawing: (start: Point, end: Point) => {
        // 实时更新矩形预览
        this.tempRectangle = { start, end };
        this.renderer.markDirty();
      },
      onRectangleComplete: () => {
        // 矩形绘制完成，清除临时预览
        this.tempRectangle = null;
        this.renderer.markDirty();
      },
    });
  }

  /**
   * 绑定事件监听器
   */
  private setupEventListeners(): void {
    this.canvas.addEventListener('mousedown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.interactionManager.handleMouseDown(
        e.clientX - rect.left,
        e.clientY - rect.top
      );
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.interactionManager.handleMouseMove(
        e.clientX - rect.left,
        e.clientY - rect.top
      );
    });

    this.canvas.addEventListener('mouseup', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.interactionManager.handleMouseUp(
        e.clientX - rect.left,
        e.clientY - rect.top
      );
    });

    // 防止右键菜单
    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }

  /**
   * 开始渲染循环
   */
  private startRenderLoop(): void {
    const render = () => {
      const elements = this.elementManager.getAll();
      
      // 如果有临时预览，强制全量重绘以确保预览可见
      const hasTempPreview = Boolean(
        (this.tempPathPoints && this.tempPathPoints.length > 1) || this.tempRectangle
      );
      
      // 渲染元素（如果有临时预览，强制全量重绘）
      this.renderer.render(elements, hasTempPreview);
      
      // 渲染临时预览（在元素之上，不受裁剪影响）
      if (this.tempPathPoints && this.tempPathPoints.length > 1) {
        this.renderer.renderTempPath(this.tempPathPoints);
      }
      if (this.tempRectangle) {
        this.renderer.renderTempRectangle(this.tempRectangle.start, this.tempRectangle.end);
      }
      
      this.animationFrameId = requestAnimationFrame(render);
    };
    this.animationFrameId = requestAnimationFrame(render);
  }

  /**
   * 停止渲染循环
   */
  private stopRenderLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * 添加元素
   */
  addElement(element: IElement): void {
    this.elementManager.add(element);
    this.renderer.markDirtyRegion(element.getBoundingBox());
  }

  /**
   * 移除元素
   */
  removeElement(id: string): boolean {
    const element = this.elementManager.get(id);
    if (element) {
      const bounds = element.getBoundingBox();
      const removed = this.elementManager.remove(id);
      if (removed) {
        this.renderer.markDirtyRegion(bounds);
      }
      return removed;
    }
    return false;
  }

  /**
   * 获取元素
   */
  getElement(id: string): IElement | null {
    return this.elementManager.get(id);
  }

  /**
   * 获取所有元素
   */
  getAllElements(): IElement[] {
    return this.elementManager.getAll();
  }

  /**
   * 设置交互模式
   */
  setMode(mode: InteractionMode): void {
    this.interactionManager.setMode(mode);
  }

  /**
   * 获取当前选中的元素
   */
  getSelectedElement(): IElement | null {
    return this.interactionManager.getSelectedElement();
  }

  /**
   * 清除选中
   */
  clearSelection(): void {
    this.interactionManager.clearSelection();
    this.renderer.markDirty();
  }

  /**
   * 删除选中的元素
   */
  deleteSelectedElement(): boolean {
    const selected = this.interactionManager.getSelectedElement();
    if (selected) {
      const removed = this.removeElement(selected.id);
      this.clearSelection();
      return removed;
    }
    return false;
  }

  /**
   * 设置路径绘制完成回调
   */
  onPathComplete(callback: (points: Point[]) => void): void {
    this.interactionManager.setCallbacks({
      onPathComplete: callback,
    });
  }

  /**
   * 设置矩形绘制完成回调
   */
  onRectangleComplete(callback: (start: Point, end: Point) => void): void {
    this.interactionManager.setCallbacks({
      onRectangleComplete: callback,
    });
  }

  /**
   * 设置元素选中回调
   */
  onElementSelected(callback: (element: IElement | null) => void): void {
    // 保存外部回调
    const externalCallback = callback;
    
    // 更新回调，先执行内部逻辑，再执行外部回调
    // 注意：使用 setCallbacks 的合并机制，只更新 onElementSelected
    this.interactionManager.setCallbacks({
      onElementSelected: (element) => {
        // 先执行内部逻辑
        this.elementManager.getAll().forEach((el) => {
          if (el !== element) {
            el.selected = false;
          }
        });
        this.renderer.markDirty();
        // 再执行外部回调
        externalCallback(element);
      },
    });
  }

  /**
   * 调整画布大小
   */
  resize(): void {
    this.renderer.resize();
    const bounds: BoundingBox = {
      x: -10000,
      y: -10000,
      width: 20000,
      height: 20000,
    };
    this.elementManager.updateSpatialBounds(bounds);
  }

  /**
   * 销毁引擎
   */
  destroy(): void {
    this.stopRenderLoop();
    // 清理事件监听器等
  }
}

