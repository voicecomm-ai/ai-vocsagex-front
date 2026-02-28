"use client";

// LLM节点面板组件 - 用于配置大语言模型节点的各种参数
import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
  useCallback,
} from "react";
import {
  Input,
  Select,
  message,
  Switch,
  InputNumber,
  Slider,
  Tooltip,
  Spin,
  Button,
  Divider,
} from "antd";
import Image from "next/image";
import "../reset.css";
import styles from "./style.module.css";
import { getAgentModelList } from "@/api/agent";
const { TextArea } = Input;
import { useNodeData, useNodesInteractions } from "../../hooks";
import debounce from "lodash/debounce";
import { add, throttle } from "lodash";
import VariableCascader from "../../../variableCascader";
import { useStore } from "@/store/index";
import ContentInput from "./ContentInput";
import { getUuid } from "@/utils/utils";
import ModelSelect from "../../../model-select";
import ParamsModal from "./ParamsModal";
import RunHeader from "../../components/RunHeader";  
// LLM节点面板组件，使用forwardRef暴露方法给父组件
const parameterExtractionPanel = forwardRef((props, ref) => {
  // 获取节点交互相关方法
  const { updateNodeDetail } = useNodesInteractions();
  // 获取节点数据相关方法
  const { getUpstreamVariables, getNodeById } = useNodeData();

  // 从全局状态获取面板相关状态
  const {
    panelVisible, // 面板是否可见
    pannerNode, // 当前面板节点数据
    readOnly, // 是否只读模式
    setPannerNode, // 设置面板节点
    setPanelVisible, // 设置面板可见性
    setRunVisible, // 设置运行可见性
    changeId, // 变更ID
  } = useStore((state) => state);

  // 向父组件暴露方法
  useImperativeHandle(ref, () => ({}));

  // 节点数据状态
  const [data, setData] = useState({});
  // 加载状态
  const [loading, setLoading] = useState(false);
  // 模型列表状态
  const [rerankModelListArray, setRerankModelListArray] = useState([]);
  // 变量数组状态
  const [variableData, setVariableData] = useState([]);
  const [inputVariableData, setinputVariableData] = useState([]);
  // 提示词模板数组状态
  const isOpen = useRef(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenData, setFullscreenData] = useState({}); //全屏数据
  const [fullscreenIndex, setFullscreenIndex] = useState(0); //全屏索引
  const [variableId, setVariableId] = useState(null); //变量ID
  const [llmModelList, setLlmModelList] = useState([]); //文本模型列表
  const paramsModalRef = useRef(null); //参数设置模态框ref
  const [isEditing, setIsEditing] = useState(false); //标题输入框聚焦

  const [wordCount, setWordCount] = useState(0); //分类说明数字统计
  const outputList = [
    { name: "usage", type: "object", description: "模型用量信息" },
  ];

  // 监听面板可见性和节点数据变化，初始化数据
  useEffect(() => {
    // console.log(pannerNode.type, "pannerNode.type");

    if (
      panelVisible &&
      pannerNode &&
      pannerNode.type == "parameter-extractor"
    ) {
      initFun();
    }
  }, [panelVisible, changeId]);

  // 初始化函数
  const initFun = async () => {
    isOpen.current = true;
    setLoading(true);
    handleRenderVariable(); // 渲染变量
    let nodeData = getNodeById(pannerNode.data.id);
    await setData(nodeData.data); // 设置节点数据
    await getAgentModelListEvent(nodeData.data); // 获取模型列表
  };

  // 更新数据事件处理函数
  const updateDataEvent = (dataPar, dataParValue) => {
    console.log(dataPar, "dataPar");
    console.log(dataParValue, "dataParValue");

    let nodeData = getNodeById(pannerNode.data.id);
    if (isOpen.current) {
      const obj = {
        ...nodeData.data,
        [dataPar]: dataParValue,
      };

      setData(obj);
      updateNodeDetailEvent(obj);
    }
  };

  // 渲染变量函数
  const handleRenderVariable = (outputs) => {
    setVariableId(getUuid());
    const upstreamVariables = getUpstreamVariables(pannerNode.data.id);
    // console.log(upstreamVariables,'upstreamVariables');
    setVariableData(upstreamVariables);
    const filtered = filterVariables(upstreamVariables);
    setinputVariableData(filtered);
  };

  //输入变量数据只保留string，file及其下的string变量
  function filterVariables(data) {
    return data.map((item) => {
      const newItem = { ...item };

      if (newItem.children) {
        // 第一层 children
        newItem.children = newItem.children
          .filter(
            (child) =>
              child.variable_type === "string" || child.variable_type === "file"
          )
          .map((child) => {
            const newChild = { ...child };

            if (newChild.children) {
              // 第二层 children
              newChild.children = newChild.children.filter(
                (subChild) => subChild.variable_type === "string"
              );
            }

            return newChild;
          });
      }

      return newItem;
    });
  }

  // 更新节点详情的防抖函数
  const updateNodeDetailEvent = (data) => {
    const newData = {
      nodeId: pannerNode.data.id,
      data: {
        ...data,
      },
    };
    // console.log(newData);
    updateNodeDetail(newData);
  };
  // 关闭模态框事件
  const hideModal = () => {
    setOpen(false);
  };

  // 关闭面板事件
  const closePanelEvent = () => {
    setPannerNode(null);
    isOpen.current = false;
    setPanelVisible(false);
  };

  // 处理节点标题变更
  const handleNodeTitleChange = (e) => {
    updateDataEvent("title", e.target.value);
  };

  // 获取模型列表事件
  const getAgentModelListEvent = async (nodeDataPar) => {
    // console.log(11, "nodeDataPar");
    const reqPar = {
      type: 1,
      tagIdList: [1, 2], // 1 文本模型 2 多模态模型 3推理 9 排序
      isShelf: 1,
      isOr: 1,
    };
    await getAgentModelList(reqPar).then((res) => {
      const dataArray = res.data || [];
      setLlmModelList(dataArray);
      setLoading(false);
    });
  };

  // 选择模型处理函数
  const handleSelectModal = (obj) => {
    let modelPar = {
      ...data.model,
      ...obj,
    };

    updateDataEvent("model", modelPar);
  };

  // 选择变量值处理函数
  const onChangeVariable = (obj) => {
    console.log(obj.value_selector, "obj.value_selector");
    updateDataEvent("query", obj.value_selector);
  };

  // 运行面板事件
  const runPanelEvent = () => {
    if (readOnly) return;
    let nodeData = getNodeById(pannerNode.data.id);
    if (!data.query) return message.warning("请选择变量");
    if (data.parameters.length === 0) return message.warning("请填写提取参数");

    setPannerNode(nodeData);
    setPanelVisible(false);
    setRunVisible(true);
  };
  // 处理节点描述变更
  const handleNodeDescChange = (e) => {
    updateDataEvent("desc", e.target.value);
  };

  //全屏处理事件
  const handleFullscreenEvent = (data, index) => {
    setIsFullscreen(!isFullscreen);
    setFullscreenData(data);
    setFullscreenIndex(index);
  };
  const handleAddExtract = () => {
    paramsModalRef.current.showModal();
  };
  const addParamsEvent = (values, editIndex) => {
    if (editIndex !== null) {
      //编辑
      const newParameters = [...data.parameters];
      newParameters[editIndex] = values;
      updateDataEvent("parameters", newParameters);
    } else {
      // 新增
      const newParameters = [...data.parameters, values];
      updateDataEvent("parameters", newParameters);
    }
  };

  // 删除参数
  const handleDeleteParams = (index) => {
    const newParameters = [...data.parameters];
    newParameters.splice(index, 1);
    updateDataEvent("parameters", newParameters);
  };

  //编辑参数
  const handleEditParams = (index) => {
    const paramsItem = data.parameters[index];
    paramsModalRef.current.showModal(paramsItem, index);
  };

  // 提示词相关
  // 字数变化回调
  const handleWordCountChange = (count) => {
    setWordCount(count);
  };
  // 复制事件
  const handleCopy = () => {
    if (readOnly) return;
    navigator.clipboard.writeText(data.instruction || "").then(() => {
      message.success("复制成功");
    });
  };

  const updateNodeDataByHeader =(obj)=>{
    setData(obj);
    updateNodeDetailEvent(obj);
   }


  return (
    <div className={styles["panel_main"]}>
      <Spin spinning={loading} wrapperClassName="node_main_spin">
        {/* 面板头部区域 */}
        <RunHeader data={data} updateNodeDataByHeader={updateNodeDataByHeader} runPanelEventByHeader={runPanelEvent} isPadding={true}    />


        {/* 面板主要内容区域 */}
        <div className={styles["panel_main_con"]}>
          {/* 模型选择区域 */}
          <div className={styles["panel_main_con_model"]}>
            <div className={styles["panel_main_con_modeltxt"]}>
              <span className="span_required">*</span>
              模型
            </div>
            <div className={styles["panel_main_con_modelsel"]}>
              <ModelSelect
                modelId={data.model?.id}
                model={data.model}
                modelList={llmModelList}
                updateModelSelect={handleSelectModal}
                disabled={readOnly}
              />
            </div>
          </div>

          {/* 上下文配置区域 */}
          <div className={styles["panel_main_con_context"]}>
            <div className={styles["panel_main_con_contexttitle"]}>
              <span className={styles["panel_main_con_modeltxt"]}>
                <span className="span_required">*</span>
                用户输入
              </span>
            </div>

            {/* 变量选择器 */}
            <div className={styles["panel_main_con_query"]}>
              <VariableCascader
                onChange={onChangeVariable}
                disabled={readOnly}
                value_selector={data.query}
                data={inputVariableData}
              />
            </div>

            <div className={styles["panel_main_con_context_tip"]}>
              <div className={styles["panel_main_extract"]}>
                <div>
                  <span className="span_required">*</span>
                  提取参数
                </div>

                <Button
                  type="text"
                  onClick={handleAddExtract}
                  className={styles["panel_main_con_inputvarfenlei_add"]}
                  disabled={readOnly}
                >
                  <img src="/workflow/add.png" height={12} width={12} /> 添加
                </Button>
              </div>
              <div className={styles["panel_main_con_context_params"]}>
                {data.parameters?.map((parmas, index) => (
                  <div
                    className={styles["panel_main_extract_item"]}
                    key={index}
                  >
                    <div className={styles["panel_main_extract_item_left"]}>
                      <div
                        className={styles["panel_main_extract_item_left_label"]}
                      >
                        <div
                          className={
                            styles["panel_main_extract_item_left_label_text"]
                          }
                        >
                          {parmas.name}
                        </div>
                        <div
                          className={
                            styles["panel_main_extract_item_left_label_type"]
                          }
                        >
                          {parmas.type}
                        </div>
                      </div>
                      <div
                        className={styles["panel_main_extract_item_left_desc"]}
                      >
                        {parmas.description}
                      </div>
                    </div>
                    <div>
                      <img
                        className={styles["panel_main_extract_item_icon"]}
                        src="/workflow/common/edit.png"
                        alt="编辑"
                        onClick={() => handleEditParams(index)}
                      />
                      <img
                        className={styles["panel_main_extract_item_icon"]}
                        src="/workflow/common/red_delete.png"
                        alt="删除"
                        onClick={() => handleDeleteParams(index)}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {data.parameters?.length === 0 && (
                <div className={styles["panel_main_extract_empty"]}>
                  请添加需要提取的参数
                </div>
              )}
            </div>
            {/* 提示词模板输入区域 */}
            <div>
              <div className={styles["panel_main_con_inputvarfenlei"]}>
                <div className={styles["tip_title_left"]}>
                  提示词{" "}
                  <Tooltip
                    title={
                      <div style={{ fontSize: 12 }}>
                        帮助模型理解如何提取参数
                      </div>
                    }
                    color={"rgba(54, 64, 82, 0.90)"}
                  >
                    <img
                      src="/agent/info.png"
                      className={styles["question-icon"]}
                    />
                  </Tooltip>
                </div>
                <div className={styles.contentInput_header_right}>
                  <div className={styles.contentInput_header_right_wordCount}>
                    {wordCount}
                  </div>
                  <div className={styles.contentInput_dividing_line}></div>
                  <div className={styles.contentInput_header_right_copy}>
                    <img
                      src="/workflow/common/copy.png"
                      alt=""
                      style={{ cursor: readOnly ? "not-allowed" : "pointer" }}
                      onClick={handleCopy}
                    />
                  </div>
                  <div className={styles.contentInput_header_right_copy}>
                    <img
                      src="/workflow/common/full.png"
                      alt=""
                      onClick={handleFullscreenEvent}
                    />
                  </div>
                </div>
              </div>
              {data && Object.keys(data).length > 0 && (
                <ContentInput
                  key={variableId}
                  handleFullscreenEvent={handleFullscreenEvent}
                  nodeData={data}
                  updateDataEvent={updateDataEvent}
                  data={data}
                  variables={variableData}
                  isFullscreen={isFullscreen}
                  content={fullscreenData}
                  pannerNodeId={pannerNode?.id}
                  readOnly={readOnly}
                  countChange={handleWordCountChange}
                />
              )}
            </div>

            {/* 输出变量区域 */}
            <div className={styles["panel_main_con_outputvar"]}>
              <div className={styles["panel_main_con_outputvartitle"]}>
                <div className={styles["main_con_outputvartitle_left"]}>
                  输出
                </div>
              </div>
              <ul className={styles["panel_main_con_outputvarconul"]}>
                {/* Text输出变量 */}
                {[...(data.parameters || []), ...outputList].map(
                  (item, index) => (
                    <li className={styles["panel_main_con_outputvarconul_li"]}>
                      <div
                        className={
                          styles["panel_main_con_outputvarconul_litop"]
                        }
                      >
                        <span>{item.name}</span>
                        <span
                          className={
                            styles["panel_main_con_outputvarconul_litop_a"]
                          }
                        >
                          {item.type}
                        </span>
                      </div>
                      <div
                        className={
                          styles["panel_main_con_outputvarconul_litop_b"]
                        }
                      >
                        {item.description}
                      </div>
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>
        </div>
      </Spin>
      {isFullscreen && (
        <div className={styles.fullscreen_container}>
          {" "}
          <div className={styles["panel_main_con_inputvarfenlei"]}>
            <span>分类说明</span>
            <div className={styles.contentInput_header_right}>
              <div className={styles.contentInpu_header_right_wordCount}>
                {wordCount}
              </div>
              <div className={styles.contentInput_dividing_line}></div>
            <div   className={styles.contentInput_header_right_copy}>
              <img
              
                src="/workflow/common/copy.png"
                alt=""
                style={{ cursor: readOnly ? "not-allowed" : "pointer" }}
                onClick={handleCopy}
              />
               </div>
              <div   className={styles.contentInput_header_right_copy}>
              <img
           
                src="/workflow/common/zoom.png"
                  alt=""
                  onClick={handleFullscreenEvent}
                />
              </div>
            </div>
          </div>
          <ContentInput
            handleFullscreenEvent={handleFullscreenEvent}
            nodeData={data}
            updateDataEvent={updateDataEvent}
            // 因为这里只需要一个实例，所以将数据封装成一个对象
            data={data}
            variables={variableData}
            isFullscreen={isFullscreen}
            content={fullscreenData}
            readOnly={readOnly}
            countChange={handleWordCountChange}
          />
        </div>
      )}
      <ParamsModal ref={paramsModalRef} onSubmit={addParamsEvent} />
    </div>
  );
});

export default parameterExtractionPanel;
