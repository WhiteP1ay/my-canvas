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
  
  /** 平移状态 */
  private isPanning: boolean = false;
  private panStartPoint: Point | null = null;

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
      onElementMoved: () => {
        // 拖拽时强制全量重绘，避免残影问题
        // 因为选中边框可能超出元素边界框，脏矩形优化难以精确处理
        this.renderer.markDirty();
      },
      onPathDrawing: (points: Point[]) => {
        // 实时更新路径预览
        this.tempPathPoints = points;
        // 有临时预览时，强制全量重绘以确保预览可见
        this.renderer.markDirty();
      },
      onPathComplete: () => {
        // 路径绘制完成，清除临时预览
        // 注意：当外部设置 onPathComplete 回调时，会在回调中清除
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
        // 注意：当外部设置 onRectangleComplete 回调时，会在回调中清除
        this.tempRectangle = null;
        this.renderer.markDirty();
      },
    });
  }

  /**
   * 绑定事件监听器
   */
  private setupEventListeners(): void {
    // 空格键状态
    let spaceKeyPressed = false;
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !e.repeat) {
        spaceKeyPressed = true;
        this.canvas.style.cursor = 'grab';
      }
    });
    document.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        spaceKeyPressed = false;
        if (!this.isPanning) {
          this.canvas.style.cursor = '';
        }
      }
    });

    // 鼠标按下
    this.canvas.addEventListener('mousedown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.clientX;
      const clientY = e.clientY;
      
      // 中键（button === 1）或空格键+左键：开始平移
      if (e.button === 1 || (e.button === 0 && spaceKeyPressed)) {
        e.preventDefault();
        e.stopPropagation();
        this.startPanning(clientX, clientY);
        return;
      }
      
      // 其他情况：正常交互
      this.interactionManager.handleMouseDown(
        clientX - rect.left,
        clientY - rect.top
      );
    });

    // 鼠标移动
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      
      // 如果正在平移，处理平移
      if (this.isPanning) {
        e.preventDefault();
        this.handlePanning(e.clientX, e.clientY);
        return;
      }
      
      // 否则正常交互
      this.interactionManager.handleMouseMove(
        e.clientX - rect.left,
        e.clientY - rect.top
      );
    });

    // 鼠标抬起
    this.canvas.addEventListener('mouseup', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      
      // 如果正在平移，结束平移
      if (this.isPanning && (e.button === 1 || e.button === 0)) {
        e.preventDefault();
        this.stopPanning();
        return;
      }
      
      // 否则正常交互
      this.interactionManager.handleMouseUp(
        e.clientX - rect.left,
        e.clientY - rect.top
      );
    });

    // 鼠标离开画布时结束平移
    this.canvas.addEventListener('mouseleave', () => {
      if (this.isPanning) {
        this.stopPanning();
      }
    });

    // 防止右键菜单
    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    // 鼠标滚轮缩放
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.handleWheel(e);
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
      if (removed) {
        this.clearSelection();
        // 通知外部选中状态变化
        if (this.interactionManager['onElementSelected']) {
          this.interactionManager['onElementSelected'](null);
        }
      }
      return removed;
    }
    return false;
  }

  /**
   * 设置路径绘制完成回调
   */
  onPathComplete(callback: (points: Point[]) => void): void {
    const externalCallback = callback;
    // 先执行内部逻辑（清除临时预览），再执行外部回调
    this.interactionManager.setCallbacks({
      onPathComplete: (points: Point[]) => {
        // 先清除临时预览
        this.tempPathPoints = null;
        this.renderer.markDirty();
        // 再执行外部回调
        externalCallback(points);
      },
    });
  }

  /**
   * 设置矩形绘制完成回调
   */
  onRectangleComplete(callback: (start: Point, end: Point) => void): void {
    const externalCallback = callback;
    // 先执行内部逻辑（清除临时预览），再执行外部回调
    this.interactionManager.setCallbacks({
      onRectangleComplete: (start: Point, end: Point) => {
        // 先清除临时预览
        this.tempRectangle = null;
        this.renderer.markDirty();
        // 再执行外部回调
        externalCallback(start, end);
      },
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

  /**
   * 处理鼠标滚轮缩放
   */
  private handleWheel(e: WheelEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // 计算鼠标在画布坐标中的位置（缩放前）
    const canvasX = (mouseX - this.transform.translateX) / this.transform.scaleX;
    const canvasY = (mouseY - this.transform.translateY) / this.transform.scaleY;

    // 缩放因子（滚轮向下缩小，向上放大）
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const minScale = 0.1;
    const maxScale = 10;

    // 计算新的缩放值
    const newScaleX = Math.max(minScale, Math.min(maxScale, this.transform.scaleX * zoomFactor));
    const newScaleY = Math.max(minScale, Math.min(maxScale, this.transform.scaleY * zoomFactor));

    // 计算新的平移值，使鼠标位置在缩放后保持不变
    const newTranslateX = mouseX - canvasX * newScaleX;
    const newTranslateY = mouseY - canvasY * newScaleY;

    // 更新变换矩阵
    this.transform = {
      scaleX: newScaleX,
      scaleY: newScaleY,
      translateX: newTranslateX,
      translateY: newTranslateY,
    };

    // 同步到各个管理器
    this.renderer.setTransform(this.transform);
    this.interactionManager.setTransform(this.transform);
    this.renderer.markDirty();
  }

  /**
   * 开始平移
   */
  private startPanning(clientX: number, clientY: number): void {
    this.isPanning = true;
    this.panStartPoint = { x: clientX, y: clientY };
    this.canvas.style.cursor = 'grabbing';
  }

  /**
   * 处理平移
   */
  private handlePanning(clientX: number, clientY: number): void {
    if (!this.panStartPoint) {
      return;
    }

    const deltaX = clientX - this.panStartPoint.x;
    const deltaY = clientY - this.panStartPoint.y;

    // 更新平移值
    this.transform.translateX += deltaX;
    this.transform.translateY += deltaY;

    // 同步到各个管理器
    this.renderer.setTransform(this.transform);
    this.interactionManager.setTransform(this.transform);
    this.renderer.markDirty();

    // 更新起始点
    this.panStartPoint = { x: clientX, y: clientY };
  }

  /**
   * 结束平移
   */
  private stopPanning(): void {
    this.isPanning = false;
    this.panStartPoint = null;
    this.canvas.style.cursor = '';
  }
}

