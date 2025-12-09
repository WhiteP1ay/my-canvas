/**
 * 性能测试工具
 * 用于生成大量随机元素以测试引擎性能
 */

import { generateId } from "@canvas/core";
import { Rectangle, Path } from "@canvas/elements";
import type { IElement } from "@canvas/elements";
import type { Point } from "@canvas/math";
import type { CanvasEngine } from "@canvas/core";

/**
 * 性能测试结果
 */
export interface PerformanceTestResult {
  /** 创建的元素数量 */
  count: number;
  /** 创建元素耗时（ms） */
  createDuration: number;
  /** 添加元素耗时（ms） */
  addDuration: number;
  /** 总耗时（ms） */
  totalDuration: number;
}

/**
 * 随机生成大量元素用于性能测试
 * @param engine Canvas 引擎实例
 * @param count 要生成的元素数量，默认 10000
 * @param canvasWidth 画布宽度，用于计算元素分布范围
 * @param canvasHeight 画布高度，用于计算元素分布范围
 * @returns 性能测试结果
 */
export function generateRandomElements(
  engine: CanvasEngine,
  count: number = 10000,
  canvasWidth: number = 600,
  canvasHeight: number = 400
): PerformanceTestResult {
  const startTime = performance.now();
  const elements: IElement[] = [];

  // 颜色池
  const colors = [
    "#3b82f6",
    "#ef4444",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
    "#84cc16",
    "#f97316",
    "#6366f1",
  ];
  const pathColors = [
    "#000000",
    "#3b82f6",
    "#ef4444",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
    "#84cc16",
    "#f97316",
  ];

  // 生成矩形和路径
  for (let i = 0; i < count; i++) {
    const isRectangle = Math.random() > 0.5;

    if (isRectangle) {
      // 生成随机矩形
      const x = Math.random() * (canvasWidth * 2) - canvasWidth;
      const y = Math.random() * (canvasHeight * 2) - canvasHeight;
      const width = 20 + Math.random() * 80;
      const height = 20 + Math.random() * 80;

      const fillColor = colors[Math.floor(Math.random() * colors.length)];
      const strokeColor = colors[Math.floor(Math.random() * colors.length)];

      const rect = new Rectangle(generateId("rect"), x, y, width, height, {
        fillColor,
        strokeColor,
        strokeWidth: 1 + Math.random() * 2,
        opacity: 0.7 + Math.random() * 0.3,
      });
      elements.push(rect);
    } else {
      // 生成随机路径
      const pointCount = 3 + Math.floor(Math.random() * 5);
      const startX = Math.random() * (canvasWidth * 2) - canvasWidth;
      const startY = Math.random() * (canvasHeight * 2) - canvasHeight;
      const points: Point[] = [{ x: startX, y: startY }];

      for (let j = 1; j < pointCount; j++) {
        points.push({
          x: points[j - 1].x + (Math.random() - 0.5) * 50,
          y: points[j - 1].y + (Math.random() - 0.5) * 50,
        });
      }

      const strokeColor =
        pathColors[Math.floor(Math.random() * pathColors.length)];

      const path = new Path(generateId("path"), points, {
        strokeColor,
        strokeWidth: 1 + Math.random() * 3,
        opacity: 0.6 + Math.random() * 0.4,
      });
      elements.push(path);
    }
  }

  // 批量添加所有元素（直接操作 ElementManager 避免每次标记脏区域）
  const addStartTime = performance.now();
  const elementManager = engine["elementManager"];
  for (const element of elements) {
    elementManager.add(element);
  }
  // 最后触发一次全量重绘
  engine["renderer"].markDirty();

  const endTime = performance.now();
  const createDuration = addStartTime - startTime;
  const addDuration = endTime - addStartTime;
  const totalDuration = endTime - startTime;

  return {
    count,
    createDuration,
    addDuration,
    totalDuration,
  };
}

/**
 * 格式化性能测试结果为字符串
 */
export function formatPerformanceResult(result: PerformanceTestResult): string {
  return (
    `成功生成 ${result.count} 个元素！\n` +
    `创建耗时: ${result.createDuration.toFixed(2)}ms\n` +
    `添加耗时: ${result.addDuration.toFixed(2)}ms\n` +
    `总耗时: ${result.totalDuration.toFixed(2)}ms\n\n` +
    `现在可以测试拖拽、缩放、平移等操作的性能。`
  );
}

/**
 * 在控制台输出性能测试结果
 */
export function logPerformanceResult(result: PerformanceTestResult): void {
  console.log(`✅ 成功生成 ${result.count} 个元素`);
  console.log(`   创建耗时: ${result.createDuration.toFixed(2)}ms`);
  console.log(`   添加耗时: ${result.addDuration.toFixed(2)}ms`);
  console.log(`   总耗时: ${result.totalDuration.toFixed(2)}ms`);
}
