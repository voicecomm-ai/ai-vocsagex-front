import React, { useState, useRef, useEffect, useCallback } from "react";
import { Modal, Form, Checkbox, Button, message } from "antd";
import { ReactSVG } from "react-svg";
import styles from "../page.module.css";

// 主模态框组件
const ContextMenu = ({
  visible,
  actions,
  position,
  onUpdateContextMenuVisible,
  pathList = [],
  onConfirmPathExpand, // 路径拓展确认回调
}) => {
  const menuRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState({ left: "0px", top: "0px" });
  const [pathContainerPosition, setPathContainerPosition] = useState({
    left: "100%",
    top: "0px",
    bottom: "auto",
  });
  const [showPathContainer, setShowPathContainer] = useState(false);

  // 路径选择相关状态
  const [options, setOptions] = useState([]);
  const [allChecked, setAllChecked] = useState(false);
  const [checkedData, setCheckedData] = useState([]);

  useEffect(() => {
    if (allChecked) {
      const allValues = pathList.map((item) => item.extendEdge);
      setCheckedData(allValues);
    } else {
      setCheckedData([]);
    }
  }, [allChecked]);

  // 处理路径选择变化
  const handleCheckChange = useCallback(
    (checkedValues) => {
      setCheckedData(checkedValues);
      // 同步全选状态
      setAllChecked(checkedValues.length === pathList.length);
    },
    [pathList]
  );

  // 处理拓展确认
  const handleExpand = useCallback(() => {
    if (checkedData.length) {
      onConfirmPathExpand?.(checkedData);
      onUpdateContextMenuVisible(false); // 关闭菜单
    } else {
      message.warning("请选择要拓展的路径");
    }
  }, [checkedData, onConfirmPathExpand, onUpdateContextMenuVisible]);

  // 计算菜单定位
  const calculateMenuPosition = useCallback(() => {
    if (!menuRef.current || !position) return;

    const dom = menuRef.current;
    const { width, height } = dom.getBoundingClientRect();
    const { clientWidth, clientHeight } = document.documentElement;

    // 计算菜单自身定位（不超出视口）
    const left = Math.min(position.left, clientWidth - width);
    const top = Math.min(position.top, clientHeight - height);
    setMenuStyle({ left: `${left}px`, top: `${top}px` });

    // 计算路径容器定位
    setTimeout(() => {
      const { right, bottom } = dom.getBoundingClientRect();
      // 垂直方向调整
      if (clientHeight - bottom < 200) {
        setPathContainerPosition((prev) => ({
          ...prev,
          bottom: "0px",
          top: "auto",
        }));
      } else {
        setPathContainerPosition((prev) => ({
          ...prev,
          top: "0px",
          bottom: "auto",
        }));
      }
      // 水平方向调整
      if (clientWidth - right < 170) {
        setPathContainerPosition((prev) => ({
          ...prev,
          left: "calc(-100% - 24px)",
        }));
      } else {
        setPathContainerPosition((prev) => ({ ...prev, left: "100%" }));
      }
    }, 0);
  }, [position]);

  useEffect(() => {
    if (visible) {
      calculateMenuPosition();
      const newOptions = pathList.map((item) => ({
        label: item.extendEdge,
        value: item.extendEdge,
      }));
      setOptions(newOptions);
      setAllChecked(false);
      setCheckedData([]);
    } else {
      setShowPathContainer(false);
      // 重置选中状态
      setAllChecked(false);
      setCheckedData([]);
      setOptions([]);
    }
  }, [visible, position, pathList, calculateMenuPosition]);

  // 处理菜单项点击
  const handleClick = (item, e) => {
    e.stopPropagation(); // 阻止事件冒泡，避免菜单关闭
    if (item.disabled) return;

    if (item.icon === "menu_node_expand") {
      setShowPathContainer(true);
    } else {
      item.action?.(); // 执行菜单项动作
      onUpdateContextMenuVisible(false); // 关闭菜单
    }
  };

  // 处理鼠标悬浮（显示路径容器）
  const handleMouseEnter = (item) => {
    if (item.disabled || item.icon !== "menu_node_expand") return;
    setShowPathContainer(true);
  };

  // 处理鼠标离开（隐藏路径容器）
  const handleMouseLeave = (item) => {
    if (item.disabled || item.icon !== "menu_node_expand") return;
    setTimeout(() => {
      setShowPathContainer(false);
    }, 100); // 延迟隐藏，避免快速切换时闪烁
  };

  // 点击菜单外部关闭
  const handleMenuClick = () => {
    onUpdateContextMenuVisible(false);
  };

  // 阻止右键默认行为
  const handleContextMenu = (e) => {
    e.preventDefault();
  };

  if (!visible) return null; // 不可见时不渲染

  return (
    <div
      ref={menuRef}
      className={styles["menu-wrapper"]}
      style={menuStyle}
      onContextMenu={handleContextMenu}
      onClick={handleMenuClick}
    >
      <ul className={styles["menu-container"]}>
        {actions.map((item, index) => (
          <li
            key={index}
            className={`${styles["menu-item"]} ${
              item.disabled ? styles["is-disabled"] : ""
            }`}
            onClick={(e) => handleClick(item, e)}
            onMouseEnter={() => handleMouseEnter(item)}
            onMouseLeave={() => handleMouseLeave(item)}
          >
            <button disabled={item.disabled} className={styles["label"]}>
              <ReactSVG
                className={styles["util-icon-svg"]}
                src={`/knowledge/graph/${item.icon}.svg`}
              />
              <span className={styles["label-text"]}>{item.label}</span>
            </button>
            {showPathContainer && item.icon === "menu_node_expand" && (
              <div
                className={styles["path-wrapper"]}
                style={pathContainerPosition}
                onMouseEnter={() => setShowPathContainer(true)}
                onMouseLeave={() => setShowPathContainer(false)}
              >
                <div className={styles["path-list-container"]}>
                  {/* 全选复选框 */}
                  <div className={styles["all-path"]}>
                    <Checkbox
                      checked={allChecked}
                      onChange={(e) => setAllChecked(e.target.checked)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      全部
                    </Checkbox>
                  </div>

                  {/* 路径列表复选框组 */}
                  <div
                    className={styles["path-checkbox-group-wrapper"]}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox.Group
                      value={checkedData}
                      options={options}
                      onChange={handleCheckChange}
                      className={styles["path-checkbox-group"]}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  {/* 确认拓展按钮 */}
                  <div className={styles["path-expand__confirm"]}>
                    <Button
                      type="primary"
                      className={styles["expand-confirm__button"]}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExpand();
                      }}
                    >
                      确定拓展
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ContextMenu;
