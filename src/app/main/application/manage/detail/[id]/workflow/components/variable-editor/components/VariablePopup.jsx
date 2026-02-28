import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { Input, Popover, Typography } from "antd";
import { SearchOutlined, RightOutlined } from "@ant-design/icons";
import {
  flip,
  offset,
  shift,
  useFloating,
  useDismiss,
  useInteractions,
} from '@floating-ui/react';
import variableStyles from "./variableCascader.module.css";
import useClickOutside from './useClickOutside'; // 自定义 hook 存在于另一个文件
import { useVaiable } from "../../hooks/useVaiable";
/**
 * 变量弹框组件
 * @param {Object} props - 组件属性
 * @param {boolean} props.visible - 是否显示弹框
 * @param {Object} props.referenceElement - 参考元素（光标位置）
 * @param {Array} props.variables - 变量列表
 * @param {Function} props.onSelect - 选择变量回调
 * @param {Function} props.onClose - 关闭弹框回调
 * @param {string} props.searchText - 搜索文本
 * @param {string} props.type - 需要过滤的变量类型
 */
const VariablePopup = ({
  visible,
  referenceElement,
  variables = [],
  onSelect,
  onClose,
  searchText = "",
  type = "",
  filterData = [],
  editorWidth, //编辑器宽度
  isContext = false,//是否已经配置上下文
  showContext = false,//是否展示上下文
  showAbove = false, //是否显示在光标上方
  allowMiddleSelect = true,//是否允许选择中间变量
}) => {
  const { Search } = Input;
  const { Text } = Typography;
  const { getVarIcon } = useVaiable();
  // ==================== 状态管理 ====================
  const [filteredVariables, setFilteredVariables] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const popupRef = useRef(null);

  // ==================== useFloating 配置 ====================
  const { refs, floatingStyles, isPositioned,context } = useFloating({
    open: visible,
    onOpenChange: (open) => {
      if (!open) {
        onClose();
      }
    },
    elements: {
      reference: referenceElement,
    },
    placement: showAbove ? 'top-start' : 'bottom',
    middleware: [
      offset(20), // 与参考元素的距离
      shift({
        padding: 8, // 与视口边缘的最小距离
      }),
      flip(), // 自动翻转位置
    ],
    whileElementsMounted: (reference, floating, update) => {
      // console.log("whileElementsMounted", reference, floating, update);
      // 当参考元素或浮动元素挂载时更新位置
      update();
    },
  });

  const dismiss = useDismiss(context);
  const { getFloatingProps } = useInteractions([dismiss]);
  // VariableCascader 相关状态
  const [searchValue, setSearchValue] = useState("");
  const [selectNode, setSelectNode] = useState("");
  const [selectVariable, setSelectVariable] = useState("");
  const [selectParams, setSelectParams] = useState("");
  const [selectData, setSelectData] = useState("");

  // ==================== VariableCascader 数据处理 ====================

  useEffect(() => {
    // console.log("visible", visible);
    if (!visible) {
      clearSelect();
    }
  }, [variables]);
  /**
   * 根据搜索值过滤数据
   * 支持按节点标题和变量名称进行模糊搜索
   */

  // ==================== 事件处理函数 ====================
  const filteredData = useMemo(() => {
   
    // console.log(variables, "variables");
   // 类型过滤函数（保持不变）
   const filterByType = (children) => {
     if (!children) return [];
 
     if (Array.isArray(filterData) && filterData.length > 0) {
       return children
         .map((child) => {
           let filteredChildren = filterByType(child.children);
           let filteredProps = filterByType(child.props);
 
           if (
             filterData.includes(child.variable_type) ||
             filteredChildren.length > 0 ||
             filteredProps.length > 0
           ) {
             return { ...child, children: filteredChildren, props: filteredProps };
           }
           return null;
         })
         .filter(Boolean);
     }
 
     if (type) {
       return children
         .map((child) => {
           let filteredChildren = filterByType(child.children);
           let filteredProps = filterByType(child.props);
 
           if (
             child.variable_type === type ||
             filteredChildren.length > 0 ||
             filteredProps.length > 0
           ) {
             return { ...child, children: filteredChildren, props: filteredProps };
           }
           return null;
         })
         .filter(Boolean);
     }
 
     return children;
   };
 
   // 没搜索值，按类型过滤
   if (!searchValue.trim()) {
     return variables
       .map((node) => ({
         ...node,
         children: filterByType(node.children),
       }))
       .filter((node) => node.children && node.children.length > 0);
   }
 
   const term = searchValue.toLowerCase();
 
   // 递归搜索 + 保留路径
   const searchRecursive = (nodes) => {
     if (!Array.isArray(nodes)) return [];
 
     return nodes
       .map((node) => {
         const matchSelf =
           node.label?.toLowerCase().includes(term) ||
           node.title?.toLowerCase().includes(term);
 
         const filteredChildren = searchRecursive(node.children);
   
 
         if (matchSelf || filteredChildren.length > 0 ) {
           return {
             ...node,
             children: filteredChildren,
           };
         }
         return null;
       })
       .filter(Boolean);
   };
 
   // 按类型过滤后再搜索
   return variables
     .map((node) => {
       const typeFiltered = filterByType([node]);
       return typeFiltered.length > 0 ? searchRecursive(typeFiltered) : [];
     })
     .flat();
 }, [variables, searchValue, type, filterData]);
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
  // const nodeVariableItemClick = (item) => {
  //   console.log("nodeVariableItemClick", item);
  //   setSelectData(item);
  //   clearSelect();
  //   variableChange(item);
  // };
    const middleArray = ['file','array[file]'];//中间变量类型
  const nodeVariableItemClick = (item) => {
    if(!allowMiddleSelect && middleArray.includes(item.type)){
      return false;//不允许选择中间变量
    }
     if (item?.id?.includes('second') && item.type === 'file') {
          return//不允许选择中间变量
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
    variableChange(item);
    setSelectData(item);
    clearSelect();
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

    //大写首字母函数 file => File  array[file] => Array[File]
  // 将 "file" => "File"，"array[file]" => "Array[File]" 的首字母大写函数
  const capitalizeFirstLetter = (str) => {
    if (!str) return '';
    // 处理 array[file] => Array[File]
    const arrayTypeMatch = str.match(/^array\[(.+)\]$/i);
    if (arrayTypeMatch) {
      // 递归处理内部类型
      const innerType = capitalizeFirstLetter(arrayTypeMatch[1]);
      return `Array[${innerType}]`;
    }
    // 普通类型首字母大写，其余小写
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
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
              trigger="hover"
              placement="leftTop"
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
                  src={getVarIcon(child.variable_type)}
                  alt=""
                />
                <div className={variableStyles.renderNodeChildLabel}>
                  {" "}
                  {child.label}
                </div>
                <div className={variableStyles.renderNodeChildRight}>
                  <div className={variableStyles.renderNodeChildString}>
                    {capitalizeFirstLetter(child.variable_type)}
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
                src={getVarIcon(child.variable_type)}
                alt=""
              />
              <div className={variableStyles.renderNodeChildLabel}>
                {" "}
                {child.label}
              </div>
              <div className={variableStyles.renderNodeChildRight}>
                <div className={variableStyles.renderNodeChildString}>
                  {capitalizeFirstLetter(child.variable_type)}
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
                  src={getVarIcon(child.variable_type)}
                  alt=""
                />
                <div className={variableStyles.renderNodeChildLabel}>
                  {" "}
                  {child.label}
                </div>

                <div className={variableStyles.renderNodeChildRight}>
                  <div className={variableStyles.renderNodeChildString}>
                      {capitalizeFirstLetter(child.variable_type)}
                  </div>
                  {child.children && child.children.length > 0 && (
                    <RightOutlined
                      className={variableStyles.renderNodeChildRightIcon}
                    />
                  )}
                </div>
              </div>
            );
          })}
      </div>
    );
  };

  // 上下文鼠标进入事件
  const contextMouseEnter = () => {

    nodeItemHover({
      nodeId: 'context',
      title: '上下文',
    });
  }
 //上下文点击事件
 const contextClick = () => {
  if(isContext){
    return;
  }
  onSelect({
    variable: 'context',
    label: '上下文',
    variable_type: 'context',
  });
  clearSelect();  
 }


  return (
    <div
      ref={(node) => {
        refs.setFloating(node);
        popupRef.current = node;
      }}
      {...getFloatingProps()}
      className={`${
        visible
          ? variableStyles.variablePopup
          : variableStyles.variablePopupHidden
      } ${showAbove ? variableStyles.variablePopupAbove : ''}`}
      style={{
        ...floatingStyles,
        visibility: isPositioned ? 'visible' : 'hidden',
      }}
    >
      {/* 变量级联选择器 */}
      <div className={variableStyles.cascaderContainer}>
        {/* 搜索容器 */}
        <div className={variableStyles.searchContainer}>
          <Search
            placeholder="搜索节点或变量..."
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
                    trigger="hover"
                    placement="right"
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
                        src={item.icon}
                        alt=""
                      />
                      <div className={variableStyles.renderNodeItemLabel}>
                      <Text  style={{ maxWidth: '200px' }}
                        ellipsis={{ tooltip: item.title }} >  {item.title} </Text>
                      </div>
                      <div className={variableStyles.renderNodeItemRight}>
                        <RightOutlined />
                      </div>
                    </div>
                  </Popover>
                );
              })
            : renderEmpty()}
          {showContext&&
          <div className={isContext?variableStyles.renderNodeItemDisabled:variableStyles.renderNodeItem} onMouseEnter={contextMouseEnter} onClick={contextClick}>
            <img
              className={variableStyles.renderNodeItemIcon}
              src={`/workflow/context.png`}
              alt=""
            />
            <div className={variableStyles.renderNodeItemLabel}>上下文</div>
          </div>
          }
        </div>
      </div>
    </div>
  );
};

export default VariablePopup;
