import React from 'react';
import styles from "./test.module.css";

const TabItem = ({ item, isActive, onClick }) => {
  return (
    <div
      className={`
        ${styles["test_container_tab_item"]}
        ${isActive ? styles["test_container_tab_item_active"] : ""}
        ${item.disabled ? styles["test_container_tab_item_disabled"] : ""}
      `}
      onClick={() => {
        if(item.disabled){
          return;
        }
        onClick(item.key)
      }}
      style={item.disabled ? { cursor: "not-allowed", color: "#ccc" } : {}}
    >
      {item.label}
    </div>
  );
};

export default TabItem;
