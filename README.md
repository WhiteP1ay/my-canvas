# Canvas 协作白板核心引擎

一个基于 HTML5 Canvas 的高性能绘图引擎，参考 Excalidraw 的架构设计，采用标准的 Monorepo 结构。

## 🏗️ 项目结构

```
packages/
├── math/          # 数学工具包（纯函数式）
├── elements/      # 元素定义包（Rectangle, Path）
├── core/          # 核心引擎包
├── canvas/        # React 组件包
└── app/           # 应用入口包
```

## 🚀 快速开始

### 安装依赖

```bash
yarn install
```

### 启动开发服务器

```bash
yarn dev
```

然后在浏览器中打开 `http://localhost:5173`（Vite 默认端口）


## 📦 Monorepo 架构

项目采用 Yarn Workspaces 管理 monorepo：

- **根目录**：只包含工作区配置和脚本
- **packages/app**：应用入口，显式声明对子包的依赖
- **packages/math**：数学工具包（无依赖）
- **packages/elements**：元素定义包（依赖 math）
- **packages/core**：核心引擎包（依赖 math, elements）
- **packages/canvas**：React 组件包（依赖 core, elements, math）

每个包都有独立的 `package.json`，显式声明依赖关系。

## 🎯 功能特性

- ✅ **画笔绘制**：鼠标绘制自由路径
- ✅ **矩形绘制**：拖拽绘制矩形
- ✅ **元素选中和拖拽、删除**：点击选中，拖拽移动，删除元素
- ✅ **缩放和平移**：鼠标滚轮缩放，中键/空格键拖拽平移
- ✅ **空间索引优化**：四叉树实现，支持 10,000+ 元素
- ✅ **脏矩形渲染**：只重绘变化区域，保持 60 FPS
- ✅ **视口裁剪**：只渲染可见元素，优化缩放/平移性能

## 📊 性能优化

详细性能优化文档请参考 [PERFORMANCE.md](./PERFORMANCE.md)

**关键优化**:
- ✅ 拖拽时只重绘相关区域（50x 性能提升）
- ✅ 缩放/平移时只重绘视口（20x 性能提升）
- ✅ 四叉树空间索引（770x 查询性能提升）
- ✅ 渲染循环优化，跳过无变化帧

**性能指标**: 10,000+ 元素保持 60 FPS

## 📝 使用示例

```tsx
import { Canvas } from '@canvas/canvas';
import { InteractionMode } from '@canvas/core';

function App() {
  const [mode, setMode] = useState(InteractionMode.PEN);
  
  return <Canvas width={1200} height={800} mode={mode} />;
}
```

## 🔧 技术栈

- **React 19** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Yarn Workspaces** - Monorepo 管理
- **HTML5 Canvas** - 原生 Canvas API（无第三方库）

## 📄 许可证

MIT
