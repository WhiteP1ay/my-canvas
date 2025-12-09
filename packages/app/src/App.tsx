import { useState, useRef } from 'react';
import { Canvas } from '@canvas/canvas';
import { InteractionMode, CanvasEngine } from '@canvas/core';
import type { IElement } from '@canvas/elements';
import './App.css';

function App() {
  const [mode, setMode] = useState<InteractionMode>(InteractionMode.SELECT);
  const [selectedElement, setSelectedElement] = useState<IElement | null>(null);
  const engineRef = useRef<CanvasEngine | null>(null);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Canvas 协作白板引擎</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setMode(InteractionMode.SELECT)}
          style={{
            marginRight: '10px',
            padding: '8px 16px',
            backgroundColor: mode === InteractionMode.SELECT ? '#3b82f6' : '#e5e7eb',
            color: mode === InteractionMode.SELECT ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          选择模式
        </button>
        <button
          onClick={() => setMode(InteractionMode.PEN)}
          style={{
            marginRight: '10px',
            padding: '8px 16px',
            backgroundColor: mode === InteractionMode.PEN ? '#3b82f6' : '#e5e7eb',
            color: mode === InteractionMode.PEN ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          画笔
        </button>
        <button
          onClick={() => setMode(InteractionMode.RECTANGLE)}
          style={{
            padding: '8px 16px',
            backgroundColor: mode === InteractionMode.RECTANGLE ? '#3b82f6' : '#e5e7eb',
            color: mode === InteractionMode.RECTANGLE ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          矩形
        </button>
      </div>

      <div style={{ position: 'relative' }}>
        <Canvas 
          width={600} 
          height={400} 
          mode={mode}
          onElementSelected={setSelectedElement}
          engineRef={engineRef}
        />
        {selectedElement && (
          <button
            onClick={() => {
              if (engineRef.current) {
                engineRef.current.deleteSelectedElement();
                setSelectedElement(null);
              }
            }}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              padding: '8px 16px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
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
