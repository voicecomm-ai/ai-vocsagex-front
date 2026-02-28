// 创建tag标签
// 全局临时标签元素缓存
let tempTag = null;

// 创建临时标签（仅显示全称）
function createTempTag(text, x, y) {
  // 销毁已有标签
  if (tempTag) {
    document.body.removeChild(tempTag);
  }

  // 创建新标签
  tempTag = document.createElement("div");
  tempTag.style.cssText = `
    position: fixed;
    padding: 2px 8px;
    border-radius: 4px;
    background: rgba(18, 30, 58, 0.9);
    color: white;
    font-size: 14px;
    pointer-events: none; /* 避免遮挡鼠标事件 */
    z-index: 9999; /* 确保在最上层 */
    max-width: 300px;
  `;
  tempTag.textContent = text || "暂无内容";

  // 定位（偏移鼠标位置避免遮挡）
  tempTag.style.left = `${x + 10}px`;
  tempTag.style.top = `${y + 10}px`;

  document.body.appendChild(tempTag);
}

// 移除临时标签
function removeTempTag() {
  if (tempTag) {
    document.body.removeChild(tempTag);
    tempTag = null;
  }
}

// 核心函数：鼠标悬停时显示全称标签
export function createLabelDetail(node, event) {
  const { name } = node.data() || {};
  const { clientX, clientY } = event.originalEvent || event;
  if (name && clientX && clientY) {
    createTempTag(name, clientX, clientY);
  }
}

// 核心函数：鼠标离开时移除标签
export function removeLabelDetail() {
  removeTempTag();
}

// 导出空组件（保持原有导出结构兼容）
export default () => null;
