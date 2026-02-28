"use client";

import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
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
  Switch,
  Select,
  Divider,
  InputNumber,
  Tooltip,
  Slider,
} from "antd";
import styles from "../node.module.css";
import iterationStyles from "./iteration.module.css";
import { useNodesInteractions, useNodeData, useCheck } from "../../hooks";

import debounce from "lodash/debounce";
import { useStore } from "@/store/index";
import { getUuid } from "@/utils/utils";
import VariableCascader from "../../../variableCascader";
import { useIteration } from "./hooks";
import RunHeader  from '../../components/RunHeader'
const inputFilterData = [
  "array[string]",
  "array[number]",
  "array[object]",
  "array[file]",
  "array",
];

const IterationPanel = forwardRef((props, ref) => {
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
    setChangeNodeType,
  } = useStore((state) => state);
  const { updateNodeDetail } = useNodesInteractions();
  const {
    getUpstreamVariables,
    getNodeById,
    getCurrentAndDownstreamVariables,
  } = useNodeData();
  const { checkIterationNodeRequired } = useCheck();
  const { getIterationChildVariables } = useIteration();
  useImperativeHandle(ref, () => ({
    hideModal,
  }));

  const deleteModalRef = useRef(null); //变量删除ref
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({}); //数据
  const [loading, setLoading] = useState(false); //加载中
  const [title, setTitle] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [iterationVariables, setIterationVariables] = useState([]); //变量数据列表
  const [inputVariableData, setInputVariableData] = useState([]); //输入变量数据
  const [outputVariableData, setOutputVariableData] = useState([]); //输出变量数据

  useEffect(() => {
    if (panelVisible && pannerNode) {
      setData(pannerNode.data);
      setTitle(pannerNode.data.title);
      initEvent();
    }
  }, [panelVisible]);

  //初始化事件
  const initEvent = () => {
    let nodeData = getNodeById(pannerNode.data.id);
    let inputVariableArray = getUpstreamVariables(pannerNode.data.id);
    setInputVariableData(inputVariableArray);
    let outputVariableArray = getIterationChildVariables(pannerNode.data.id);
    setOutputVariableData(outputVariableArray);
  };

  useEffect(() => {
    if (panelVisible) {
      initEvent();
    }
  }, [changeId]);

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
  //批量更新数据事件
  const updateDataEventBatch = (dataObj) => {
    let nodeData = getNodeById(pannerNode.data.id);
    const obj = {
      ...nodeData.data,
      ...dataObj,
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

  //运行面板事件
  const runPanelEvent = () => {
    if (readOnly) return;
    const isValid = checkIterationNodeRequired(data);
    if (!isValid) {
      message.warning("必填项未完成配置!");
      return;
    }
    setPannerNode(props.nodeData);
    setPanelVisible(false);
    setRunVisible(true);
  };

  // 最大并行数改变事件
  const handleParallelNumChange = (value) => {
    updateDataEvent("parallel_nums", value);
  };

  // 输入变量选择变化时处理函数
  // obj: 由 VariableCascader 返回的变量对象
  const handleInputVariableChange = (obj) => {
    // 获取变量选择器数组
    let value_selector = obj?.value_selector;
    // 获取变量类型（如 array[string], array[number] 等）
    let variable_type = obj?.variable_type;
    // 如果 variable_type 为空，默认设置为 'array[string]'
    let iterator_input_type = !variable_type ? "array[string]" : variable_type;

    // 构造需要更新的数据对象
    let updateData = {
      iterator_selector: value_selector ||[], // 选中的输入变量 selector
      iterator_input_type: iterator_input_type, // 选中的输入变量类型
    };

    // 调用批量更新事件，将更改同步到节点数据
    updateDataEventBatch(updateData);
  };

  
  //判断当前类型 是否为array 类型
  const isArrayType = (variable_type) => {
    return variable_type.includes("array");
  }

  // 输出变量选择变化时处理函数
  const handleOutputVariableChange = (obj) => {
    let value_selector = obj?.value_selector || [];
    let  variable_type = obj?.variable_type || "array[string]";
    let updateData = {
      output_selector: value_selector,
      output_type: !isArrayType(variable_type) ? "array["+variable_type+"]" : variable_type,
    };
    updateDataEventBatch(updateData);
  };

  const updateNodeDataByHeader =(obj)=>{
    setData(obj);
    updateNodeDetailEvent(obj);
   }
  return (
    <div className={iterationStyles["panel_main"]}>
       <RunHeader data={data} updateNodeDataByHeader={updateNodeDataByHeader} runPanelEventByHeader={runPanelEvent}   />
      <div className={iterationStyles["panel_main_content"]}>
        <div className={iterationStyles["iteration_content_title"]}>
          输入
          <div className="span_required">*</div>
          <div className={iterationStyles["iteration_content_title_array"]}>Array</div>
          </div>
        <div className={iterationStyles["iteration_content_input"]}>
          <VariableCascader
            disabled={readOnly}
            value_selector={data.iterator_selector}
            data={inputVariableData}
            filterData={inputFilterData}
            onChange={handleInputVariableChange}
          />
        </div>
        <div className={iterationStyles["iteration_content_title"]}>
          输出变量
          <div className="span_required">*</div>
          <div className={iterationStyles["iteration_content_title_array"]}>Array</div>
        </div>
        <div className={iterationStyles["iteration_content_output"]}>
          <VariableCascader disabled={readOnly} value_selector={data.output_selector} data={outputVariableData} onChange={handleOutputVariableChange} />
        </div>
        <div className={iterationStyles["iteration_parallel_control"]}>
          <div className={iterationStyles["iteration_parallel_control_title"]}>
            并行模式
            <Tooltip title="并行模式控制批处理任务是否并行执行">
              <img
                src="/common/tip.png"
                alt=""
                className={
                  iterationStyles["iteration_parallel_control_title_icon"]
                }
              />
            </Tooltip>
          </div>
          <div className={iterationStyles["iteration_parallel_control_switch"]}>
            <Switch
              checked={data.is_parallel}
              disabled={readOnly}
              onChange={(checked) => {
                updateDataEvent("is_parallel", checked);
              }}
            />
          </div>
        </div>
        {data.is_parallel && (
        <div className={iterationStyles["iteration_parallel"]}>
          <div className={iterationStyles["iteration_parallel_title"]}>
            最大并行度
            <Tooltip title="用于控制单次处理并行的最大任务数量">
              <img
                src="/common/tip.png"
                className={
                  iterationStyles["iteration_parallel_control_title_icon"]
                }
              />
            </Tooltip>
          </div>

          <div className={iterationStyles["iteration_parallel_slider_conf"]}>
            <InputNumber
              value={data.parallel_nums}
              onChange={(value) => {
                handleParallelNumChange(value);
              }}
              variant="borderless"
              min={1}
              max={10}
              disabled={readOnly}
              className={
                iterationStyles["iteration_parallel_slider_conf_input"]
              }
            />
            <div
              className={
                iterationStyles["iteration_parallel_slider_conf_slider"]
              }
            >
              <Slider
                min={1}
                max={10}
                value={data.parallel_nums}
                onChange={handleParallelNumChange}
                disabled={readOnly}
              />
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
});

export default IterationPanel;
