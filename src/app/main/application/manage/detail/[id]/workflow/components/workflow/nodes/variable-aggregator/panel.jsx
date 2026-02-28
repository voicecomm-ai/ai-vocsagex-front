/**
 * 变量聚合器面板组件
 *
 * 功能说明：
 * 1. 管理变量聚合器节点的配置面板
 * 2. 支持创建和管理多个分组（groups）
 * 3. 每个分组可以添加多个变量，用于聚合处理
 * 4. 支持编辑节点标题、描述等信息
 * 5. 支持变量的添加、删除、更新操作
 * 6. 聚合策略：返回每个分组中第一个非空的值
 *
 * @component
 * @param {Object} props - 组件属性
 * @param {Object} ref - 转发引用，用于暴露组件方法
 */

"use client";

// React 核心 hooks
import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
} from "react";
// Ant Design 组件库
import {
  Button,
  Drawer,
  Form,
  Cascader,
  Radio,
  Input,
  Tree,
  ConfigProvider,
  Typography,
  message,
  Select,
  Divider,
  InputNumber,
  Tooltip,
  Slider,
} from "antd";
// 样式文件
import styles from "../node.module.css";
import variableAggregatorStyles from "./variableAggregator.module.css";
// 自定义 hooks
import { useNodesInteractions, useNodeData } from "../../hooks";
// 工具函数
import debounce from "lodash/debounce";
import { useStore } from "@/store/index";
import { getUuid, capitalizeFirstLetter } from "@/utils/utils";
// 变量级联选择器组件
import VariableCascader from "../../../variableCascader";
import { useAggregator } from "./hooks/use-aggregator";
import RunHeader  from '../../components/RunHeader'
/**
 * 变量聚合器面板主组件
 * 使用 forwardRef 以支持父组件调用子组件方法
 */
const VariableAggregatorPanel = forwardRef((props, ref) => {
  // Ant Design 组件解构
  const { TextArea } = Input;
  const { Paragraph, Text } = Typography;

  // 从全局 store 获取状态和方法
  const {
    setPanelVisible, // 设置面板可见性
    readOnly, // 只读模式标识
    setPannerNode, // 设置当前面板节点
    setRunVisible, // 设置运行面板可见性
    panelVisible, // 面板是否可见
    pannerNode, // 当前面板节点数据
    changeId, // 变更ID，用于触发更新
    setChangeNodeType, // 设置变更节点类型
    setChangeId,
  } = useStore((state) => state);

  // 节点交互相关 hooks
  const { updateNodeDetail } = useNodesInteractions();

  // 节点数据相关 hooks
  const {
    getUpstreamVariables, // 获取上游变量
    getNodeById, // 根据ID获取节点
    getCurrentAndDownstreamVariables, // 获取当前及下游变量
  } = useNodeData();

  // 校验相关 hooks
  const { validateRequired } = useAggregator();
  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    hideModal, // 隐藏模态框方法
  }));

  // ========== 状态管理 ==========
  const deleteModalRef = useRef(null); // 变量删除操作的 ref
  const [open, setOpen] = useState(false); // 模态框打开状态
  const [data, setData] = useState({}); // 节点数据
  const [loading, setLoading] = useState(false); // 加载状态
  const [title, setTitle] = useState(""); // 节点标题
  const [isEditing, setIsEditing] = useState(false); // 是否正在编辑标题
  const [groupData, setGroupData] = useState([]); // 分组数据列表
  const [variableData, setVariableData] = useState([]); // 可用的变量数据列表
  const [hoverGroupId, setHoverGroupId] = useState(null); // 悬停的分组ID
  const [editGroup, setEditGroup] = useState(null); // 编辑的分组的对象
  // ========== 生命周期和副作用 ==========

  /**
   * 监听面板可见性变化，初始化面板数据
   * 当面板打开且有节点数据时，初始化组件状态
   */
  useEffect(() => {
    if (panelVisible && pannerNode) {
      setData(pannerNode.data);
      setTitle(pannerNode.data.title);
      initEvent();
    }
  }, [panelVisible]);

  /**
   * 初始化事件处理
   * 从节点数据中提取分组配置并初始化状态
   */
  const initEvent = () => {
    let nodeData = getNodeById(pannerNode.data.id);
    let configData = nodeData.data;
    let advanced_settings = configData.advanced_settings; // 高级设置
    let groups = advanced_settings.groups; // 分组数据
    setGroupData(groups);
    getVariableDataEvent();
  };

  /**
   * 获取变量数据事件
   * 获取当前节点的上游变量，用于变量选择器
   */
  const getVariableDataEvent = () => {
    const upstreamVariables = getUpstreamVariables(pannerNode.data.id);
    console.log(upstreamVariables,'upstreamVariables')
    setVariableData(upstreamVariables);
  };

  /**
   * 监听变更ID，当工作流发生变化时重新获取变量数据
   * 确保变量列表与最新的工作流状态同步
   */
  useEffect(() => {
    if (panelVisible) {
      getVariableDataEvent();
    }
  }, [changeId]);

  // ========== 面板控制事件 ==========

  /**
   * 隐藏模态框
   * 暴露给父组件调用的方法
   */
  const hideModal = () => {
    setOpen(false);
  };

  /**
   * 关闭面板事件
   * 清空当前节点并隐藏面板
   */
  const closePanelEvent = () => {
    setPannerNode(null);
    setPanelVisible(false);
  };

  // ========== 数据更新事件 ==========

  /**
   * 更新数据事件处理函数（单个字段）
   * @param {string} dataPar - 要更新的数据字段名
   * @param {any} dataParValue - 新的字段值
   */
  const updateDataEvent = (dataPar, dataParValue) => {
    let nodeData = getNodeById(pannerNode.data.id);
    const obj = {
      ...nodeData.data,
      [dataPar]: dataParValue,
    };
    setData(obj);
    updateNodeDetailEvent(obj);
  };

  /**
   * 批量更新数据事件处理函数
   * @param {Object} dataObj - 要更新的数据对象
   */
  const updateDataEventBatch = (dataObj) => {
    let nodeData = getNodeById(pannerNode.data.id);
    const obj = {
      ...nodeData.data,
      ...dataObj,
    };

    setData(obj);
    updateNodeDetailEvent(obj);
  };

  /**
   * 更新节点详情事件（防抖处理）
   * 使用 debounce 避免频繁更新，延迟 50ms 执行
   * 更新节点数据后，触发变更ID和节点类型更新，通知其他组件刷新
   */
  const updateNodeDetailEvent = useRef(
    debounce(async (data) => {
      const newData = {
        nodeId: pannerNode.data.id,
        data: {
          ...data,
        },
      };
      updateNodeDetail(newData);
      setChangeId(getUuid());
      setChangeNodeType(pannerNode.data.type);
    }, 50) // 防抖延迟 50ms
  ).current;

  // ========== 节点标题和描述处理 ==========

  /**
   * 节点标题改变事件
   * @param {Event} e - 输入事件对象
   */
  const handleNodeTitleChange = (e) => {
    let title = e.target.value;
    setTitle(title);
  };

  /**
   * 输入框获得焦点时
   * 设置编辑状态为 true，显示编辑样式
   */
  const handleTitleFocus = () => {
    setIsEditing(true);
  };

  /**
   * 节点描述改变事件
   * @param {Event} e - 输入事件对象
   */
  const handleNodeDescChange = (e) => {
    updateDataEvent("desc", e.target.value);
  };

  /**
   * 保存标题
   * 验证标题不能为空，如果为空则恢复原值并提示
   * @param {string} value - 要保存的标题值
   */
  const saveTitle = (value) => {
    if (!value.trim()) {
      setTitle(data.title);
      return message.warning("节点名称不能为空");
    }
    updateDataEvent("title", value);
  };

  /**
   * 失去焦点时保存标题并关闭编辑状态
   */
  const handleTitleBlur = () => {
    setIsEditing(false);
    saveTitle(title);
  };

  // ========== 运行面板事件 ==========

  /**
   * 运行面板事件
   * 切换到运行面板，用于测试节点功能
   */
  const runPanelEvent = () => {
    if (readOnly) return;
    if (!validateRequired(data)) {
      message.warning("必填项未完成配置!");
      return;
    }
    setPannerNode(props.nodeData)
    setPanelVisible(false);
    setRunVisible(true); 
  };

  // ========== 分组管理相关函数 ==========

  /**
   * 生成下一个分组名称
   * 自动生成格式为 "Group1", "Group2", "Group3" 等的名称
   * @param {Array} groups - 当前分组数组
   * @returns {string} 新的分组名称
   */
  function getNextGroupName(groups) {
    if (!Array.isArray(groups)) return "Group1";

    let maxNumber = 0;
    groups.forEach((g) => {
      const match = g.group_name.match(/^Group(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) maxNumber = num;
      }
    });

    return `Group${maxNumber + 1}`;
  }

  /**
   * 添加分组事件
   * 创建一个新的分组，初始状态为 output_type: "any"，variables: []
   */
  const handleAddGroupEvent = () => {
    if (readOnly) return;
    let groupArray = [...groupData];
    let addGroupData = {
      groupId: getUuid(), // 生成唯一ID
      group_name: getNextGroupName(groupArray), // 自动生成分组名称
      output_type: "any", // 初始输出类型为任意
      variables: [], // 初始变量列表为空
    };
    groupArray.push(addGroupData);
    setGroupData(groupArray);
    updateAdvancedSettingsEvent(groupArray);
  };

  /**
   * 更新高级设置事件
   * 将分组数据更新到节点的 advanced_settings 中
   * @param {Array} data - 分组数据数组
   */
  const updateAdvancedSettingsEvent = (data) => {
    let advanced_settings = {
      group_enabled: true, // 启用分组功能
      groups: data, // 分组数据
    };
    updateDataEvent("advanced_settings", advanced_settings);
  };

  /**
   * 删除分组事件
   * @param {Object} item - 要删除的分组项
   * @param {number} groupIndex - 分组在数组中的索引
   */
  const deleteGroupEvent = (item, groupIndex) => {
    if (readOnly) return;
    let groupArray = [...groupData];
    groupArray.splice(groupIndex, 1);
    setGroupData(groupArray);
    updateAdvancedSettingsEvent(groupArray);
  };

  // ========== 变量管理相关函数 ==========

  /**
   * 添加变量事件
   * 向指定分组中添加一个新变量
   * 如果分组中还没有变量，则根据第一个变量的类型设置分组的 output_type
   * @param {Object} obj - 变量对象，包含 value_selector 和 variable_type
   * @param {Object} item - 分组项对象
   */
  const handleAddVariableEvent = (obj, item) => {
    let value_selector = obj.value_selector; // 变量选择器路径
    let variable_type = obj.variable_type; // 变量类型
    if (readOnly) return;
    let groupArray = [...groupData];
    groupArray.forEach((g) => {
      if (g.groupId === item.groupId) {
        // 初始化输出变量类型：如果分组为空，则使用第一个变量的类型
        g.output_type = g.variables.length == 0 ? variable_type : g.output_type;
        g.variables.push(value_selector);
      }
    });
    setGroupData(groupArray);
    updateAdvancedSettingsEvent(groupArray);
  };

  /**
   * 验证两个数组是否完全相同
   * 注意：此函数目前未被使用
   * @param {Array} a - 第一个数组
   * @param {Array} b - 第二个数组
   * @returns {boolean} 是否完全相同
   */
  const arrayEqual = (a, b) => {
    if (a.length !== b.length) return false;
    return a.every((v, i) => v === b[i]);
  };

  /**
   * 变量更新事件
   * 更新指定分组中指定索引的变量
   * 会检查是否存在重复变量，如果重复则不更新
   * @param {Object} obj - 新的变量对象，包含 value_selector
   * @param {Object} item - 分组项对象
   * @param {number} variableIndex - 变量在分组中的索引
   */
  const handleVariableUpdateEvent = (obj, item, variableIndex) => {
    let groupArray = [...groupData];
    // 更新变量
    groupArray.forEach((g) => {
      if (g.groupId === item.groupId) {
        g.variables[variableIndex] = obj?.value_selector;
      }
    });
    setGroupData(groupArray);
    updateAdvancedSettingsEvent(groupArray);
  };

  /**
   * 删除变量事件
   * 从指定分组中删除指定索引的变量
   * @param {Object} item - 分组项对象
   * @param {number} groupIndex - 变量在分组中的索引（注意：参数名可能有误，实际是变量索引）
   */
  const deleteGroupVariableEvent = (item, groupIndex) => {
    if (readOnly) return;
    let groupArray = [...groupData];
    groupArray.forEach((g) => {
      if (g.groupId === item.groupId) {
        g.variables.splice(groupIndex, 1);
        if(g.variables.length == 0) {
          g.output_type = "any";
        }
      }
    });
    setGroupData(groupArray);
    updateAdvancedSettingsEvent(groupArray);
  };
  //编辑分组事件
  const handleEditGroupEvent = (item, groupIndex) => {
    setEditGroup(item);
  };

  /**
   * 更新分组名称事件
   * @param {Event} e - 输入事件对象
   * @param {Object} item - 分组项对象
   */
  const handleGroupNameChange = (e, item) => {
    let value = e.target.value;
    let errorMsg = "";
    if (value.trim() == "") {
      //
      return false;
    }
    if (value) {
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
        errorMsg = "分组名称只能包含字母、数字和下划线，且不能以数字开头";
      }
      // 检查变量名是否重复（排除当前索引）
      const isDuplicate = groupData.some((g) => g.group_name === value);
      if (isDuplicate) {
        errorMsg = "分组名称不能重复";
      }
    }
    let groupArray = [...groupData];
    groupArray.forEach((g) => {
      if (g.groupId === item.groupId) {
        g.group_name = e.target.value;
        g.errorMsg = errorMsg;
      }
    });
    setGroupData(groupArray);
    updateAdvancedSettingsEvent(groupArray);
  };
  //编辑分组失去焦点事件
  const handleGroupNameBlur = (e, item) => {
    setEditGroup(null);
  };
  // ========== 渲染部分 ==========
  const updateNodeDataByHeader =(obj)=>{
    setData(obj);
    updateNodeDetailEvent(obj);
   }
  return (
    <div className={variableAggregatorStyles["panel_main"]}>
    <RunHeader data={data} updateNodeDataByHeader={updateNodeDataByHeader} runPanelEventByHeader={runPanelEvent}   />
      {/* 聚合器内容区域 */}
      <div className={variableAggregatorStyles["aggregator_content"]}>
        {/* 分组列表 */}
        <div className={variableAggregatorStyles["aggregator_content_main"]}>
          {groupData.map((item, groupIndex) => (
            <div
              key={item.groupId}
              className={variableAggregatorStyles["aggregator_item"]}
            >
              {/* 分组头部 */}
              <div
                className={variableAggregatorStyles["aggregator_item_header"]}
              >
                {/* 分组头部左侧：图标、名称、类型、操作按钮 */}
                <div
                  onMouseEnter={() => setHoverGroupId(item.groupId)}
                  onMouseLeave={() => setHoverGroupId(null)}
                  className={
                    variableAggregatorStyles["aggregator_item_header_left"]
                  }
                >
                  {/* 分组图标 */}
                  <img
                    src="/workflow/group.png"
                    alt=""
                    className={
                      variableAggregatorStyles["aggregator_item_header_img"]
                    }
                  />
                  {/* 分组名称（必填标记） */}
                  {editGroup?.groupId != item.groupId && (
                    <div
                      className={
                        variableAggregatorStyles["aggregator_item_header_name"]
                      }
                    >
                      {item.group_name}
                      <div className="span_required">*</div>
                    </div>
                  )}
                  {editGroup?.groupId == item.groupId && (
                    <Input
                      size="small"
                      autoFocus={true}
                      disabled={readOnly}
                      value={item.group_name}
                      maxLength={20}
                      onChange={(e) => {
                        handleGroupNameChange(e, item);
                      }}
                      onBlur={(e) => {
                        handleGroupNameBlur(e, item);
                      }}
                    />
                  )}
                  {/* 输出类型标签（当类型不为 any 时显示） */}
                  {item.output_type != "any" && (
                    <div
                      className={
                        variableAggregatorStyles.aggregator_output_type
                      }
                    >
                      {item.output_type?.toUpperCase()}
                    </div>
                  )}
                  {hoverGroupId === item.groupId && (
                    <div className={variableAggregatorStyles.group_action}>
                      {/* 编辑按钮（目前未实现功能） */}
                      <img
                        src="/workflow/common/edit.png"
                        onClick={() => {
                          handleEditGroupEvent(item, groupIndex);
                        }}
                        className={variableAggregatorStyles.group_action_img}
                        alt=""
                      />
                      {/* 删除按钮（至少保留一个分组时显示） */}
                      {groupData.length > 1 && (
                        <img
                          onClick={() => {
                            if (readOnly) return;
                            deleteGroupEvent(item, groupIndex);
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.src =
                              "/workflow/common/delete_hover.png")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.src =
                              "/workflow/common/delete.png")
                          }
                          className={`${
                            variableAggregatorStyles["panel_item_right_del"]
                          } ${readOnly ? "readOnly" : ""}`}
                          src="/workflow/common/delete.png"
                          alt=""
                        />
                      )}
                    </div>
                  )}
                  {/* 分组名称编辑输入框（已注释，未使用） */}
                </div>
                {/* 分组头部右侧：添加变量按钮 */}
                <div
                  className={
                    variableAggregatorStyles["aggregator_item_header_right"]
                  }
                >
                  <VariableCascader
                    disabled={readOnly}
                    readOnly={readOnly}
                    data={variableData}
                    allowMiddleSelect={true}
                    filterVariable={item.variables}
                    // 如果输出类型为 any，不过滤；否则只显示匹配类型的变量
                    filterData={
                      item.output_type == "any" ? [] : [item.output_type]
                    }
                    onChange={(value) => {
                      handleAddVariableEvent(value, item);
                    }}
                  >
                    <div
                      className={
                        variableAggregatorStyles[
                          "aggregator_item_header_right_content"
                        ]
                      }
                    >
                      <img
                        src="/workflow/add.png"
                        className={
                          variableAggregatorStyles["aggregator_content_add_img"]
                        }
                      />
                      添加
                    </div>
                  </VariableCascader>
                </div>
              </div>
              {/* 分组内容区域：变量列表 */}
              <div
                className={variableAggregatorStyles["aggregator_item_content"]}
              >
                {/* 空状态提示 */}
                {item.variables.length == 0 && (
                  <div
                    className={
                      variableAggregatorStyles["aggregator_item_content_empty"]
                    }
                  >
                    请选择变量
                  </div>
                )}
                {/* 变量列表 */}
                {item.variables.length > 0 &&
                  item.variables.map((variable, variableIndex) => (
                    <div
                      key={variableIndex}
                      className={
                        variableAggregatorStyles["aggregator_item_content_item"]
                      }
                    >
                      {/* 变量选择器 */}
                      <div
                        className={
                          variableAggregatorStyles[
                            "aggregator_item_content_item_left"
                          ]
                        }
                      >
                        <VariableCascader
                          disabled={readOnly}
                          value_selector={variable}
                          readOnly={readOnly}
                          data={variableData}
                          allowMiddleSelect={false}
                          filterVariable={item.variables}
                          // 如果输出类型为 any，不过滤；否则只显示匹配类型的变量
                          filterData={
                            item.output_type == "any" ? [] : [item.output_type]
                          }
                          onChange={(value) => {
                            handleVariableUpdateEvent(
                              value,
                              item,
                              variableIndex
                            );
                          }}
                        />
                      </div>
                      {/* 删除变量按钮 */}
                      <div
                        className={
                          variableAggregatorStyles[
                            "aggregator_item_content_item_right"
                          ]
                        }
                      >
                        
                        <img
                          onClick={() => {
                            if (readOnly) return;
                            deleteGroupVariableEvent(item, variableIndex);
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.src =
                              "/workflow/common/delete_hover.png")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.src =
                              "/workflow/common/delete.png")
                          }
                          className={`${
                            variableAggregatorStyles["panel_item_right_del"]
                          } ${readOnly ? "readOnly" : ""}`}
                          src="/workflow/common/delete.png"
                          alt=""
                        />
                      </div>
                    </div>
                  ))}
              </div>
              {/* 错误提示区域 */}
              {item.errorMsg && (
                <div className={variableAggregatorStyles.aggregator_item_content_error}>
                  {item.errorMsg}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 添加分组按钮 */}
        <div
          className={variableAggregatorStyles["aggregator_content_add"]}
          onClick={handleAddGroupEvent}
        >
          <img
            src="/workflow/add.png"
            className={variableAggregatorStyles["aggregator_content_add_img"]}
            alt=""
          />
          添加分组
        </div>
        {/* 聚合策略说明 */}
        <div className={variableAggregatorStyles.aggregator_content_desc}>
          聚合策略：返回每个分组中第一个非空的值
        </div>
        {/* 输出变量 */}
        <div className={variableAggregatorStyles.aggregator_output_variable}>
          <div
            className={
              variableAggregatorStyles.aggregator_output_variable_title
            }
          >
            输出变量
          </div>
          <div className={variableAggregatorStyles.output_variable_content}>
            {groupData.map((item, groupIndex) => (
              <div
                key={groupIndex}
                className={
                  variableAggregatorStyles.output_variable_content_item
                }
              >
                <div
                  className={
                    variableAggregatorStyles.output_variable_item_title
                  }
                >
                  {item.group_name}.output{" "}
                  <span
                    className={
                      variableAggregatorStyles.output_variable_item_title_type
                    }
                  >
                    {capitalizeFirstLetter(item.output_type)}
                  </span>
                </div>
                <div
                  className={variableAggregatorStyles.output_variable_item_desc}
                >
                  {item.group_name} 的输出变量
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

export default VariableAggregatorPanel;
