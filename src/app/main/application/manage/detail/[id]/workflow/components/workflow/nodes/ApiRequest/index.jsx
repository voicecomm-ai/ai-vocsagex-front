/* eslint-disable @next/next/no-img-element */
// components/CustomNode.js or .tsx
import React, { useState, useRef, useEffect } from "react";
import { Handle, Position } from "@xyflow/react";
import styles from "../node.module.css";
import apiStyles from "./style.module.css";
import { Input, Tooltip, Button, Popconfirm, message,Typography } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import ReactFlow, { Background, Controls, MiniMap, useReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import Operator from "../../components/Operator";
// import ContentInput from "./ContentInput/index";
import { useStore } from "@/store/index";
import { useNodesInteractions, useNodeData } from "../../hooks";
import debounce from "lodash/debounce";
import { NodeSourceHandle, NodeTargetHandle } from "../../node-handle";
import { useNode } from '../../../hooks'  
const ApiRequestNode = ({ id, data, selected, type }) => {
  const { Text } = Typography;
  const { updateNodeDetail, isNodeConnected } = useNodesInteractions();
  const { getNodeIcon } = useNode()
  const startPanelRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(data.title || "");
  const [isFocus, setIsFocus] = useState(false);
  const [url, setUrl] = useState(null);
  const [renderData, setRenderData] = useState(null);
  const [variableData, setVariableData] = useState(null);
  const { getUpstreamVariables, getContentNodeVariables, getNodeById } = useNodeData();
  const { setNodes, getNodes, deleteElements } = useReactFlow();
  const {
    setPanelVisible,
    readOnly,
    setPannerNode,
    setRunVisible,
    docInputData,
    panelVisible,
    pannerNode,
  } = useStore((state) => state);
  const actionList = [];
  // 保存标题
  const saveTitle = (value) => {
    if (!value.trim()) {
      return message.warning("节点名称不能为空");
    }
    let obj = {
      ...data,
      title: value,
    };
    // console.log(obj)
    updateNodeDetailEvent(obj);
  };

  const updateNodeDetailEvent = useRef(
    debounce(async (data) => {
      let newData = {
        nodeId: id,
        data: { ...data, id: id.id },
      };
      updateNodeDetail(newData);
    }, 100) // 1000ms 无操作后才触发
  ).current;
  // console.log(data, "index");

  //更新名称
  const updataNameEvent = () => {
    setTitle(data.title);
    setIsEditing(true);
  };

  useEffect(() => {

    const newData = { ...data };
    if (!newData.url) {
      newData.url = "";
    }
    const urlDatas = newData.url
      ? [
          {
            text: newData?.url,
          },
        ]
      : [];
    const variablesDetail = getContentNodeVariables(urlDatas, newData.id) || [];
    const parts = parseAndConvertUrl(newData.url, variablesDetail).filter(item=>item.content);
    setRenderData(newData);
    setUrl(parts);
  }, [data]);

  // 解析并转换URL的主函数
  const parseAndConvertUrl = (url, variablesDetail) => {
    // 提取URL中的所有变量
    const variableRegex = /{{#(.*?)#}}/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    // 分割URL为普通文本和变量部分
    while ((match = variableRegex.exec(url)) !== null) {
      // 添加变量前的普通文本
      if (match.index > lastIndex) {
        parts.push({
          type: "text",
          content: url.substring(lastIndex, match.index),
        });
      }

      // 添加变量部分
      const variableQuery = match[1];
      const variableInfo =
        variablesDetail.find((item) => item.variableQuery === variableQuery) || null;

      parts.push({
        type: "variable",
        content: variableInfo,
      });

      lastIndex = match.index + match[0].length;
    }

    // 添加剩余的普通文本
    if (lastIndex < url.length) {
      parts.push({
        type: "text",
        content: url.substring(lastIndex),
      });
    }

    return parts;
  };

  //节点点击事件
  const onNodeClick = () => {
    setRunVisible(false);
    // if(!data) return
    if (!data.authorization) {
      data.authorization = {
        type: "no-auth",
        config: null,
      };
    }
    if (!data.body) {
      data.body = {
        type: "none",
        data: [],
      };
    }
    if (!data.url) {
      data.url = "";
    }
    if (!data.method) {
      data.method = "get";
    }
    if (!data.headers && !data.headersList) {
      data.headers = "";
      data.headersList = [
        {
          key: "",
          value: "",
        },
      ];
    }
    if (!data.params && !data.paramsList) {
      data.params = "";
      data.paramsList = [
        {
          key: "",
          value: "",
        },
      ];
    }
    setPannerNode({ id, data, type });
    setPanelVisible(true);
  };
  //处理节点名称改变事件
  const handleTitleChange = (value) => {
    setTitle(value);
  };
  // 失去焦点时保存标题并关闭编辑
  const handleTitleBlur = () => {
    saveTitle(title);
    setIsEditing(false);
  };

  const handleMouseEnter = () => {
    setIsFocus(true);
  };
  const handleMouseLeave = () => {
    setIsFocus(false);
  };

  const updateDataEvent = (data) => {
    // console.log(data,'dddd');
  };

  //获取节点详情事件
  const getNodeDetailEvent = (obj) => {
    console.log(obj,'obj');
    let variableQuery = obj.variableQuery;
    let nodeId =variableQuery?variableQuery.split('.')[0]:null;
    return getNodeIcon(obj.nodeType, nodeId);
  }
  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`${styles["custom_node"]} ${apiStyles["api_node"]} ${
        pannerNode && pannerNode.id === id ? styles["selected_node"] : ""
      }`}
    >
      {/* ✅ 只有选中节点时显示按钮 */}

      <div onClick={() => onNodeClick({ id, data })} className={styles["custom_node_content"]}>
        <div className={styles["custom_node_header"]}>
          <img
            className={styles["custom_node_header_icon"]}
            alt=''
            src={`/workflow/http-request.png`}
          />

          <div className={styles["custom_node_header_title"]}>{renderData?.title}</div>
          <div className={styles["custom_node_header_type"]}>工具核心</div>
          {((pannerNode && pannerNode.id == id) || isFocus) && !readOnly && (
            <div className={styles["custom_node_actions"]} onClick={(e) => e.stopPropagation()}>
              <Operator id={id}></Operator>
            </div>
          )}
        </div>
        {url && url.length > 0 &&  (
          <div
            className={apiStyles["start_panel_variable_item"]}
            style={{ flexDirection: "row", alignItems: "center",marginTop: '12px',justifyContent: 'space-between' }}
          >
            <div
             className={apiStyles["start_panel_variable_item_content"]}
              style={{
              
                flexWrap: "wrap",
              }}
            >
              {url.map((part, index) => (
                <div key={`part${index}`}>
                  {part.type === "variable" && part.content ? (
                    <div style={{ display: "flex", alignItems: "center" }}>
                      {part.content?.nodeType && (
                        <img
                          className={apiStyles["panel_main_header_left_icon"]}
                          src={getNodeDetailEvent(part.content)}
                          alt=''
                        />
                      )}
                        <Text style={{ maxWidth: 100 }} ellipsis={{ tooltip: part.content?.title }}>
                        <span style={{ color: "#364052" }}>{part.content?.title}</span>
                      </Text>
                     
                      <div style={{ color: "#364052" }}> /</div>
                    
                      <div className={apiStyles["api_request_index_variable"]} >   {`{{${part.content?.label}}}`}</div>
                    </div>
                  ) : (
                    <div style={{ wordBreak: "break-all" }}>{part.content}</div>
                  )}
                </div>
              ))}
            </div>

            <div className={styles["api_request_index_method"]}>{renderData.method.toUpperCase()}</div>
          </div>
        )}
        {renderData?.desc && <div className={styles["custom_node_desc"]}>{renderData.desc}</div>}
      </div>
      <NodeTargetHandle id={id} isFocus={isFocus} nodeId={id} />  
      <NodeSourceHandle id={id} isFocus={isFocus} nodeId={id} />
     
    </div>
  );
};

export default ApiRequestNode;
