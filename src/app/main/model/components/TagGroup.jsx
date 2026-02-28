"use client";

import { Tag, Button } from "antd";
import { useRef, useEffect, useState } from "react";
import { RightOutlined, LeftOutlined } from "@ant-design/icons";
import styles from "./index.module.css";
import EllipsisCheckableTag from "@/app/components/common/EllipsisTooltip";

const { CheckableTag } = Tag;

export default function TagGroup({
  list,
  selectedTags,
  onChange,
  keyField = "id",
  labelField = "name",
  children,
}) {
  const tagScrollRef = useRef(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [showLeftArrow, setShowLeftArrow] = useState(false);//左箭头

  useEffect(() => {
    const container = tagScrollRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      if (e.deltaY === 0) return;
      e.preventDefault();
      container.scrollLeft += e.deltaY;
    };

    const checkScroll = () => {
      const container = tagScrollRef.current;
      if (!container) return;

      const scrollable = container.scrollWidth > container.clientWidth;
      const canScrollLeft = container.scrollLeft > 0;

      setShowScrollBtn(scrollable);
      setShowLeftArrow(scrollable && canScrollLeft);
    };
    container.addEventListener("scroll", checkScroll);

    container.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("resize", checkScroll);
    checkScroll();

    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [list]);

  const scrollRight = () => {
    tagScrollRef.current.scrollLeft += 100;
  };

  const scrollLeft = () => {
    tagScrollRef.current.scrollLeft -= 100;
  };

  const isAllSelected = selectedTags.length === 0;

  return (
    <div className={styles.container}>

      {showScrollBtn && showLeftArrow && (
        <Button
          icon={<LeftOutlined />}
          className={`${styles.scrollBtn} ${styles.leftBtn}`}
          onClick={scrollLeft}
        />
      )}

      <div className={styles.tagWrapper} ref={tagScrollRef}>
        <CheckableTag
          key="all"
          checked={isAllSelected}
          onChange={(checked) => {
            if (checked) onChange([], true);
          }}
          className={`${styles.tag} ${isAllSelected ? styles.active : ""}`}
        >
          全部
        </CheckableTag>

        {list.map((tag) => {
          const key = tag[keyField];
          const label = tag[labelField];
          const isChecked = selectedTags.includes(tag);
          return (
            <EllipsisCheckableTag
              className={`${styles.tag} ${isChecked ? styles.active : ""}`}
              key={key}
              label={label}
              checked={isChecked}
              onChange={(checked) => onChange(tag, checked)}
            />
          );
        })}

        {!showScrollBtn && children /* 标签未超出时放在末尾 */}
      </div>

      {showScrollBtn && (
        <div className={styles.controlGroup}>
          {children /* 标签超出时固定放右侧 */}
          <Button
            icon={<RightOutlined />}
            className={styles.scrollBtn}
            onClick={scrollRight}
          />
        </div>
      )}
    </div>
  );
}
