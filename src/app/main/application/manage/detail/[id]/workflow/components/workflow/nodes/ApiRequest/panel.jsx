/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, forwardRef, useImperativeHandle, useRef, useEffect } from "react";
import { Input, Select, Typography, Spin, Radio, message } from "antd";
import Image from "next/image";
// import { getKnowledgeBaseList } from "@/api/knowledge";
// import RecallSettingsModel from "./RecallSettingsModel/index";
import AuthSettingModal from "./AuthSettingModel/index";
// import DocumentFilterCriteriaModel from "./DocumentFilterCriteriaModel/index";
// import KnowledgeConf from '@/app/components/knowledge/Update.jsx'; // 知识库配置组件
import "../reset.css";
import styles from "./style.module.css";
// import { getAgentModelList } from "@/api/agent";
import ContentInput from "./ContentInput/index";
import KeyValue from "./KeyValue/index";
import { useStore } from "@/store/index";
// import VariableSelector from "../../../VariableSelector/index";
const { TextArea } = Input;
import { useNodeData, useNodesInteractions } from "../../hooks";
import throttle from "lodash/throttle";
import VariableCascader from "../../../variableCascader";
import nodeStyles from "../node.module.css";
import { useApi } from "./hooks/use-api";
// import ModelSelect from '../../../model-select';
// import { useKnowledge } from "./hooks/use-knowledge";
// import { getMetadataList } from "@/api/workflow";
import { getUuid } from "@/utils/utils";
import dynamic from "next/dynamic";
// 关闭 SSR
// const VariableEditor = dynamic(() => import("./variable-editor"), {
//   ssr: false,
// });
import RunHeader from "../../components/RunHeader";  
const filterProperties = [
  {
    name: "禁用",
    type: "disabled",
    subText: "禁用文档过滤",
  },
  {
    name: "自动",
    type: "automatic",
    subText: "根据用户查询自动生成文档过滤条件",
  },
  {
    name: "手动",
    type: "manual",
    subText: "手动添加文档过滤条件",
  },
];

const knowledgeType = {
  FULL_TEXT: "全文检索",
  HYBRID: "混合检索",
  VECTOR: "向量检索",
};

const ApiRequestPanel = forwardRef((props, ref) => {
  const { updateNodeDetail } = useNodesInteractions();
  // const { validateKnowledgeNode,sortByOriginalOrder } = useKnowledge();
  const { getUpstreamVariables, getNodeById } = useNodeData();
  const { Paragraph, Text } = Typography;
  useImperativeHandle(ref, () => ({
    showModal,
    hideModal,
  }));

  const [data, setData] = useState({}); //数据
  const [loading, setLoading] = useState(false); //加载中
  const [isEditing, setIsEditing] = useState(false);
  const [textModelList, setTextModelList] = useState([]);
  const [variableId, setVariableId] = useState(null); //变量ID
  const [activeTypeItem, setActiveTypeItem] = useState({
    name: "禁用",
    type: "disabled",
    subText: "禁用文档过滤",
  });
  const authSettingModelRef = useRef(null);
  const {
    setPanelVisible,
    setPannerNode,
    setRunVisible,
    panelVisible,
    pannerNode,
    changeId,
    readOnly,
  } = useStore((state) => state);

  // 选择的知识库列表
  const [selDatabase, setSelDatabase] = useState([]);
  const [knowledgeList, setKnowledgeList] = useState([]); //知识库列表
  const [variableData, setVariableData] = useState([]);
  const [variableFileData, setVariableFileData] = useState([]);
  const [variableFileBinaryData, setVariableFileBinaryData] = useState([]);
  const [variableBodyData, setVariableBodyData] = useState([]);
  // 模型列表
  const [rerankModelListArray, setRerankModelListArray] = useState([]);
  const isOpen = useRef(false);
  const nodeIdCurrent = useRef(null); //当前节点id
  const [isFullscreen, setIsFullscreen] = useState(false); //是否全屏
  const [isChangeBody, setIsChangeBody] = useState(true); //
  const [fullscreenData, setFullscreenData] = useState({});
  const [authTypeText, setAuthTypeText] = useState(""); //是否全屏
  const { validateApiNode } = useApi();
  const [filterData, setFilterData] = useState(["string", "number", "file"]);
  const [formDatafilterData, setFormDataFilterData] = useState(["file"]);
  const [binaryfilterData, setBinaryFilterData] = useState(["file", "array[file]"]);

  const [method, setMethod] = useState("get");
  const [headers, setHeaders] = useState("");
  const [params, setParams] = useState("");
  const [bodyType, setBodyType] = useState("none");

  const bodyOptions = [
    { value: "none", label: <div>none</div> },
    { value: "json", label: <div>JSON</div> },
    { value: "raw-text", label: <div>raw</div> },
    { value: "binary", label: <div>binary</div> },
    { value: "form-data", label: <div>form-data</div> },
    { value: "x-www-form-urlencoded", label: <div>x-www-form-urlencoded</div> },
  ];
  const apiTypeList = [
    {
      label: "GET",
      value: "get",
    },
    {
      label: "POST",
      value: "post",
    },
    {
      label: "HEAD",
      value: "head",
    },
    {
      label: "PATCH",
      value: "patch",
    },
    {
      label: "PUT",
      value: "put",
    },
    {
      label: "DELETE",
      value: "delete",
    },
  ];

  const authTypeMap = {
    "no-auth": "无",
    "api-key": "Api-Key",
  };

  // 召回设置
  const KnowledgeRetrievalPanelRef = useRef(null);
  // 选择引用知识库
  const KnowledgeSelectModelRef = useRef(null);
  // 文档过滤条件
  const documentFilterCriteriaRef = useRef(null);
  const [tableData, setTableData] = useState([{ id: 1, key: "", value: "" }]);
  const [title, setTitle] = useState("");
  const [formData, setformData] = useState([]);
     const variableStyle = {
    background: "rgba(242,244,246,0.5)",
    // borderRadius: "8px",
    // border: "none",
  };
  // 生成唯一ID（基于当前时间戳，避免重复）
  const generateId = () => Date.now();
  const isInit = useRef(false);
  const showModal = async (obj, type, selectDepartment) => {
    setLoading(true);
  };
  useEffect(() => {
    if (panelVisible && pannerNode) {
      let nodeData = getNodeById(pannerNode.data.id);
      // setBodyValue(nodeData.data.body.data);
      // nodeData.data.headersList = updateHeaders(nodeData.data?.headers);
      // nodeData.data.paramsList = updateParams(nodeData.data?.params);
      // nodeData.data.url = "{{#bd349072-6cb7-49ea-b1ce-6bb56f792855.string#}}";
      setData(nodeData.data);
      setMethod(nodeData.data.method);
      setBodyType(nodeData.data.body.type);
      setformData(nodeData.data.body.data);
      // let formDatas = nodeData.data.body.data
      // nodeData.data.body.data.forEach((item) => {
      //   if (item.type === 'file') {
      //     item.file = convertToArr(item.value);
      //   }
      // });
      // console.log(nodeData.data.body.data);
      // updateNodeDetailEvent(nodeData.data);
      setTitle(nodeData.data.title);
      setAuthTypeText(authTypeMap[nodeData.data.authorization.type]);
      setData(nodeData.data);
      handleRenderVariable();
      handleRenderFileVariable();
      handleRenderBodyVariable();
      handleRenderFileBinaryVariable();
    }
  }, [panelVisible]);

  useEffect(() => {
    if (panelVisible) {
      let nodeData = getNodeById(pannerNode.data.id);
      setData(nodeData.data);
      handleRenderVariable();
      handleRenderFileVariable();
      handleRenderFileBinaryVariable();
      handleRenderBodyVariable();
    }
  }, [changeId]);

  const handleChangeMethod = (e) => {
    updateDataEvent("method", e);
    setMethod(e);
  };

  //更新单个data函数
  const updateDataEvent = (dataPar, dataParValue, tableList) => {
    let nodeData = getNodeById(pannerNode.data.id);

    const obj = {
      ...nodeData.data,
      [dataPar]: dataParValue,
    };
    if (dataPar === "headers") {
      obj.headersList = tableList;
    }
    if (dataPar === "params") {
      obj.paramsList = tableList;
    }

    // console.log(obj, "updateDataEvent obj");
    setData(obj);
    updateNodeDetailEvent(obj);
  };

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

  // 面板通用变量
  const handleRenderVariable = () => {
    setVariableId(getUuid());
    const upstreamVariables = getUpstreamVariables(props.nodeData.id);
    // console.log(upstreamVariables);
    const varTypes = ["string", "number", "file"];
    upstreamVariables.forEach((first, index) => {
      // first.id = `first-${index}`;
      if (first?.children?.length) {
        const children = first.children.filter((item) => varTypes.includes(item.variable_type));
        children.length &&
          children.forEach((second, idx) => {
            second.id = `second-${idx}`;
          });
        first.children = children.length ? children : null;
      }
    });
    setVariableData(upstreamVariables);
  };

  //只能选文件类型的变量
  const handleRenderFileVariable = () => {
    const upstreamVariables = getUpstreamVariables(props.nodeData.id);

    const varTypes = ["file", "array[file]"];
    const filterArr = [];
    upstreamVariables.forEach((first, index) => {
      if (first?.children?.length) {
        const children = first.children.filter((item) => varTypes.includes(item.variable_type));

        first.children = children.length ? children : null;
      }
      first.children && filterArr.push(first);
    });
    setVariableFileData(filterArr);
  };
  //只能选array文件类型的变量
  const handleRenderFileBinaryVariable = () => {
    const upstreamVariables = getUpstreamVariables(props.nodeData.id);

    const varTypes = ["file"];
    const filterArr = [];
    upstreamVariables.forEach((first, index) => {
      if (first?.children?.length) {
        const children = first.children.filter((item) => varTypes.includes(item.variable_type));
        children.forEach((child) => (child.children = null));
        first.children = children.length ? children : null;
      }
      first.children && filterArr.push(first);
    });
    setVariableFileBinaryData(filterArr);
  };

  //body json、raw变量 string array[string] number file(里的变量)
  const handleRenderBodyVariable = () => {
    const varTypes = ["string", "number", "file", "array[string]", "array[number]"];
    const upstreamVariables = getUpstreamVariables(props.nodeData.id);
    upstreamVariables.forEach((first, index) => {
      // first.id = `first-${index}`;
      if (first?.children?.length) {
        const children = first.children.filter((item) => varTypes.includes(item.variable_type));
        children.length &&
          children.forEach((second, idx) => {
            second.id = `second-${idx}`;
          });
        first.children = children.length ? children : null;
      }
    });
    setVariableBodyData(upstreamVariables);
  };
  //关闭事件
  const hideModal = () => {
    setOpen(false);
  };

  // 关闭面板事件
  const closePanelEvent = () => {
    isOpen.current = false;

    setPannerNode(null);
    setPanelVisible(false);
  };

  // 设置title名字
  const handleNodeTitleChange = (e) => {
    let title = e.target.value;
    if (e.target.value && e.target.value.length > 50) {
      // 裁剪到 maxLength 长度并添加省略号maxLength 长度并添加省略号maxLength 长度并添加省略号maxLength 长度并添加省略号maxLength 长度并添加省略号
      title = e.target.value.slice(0, 50);
    }
    setTitle(title);
    // updateDataEvent("title", e.target.value);
  };

  // 保存标题
  const saveTitle = (value) => {
    if (!value.trim()) {
      setTitle(data.title);
      return message.warning("节点名称不能为空");
    }
    // let obj = {
    //   ...data,
    //   title: value,
    // };
    updateDataEvent("title", value);
  };

  // 失去焦点时保存标题并关闭编辑
  const handleTitleBlur = () => {
    saveTitle(title);
    setIsEditing(false);
  };

  // 选择变量值
  const onChangeBinary = (obj) => {
    // console.log(obj, "binary");
    let nodeData = getNodeById(pannerNode.data.id);
    const body = {
      type: bodyType,
      data: [
        {
          type: obj.variable_type,
          file: obj.value_selector,
        },
      ],
    };
    const objdata = {
      ...nodeData.data,
      body: body,
      binaryVars: obj,
    };
    setData(objdata);
    updateNodeDetailEvent(objdata);
  };

  // 处理节点描述变更
  const handleNodeDescChange = (e) => {
    updateDataEvent("desc", e.target.value);
  };

 
  // 运行面板事件
  const runPanelEvent = () => {
    if (readOnly) return;
    if(!validateApiNode(data)){//验证必填参数
      return;
    }
    if (data.headers === ":") {
      data.headers = "";
    }
    if (data.params === ":") {
      data.params = "";
    }
    let nodeData = getNodeById(pannerNode.data.id);

    setPannerNode(nodeData);
    setPanelVisible(false);
    setRunVisible(true);
  };

  const onBodyTypeChange = (e) => {
    // console.log(e, "ee");
    
    setBodyType(e.target.value);
    let body = {};
    switch (e.target.value) {
      case "form-data":
        body = {
          type: e.target.value,
          data: [
            {
              type: "text",
              key: "",
              value: "",
            },
          ],
        };

        break;
      case "x-www-form-urlencoded":
        body = {
          type: e.target.value,
          data: [
            {
              key: "",
              value: "",
            },
          ],
        };

        break;
      case "json":
      case "raw-text":
        body = {
          type: e.target.value,
          data: [
            {
              key: "",
              value: "",
            },
          ],
        };

        break;
      case "binary":
        body = {
          type: e.target.value,
          data: [
            {
              file: [],
              type: "file",
            },
          ],
        };

        break;

      case "none":
        body = {
          type: e.target.value,
          data: [],
        };
        break;
    }
     setVariableId(getUuid());
    updateDataEvent("body", body);
  };

  function convertKeyValueArrayToString(arr) {
    // 遍历数组，将每个对象转换为 "key:value" 格式
    const stringItems = arr.map((item) => {
      // 拼接 key 和 value，中间用冒号分隔
      return `${item.key}:${item.value}`;
    });

    // 用换行符 \n 拼接所有项
    return stringItems.join("\n");
  }

  const updateDataBytype = (newTableList, renderType) => {
    switch (renderType) {
      case "headers":
        let headersFilter = newTableList.filter((li) => li.key && li.value);
        const newHeaders = convertKeyValueArrayToString(headersFilter);

        updateDataEvent("headers", newHeaders, newTableList);
        break;
      case "params":
        let paramsFilter = newTableList.filter((li) => li.key && li.value);
        const newParams = convertKeyValueArrayToString(paramsFilter);
        updateDataEvent("params", newParams, newTableList);
        break;

      default:
        break;
    }
  };

  const updateDataUrl = (obj) => {
    // console.log(obj,'urllllll');
    updateDataEvent("url", obj);
  };

  const updateDataBody = (value, renderType, type) => {
    // console.log(value, "body", renderType, type);
    let body = {};
    switch (type) {
      case "none":
        body = {
          type,
          data: [],
        };

        break;
      // case "binary":

      //   body = {
      //     type,
      //      data: value,
      //   };

      //   break;

      case "json":
      case "raw-text":
        body = {
          type,
          data: [
            {
              key: "",
              value: value,
            },
          ],
        };

        break;
      case "x-www-form-urlencoded":
        body = {
          type,
          data: value,
        };
        break;
      case "form-data":
        body = {
          type,
          data: value,
        };
        break;
    }
    // console.log(body,'ddd');

    updateDataEvent("body", body);
  };

  const setSelAuthFunc = (obj) => {
    // console.log(obj,'obj');
    setAuthTypeText(authTypeMap[obj.type]);
    updateDataEvent("authorization", obj);
  };

  //全屏处理事件
  const handleFullscreenEvent = (data, index) => {
    setIsFullscreen(!isFullscreen);
    setFullscreenData(data);

    // setFullscreenIndex(index);
  };
  // console.log(data.body, "isFullscreen");
  // 鉴权弹窗
  const handleOpenAuthSetting = () => {
    authSettingModelRef.current.showModal(data?.authorization, variableData, pannerNode.id);
  };

   const handleTitleFocus = () => {
    setIsEditing(true);
  };

  const updateNodeDataByHeader =(obj)=>{
    setData(obj);
    updateNodeDetailEvent(obj);
   }

  return (
    <div className={styles["panel_main_api"]}>
      <Spin spinning={loading} wrapperClassName='node_main_spin'>
        {/* 面板头部区域 */}
        <RunHeader data={data} updateNodeDataByHeader={updateNodeDataByHeader} runPanelEventByHeader={runPanelEvent} isPadding={true}  />

        <div className={styles["panel_main_con"]}>
          <div>
            <div className={styles["panel_main_con_query"]}>
              <div className={styles["query_variable"]}>
                <span className='span_required'>*</span>
                <span>API</span>
              </div>

              <div className={styles["panel_main_auth_setting"]}>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}
                  onClick={handleOpenAuthSetting}
                >
                  <img
                    alt=''
                    className={styles["panel_main_auth_setting_icon"]}
                    src='/workflow/auth_add.png'
                  />
                  <span>鉴权</span>
                </div>
                <span className={styles["panel_main_auth_setting_none"]}>{authTypeText}</span>
              </div>
            </div>
            {/* API */}
            <div className={styles["main_method_url_wrap"]}>
              <Select
                className={styles["select_custom_select"]}
                style={{ width: "100px",borderRadius: '8px',height: '36px',background: '#F5F9FC' }}
                value={method}
                onChange={handleChangeMethod}
                disabled={readOnly}
                variant='borderless'
                options={apiTypeList}
              />
              {/* url */}
              <ContentInput
                key={variableId}
                nodeData={data}
                data={data?.url}
                minHeight={36}
                bg={"#fff"}
             
                renderType={"url"}
                isHeader={false}
                updateDataEvent={updateDataUrl}
                variables={variableData}
                pannerNodeId={pannerNode?.id}
                readOnly={readOnly}
              />
            </div>
          </div>
          {/* headers */}
          <div className={styles["main_method_headers_wrap"]}>
            <div className={styles["query_variable"]}>HEADERS</div>
            <KeyValue
              list={data.headersList}
              key={variableId}
              renderType={"headers"}
              isSupportFile={false}
              readOnly={readOnly}
              variables={variableData}
              updateDataBytype={updateDataBytype}
              pannerNodeId={pannerNode?.id}
            />
          </div>
          {/* params */}
          <div className={styles["main_method_headers_wrap"]}>
            <div className={styles["query_variable"]}>PARAMS</div>
            <KeyValue
              list={data.paramsList}
              key={variableId}
              renderType={"params"}
              isSupportFile={false}
              readOnly={readOnly}
              variables={variableData}
              updateDataBytype={updateDataBytype}
              pannerNodeId={pannerNode?.id}
            />
          </div>
          {/* body */}
          <div>
            {/* <div className={styles["panel_main_con_query"]}>
            </div> */}
            <div className={styles["query_variable"]}>
              <span className='span_required'>*</span>
              <span>BODY</span>
            </div>
            <div className={styles["main_body_content"]}>
              <div className={styles["main_body_content_radio"]}>
                <Radio.Group
                  name='bodygroup'
                  onChange={onBodyTypeChange}
                  value={bodyType}
                  options={bodyOptions}
                  disabled={readOnly}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                />
              </div>
              {bodyType === "none" && <div></div>}
              {bodyType === "x-www-form-urlencoded" && (
                <KeyValue
                  data={data}
                  list={data.body?.data}
                  key={variableId}
                  renderType={"body"}
                  bodyType={bodyType}
                  isSupportFile={bodyType === "form-data"}
                  readOnly={readOnly}
                  variables={variableData}
                  updateDataBytype={updateDataBody}
                  pannerNodeId={pannerNode?.id}
                />
              )}
              {bodyType === "form-data" && (
                <KeyValue
                  data={data}
                  list={data.body?.data}
                  key={variableId}
                  renderType={"body"}
                  bodyType={bodyType}
                  isSupportFile={bodyType === "form-data"}
                  readOnly={readOnly}
                  variables={variableData}
                  variableBodyData={variableFileData}
                  updateDataBytype={updateDataBody}
                  pannerNodeId={pannerNode?.id}
                />
              )}

              {bodyType === "json" && (
                <ContentInput
                  nodeData={data}
                  handleFullscreenEvent={handleFullscreenEvent}
                  data={data.body?.data[0]?.value}
                  bodyType={bodyType}
                  minHeight={100}
                  key={variableId}
                  bg={"#f2f4f6"}
                  renderType={"body"}
                  isHeader={true}
                  updateDataEvent={updateDataBody}
                  variables={variableBodyData}
                  pannerNodeId={pannerNode?.id}
                  readOnly={readOnly}
                  isFullscreen={isFullscreen}
                  isChangeBody={isChangeBody}
                />
              )}
              {bodyType === "raw-text" && (
                <ContentInput
                  nodeData={data}
                  handleFullscreenEvent={handleFullscreenEvent}
                  data={data.body?.data[0]?.value}
                  bodyType={bodyType}
                  minHeight={100}
                  key={variableId}
                  bg={"#f2f4f6"}
                  renderType={"body"}
                  isHeader={true}
                  updateDataEvent={updateDataBody}
                  variables={variableBodyData}
                  pannerNodeId={pannerNode?.id}
                  readOnly={readOnly}
                  isFullscreen={isFullscreen}
                  isChangeBody={isChangeBody}
                />
              )}
              {bodyType === "binary" && (
                <VariableCascader
                  disabled={readOnly}
                  key={variableId}
                  onChange={onChangeBinary}
                   style={
                                   variableStyle
                                  }
                  value_selector={data.body?.data[0]?.file}
                  data={variableFileBinaryData}
                />
              )}
            </div>
          </div>

          {/* 输出 */}
          <div className={styles["panel_main_output_variable"]}>
            <div className={styles["output_variable_title"]}>输出</div>
            <div className={styles["output_variable_title_res"]}>
              <div className={styles["output_variable_title_restxt"]}>
                <div className={styles["output_variable_title_restxta"]}>body</div>
                <div className={styles["output_variable_title_restxtb"]}>string</div>
              </div>
              <div className={styles["output_variable_title_zhdfd"]}>响应内容</div>
            </div>
            <div className={styles["output_variable_title_res"]}>
              <div className={styles["output_variable_title_restxt"]}>
                <div className={styles["output_variable_title_restxta"]}>status_code</div>
                <div className={styles["output_variable_title_restxtb"]}>number</div>
              </div>
              <div className={styles["output_variable_title_zhdfd"]}>响应状态码</div>
            </div>
            <div className={styles["output_variable_title_res"]}>
              <div className={styles["output_variable_title_restxt"]}>
                <div className={styles["output_variable_title_restxta"]}>headers</div>
                <div className={styles["output_variable_title_restxtb"]}>object</div>
              </div>
              <div className={styles["output_variable_title_zhdfd"]}>响应头列表JSON</div>
            </div>
            <div className={styles["output_variable_title_res"]}>
              <div className={styles["output_variable_title_restxt"]}>
                <div className={styles["output_variable_title_restxta"]}>files</div>
                <div className={styles["output_variable_title_restxtb"]}>Array[File]</div>
              </div>
              <div className={styles["output_variable_title_zhdfd"]}>文件列表</div>
            </div>
          </div>
        </div>
      </Spin>
      {isFullscreen && (
        <div className={styles.fullscreen_container}>
          <ContentInput
            nodeData={data}
            handleFullscreenEvent={handleFullscreenEvent}
            data={fullscreenData}
            bodyType={bodyType}
            minHeight={100}
            renderType={"body"}
            isHeader={true}
            updateDataEvent={updateDataBody}
            variables={variableBodyData}
            pannerNodeId={pannerNode?.id}
            readOnly={readOnly}
            content={fullscreenData}
            isFullscreen={isFullscreen}
          />
        </div>
      )}
      {/* 鉴权设置弹窗 */}
      <AuthSettingModal
        ref={authSettingModelRef}
        setSelAuthFunc={setSelAuthFunc}
        readOnly={readOnly}
      />
    </div>
  );
});

export default ApiRequestPanel;
