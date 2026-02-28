"use client";
// 控制溢出显示组件
import React, { useRef, useEffect, useState } from "react";
import { Tooltip, Tag } from "antd";
const { CheckableTag } = Tag;

const EllipsisCheckableTag = ({ label, checked, onChange, className = "", ...rest }) => {
  const textRef = useRef(null);
  const [isOverflow, setIsOverflow] = useState(false);

  useEffect(() => {
    const el = textRef.current;
    if (el) {
      const hasOverflow = el.scrollWidth > el.clientWidth;
      setIsOverflow(hasOverflow);
    }
  }, [label]);

  const tagContent = (
    <CheckableTag
      checked={checked}
      onChange={onChange}
    className={className}
      {...rest}
    >
      <span
        ref={textRef}
        style={{
          display: "block",
          maxWidth: "180px", // 必须加限制，否则不会触发溢出
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
        }}
      >
        {label}
      </span>
    </CheckableTag>
  );

  return isOverflow ? (
    <Tooltip title={label} placement="top" color="rgba(54, 64, 82, 0.90)">
      {tagContent}
    </Tooltip>
  ) : (
    tagContent
  );
};

export default EllipsisCheckableTag;
