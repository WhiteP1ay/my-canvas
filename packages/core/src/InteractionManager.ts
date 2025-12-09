/**
 * 交互管理器
 * 处理鼠标事件，实现选中、拖拽、画笔绘制、矩形绘制
 */

import type { IElement, Transform } from '@canvas/elements';
import type { Point, BoundingBox } from '@canvas/math';
import { applyInverseTransform } from '@canvas/math';
import { SpatialIndex } from './SpatialIndex';

/**
 * 交互模式
 */
export const InteractionMode = {
  /** 画笔模式（绘制路径） */
  PEN: 'pen',
  /** 矩形模式 */
  RECTANGLE: 'rectangle',
  /** 选择模式（选中和拖拽） */
  SELECT: 'select',
} as const;

export type InteractionMode = typeof InteractionMode[keyof typeof InteractionMode];

/**
 * 交互状态
 */
interface InteractionState {
  /** 当前模式 */
  mode: InteractionMode;
  /** 是否正在交互 */
  isActive: boolean;
  /** 起始点 */
  startPoint: Point | null;
  /** 当前点 */
  currentPoint: Point | null;
  /** 被选中的元素 */
  selectedElement: IElement | null;
  /** 被拖拽的元素 */
  draggedElement: IElement | null;
  /** 拖拽偏移量 */
  dragOffset: Point | null;
}

/**
 * 交互管理器类
 */
export class InteractionManager {
  private spatialIndex: SpatialIndex;
  private transform: Transform;
  private state: InteractionState;
  private mode: InteractionMode = InteractionMode.SELECT;
  
  /** 事件回调 */
  private onElementSelected?: (element: IElement | null) => void;
  private onElementMoved?: (element: IElement, deltaX: number, deltaY: number, oldBounds?: BoundingBox) => void;
  private onPathDrawing?: (points: Point[]) => void;
  private onPathComplete?: (points: Point[]) => void;
  private onRectangleDrawing?: (start: Point, end: Point) => void;
  private onRectangleComplete?: (start: Point, end: Point) => void;

  /** 当前绘制的路径点 */
  private currentPathPoints: Point[] = [];

  constructor(spatialIndex: SpatialIndex, transform: Transform) {
    this.spatialIndex = spatialIndex;
    this.transform = transform;
    this.state = {
      mode: InteractionMode.SELECT,
      isActive: false,
      startPoint: null,
      currentPoint: null,
      selectedElement: null,
      draggedElement: null,
      dragOffset: null,
    };
  }

  /**
   * 设置交互模式
   */
  setMode(mode: InteractionMode): void {
    this.mode = mode;
    this.state.mode = mode;
    this.clearSelection();
  }

  /**
   * 设置事件回调（合并而不是替换）
   */
  setCallbacks(callbacks: {
    onElementSelected?: (element: IElement | null) => void;
    onElementMoved?: (element: IElement, deltaX: number, deltaY: number, oldBounds?: BoundingBox) => void;
    onPathDrawing?: (points: Point[]) => void;
    onPathComplete?: (points: Point[]) => void;
    onRectangleDrawing?: (start: Point, end: Point) => void;
    onRectangleComplete?: (start: Point, end: Point) => void;
  }): void {
    // 合并回调而不是替换
    if (callbacks.onElementSelected !== undefined) {
      this.onElementSelected = callbacks.onElementSelected;
    }
    if (callbacks.onElementMoved !== undefined) {
      this.onElementMoved = callbacks.onElementMoved;
    }
    if (callbacks.onPathDrawing !== undefined) {
      this.onPathDrawing = callbacks.onPathDrawing;
    }
    if (callbacks.onPathComplete !== undefined) {
      this.onPathComplete = callbacks.onPathComplete;
    }
    if (callbacks.onRectangleDrawing !== undefined) {
      this.onRectangleDrawing = callbacks.onRectangleDrawing;
    }
    if (callbacks.onRectangleComplete !== undefined) {
      this.onRectangleComplete = callbacks.onRectangleComplete;
    }
  }

  /**
   * 更新变换矩阵
   */
  updateTransform(transform: Transform): void {
    this.transform = transform;
  }

  /**
   * 将屏幕坐标转换为画布坐标
   */
  private screenToCanvas(screenX: number, screenY: number): Point {
    return applyInverseTransform({ x: screenX, y: screenY }, this.transform);
  }

  /**
   * 处理鼠标按下
   */
  handleMouseDown(clientX: number, clientY: number): void {
    const canvasPoint = this.screenToCanvas(clientX, clientY);
    
    this.state.startPoint = canvasPoint;
    this.state.currentPoint = canvasPoint;
    this.state.isActive = true;

    if (this.mode === InteractionMode.PEN) {
      // 开始绘制路径
      this.currentPathPoints = [canvasPoint];
      if (this.onPathDrawing) {
        this.onPathDrawing([...this.currentPathPoints]);
      }
    } else if (this.mode === InteractionMode.RECTANGLE) {
      // 开始绘制矩形
      if (this.onRectangleDrawing) {
        this.onRectangleDrawing(canvasPoint, canvasPoint);
      }
    } else {
      // 选择模式：查找点击位置的元素
      const element = this.spatialIndex.queryPoint(canvasPoint);

      if (element) {
        // 选中元素
        this.state.selectedElement = element;
        this.state.draggedElement = element;
        element.selected = true;

        // 计算拖拽偏移量
        const elementBounds = element.getBoundingBox();
        this.state.dragOffset = {
          x: canvasPoint.x - elementBounds.x,
          y: canvasPoint.y - elementBounds.y,
        };

        if (this.onElementSelected) {
          this.onElementSelected(element);
        }
      } else {
        // 点击空白区域，清除选中
        this.clearSelection();
      }
    }
  }

  /**
   * 处理鼠标移动
   */
  handleMouseMove(clientX: number, clientY: number): void {
    if (!this.state.isActive) {
      return;
    }

    const canvasPoint = this.screenToCanvas(clientX, clientY);
    this.state.currentPoint = canvasPoint;

    if (this.mode === InteractionMode.PEN) {
      // 继续绘制路径
      this.currentPathPoints.push(canvasPoint);
      if (this.onPathDrawing) {
        this.onPathDrawing([...this.currentPathPoints]);
      }
    } else if (this.mode === InteractionMode.RECTANGLE) {
      // 更新矩形绘制
      if (this.state.startPoint && this.onRectangleDrawing) {
        this.onRectangleDrawing(this.state.startPoint, canvasPoint);
      }
    } else if (this.state.draggedElement && this.state.currentPoint && this.state.startPoint) {
      // 拖拽元素
      const deltaX = canvasPoint.x - this.state.startPoint.x;
      const deltaY = canvasPoint.y - this.state.startPoint.y;

      // 记录旧位置（用于清除残影）
      const oldBounds = this.state.draggedElement.getBoundingBox();

      // 更新元素位置
      this.state.draggedElement.x += deltaX;
      this.state.draggedElement.y += deltaY;

      // 如果是路径，需要更新所有点
      if (this.state.draggedElement.type === 'path') {
        const path = this.state.draggedElement as IElement & { points: Point[] };
        if (path.points) {
          for (const point of path.points) {
            point.x += deltaX;
            point.y += deltaY;
          }
        }
      }

      // 更新空间索引
      this.spatialIndex.update(this.state.draggedElement);

      // 触发回调（传入旧位置，用于清除残影）
      if (this.onElementMoved) {
        this.onElementMoved(this.state.draggedElement, deltaX, deltaY, oldBounds);
      }

      // 更新起始点
      this.state.startPoint = canvasPoint;
    }
  }

  /**
   * 处理鼠标抬起
   */
  handleMouseUp(clientX: number, clientY: number): void {
    if (!this.state.isActive) {
      return;
    }

    const canvasPoint = this.screenToCanvas(clientX, clientY);

    if (this.mode === InteractionMode.PEN && this.currentPathPoints.length > 1) {
      // 完成路径绘制
      if (this.onPathComplete) {
        this.onPathComplete([...this.currentPathPoints]);
      }
      this.currentPathPoints = [];
    } else if (this.mode === InteractionMode.RECTANGLE && this.state.startPoint) {
      // 完成矩形绘制
      if (this.onRectangleComplete) {
        this.onRectangleComplete(this.state.startPoint, canvasPoint);
      }
    }

    // 重置状态
    this.state.isActive = false;
    this.state.draggedElement = null;
    this.state.dragOffset = null;
  }

  /**
   * 获取当前选中的元素
   */
  getSelectedElement(): IElement | null {
    return this.state.selectedElement;
  }

  /**
   * 清除选中
   */
  clearSelection(): void {
    if (this.state.selectedElement) {
      this.state.selectedElement.selected = false;
    }
    this.state.selectedElement = null;
    if (this.onElementSelected) {
      this.onElementSelected(null);
    }
  }
}

