import React, { useRef } from "react";
import { LeftCircleOutlined, RightCircleOutlined } from "@ant-design/icons";
import styles from "../page.module.css";

const NodeTab = ({ tagTabList, currentTag, onUpdateCurrentTag }) => {
  const scrollContainer = useRef(null);
  const scrollTarget = useRef(null);

  const handleLeft = () => {
    if (!scrollTarget.current || !scrollContainer.current) return;

    let leftWidth = parseInt(scrollTarget.current.style.left || "0") + 92;
    leftWidth = Math.min(leftWidth, 0);
    scrollTarget.current.style.left = `${leftWidth}px`;
  };

  const handleRight = () => {
    if (!scrollTarget.current || !scrollContainer.current) return;

    let rightWidth = parseInt(scrollTarget.current.style.left || "0") - 92;

    const maxRight =
      scrollContainer.current.offsetWidth - scrollTarget.current.scrollWidth;

    rightWidth = Math.max(rightWidth, maxRight);
    scrollTarget.current.style.left = `${rightWidth}px`;
  };

  const handleTabClick = (index) => {
    onUpdateCurrentTag(index);
  };

  return (
    <div className={styles["tab-container"]}>
      <div className={styles["scroller-container"]} ref={scrollContainer}>
        <ul className={styles["tabs-item-container"]} ref={scrollTarget}>
          {tagTabList.map((item, index) => (
            <li
              key={index}
              className={currentTag === index ? styles["tabs-active"] : ""}
              onClick={() => handleTabClick(index)}
            >
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {tagTabList.length > 3 && (
        <div className={styles["tab-switch-container"]}>
          <LeftCircleOutlined onClick={handleLeft} />
          <RightCircleOutlined onClick={handleRight} />
        </div>
      )}
    </div>
  );
};

export default NodeTab;
