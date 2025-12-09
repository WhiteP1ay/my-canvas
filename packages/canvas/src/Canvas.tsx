/**
 * Canvas React 组件
 * 封装 CanvasEngine，提供 React 接口
 */

import { useEffect, useRef } from 'react';
import { CanvasEngine, InteractionMode, generateId } from '@canvas/core';
import { Rectangle, Path } from '@canvas/elements';
import type { IElement } from '@canvas/elements';
import type { Point } from '@canvas/math';

interface CanvasProps {
  width?: number;
  height?: number;
  mode?: InteractionMode;
  onModeChange?: (mode: InteractionMode) => void;
  onElementSelected?: (element: IElement | null) => void;
  engineRef?: React.MutableRefObject<CanvasEngine | null>;
}

export function Canvas({ 
  width = 800, 
  height = 600, 
  mode = InteractionMode.SELECT,
  onElementSelected,
  engineRef: externalEngineRef,
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const internalEngineRef = useRef<CanvasEngine | null>(null);
  const engineRef = externalEngineRef || internalEngineRef;

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    // 初始化引擎
    const engine = new CanvasEngine(canvasRef.current);
    engineRef.current = engine;

    // 设置选中回调
    if (onElementSelected) {
      engine.onElementSelected(onElementSelected);
    }

    // 设置路径绘制完成回调
    engine.onPathComplete((points: Point[]) => {
      if (points.length < 2) {
        return;
      }
      const path = new Path(generateId('path'), points, {
        strokeColor: '#000000',
        strokeWidth: 2,
        fillColor: undefined,
      });
      engine.addElement(path);
    });

    // 设置矩形绘制完成回调
    engine.onRectangleComplete((start: Point, end: Point) => {
      const x = Math.min(start.x, end.x);
      const y = Math.min(start.y, end.y);
      const w = Math.abs(end.x - start.x);
      const h = Math.abs(end.y - start.y);

      if (w < 5 || h < 5) {
        // 矩形太小，忽略
        return;
      }

      const rect = new Rectangle(generateId('rect'), x, y, w, h, {
        fillColor: '#3b82f6',
        strokeColor: '#1e40af',
        strokeWidth: 2,
      });
      engine.addElement(rect);
    });

    // 清理
    return () => {
      engine.destroy();
    };
  }, []); // 注意：onElementSelected 在初始化时设置，后续变化不会更新

  // 更新选中回调（当 prop 变化时）
  useEffect(() => {
    if (engineRef.current && onElementSelected) {
      engineRef.current.onElementSelected(onElementSelected);
    }
  }, [onElementSelected]);

  // 更新模式
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setMode(mode);
    }
  }, [mode]);

  // 调整大小
  useEffect(() => {
    if (engineRef.current && canvasRef.current) {
      engineRef.current.resize();
    }
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        border: '1px solid #ccc',
        cursor: mode === InteractionMode.PEN ? 'crosshair' : 'default',
      }}
    />
  );
}

