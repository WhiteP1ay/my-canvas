/**
 * 工具函数
 */

/**
 * 生成唯一 ID
 */
let idCounter = 0;
export function generateId(prefix: string = 'element'): string {
  return `${prefix}_${Date.now()}_${++idCounter}`;
}

