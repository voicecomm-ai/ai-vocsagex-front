"use client";

import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
  useMemo
} from "react";
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
} from "antd";
import styles from "../node.module.css";
import Variable from "../../../Dialog/Variable";
import assignerStyles from "./assigner.module.css";

import { useNodesInteractions, useNodeData } from "../../hooks";
import VariableCascader from "../../../variableCascader";
import RunHeader from "../../components/RunHeader";  
import debounce from "lodash/debounce";
import JsonEditor from "./JsonEditor";
import { useStore } from "@/store/index";
import { getUuid } from "@/utils/utils";
import { useAssigner } from "./hooks/use-assigner";
import JsonModal from "./JsonModal";


const StringActions = [
  {
    label: "覆盖",
    value: "over-write",
  },
  {
    label: "清空",
    value: "clear",
  },
  {
    label: "设置",
    value: "set",
  },
];
const NumberActions = [
  {
    label: "+=",
    value: "+=",
  },
  {
    label: "-=",
    value: "-=",
  },
  {
    label: "*=",
    value: "*=",
  },
  {
    label: "/=",
    value: "/=",
  },
];
const ObjectActions = [
  {
    label: "覆盖",
    value: "over-write",
  },
  {
    label: "清空",
    value: "clear",
  },
  {
    label: "追加",
    value: "append",
  },
  {
    label: "扩展",
    value: "extend",
  },
  {
    label: "移除首项",
    value: "remove-first",
  },
  {
    label: "移除末项",
    value: "remove-last",
  },
];

const AssignerPanel = forwardRef((props, ref) => {
  const { TextArea } = Input;
  const { Paragraph, Text } = Typography;
  const {
    setPanelVisible,
    readOnly,
    setPannerNode,
    setRunVisible,
    panelVisible,
    pannerNode,
    setChangeId,
    changeId,
    changeNodeType,
    setChangeNodeType,
  } = useStore((state) => state);
  const { updateNodeDetail, isNodeConnected } = useNodesInteractions()
  const { getUpstreamVariables, getNodeById } = useNodeData();
  const { getLoopVariableEvent } = useAssigner();
  useImperativeHandle(ref, () => ({
    hideModal,
  }));

  const deleteModalRef = useRef(null); //变量删除ref
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({}); //数据
  const [loading, setLoading] = useState(false); //加载中
  const [title, setTitle] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [variableData, setVariableData] = useState([]); //变量数据列表
  const [loopVariableData, setLoopVariableData] = useState([]); //循环节点变量数据列表
  const [jsonId,setJsonId] = useState(0);
  const [cacheFrontVariableData, setCacheFrontVariableData] = useState([]); //上游节点变量数据列表
  const jsonModalRef = useRef(null); //json弹框ref
  useEffect(() => {
    if (panelVisible && pannerNode) {
      setData(pannerNode.data);
      setTitle(pannerNode.data.title);
      initEvent(1);
    }
  }, [panelVisible]);

  useEffect(() => {
    if (panelVisible) {
      handleNodeVariableEvent();
    }
  }, [changeId]);
  //初始化事件
  const initEvent = (type) => {
    let nodeData = getNodeById(pannerNode.data.id);
    let loopVariable = getLoopVariableEvent(pannerNode.data.id);
    let items = nodeData.data.items || [];
    handleRenderVariableData(items, loopVariable, type);
    setLoopVariableData(loopVariable);
    setJsonId(getUuid());
  };

  //处理节点变量获取刷新问题
  const handleNodeVariableEvent = () => {
    let loopVariable = getLoopVariableEvent(pannerNode.data.id);
    setLoopVariableData(loopVariable);
  };  

  //处理生成渲染数据列表
  const handleRenderVariableData = (items = [], data = [], type = 0) => {
    let isNeedUpdate = false;

    const variableArr = items.map((item) => {
      const variableObj = findNodeByValueSelector(data, item.variable_selector);
      const nextItem = { ...item };

      // 当变量类型不一致时，根据最新变量类型纠正配置
      if (variableObj && nextItem.variable_type !== variableObj.variable_type) {
        const actionSelects = getActionSelects(variableObj.variable_type) || [];
        const firstChild = actionSelects[0] || { value: null };
        nextItem.variable_type = variableObj.variable_type;
        nextItem.operation = firstChild.value;
        nextItem.input_type = isSetVariable(firstChild.value) ? "variable" : "constant";
        nextItem.value = "";
        isNeedUpdate = true;
      }

      return {
        ...nextItem,
        filterData: variableObj ? [variableObj.variable_type] : [],
      };
    });

    // 仅在需要时同步节点数据，避免无意义的 update
    if (type === 1 && isNeedUpdate) {
      updateDataEvent("items", variableArr);
    }

    setVariableData(variableArr);
  };
  //关闭事件
  const hideModal = () => {
    setOpen(false);
  };

  // 关闭面板事件
  const closePanelEvent = () => {
    setPannerNode(null);
    setPanelVisible(false);
  };

  // 更新数据事件处理函数
  const updateDataEvent = (dataPar, dataParValue) => {
    let nodeData = getNodeById(pannerNode.data.id);
    const obj = {
      ...nodeData.data,
      [dataPar]: dataParValue,
    };
    setData(obj);
    updateNodeDetailEvent(obj);
  };

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
    }, 50) //
  ).current;

  // 节点标题改变事件
  const handleNodeTitleChange = (e) => {
    let title = e.target.value;
    setTitle(title);
  };

  // 输入框获得焦点时
  const handleTitleFocus = () => {
    setIsEditing(true);
  };
  const handleNodeDescChange = (e) => {
    updateDataEvent("desc", e.target.value);
  };
  // 保存标题
  const saveTitle = (value) => {
    if (!value.trim()) {
      setTitle(data.title);
      return message.warning("节点名称不能为空");
    }
    updateDataEvent("title", value);
  };
  // 失去焦点时保存标题并关闭编辑
  const handleTitleBlur = () => {
    setIsEditing(false);
    saveTitle(title);
  };

  //添加变量点击事件
  const addVariableEvent = () => {
    if(readOnly){
      return;
    }
    let addData ={
      variable_selector:null,
      variable: "",
      operation: null,
      variable_type: null,
      value: "",
      input_type:'constant',
    }
    variableData.push(addData);
    setVariableData(variableData);
    updateDataEvent("items", variableData);
  };

  //删除变量点击事件
  const deleteVariableEvent = (item, index) => {
    if (readOnly) return;
    let variableArr = variableData.filter((i, iIndex) => iIndex !== index);
    setVariableData(variableArr);
    updateDataEvent("items", variableArr);
  };

  const customStyle = {
    //自定义Cascader样式
    border: "none",
    background: "transparent",
  };
  //根据数据类型渲染不同的select 选项
  const renderSelectOptions = (item) => {
    let variableObj = findNodeByValueSelector(
      loopVariableData,
      item.variable_selector
    );
    if (variableObj ||item.variable_type) {
      let type = variableObj ? variableObj.variable_type : item.variable_type;
      return getActionSelects(type);
    } else {
      return [];
    }
  };
  //根据类型返回不同的数组
  const getActionSelects = (variable_type) => {
    switch (variable_type) {
      case "string":
        return StringActions;
      case "object":
        return StringActions;
      case "number":
        return StringActions.concat(NumberActions);
      case "array[string]":
        return ObjectActions;
      case "array[number]":
        return ObjectActions;
      case "array[object]":
        return ObjectActions;
      case "array[boolean]":
        return ObjectActions;
    }
  };
  /**
   * 根据 value_selector 递归查找对应节点
   * @param {Array} data - 节点数组
   * @param {Array} value_selector - 要查找的路径数组，例如 ["697a8b25-9738-6390-933a-952cb9508c3d", "test12"]
   * @returns {Object|null} 找到的节点对象或 null
   */
  function findNodeByValueSelector(data, value_selector) {
    if (
      !Array.isArray(data) ||
      !Array.isArray(value_selector) ||
      value_selector.length === 0
    ) {
      return null;
    }
    for (const node of data) {
      // 检查当前节点是否匹配
      if (
        Array.isArray(node.value_selector) &&
        node.value_selector.length === value_selector.length &&
        node.value_selector.every((v, i) => v === value_selector[i])
      ) {
        return node;
      }

      // 如果有子节点，递归查找
      if (node.children && node.children.length > 0) {
        const found = findNodeByValueSelector(node.children, value_selector);
        if (found) return found;
      }
    }

    return null;
  }

  //更新变量数据事件
  const updateVariableDataEvent = (index, key, value) => {
    let variableArr = [...variableData];
    variableArr[index][key] = value;
    setVariableData(variableArr);
    updateDataEvent("items", variableArr);
  };

  const  isSetVariable = (value) => {
    if(value == "over-write" || value == "append" || value == "extend" || value == "clear" || value == "remove-first" || value == "remove-last") {
      return true;
    }
    return false;
  };
  //上游变量选中change 事件
  const variableCascaderChangeEvent = (obj, index) => {
    let value_selector = obj.value_selector;
    let actionSelects = getActionSelects(obj.variable_type);
    let firstChild = actionSelects?actionSelects[0]:{value:null};
    let variableArr = [...variableData];
    variableArr[index].operation = firstChild.value;
    variableArr[index].value = "";
    variableArr[index].variable_type = obj.variable_type;
    variableArr[index].variable_selector = value_selector;
    variableArr[index].input_type=isSetVariable(firstChild.value)?'variable':'constant';
    setVariableData(variableArr);
    updateDataEvent("items", variableArr);
  };

  //获取上游节点变量数据事件
  const getFrontVariableDataEvent = useMemo(() => {
    return (item) => {
      let isConnected = isNodeConnected(pannerNode.data.id, 'target');
      let frontArr = isConnected ? getUpstreamVariables(pannerNode.data.id) : [];
      let returnData = filterVariables(frontArr, item.variable_selector);
      return returnData;
    };
  }, [changeId]);
/**
 * 过滤出 value_selector 与 targetSelector 完全相同的变量项
 * @param {Array} nodes - 节点数组
 * @param {Array} targetSelector - 需要匹配的 selector，例如 ['4703f36b-6647-607d-baba-7a557c37a7cc', 'tees']
 * @returns {Array} - 匹配的变量项数组
 */
const filterVariables = (nodes, targetSelector) => {
  // 深度遍历 nodes，过滤 children 里匹配的变量
  return nodes.map(node => {
    if (!node.children) return node;

    const filteredChildren = node.children.filter(child => {
      const selector = child.value_selector || child.valueSelectorArr;
      // 保留 selector 不完全等于 targetSelector 的项
      return !(
        Array.isArray(selector) &&
        selector.length === targetSelector.length &&
        selector.every((v, i) => v === targetSelector[i])
      );
    });

    return { ...node, children: filteredChildren };
  });
}

  //
  const extractBracketValue = (str) => {
    const match = String(str).match(/\[([^\]]+)\]/);
    return match ? match[1].trim() : "";
  };
 
  //变量值设置事件
  const variableValueChangeEvent = (obj, index) => {
    let value_selector = obj.value_selector;
    let variableArr = [...variableData];
    variableArr[index].value = value_selector;
    setVariableData(variableArr);
    updateDataEvent("items", variableArr);
  };
  //根据不同的操作类型返回不同的操作
  const renderVariableItem = (item, index) => {
    let frontVariableData = getFrontVariableDataEvent(item);
    let key = getUuid();
    let filterData = [item.variable_type];
    if (item.operation === "append") {
      // 追加时需要提取括号内的值
      let bracketValue = extractBracketValue(item.variable_type);
      filterData = [bracketValue];
    }
    switch (item.operation) {
      case "over-write": //覆盖
        return (
          <VariableCascader
            value_selector={item.value}
            style={customStyle}
            filterData={filterData}
             placeholder='设置参数'
           key={key}
            allowMiddleSelect={false}
            disabled ={readOnly}
            onChange={(value) => {
              variableValueChangeEvent(value, index);
            }}
            data={frontVariableData}
          />
        );
      case "set": //设置
        return renderSetInputArea(item, index);
      case "append": //追加
        return (
          <VariableCascader
            value_selector={item.value}
            style={customStyle}
             placeholder='设置参数'
            filterData={filterData}
            allowMiddleSelect={false}
            disabled ={readOnly}
            key={key}
            onChange={(value) => {
              variableValueChangeEvent(value, index);
            }}
            data={frontVariableData}
          />
        );
      case "extend": //扩展
        return (
          <VariableCascader
            value_selector={item.value}
            style={customStyle}
            filterData={filterData}
             placeholder='设置参数'
            allowMiddleSelect={false}
            disabled ={readOnly}
            key={key}
            onChange={(value) => {
              variableValueChangeEvent(value, index);
            }}
            data={frontVariableData}
          />
        );
        case "+=": //增加
        return (
          <InputNumber
          value={item.value}
          style={{ width: "100%" }}
          variant="borderless"
          placeholder="请输入"
          disabled={readOnly}
          onChange={(value) => {
            updateVariableDataEvent(index, "value", value);
          }}
        />
        );
      case "-=": //减少
        return (
          <InputNumber
          value={item.value}
          style={{ width: "100%" }}
          variant="borderless"
          placeholder="请输入"
          disabled={readOnly}
          onChange={(value) => {
            updateVariableDataEvent(index, "value", value);
          }}
        />
        );
      case "*=": //乘以
        return (
          <InputNumber
          value={item.value}
          style={{ width: "100%" }}
          variant="borderless"
          placeholder="请输入"
          disabled={readOnly}
          onChange={(value) => {
            updateVariableDataEvent(index, "value", value);
          }}
        />
        );
      case "/=": //除以
        return (
          <InputNumber
          value={item.value}
          style={{ width: "100%" }}
          variant="borderless"
          placeholder="请输入"
          disabled={readOnly}
          onChange={(value) => {
            updateVariableDataEvent(index, "value", value);
          }}
        />
        );
     
    }
  };
  //渲染设置的输入区域
  const renderSetInputArea = (item, index) => {
    switch (item.variable_type) {
      case "string": //字符串
        return (
          <TextArea
            autoSize={{ minRows: 1, maxRows: 6 }}
            placeholder="请输入"
            variant="borderless"
            disabled={readOnly}
            value={item.value}
            onChange={(e) => {
              updateVariableDataEvent(index, "value", e.target.value);
            }}
          />
        );
      case "number": //数字
        return (
          <InputNumber
            value={item.value}
            style={{ width: "100%" }}
            variant="borderless"
            placeholder="请输入"
            disabled={readOnly}
            onChange={(value) => {
              updateVariableDataEvent(index, "value", value);
            }}
          />
        );
      case "object": //对象
        return (
          <div className={assignerStyles["object_content"]}>
            <div className={assignerStyles["object_content_header"]}>
              <img
                src="/workflow/json_copy.png"
                onClick={() => handleCopy(item.value)}
                alt=''
              />
              <img
                alt=''
                src="/workflow/json_full.png"
                onClick={() => toggleFullscreen(item,index)}
              />
            </div>
            <div className={assignerStyles["object_content_json"]}>
              <JsonEditor
                readOnly={readOnly}
                content={item.value}
                disabled={readOnly}
                key={jsonId}
                onChange={(value) => {
                  console.log(value, "value");
                  handleVariableDataChangeJson(value, item, index);
                }}
              />
            </div>
          </div>
        );
    }
  };
  const toggleFullscreen = (item,index) => {
    jsonModalRef.current.showModal(item,index);
  };
  //复制点击事件
  const handleCopy = (value) => {
    const jsonStr = JSON.stringify(value);
    navigator.clipboard.writeText(jsonStr).then(() => {
      message.success("复制成功");
    });
  };
  //处理未放大json数据事件
  const handleVariableDataChangeJson = (value, item, index) => {
    let jsonObj = typeof value === "string" ? JSON.parse(value) : value;
    console.log(jsonObj, "jsonObj");
    updateVariableDataEvent(index, "value", jsonObj);
  };

  //判断是否需要展示输入框区域
  const isShowInputArea = (item) => {
    let isShow = true; //clear remove-first remove-last 不展示
    if (
      item.operation === "remove-first" ||
      item.operation === "clear" ||
      item.operation === "remove-last"
    ) {
      isShow = false;
    }
    return isShow;
  };
   //json数据改变事件
  const changeJsonDataEvent = (index,json) => {
    console.log(index,json, "index,json");
    setJsonId(getUuid());
    handleVariableDataChangeJson(json, variableData[index], index);
  };

 //操作类型change 事件
 const writeModeChangeEvent = (value, index) => {
  let variableArr = [...variableData];
  variableArr[index].operation = value;
  variableArr[index].value =''; //切换操作类型时清空值
  variableArr[index].input_type=isSetVariable(value)?'variable':'constant';
  console.log(variableArr, "variableArr");
  console.log(value, "value");
  setVariableData(variableArr);
  updateDataEvent("items", variableArr);
 };

 const renderVariableType = (item) => {
  let variableValue = item.variable_type;
  if (item.operation === "append") {
    // 追加时需要提取括号内的值
    let bracketValue = extractBracketValue(variableValue);
    variableValue = bracketValue;
  }
  return capitalizeFirstLetter(variableValue);
 }
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
  const updateNodeDataByHeader =(obj)=>{
    setData(obj);
    updateNodeDetailEvent(obj);
   }
  return (
    <div className={styles["panel_main"]}>
     <RunHeader data={data} updateNodeDataByHeader={updateNodeDataByHeader}  isRun={false}  />
      <div className="node_panel_config">
      <div className={styles["start_panel_variable"]}>
        <div className={styles["start_panel_variable_title"]}>变量</div>

        <div
          className={`${styles["start_panel_variable_add"]} ${
            readOnly ? "readOnly" : ""
          }`}
          onClick={addVariableEvent}
        >
          <img src="/workflow/add.png" /> 添加
        </div>
      </div>
      <div className={assignerStyles["assigner_panel_content"]}>
        {variableData.map((item, index) => (
          <div className={assignerStyles["panel_item"]} key={index}>
            <div className={assignerStyles["panel_item_left"]}>
              <div className={assignerStyles["panel_item_left_header"]}>
                <div className={assignerStyles["panel_item_left_header_left"]}>
                  <VariableCascader
                    value_selector={item.variable_selector}
                    style={customStyle}
                    allowMiddleSelect={false}
                    placeholder='请选择变量'
                    disabled ={readOnly}
                    key={loopVariableData.length+index}
                    onChange={(value) => {
                      variableCascaderChangeEvent(value, index);
                    }}
                    data={loopVariableData}
                  />
                </div>
                <Divider type="vertical" />
                <div className={assignerStyles["panel_item_left_header_right"]}>
                  <Select
                    options={renderSelectOptions(item)}
                    variant="borderless"
                    disabled={readOnly || !item.variable_selector}
                    placeholder="操作"
                    value={item.operation}
                    classNames={{
                      root: assignerStyles[
                        "panel_item_left_header_right_select_root"
                      ],
                    }}
                    className={`${assignerStyles["panel_item_left_header_right_select"]}`}
                    onChange={(value) => {
                      writeModeChangeEvent(value, index);
                    
                    }}
                  ></Select>
                </div>
              </div>
              {/* 展示输入框区域 */}
              {isShowInputArea(item) && item.variable_selector && (
                <div className={assignerStyles["panel_item_right_content"]}>
                  {renderVariableItem(item, index)}
                {item.input_type === 'variable'&&!item.value && (
                  <div className={assignerStyles["panel_item_right_content_variable_type"]}> {renderVariableType(item)}</div> 
                )}
                </div>
              )}
            </div>
            <div className={assignerStyles["panel_item_right"]}>
              <img
                onClick={() => {
                  if (readOnly) return;
                  deleteVariableEvent(item, index);
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.src = "/workflow/common/delete_hover.png")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.src = "/workflow/common/delete.png")
                }
                className={`${assignerStyles["panel_item_right_del"]} ${
                  readOnly ? "readOnly" : ""
                }`}
                src="/workflow/common/delete.png"
                alt=""
              />
            </div>
          </div>
        ))}
      </div>
      </div>
      <JsonModal ref={jsonModalRef} changeJsonDataEvent={changeJsonDataEvent} readOnly={readOnly} />
    </div>
  );
});

export default AssignerPanel;
