import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Input, Cascader, Select, Popover, Typography, Tooltip } from "antd";
import { SearchOutlined, RightOutlined, CloseOutlined } from "@ant-design/icons";
import styles from "./variableCascader.module.css";
import useClickOutside from "./useClickOutside"; // 自定义 hook 存在于另一个文件
import { useReactFlow } from '@xyflow/react'
import { useVaiable } from "../hooks/useVaiable";
/**
 * 变量级联选择器组件
 * 用于在工作流中选择节点变量，支持搜索、级联展示等功能
 *
 * @param {Array} data - 节点数据数组，包含节点信息和变量信息
 * @param {string} placeholder - 占位符文本
 * @param {string} className - 自定义CSS类名
 * @param {Object} style - 自定义样式对象
 * @param {Function} onChange - 值变化时的回调函数
 * @param {Array} value_selector - 当前选中的值选择器路径
 * @param {Boolean}   disabled = false,//是否禁用
 * @param {Boolean}   isSingle = false,//是否只返回单个值
 */
const VariableCascader = ({
  data = [],
  placeholder = "请选择变量",
  onChange,
  value_selector,
  type = null,//需要过滤的变量类型
  filterData = [],//需要展示的变量类型数组
  disabled = false,//是否禁用
  onSelectChange,
  isSingle = false,//是否只返回单个值
  style={},//自定义样式
  showProperty = true,//是否展示变量子属性
  clearable = true, // 是否允许清除
  labelMaxWidth = 150,//标签最大宽度
  allowMiddleSelect = true,//是否允许选择中间变量
  children = null,//子组件
  renderWidth = '150px',//渲染宽度
  filterVariable = [],//需要过滤的变量数组
}) => {
  // 从 antd 组件中解构需要的组件
  const { Search } = Input;
  const { Text } = Typography;
  const reactFlowInstance = useReactFlow();
  const { getVarIcon } = useVaiable();
 
  
  // ==================== 状态管理 ====================

  // 搜索框的输入值
  const [searchValue, setSearchValue] = useState("");
  // 当前选中的键值数组
  const [selectedKeys, setSelectedKeys] = useState([]);
  // 当前选中的节点
  const [selectNode, setSelectNode] = useState("");
  // 当前选中的变量
  const [selectVariable, setSelectVariable] = useState("");
  // 当前选中的参数
  const [selectParams, setSelectParams] = useState("");
  // 弹出层是否打开
  const [popoverOpen, setPopoverOpen] = useState(false);
  // 当前选中的数据对象
  const [selectData, setSelectData] = useState(""); //选择的数据
  // 是否显示清除按钮
  const [showClose, setShowClose] = useState(false);

  // 添加ref用于检测点击外部区域
  const popoverRef = useRef(null);
  const triggerRef = useRef(null);
  

  // ==================== 数据处理 ====================
  /**
   * 根据搜索值过滤数据
   * 支持按节点标题和变量名称进行模糊搜索
   */
  const filteredData = useMemo(() => {
  
    // 判断是否需要过滤掉该变量
    const isFilteredVariable = (node) => {
      if (!Array.isArray(filterVariable) || filterVariable.length === 0) return false;
      if (!Array.isArray(node?.value_selector)) return false;
  
      return filterVariable.some(
        (fv) =>
          Array.isArray(fv) &&
          fv.length === node.value_selector.length &&
          fv.every((v, idx) => v === node.value_selector[idx])
      );
    };
  
    // 类型过滤函数（保持你原本逻辑）
    const filterByType = (childrenArray) => {
      if (!childrenArray) return [];
  
      if (Array.isArray(filterData) && filterData.length > 0) {
        return childrenArray
          .map((child) => {
            if (isFilteredVariable(child)) return null; // ❶ 按路径过滤变量
  
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
        return childrenArray
          .map((child) => {
            if (isFilteredVariable(child)) return null; // ❶ 按路径过滤变量
  
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
  
      // 无类型过滤，也要过滤掉 filterVariable
      return childrenArray
        .map((child) => {
          if (isFilteredVariable(child)) return null; // ❶ 按路径过滤变量
  
          let filteredChildren = filterByType(child.children);
          let filteredProps = filterByType(child.props);
  
          return { ...child, children: filteredChildren, props: filteredProps };
        })
        .filter(Boolean);
    };
  
    // 没搜索值 → 只进行类型过滤 + filterVariable 过滤
    if (!searchValue.trim()) {
      return data
        .map((node) => {
          if (isFilteredVariable(node)) return null; // ❶ 顶层节点过滤
  
          return {
            ...node,
            children: filterByType(node.children),
            props: filterByType(node.props),
          };
        })
        .filter((node) => node && ((node.children?.length ?? 0) > 0 || (node.props?.length ?? 0) > 0));
    }
  
    const term = searchValue.toLowerCase();
  
    // 搜索递归
    const searchRecursive = (nodes) => {
      if (!Array.isArray(nodes)) return [];
  
      return nodes
        .map((node) => {
          if (isFilteredVariable(node)) return null; // ❶ 搜索中也过滤该变量
  
          const matchSelf =
            node.label?.toLowerCase().includes(term) ||
            node.title?.toLowerCase().includes(term);
  
          const filteredChildren = searchRecursive(node.children);
          const filteredProps = searchRecursive(node.props);
  
          if (matchSelf || filteredChildren.length > 0 || filteredProps.length > 0) {
            return {
              ...node,
              children: filteredChildren,
              props: filteredProps,
            };
          }
  
          return null;
        })
        .filter(Boolean);
    };
  
    // 搜索前先做类型过滤
    return data
      .map((node) => {
        if (isFilteredVariable(node)) return []; // ❶ 顶层过滤
  
        const typeFiltered = filterByType([node]);
        return typeFiltered.length > 0 ? searchRecursive(typeFiltered) : [];
      })
      .flat();
  
  }, [data, searchValue, type, filterData, filterVariable]);
  
  /**
   * 根据值选择器路径查找节点
   * @param {Array} nodes - 节点数组
   * @param {Array} valueSelectorPath - 值选择器路径
   * @returns {Object|null} 找到的节点对象或null
   */
  const findNodeByValue = (nodes, valueSelectorPath) => {
    for (const node of nodes) {
      // 检查当前节点是否有子节点（变量）
      if (node.children && node.children.length > 0) {
        for (const variable of node.children) {
          // 使用递归辅助函数在变量及其子节点中搜索
          const found = findVariableBySelector(variable, valueSelectorPath);
          if (found) {
            return getVariableMiddleName(found);
          }
        }
      }
    }
    return null;
  };

  //获取变量中间值名称
  const getVariableMiddleName = (found) => {
    let  value_selector = found.value_selector;
    let variable_middle = '';
    if(value_selector.length==3){
      variable_middle = value_selector[1];
    }
    found.variable_middle = variable_middle;
    found.render_value =variable_middle&&found.nodeType=='variable-aggregator'? variable_middle+'.'+found.variable_name:found.variable_name;
    return found;
  }

  /**
   * 递归辅助函数，查找匹配完整值选择器路径的变量
   * @param {Object} node - 当前节点
   * @param {Array} targetPath - 目标路径
   * @returns {Object|null} 找到的变量对象或null
   */
  const findVariableBySelector = (node, targetPath) => {
    if (!node || !node.value_selector) return null;

    const nodePath = node.value_selector;

    if (Array.isArray(nodePath) && arraysEqual(nodePath, targetPath)) {
      return node;
    }

    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        const found = findVariableBySelector(child, targetPath);
        if (found) {
          return found;
        }
      }
    }

    return null;
  };

  /**
   * 辅助函数：比较两个数组是否相等
   * @param {Array} a - 第一个数组
   * @param {Array} b - 第二个数组
   * @returns {boolean} 是否相等
   */
  const arraysEqual = (a, b) => {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;

    return a.every((val, index) => val === b[index]);
  };

  /**
   * 当 value_selector 变化时，查找并设置对应的数据
   */
  const parseValueSelector = (value_selector) => {
    if (typeof value_selector !== "string") return value_selector;
    // 匹配 {{# ... #}} 格式
    const reg = /^\{\{#(.+?)#\}\}$/;
    const match = value_selector.match(reg);
    if (match) {
      // match[1] 是 #号之间的内容，如 1755765827936.text.name
      return match[1].split(".");
    }
    return value_selector;
  };

  useMemo(() => {
    if (value_selector &&data&&data.length>0) {
      let valueSelectorArray = parseValueSelector(value_selector);

      if (valueSelectorArray.id) {
        if (valueSelectorArray.id.includes('second') && valueSelectorArray.type === 'file') {
          return
        } else {
          // 递归查找节点的函数
          const findNode = findNodeByValue(data, valueSelectorArray);
          if (findNode) {
            setSelectData(findNode);
          }
        }
      } else {
        // 递归查找节点的函数
        const findNode = findNodeByValue(data, valueSelectorArray);
        if (findNode) {
          setSelectData(findNode);
        }

      }
    }
    else{
      setSelectData("");
    }
  }, [value_selector,data]);



  // ==================== 事件处理函数 ====================

  /**
   * 处理搜索输入变化
   * @param {Event} e - 输入事件对象
   */
  const handleSearchChange = useCallback((e) => {
    setSearchValue(e.target.value);
  }, []);

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

  const middleArray = ['file','array[file]'];//中间变量类型
  const nodeVariableItemClick = (item) => {
    if(!allowMiddleSelect && middleArray.includes(item.type)){
      return false;//不允许选择中间变量
    }
     if (item?.id?.includes('second') && item.type === 'file') {
          return//不允许选择中间变量
        } else {
          // 递归查找节点的函数
          handleChange(item);
          setSelectData(item);
          clearSelect();
        }
  };

  /**
   * 变量参数点击事件处理
   * @param {Object} item - 选中的参数项
   */
  const variableItemClick = (item) => {
    handleChange(item);
    setSelectData(item);
    clearSelect();
  };

  /**
   * 清除选中效果
   * 重置所有选中状态
   */
  const clearSelect = () => {
    setSelectNode("");
    setSelectVariable("");
    setSelectParams("");
    setSearchValue(""); //清空搜索框
  };

  /**
   * 清除数据事件处理
   * 重置选中的数据并触发onChange回调
   */
  const clearDataEvent = () => {
    setSelectData("");
    if (onSelectChange) {
      onSelectChange("");
    }
    if (onChange) {
      onChange("");
    }
  };

  /**
   * 节点hover事件处理
   * @param {Object} item - 节点项对象
   */
  const nodeItemHover = (item) => {
    setSelectNode(item);
  };

  const clearDataEventWrapper = (e) => {
    e.stopPropagation();
    clearDataEvent();
    onChange('');
  }

  //统一处理onChange
  const handleChange = (value) => {
    setPopoverOpen(false);
    if (onSelectChange) {
      onSelectChange(value.value_selector);
    }
    if (onChange) {
      if (isSingle) {
        onChange(value.value_selector);
      } else {
        onChange(value);
      }
    }
  }

  // ==================== 弹框关闭处理 ====================
  /**
   * 处理点击外部区域关闭弹框
   */
  // useEffect(() => {
  //   const handleClickOutside = (event) => {
  //     if (popoverOpen) {
  //       // 检查点击是否在弹框容器或触发器之外
  //       const isOutsidePopover = popoverRef.current && !popoverRef.current.contains(event.target);
  //       const isOutsideTrigger = triggerRef.current && !triggerRef.current.contains(event.target);
  //       const isOutside = isOutsidePopover && isOutsideTrigger;
  //       console.log(isOutsideTrigger, "isOutsideTrigger");
  //       console.log(isOutsidePopover, ", isOutsidePopover");
  //       if (isOutsidePopover && isOutsideTrigger) {
  //         handleClickOther();
  //       }
  //     }
  //   };

  //   // 添加全局点击事件监听器
  //   if (popoverOpen) {
  //     document.addEventListener("mousedown", handleClickOutside);
  //   }

  //   // 清理事件监听器
  //   return () => {
  //     document.removeEventListener("mousedown", handleClickOutside);
  //   };
  // }, [popoverOpen]);

  /**
   * 处理弹框容器的鼠标事件
   */
  const handlePopoverMouseEnter = () => {
   // setPopoverOpen(true);
  };


  // ==================== 渲染函数 ====================

  /**
   * 渲染空状态
   * 当没有数据或搜索结果为空时显示
   */
  const renderEmpty = () => {
    if (searchValue.trim()) {
      return <div className={styles.emptyState}>未找到相关内容</div>;
    }
    return <div className={styles.emptyState}>暂无节点/变量</div>;
  };

  /**
   * 渲染节点项及其子变量
   * @param {Object} item - 节点项对象
   * @returns {JSX.Element} 渲染的节点项组件
   */
  const renderNodeItem = (item) => {
    return (
      <div
        className={styles.renderNodeChilds}
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
          return showProperty && child.children && child.children.length > 0 ? (
            // 如果有子变量，使用 Popover 显示
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
                className={`${styles.renderNodeChild} ${selectVariable && selectVariable.variable == child.variable
                  ? styles.renderNodeItemActive
                  : ""
                  }`}
                key={child.value}
              >
                <img className={styles.renderNodeChildIcon} src={getVarIcon(child.variable_type)} alt='' />
                <div className={styles.renderNodeChildLabel}> {child.label}</div>
                <div className={styles.renderNodeChildRight}>
                  <div className={styles.renderNodeChildString}>
                    {capitalizeFirstLetter(child.variable_type)}
                  </div>
                  <RightOutlined className={styles.renderNodeChildRightIcon} />
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
              className={`${styles.renderNodeChild} ${selectVariable && selectVariable.variable == child.variable
                ? styles.renderNodeItemActive
                : ""
                }`}
              key={child.value}
            >
              <img className={styles.renderNodeChildIcon} src={getVarIcon(child.variable_type)} alt='' />
              <div className={styles.renderNodeChildLabel}> {child.label}</div>
              <div className={styles.renderNodeChildRight}>
                <div className={styles.renderNodeChildString}>
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
      <div className={styles.renderNodeChilds} key={item.value}>
        {item.children &&
          item.children.map((child) => {
            return (
              <div
                onClick={() => {
                  variableItemClick(child);
                }}
                className={`${styles.renderNodeChild} ${selectParams && selectParams.variable == child.variable
                  ? styles.renderNodeItemActive
                  : ""
                  }`}
                key={child.value}
              >
                <img className={styles.renderNodeChildIcon} src={getVarIcon(child.variable_type)} alt='' />
                <div className={styles.renderNodeChildLabel}> {child.label}</div>

                <div className={styles.renderNodeChildRight}>
                  <div className={styles.renderNodeChildString}>
                    {capitalizeFirstLetter(child.variable_type)}
                  </div>
                  {child.children && child.children.length > 0 && (
                    <RightOutlined className={styles.renderNodeChildRightIcon} />
                  )}
                </div>
              </div>
            );
          })}
      </div>
    );
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

  // 缓存节点数据，避免重复获取
  const nodes = useMemo(() => {
    try {
      return reactFlowInstance.getNodes() || [];
    } catch (error) {
      console.warn('获取节点数据失败:', error);
      return [];
    }
  }, [reactFlowInstance]);

  // 渲染节点图标 
  const renderNodeIcon = useCallback((obj) => {
    if (!obj || !obj.nodeType) {
      return '/workflow/default.png'; // 默认图标
    }

    // MCP节点需要特殊处理
    if (obj.nodeType === 'mcp') {
      const mcpNode = nodes.find(node => node.data?.id == obj.nodeId);
      if (mcpNode?.data?.mcp_url) {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE || '';
        return baseUrl + mcpNode.data.mcp_url;
      }
      return '/workflow/mcp.png'; // MCP默认图标
    }
    if(obj.nodeType === 'agent' || obj.nodeType === 'workflow'){
      const appNode = nodes.find(node => node.data?.id == obj.nodeId);
      if(appNode?.data?.iconUrl){
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE || '';
        return baseUrl + appNode.data.iconUrl;
      }
      return '/workflow/common/string.png'; // 智能体图标 默认图标
    }
    return `/workflow/${obj.nodeType}.png`; // 其他节点类型使用标准图标
  }, [nodes]);

  // ==================== 主渲染 ====================
  const handleClickOther = () => {
    if(selectVariable || selectParams){      
      return;//如果选中变量或参数，则不关闭弹框
    }
    setPopoverOpen(false);
    clearSelect();
  };

  useClickOutside(popoverRef, triggerRef, handleClickOther);
  return (
    <div className={styles.variableCascader}>
      {/* 主弹出层 */}
      <Popover
        content={
          <div
            ref={popoverRef}
            className={styles.cascaderContainer}
          >
            {/* 搜索容器 */}
            
            <div className={styles.searchContainer}>
              <Search
                placeholder='搜索节点或变量...'
                value={searchValue}
                onChange={handleSearchChange}
             
                allowClear
                className={styles.searchInput}
              />
            </div>
            {/* 节点列表容器 */}
            <div className={styles.renderNodeItems}>
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
                        className={`${styles.renderNodeItem} ${selectNode && selectNode.nodeId == item.nodeId
                          ? styles.renderNodeItemActive
                          : ""
                          }`}
                        key={item.value}
                      >
                        <img
                          className={styles.renderNodeItemIcon}
                          src= {renderNodeIcon(item)}
                          alt=''
                        />
                        <div className={styles.renderNodeItemLabel}>
                          <Text  style={{ maxWidth: labelMaxWidth }}
                        ellipsis={{ tooltip: item.title }} >  {item.title} </Text>
                          
                           </div>
                        <div className={styles.renderNodeItemRight}>
                          <RightOutlined />
                        </div>
                      </div>
                    </Popover>
                  );
                })
                : renderEmpty()}
            </div>
          </div>
        }
        trigger='click'
        placement='bottom'
        arrow={false}
        destroyOnHidden={true}
        open={popoverOpen}
        
      >
        {/* 触发器区域 */}
        <div
          ref={triggerRef}
          onClick={() => {
            if (disabled || children) return;
            clearSelect();
              setPopoverOpen(!popoverOpen);
            
          }}
        >
          {/* 如果没有子组件且没有选中数据，显示占位符 */}
          {(!selectData  || children) && (
            children ? 
             React.cloneElement(children, {
              onClick: () => {
                if (!disabled) {
                  clearSelect();
                  setPopoverOpen(!popoverOpen);
                }
              }
            }) : (
            <div
              className={styles.renderSelectData}
                style={{
                  cursor: disabled ? "not-allowed" : "pointer",
                  backgroundColor: disabled ? "#F5F5F5" : "#F5F9FC",
                  ...style
                }}
              >
                {placeholder}
              </div>
            ))}
          {/* 如果没有子组件但有选中数据，显示选中的数据 */}
          {selectData&&!children && (
            <div
              className={styles.renderSelectData}
              style={{
                cursor: disabled ? "not-allowed" : "pointer",
                backgroundColor: disabled ? "#F5F5F5" : "#F5F9FC",
                ...style
              }}
              onMouseEnter={() => setShowClose(true)}
              onMouseLeave={() => setShowClose(false)}
            >
              
              <div className={styles.renderSelectDataContent}>
                {/* 节点类型图标 */}
                <div className={styles.renderSelectDataContent_left}>  
                {selectData.nodeType && (
                  <img
                    className={styles["renderSelectDataImg"]}
                    src={renderNodeIcon(selectData)}
                    alt=''
                  />
                )}
                {/* 节点名称 */}
                {selectData.nodeName && (
                  <div className={styles["renderSelectDataTitle"]} style={{maxWidth: renderWidth}}>
                    <Tooltip title={selectData.nodeName} placement="top">
                      <Text
                        className={styles["renderSelectDataTitleText"]}
                        style={{ maxWidth: renderWidth }}
                        ellipsis={{ tooltip: false }}
                      >
                        <span   className={styles["renderSelectDataTitleText_span"]}>{selectData.nodeName}</span>
                      </Text>
                    </Tooltip>
                    <div className={styles["renderSelectDataTitleText"]}> /</div>
                  </div>
                )}
                {/* 变量名称 */}
                <Tooltip title={selectData.render_value} placement="top">
                  <div
                    className={styles["renderSelectDataName"]}
                    style={{maxWidth: labelMaxWidth}}
                  >
                         {`{{${selectData.variable_name}}}`}
                 
                  </div>
                </Tooltip>
                </div>
                {/* 变量类型 */}
                {selectData.variable_type && (

                  <div
                    className={styles["renderSelectDataType"]}
                  >
                    {capitalizeFirstLetter(selectData.variable_type)}
              
                  </div>

                )}
              </div>
              {/* 清除按钮，鼠标移入时显示 */}
              <div className={styles.renderSelectDataClose}>
              {showClose && !disabled && clearable && (
               
                <img className={styles.renderSelectDataCloseImg} src="/common/close.png" alt=''  onClick={clearDataEventWrapper} />
                  )}
                    </div>
           
            </div>
          )}
        </div>
      </Popover>
    </div>
  );
};

/**
 * 导出变量级联选择器组件
 */
export default VariableCascader;
