"use client";
import { useState, useEffect, useRef } from "react";
import { Tooltip } from "antd";

export default function EllipsisTooltip({ children, maxWidth = 120 }) {
  const spanRef = useRef(null);
  const [isOverflow, setIsOverflow] = useState(false);

  useEffect(() => {
    const el = spanRef.current;
    if (el) {
      setIsOverflow(el.scrollWidth > el.clientWidth);
    }
  }, [children]);

  const content = (
    <span
      ref={spanRef}
      style={{
        display: "inline-block",
        maxWidth,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        verticalAlign: "middle",
        cursor: isOverflow ? "pointer" : "default",
      }}
    >
      {children}
    </span>
  );

  return isOverflow ? (
    <Tooltip
      title={<div style={{ fontSize: 12 }}>{children}</div>}
      color="rgba(54, 64, 82, 0.90)"
    >
      {content}
    </Tooltip>
  ) : (
    content
  );
}
