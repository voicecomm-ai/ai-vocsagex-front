import { useEffect } from "react";

const tableScrollStyles = `
.custom-table {
  scrollbar-arrow-color: transparent !important;
}

.custom-table .ant-table,
.custom-table .ant-table-container,
.custom-table .ant-table-body,
.custom-table .ant-table-content,
.custom-table .ant-table-body-inner {
  scrollbar-width: thin !important;
  scrollbar-color: #eaeaea transparent !important;
  scrollbar-gutter: stable !important;
  scrollbar-arrow-color: transparent !important;
}

/* Webkit 内核浏览器：隐藏滚动条按钮 + 美化滚动条 */
.custom-table ::-webkit-scrollbar-button {
  display: none !important;
  height: 0 !important;
  width: 0 !important;
}

.custom-table ::-webkit-scrollbar {
  width: 6px !important;
  height: 6px !important;
}

.custom-table ::-webkit-scrollbar-thumb {
  background-color: #eaeaea !important;
  border-radius: 3px !important;
}

.custom-table ::-webkit-scrollbar-track {
  background: transparent !important;
}
`;

const CustomTableStyle = () => {
  useEffect(() => {
    // 先检查是否已存在该样式，避免重复插入
    const existingStyle = document.querySelector("#custom-table-scroll-style");
    if (existingStyle) return;

    // 创建 style 标签并设置唯一标识，方便后续管理
    const style = document.createElement("style");
    style.id = "custom-table-scroll-style";
    style.innerHTML = tableScrollStyles;
    document.head.appendChild(style);

    // 组件卸载时移除样式
    return () => {
      const styleToRemove = document.querySelector(
        "#custom-table-scroll-style"
      );
      if (styleToRemove) {
        document.head.removeChild(styleToRemove);
      }
    };
  }, []);

  return null;
};

export { tableScrollStyles };

export default CustomTableStyle;
