import { useState, useRef } from "react";
import { Canvas } from "@canvas/canvas";
import { InteractionMode, CanvasEngine } from "@canvas/core";
import type { IElement } from "@canvas/elements";
import {
  generateRandomElements,
  formatPerformanceResult,
  logPerformanceResult,
} from "./utils/performanceTest";
import "./App.css";

function App() {
  const [mode, setMode] = useState<InteractionMode>(InteractionMode.SELECT);
  const [selectedElement, setSelectedElement] = useState<IElement | null>(null);
  const engineRef = useRef<CanvasEngine | null>(null);

  /**
   * 处理性能测试按钮点击
   */
  const handlePerformanceTest = () => {
    if (!engineRef.current) {
      return;
    }

    const result = generateRandomElements(engineRef.current, 10000, 600, 400);

    logPerformanceResult(result);
    alert(formatPerformanceResult(result));
  };

  return (
    <div className="app-container">
      <h1 className="app-title">Canvas 协作白板引擎</h1>
      <div className="app-subtitle">
        缩放：在画布上滚动鼠标滚轮 <br />
        平移：按住鼠标中键拖拽 或按住空格键 + 鼠标左键拖拽
      </div>

      <div className="button-group">
        <button
          className={`btn btn-mode ${
            mode === InteractionMode.SELECT ? "active" : ""
          }`}
          onClick={() => setMode(InteractionMode.SELECT)}
        >
          选择模式
        </button>
        <button
          className={`btn btn-mode ${
            mode === InteractionMode.PEN ? "active" : ""
          }`}
          onClick={() => setMode(InteractionMode.PEN)}
        >
          画笔
        </button>
        <button
          className={`btn btn-mode ${
            mode === InteractionMode.RECTANGLE ? "active" : ""
          }`}
          onClick={() => setMode(InteractionMode.RECTANGLE)}
        >
          矩形
        </button>
        <button className="btn btn-performance" onClick={handlePerformanceTest}>
          生成 10,000 个元素（性能测试）
        </button>
      </div>

      <div className="canvas-container">
        <Canvas
          width={600}
          height={400}
          mode={mode}
          onElementSelected={setSelectedElement}
          engineRef={engineRef}
        />
        {selectedElement && (
          <button
            className="btn btn-delete"
            onClick={() => {
              if (engineRef.current) {
                engineRef.current.deleteSelectedElement();
                setSelectedElement(null);
              }
            }}
          >
            删除选中
          </button>
        )}
      </div>
    </div>
  );
}

export default App;
