# Canvas 协作白板引擎 - Monorepo 结构

## 📦 包结构

参考 Excalidraw 的 monorepo 架构，将引擎拆分为多个独立的包：

```
packages/
├── math/          # 数学工具包（纯函数式）
│   ├── point.ts   # 点相关计算
│   ├── geometry.ts # 几何计算
│   └── transform.ts # 坐标变换
│
├── elements/      # 元素定义包
│   ├── BaseElement.ts
│   ├── Rectangle.ts
│   └── Path.ts
│
├── core/          # 核心引擎包
│   ├── CanvasEngine.ts    # 主引擎
│   ├── Renderer.ts        # 渲染引擎
│   ├── InteractionManager.ts # 交互管理器
│   ├── ElementManager.ts  # 元素管理器
│   └── SpatialIndex.ts    # 空间索引（四叉树）
│
└── canvas/        # React 组件包
    └── Canvas.tsx
```

## 🔗 依赖关系

```
canvas → core → elements → math
                ↓
            elements → math
```

## 📝 使用方式

```typescript
import { Canvas } from '@canvas/canvas';
import { InteractionMode } from '@canvas/core';

// 在 React 组件中使用
<Canvas 
  width={1200} 
  height={800} 
  mode={InteractionMode.PEN} 
/>
```

## 🎯 功能

- ✅ 画笔绘制（路径）
- ✅ 矩形绘制
- ✅ 元素选中和拖拽
- ✅ 空间索引优化（四叉树）
- ✅ 脏矩形渲染优化
- ✅ 60 FPS 性能目标

