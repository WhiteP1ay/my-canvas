# Canvas 协作白板核心引擎 - 架构设计文档

## 📋 概述

本引擎设计参考 Excalidraw 的架构思路，采用模块化设计，确保高性能、可扩展和易维护。虽然实现简化，但保持清晰的架构边界和职责划分。

## 🏗️ 整体架构

```
src/
├── core/                    # 核心引擎层
│   ├── CanvasEngine.ts      # 主引擎（协调所有模块）
│   ├── Renderer.ts          # 渲染引擎
│   ├── InteractionManager.ts # 交互管理器
│   └── ElementManager.ts    # 元素管理器
│
├── math/                    # 数学工具包（参考 Excalidraw）
│   ├── point.ts             # 点相关计算
│   ├── line.ts              # 线段相关计算
│   ├── geometry.ts          # 几何计算（距离、相交等）
│   └── transform.ts         # 坐标变换
│
├── elements/                # 元素定义（类似 Excalidraw 的 element 包）
│   ├── BaseElement.ts       # 基础元素抽象类
│   ├── Rectangle.ts         # 矩形元素
│   ├── Circle.ts            # 圆形元素
│   └── Path.ts              # 路径元素（手绘）
│
├── spatial/                 # 空间索引系统
│   └── Quadtree.ts          # 四叉树实现
│
├── utils/                   # 工具函数
│   ├── id.ts                # ID 生成
│   ├── bounds.ts            # 边界框计算
│   └── performance.ts       # 性能监控
│
└── types/                   # 类型定义
    ├── element.ts           # 元素类型
    ├── transform.ts         # 变换类型
    └── events.ts            # 事件类型
```

## 📦 模块详细设计

### 1. Core 核心引擎层

#### 1.1 CanvasEngine（主引擎）
**职责：** 作为整个引擎的入口和协调中心

**核心功能：**
- 初始化 Canvas 元素和所有子模块
- 管理渲染循环（requestAnimationFrame）
- 协调 Renderer、InteractionManager、ElementManager
- 提供统一的 API 接口
- 处理生命周期（初始化、销毁、重置）

**关键方法：**
```typescript
class CanvasEngine {
  // 初始化
  init(canvas: HTMLCanvasElement): void
  
  // 渲染循环
  private renderLoop(): void
  
  // 添加/删除元素
  addElement(element: IElement): void
  removeElement(id: string): void
  
  // 获取元素
  getElement(id: string): IElement | null
  getAllElements(): IElement[]
  
  // 变换操作
  setTransform(transform: Transform): void
  zoom(delta: number, center: Point): void
  pan(deltaX: number, deltaY: number): void
  
  // 事件处理
  handlePointerEvent(event: PointerEvent): void
  handleWheelEvent(event: WheelEvent): void
}
```

#### 1.2 Renderer（渲染引擎）
**职责：** 负责将元素渲染到 Canvas 上

**核心功能：**
- 全量渲染和增量渲染（脏矩形优化）
- 支持变换矩阵（缩放、平移）
- 高质量渲染（设备像素比适配）
- 渲染区域裁剪

**性能优化策略：**
- **脏矩形（Dirty Rectangles）**：只重绘变化的区域
- **区域合并**：合并重叠的脏矩形
- **视口裁剪**：只渲染可见区域的元素
- **批量渲染**：合并相同类型的绘制操作

**关键方法：**
```typescript
class Renderer {
  // 渲染所有元素
  render(elements: IElement[]): void
  
  // 标记脏区域
  markDirty(bounds: BoundingBox): void
  markDirtyAll(): void
  
  // 设置变换
  setTransform(transform: Transform): void
  
  // 调整画布大小
  resize(width: number, height: number): void
}
```

#### 1.3 InteractionManager（交互管理器）
**职责：** 处理所有用户交互事件

**核心功能：**
- 鼠标/触摸事件处理
- 元素选中检测（基于空间索引）
- 拖拽操作
- 画布平移（Pan）
- 画布缩放（Zoom）
- 路径绘制（手绘）

**交互状态机：**
```
NONE → SELECT (点击元素)
NONE → DRAG (点击元素后移动)
NONE → PAN (按住空格/中键移动)
NONE → DRAW (空白区域点击开始绘制)
NONE → ZOOM (滚轮事件)
```

**关键方法：**
```typescript
class InteractionManager {
  // 处理指针事件
  handlePointerDown(event: PointerEvent): void
  handlePointerMove(event: PointerEvent): void
  handlePointerUp(event: PointerEvent): void
  
  // 处理滚轮缩放
  handleWheel(event: WheelEvent): void
  
  // 获取选中元素
  getSelectedElement(): IElement | null
  
  // 清除选中
  clearSelection(): void
}
```

#### 1.4 ElementManager（元素管理器）
**职责：** 管理所有画布元素的生命周期

**核心功能：**
- 元素的增删改查
- 元素层级管理（Z-index）
- 与空间索引同步
- 元素序列化/反序列化

**关键方法：**
```typescript
class ElementManager {
  // CRUD 操作
  add(element: IElement): void
  remove(id: string): boolean
  update(element: IElement): void
  get(id: string): IElement | null
  getAll(): IElement[]
  
  // 层级操作
  bringToFront(id: string): void
  sendToBack(id: string): void
  
  // 空间查询
  queryByBounds(bounds: BoundingBox): IElement[]
  queryByPoint(point: Point): IElement | null
}
```

### 2. Math 数学工具包

参考 Excalidraw 的 math 包设计，提供纯函数式的数学计算工具。

#### 2.1 point.ts
```typescript
// 点相关计算
export function distance(a: Point, b: Point): number
export function midpoint(a: Point, b: Point): Point
export function add(a: Point, b: Point): Point
export function subtract(a: Point, b: Point): Point
export function scale(point: Point, factor: number): Point
```

#### 2.2 line.ts
```typescript
// 线段相关计算（参考 Excalidraw）
export function line(a: Point, b: Point): Line
export function linesIntersectAt(a: Line, b: Line): Point | null
export function pointToLineDistance(point: Point, line: Line): number
```

#### 2.3 geometry.ts
```typescript
// 几何计算
export function pointInRect(point: Point, rect: BoundingBox): boolean
export function rectsIntersect(a: BoundingBox, b: BoundingBox): boolean
export function rectContains(container: BoundingBox, contained: BoundingBox): boolean
export function expandBounds(bounds: BoundingBox, padding: number): BoundingBox
```

#### 2.4 transform.ts
```typescript
// 坐标变换
export function applyTransform(point: Point, transform: Transform): Point
export function applyInverseTransform(point: Point, transform: Transform): Point
export function transformBounds(bounds: BoundingBox, transform: Transform): BoundingBox
```

### 3. Elements 元素定义

#### 3.1 BaseElement（基础元素）
**职责：** 定义所有元素的通用接口和行为

**核心属性：**
- `id: string` - 唯一标识
- `type: ElementType` - 元素类型
- `x, y: number` - 位置
- `style: ElementStyle` - 样式
- `selected: boolean` - 选中状态

**核心方法：**
```typescript
abstract class BaseElement {
  // 获取边界框
  abstract getBounds(): BoundingBox
  
  // 点命中检测
  abstract hitTest(point: Point, threshold?: number): boolean
  
  // 渲染
  abstract render(ctx: CanvasRenderingContext2D, transform?: Transform): void
  
  // 克隆
  abstract clone(): BaseElement
  
  // 序列化
  abstract toJSON(): ElementData
}
```

#### 3.2 Rectangle / Circle / Path
每个元素类型实现 BaseElement 的抽象方法，提供特定的渲染和命中检测逻辑。

### 4. Spatial 空间索引

#### 4.1 Quadtree（四叉树）
**职责：** 提供高效的空间查询能力

**核心功能：**
- 插入元素（自动分裂）
- 区域查询（query by bounds）
- 点查询（query by point）
- 动态更新

**性能特点：**
- O(log n) 查询复杂度
- 支持大量元素（10,000+）
- 自动平衡

### 5. Utils 工具函数

- **id.ts**: 生成唯一 ID（UUID 或自增）
- **bounds.ts**: 边界框计算和操作
- **performance.ts**: 性能监控（FPS、渲染时间）

## 🚀 性能优化策略

### 1. 渲染优化
- ✅ **脏矩形技术**：只重绘变化区域
- ✅ **视口裁剪**：只渲染可见元素
- ✅ **批量操作**：合并相同类型的绘制
- ✅ **设备像素比适配**：高 DPI 屏幕优化

### 2. 查询优化
- ✅ **四叉树空间索引**：O(log n) 查询
- ✅ **点查询优化**：从后往前遍历（上层元素优先）
- ✅ **区域查询优化**：只查询相关子树

### 3. 内存优化
- ✅ **对象池**：复用临时对象（可选）
- ✅ **懒加载**：按需创建元素
- ✅ **弱引用**：避免循环引用

### 4. 渲染循环优化
- ✅ **requestAnimationFrame**：与浏览器刷新率同步
- ✅ **帧率控制**：限制最大 FPS（可选）
- ✅ **防抖/节流**：减少不必要的重绘

## 🔄 数据流

```
用户交互
  ↓
InteractionManager (处理事件)
  ↓
ElementManager (更新元素状态)
  ↓
SpatialIndex (更新空间索引)
  ↓
Renderer (标记脏区域)
  ↓
CanvasEngine (触发渲染循环)
  ↓
Renderer (执行渲染)
  ↓
Canvas (显示结果)
```

## 📊 性能目标

- **10,000+ 元素**：保持 60 FPS
- **交互响应**：< 16ms 延迟
- **内存占用**：< 100MB（10,000 元素）
- **初始加载**：< 100ms

## 🎯 实现优先级

### Phase 1: 核心功能（必须）
1. ✅ 基础元素类型（Rectangle, Circle, Path）
2. ✅ 渲染引擎（基础渲染）
3. ✅ 交互管理器（选中、拖拽）
4. ✅ 主引擎整合

### Phase 2: 性能优化（重要）
1. ✅ 空间索引（四叉树）
2. ✅ 脏矩形优化
3. ✅ 视口裁剪

### Phase 3: 高级功能（可选）
1. ⏳ 画布缩放/平移
2. ⏳ 元素层级管理
3. ⏳ 序列化/反序列化
4. ⏳ 性能监控

## 🔗 参考资源

- [Excalidraw GitHub](https://github.com/excalidraw/excalidraw)
- [Excalidraw Math Package](https://github.com/excalidraw/excalidraw/tree/master/packages/math)
- [Canvas API 文档](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

---

**设计原则：**
1. **单一职责**：每个模块只负责一件事
2. **依赖注入**：模块间通过接口通信
3. **可测试性**：纯函数和清晰的接口
4. **可扩展性**：易于添加新元素类型
5. **性能优先**：从设计阶段考虑性能

