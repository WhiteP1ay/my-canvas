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
# 或
npm install
```

### 启动开发服务器

```bash
yarn dev
# 或
npm run dev
```

然后在浏览器中打开 `http://localhost:5173`（Vite 默认端口）

### 构建生产版本

```bash
yarn build
# 或
npm run build
```

### 预览生产构建

```bash
yarn preview
# 或
npm run preview
```

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
- ✅ **元素选中和拖拽**：点击选中，拖拽移动
- ✅ **空间索引优化**：四叉树实现，支持 10,000+ 元素
- ✅ **脏矩形渲染**：只重绘变化区域，保持 60 FPS

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
