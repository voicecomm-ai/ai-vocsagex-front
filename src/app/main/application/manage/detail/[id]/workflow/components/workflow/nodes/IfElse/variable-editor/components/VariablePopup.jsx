import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Input, Popover, Typography } from "antd";
import { SearchOutlined, RightOutlined } from "@ant-design/icons";
import variableStyles from "./variableCascader.module.css";

/**
 * 变量弹框组件
 * @param {Object} props - 组件属性
 * @param {boolean} props.visible - 是否显示弹框
 * @param {Object} props.position - 弹框位置 { x, y }
 * @param {Array} props.variables - 变量列表
 * @param {Function} props.onSelect - 选择变量回调
 * @param {Function} props.onClose - 关闭弹框回调
 * @param {string} props.searchText - 搜索文本
 * @param {string} props.type - 需要过滤的变量类型
 */
const VariablePopup = ({
  visible,
  position,
  variables = [],
  onSelect,
  onClose,
  searchText = "",
  type = "",
  filterData = [],
  minWidth = 280,
  allowMiddleSelect = true,
}) => {
  const { Search } = Input;
  const { Text } = Typography;

  // ==================== 状态管理 ====================
  const [filteredVariables, setFilteredVariables] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const popupRef = useRef(null);

  // VariableCascader 相关状态
  const [searchValue, setSearchValue] = useState("");
  const [selectNode, setSelectNode] = useState("");
  const [selectVariable, setSelectVariable] = useState("");
  const [selectParams, setSelectParams] = useState("");
  const [selectData, setSelectData] = useState("");

  useEffect(() => {
    if (!visible) {
      clearSelect();
    }
  }, [variables]);
  /**
   * 根据搜索值过滤数据
   * 支持按节点标题和变量名称进行模糊搜索
   */

  const filteredData = useMemo(() => {
    // 定义变量过滤函数，支持递归过滤所有层级
    const filterByType = (children) => {
      if (!children) return [];

      // 优先使用 filterData 进行过滤
      if (Array.isArray(filterData) && filterData.length > 0) {
        return children
          .map((child) => {
            // 递归过滤所有子层级
            let filteredChildren = child.children;
            if (Array.isArray(child.children)) {
              filteredChildren = filterByType(child.children);
            }

            let filteredProps = child.props;
            if (Array.isArray(child.props)) {
              filteredProps = filterByType(child.props);
            }

            // 只保留符合 filterData 的变量或属性，或者有符合条件的子级
            if (
              filterData.includes(child.variable_type) ||
              (filteredChildren && filteredChildren.length > 0) ||
              (filteredProps && filteredProps.length > 0)
            ) {
              return {
                ...child,
                children: filteredChildren,
                props: filteredProps,
              };
            }
            return null;
          })
          .filter(Boolean);
      }

      // 其次使用 type 进行过滤
      if (type) {
        return children
          .map((child) => {
            // 递归过滤所有子层级
            let filteredChildren = child.children;
            if (Array.isArray(child.children)) {
              filteredChildren = filterByType(child.children);
            }

            let filteredProps = child.props;
            if (Array.isArray(child.props)) {
              filteredProps = filterByType(child.props);
            }

            // 只保留符合 type 的变量或属性，或者有符合条件的子级
            if (
              child.variable_type === type ||
              (filteredChildren && filteredChildren.length > 0) ||
              (filteredProps && filteredProps.length > 0)
            ) {
              return {
                ...child,
                children: filteredChildren,
                props: filteredProps,
              };
            }
            return null;
          })
          .filter(Boolean);
      }

      // 不过滤
      return children;
    };
    // 没有搜索内容时，直接按类型或filterData过滤
    if (!searchValue.trim()) {
      return variables
        .map((node) => ({
          ...node,
          children: filterByType(node.children),
        }))
        .filter((node) => node.children && node.children.length > 0);
    }

    const term = searchValue.toLowerCase();

    // 深度处理每个节点
    return variables
      .map((node) => {
        // 检查节点标题是否匹配搜索词
        const nodeMatches = node.title?.toLowerCase().includes(term);

        // 先按类型或filterData过滤，再按搜索过滤
        const typeFilteredChildren = filterByType(node.children);

        // 递归搜索函数，检查所有层级
        const searchInChildren = (children) => {
          if (!Array.isArray(children)) return false;
          return children.some((child) => {
            const matchSelf =
              child.label?.toLowerCase().includes(term) ||
              child.variable_type?.toLowerCase().includes(term);
            const matchChildren = searchInChildren(child.children);
            const matchProps = searchInChildren(child.props);
            return matchSelf || matchChildren || matchProps;
          });
        };

        // 筛选匹配的变量（检查所有层级）
        const matchedChildren =
          typeFilteredChildren.filter((child) => {
            // 检查变量本身
            const matchSelf =
              child.label?.toLowerCase().includes(term) ||
              child.variable_type?.toLowerCase().includes(term);
            // 检查所有子级
            const matchChildren = searchInChildren(child.children);
            // 检查属性列表
            const matchProps = searchInChildren(child.props);
            return matchSelf || matchChildren || matchProps;
          }) || [];

        if (nodeMatches || matchedChildren.length > 0) {
          return {
            ...node,
            children: matchedChildren, // 只保留匹配的变量
          };
        }

        // 不匹配节点也没有匹配的变量，直接排除
        return null;
      })
      .filter(Boolean); // 去除 null 项
  }, [variables, searchValue, type, filterData]);
  // ==================== 事件处理函数 ====================

  /**
   * 处理搜索输入变化
   * @param {Event} e - 输入事件对象
   */
  const handleSearchChange = useCallback((e) => {
    setSearchValue(e.target.value);
  }, []);

  const variableChange = (value) => {
    onSelect(value);
  };

  /**
   * 节点变量hover事件处理
   * @param {Object} item - 变量项对象
   */
  const nodeVariableItemHover = (item) => {
    setSelectVariable(item);
  };

  /**
   * 节点变量点击事件处理
   * @param {Object} item - 选中的变量项
   */
  const middleArray = ["file", "array[file]"]; //中间变量类型
  const nodeVariableItemClick = (item) => {
    if (!allowMiddleSelect && middleArray.includes(item.type)) {
      return false; //不允许选择中间变量
    }
    if (item?.id?.includes("second") && item.type === "file") {
      return; //不允许选择中间变量
    } else {
      // 递归查找节点的函数
      variableChange(item);
      setSelectData(item);
      clearSelect();
    }
  };

  /**
   * 变量参数点击事件处理
   * @param {Object} item - 选中的参数项
   */
  const variableItemClick = (item) => {
    if (item?.id?.includes("second") && item.type === "file") {
      return;
    } else {
      variableChange(item);
      setSelectData(item);
      clearSelect();
    }
  };

  /**
   * 清除选中效果
   * 重置所有选中状态
   */
  const clearSelect = () => {
    setSelectNode(""); //清空节点
    setSelectVariable(""); //清空变量
    setSelectParams(""); //清空参数
    setSearchValue(""); //清空搜索值
  };

  /**
   * 节点hover事件处理
   * @param {Object} item - 节点项对象
   */
  const nodeItemHover = (item) => {
    setSelectNode(item);
  };

  // ==================== 渲染函数 ====================

  /**
   * 渲染空状态
   * 当没有数据或搜索结果为空时显示
   */
  const renderEmpty = () => {
    if (searchValue.trim()) {
      return <div className={variableStyles.emptyState}>未找到相关内容</div>;
    }
    return <div className={variableStyles.emptyState}>暂无节点/变量</div>;
  };

  /**
   * 渲染节点项及其子变量
   * @param {Object} item - 节点项对象
   * @returns {JSX.Element} 渲染的节点项组件
   */
  const renderNodeItem = (item) => {
    return (
      <div
        className={variableStyles.renderNodeChilds}
        key={item.value}
        onMouseLeave={() => {
          nodeItemHover("");
          setSelectVariable("");
        }}
        onMouseEnter={() => {
          nodeItemHover(item);
        }}
      >
        {item.children.map((child) => {
          return child.children && child.children.length > 0 ? (
            <Popover
              content={renderVariableItem(child)}
              key={child.value}
              trigger='hover'
              placement='leftTop'
              arrow={false}
            >
              <div
                onClick={() => {
                  nodeVariableItemClick(child);
                }}
                onMouseEnter={() => {
                  nodeVariableItemHover(child);
                }}
                className={`${variableStyles.renderNodeChild} ${
                  selectVariable && selectVariable.variable == child.variable
                    ? variableStyles.renderNodeItemActive
                    : ""
                }`}
                key={child.value}
              >
                <img
                  className={variableStyles.renderNodeChildIcon}
                  src='/workflow/variable.png'
                  alt=''
                />
                <div className={variableStyles.renderNodeChildLabel}> {child.label}</div>
                <div className={variableStyles.renderNodeChildRight}>
                  <div className={variableStyles.renderNodeChildString}>
                    {child.variable_type?.toUpperCase()}
                  </div>
                  <RightOutlined className={variableStyles.renderNodeChildRightIcon} />
                </div>
              </div>
            </Popover>
          ) : (
            // 如果没有子变量，直接显示
            <div
              onClick={() => {
                nodeVariableItemClick(child);
              }}
              onMouseEnter={() => {
                nodeVariableItemHover(child);
              }}
              className={`${variableStyles.renderNodeChild} ${
                selectVariable && selectVariable.variable == child.variable
                  ? variableStyles.renderNodeItemActive
                  : ""
              }`}
              key={child.value}
            >
              <img
                className={variableStyles.renderNodeChildIcon}
                src='/workflow/variable.png'
                alt=''
              />
              <div className={variableStyles.renderNodeChildLabel}> {child.label}</div>
              <div className={variableStyles.renderNodeChildRight}>
                <div className={variableStyles.renderNodeChildString}>
                  {child.variable_type?.toUpperCase()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  /**
   * 渲染变量参数列表
   * @param {Object} item - 变量项对象
   * @returns {JSX.Element} 渲染的变量参数组件
   */
  const renderVariableItem = (item) => {
    return (
      <div className={variableStyles.renderNodeChilds} key={item.value}>
        {item.children &&
          item.children.map((child) => {
            return (
              <div
                onClick={() => {
                  variableItemClick(child);
                }}
                className={`${variableStyles.renderNodeChild} ${
                  selectParams && selectParams.variable == child.variable
                    ? variableStyles.renderNodeItemActive
                    : ""
                }`}
                key={child.value}
              >
                <img
                  className={variableStyles.renderNodeChildIcon}
                  src='/workflow/variable.png'
                  alt=''
                />
                <div className={variableStyles.renderNodeChildLabel}> {child.label}</div>

                <div className={variableStyles.renderNodeChildRight}>
                  <div className={variableStyles.renderNodeChildString}>
                    {child.variable_type?.toUpperCase()}
                  </div>
                  {child.children && child.children.length > 0 && (
                    <RightOutlined className={variableStyles.renderNodeChildRightIcon} />
                  )}
                </div>
              </div>
            );
          })}
      </div>
    );
  };

  return (
    <div
      ref={popupRef}
      className={visible ? variableStyles.variablePopup : variableStyles.variablePopupHidden}
      style={{
        left: 0,
        top: position.y,
        minWidth: `${minWidth}px`,
      }}
    >
      {/* 变量级联选择器 */}
      <div className={variableStyles.cascaderContainer}>
        {/* 搜索容器 */}
        <div className={variableStyles.searchContainer}>
          <Search
            placeholder='搜索节点或变量...'
            value={searchValue}
            onChange={handleSearchChange}
            prefix={<SearchOutlined />}
            allowClear
            className={variableStyles.searchInput}
          />
        </div>
        {/* 节点列表容器 */}
        <div className={variableStyles.renderNodeItems}>
          {filteredData.length > 0
            ? filteredData.map((item) => {
                return (
                  <Popover
                    content={renderNodeItem(item)}
                    key={item.value}
                    trigger='hover'
                    placement='right'
                    arrow={false}
                  >
                    <div
                      onMouseEnter={() => {
                        nodeItemHover(item);
                      }}
                      className={`${variableStyles.renderNodeItem} ${
                        selectNode && selectNode.nodeId == item.nodeId
                          ? variableStyles.renderNodeItemActive
                          : ""
                      }`}
                      key={item.value}
                    >
                      <img
                        className={variableStyles.renderNodeItemIcon}
                        src={`/workflow/${item.nodeType}.png`}
                        alt=''
                      />
                      <div className={variableStyles.renderNodeItemLabel}> {item.title}</div>
                      <div className={variableStyles.renderNodeItemRight}>
                        <RightOutlined />
                      </div>
                    </div>
                  </Popover>
                );
              })
            : renderEmpty()}
          {/* {showContext&&
          <div className={isContext?variableStyles.renderNodeItemDisabled:variableStyles.renderNodeItem} onMouseEnter={contextMouseEnter} onClick={contextClick}>
            <img
              className={variableStyles.renderNodeItemIcon}
              src={`/workflow/context.png`}
              alt=""
            />
            <div className={variableStyles.renderNodeItemLabel}>上下文</div>
          </div>
          } */}
        </div>
      </div>
    </div>
  );
};

export default VariablePopup;
