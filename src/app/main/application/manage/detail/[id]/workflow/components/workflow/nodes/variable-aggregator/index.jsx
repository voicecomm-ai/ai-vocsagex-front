// components/CustomNode.js or .tsx
import React, { useState, useRef, useEffect } from "react";
import { Handle, Position } from "@xyflow/react";
import styles from "../node.module.css";
import variableAggregatorStyles from "./variableAggregator.module.css";
import "@xyflow/react/dist/style.css";
import Operator from "../../components/Operator";
import { useStore } from "@/store/index";
import { useNodesInteractions } from "../../hooks";
import { NodeSourceHandle, NodeTargetHandle } from "../../node-handle";
import { getUuid } from "@/utils/utils";
import { useAggregator } from "./hooks/use-aggregator";
import { message,Typography } from "antd";
const { Text } = Typography;

const VariableAggregatorNode = ({ id, data, selected, type }) => {
  const { isNodeConnected } = useNodesInteractions();
  const { handleVariableData, validateRequired } = useAggregator();
  const [isFocus, setIsFocus] = useState(false);
  const [variableInfo, setVariableInfo] = useState([]); //展示数据

  const {
    setPanelVisible,
    readOnly,
    setPannerNode,
    setRunVisible,
    panelVisible,
    pannerNode,
    changeId,
  } = useStore((state) => state);

  //节点点击事件
  const onNodeClick = (node) => {
    setRunVisible(false);
    setPanelVisible(true);
    setPannerNode({ id, data, type });
  };

  const handleMouseEnter = () => {
    setIsFocus(true);
  };
  const handleMouseLeave = () => {
    setIsFocus(false);
  };

  useEffect(() => {
    if (data) {
      let arr = handleVariableData(data);
      setVariableInfo(arr);
    }
  }, [data, changeId]);

  //运行变量聚合节点
  const handleRunVariableAggregator = () => {
    if (!validateRequired(data)) {
      message.warning("必填项未完成配置!");
      return;
    }
    setPannerNode({ id, data, type });
    setPanelVisible(false);
    setRunVisible(true);
  };

  //获取节点图标
  const getNodeIcon = (data) => {
    console.log(data,'data');
    if(data.nodeType == 'mcp'){
      return process.env.NEXT_PUBLIC_API_BASE + data.mcpUrl;
    }
    if(data.nodeType == 'agent' || data.nodeType == 'workflow'){
      return process.env.NEXT_PUBLIC_API_BASE + data.iconUrl;
    }
    return `/workflow/${data.nodeType}.png`;
  }

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`${styles["custom_node"]} ${
        variableAggregatorStyles["variable_aggregator_node"]
      } ${pannerNode && pannerNode.id === id ? styles["selected_node"] : ""}`}
    >
      {/* ✅ 只有选中节点时显示按钮 */}

      <div
        data-action="panel"
        onClick={() => onNodeClick({ id, data })}
        className={styles["custom_node_content"]}
      >
        <div className={styles["custom_node_header"]}>
          <img
            className={styles["custom_node_header_icon"]}
            src={`/workflow/${data.type}.png`}
            alt=""
          />

          <div className={styles["custom_node_header_title"]}>
            <Text style={{maxWidth: 110}} ellipsis={{ tooltip: data.title }}>
              <span style={{fontSize: 16,fontWeight: '600',color: "#101A28"}}>{data.title}</span></Text>
            </div>
          <div className={styles["custom_node_header_type"]}>数据处理</div>
          {((pannerNode && pannerNode.id == id) || isFocus) && !readOnly && (
            <div
              className={styles["custom_node_actions"]}
              onClick={(e) => e.stopPropagation()}
            >
              <Operator isEnd={false} id={id} runVariableAggregatorEvent={handleRunVariableAggregator}></Operator>
            </div>
          )}
        </div>

        <div className={variableAggregatorStyles["panel_variable_content"]}>

          {variableInfo.map((item) => (
            <div
              key={item.groupId}
              className={variableAggregatorStyles["panel_variable_item"]}
            >
              <div
                className={variableAggregatorStyles["panel_variable_header"]}
              >
              <div className={variableAggregatorStyles["panel_variable_header_left"]}>
              <img   className={variableAggregatorStyles["panel_variable_header_left_img"]} alt="" src="/workflow/group.png" />  
              {item.group_name.toUpperCase()}
              </div>
              <div className={variableAggregatorStyles['panel_variable_item_output_type']}>{item.output_type.toUpperCase()}</div>
               
              </div>
              {item.variableArray.length>0&&(
              <div className={variableAggregatorStyles["panel_variable_content_item"]}>
                {item.variableArray.map((variable) => (
                  <div  className={variableAggregatorStyles["node_variable_item"]} key={variable.id}>
                   {variable.nodeType && (
                    <img
                      alt=""
                      className={variableAggregatorStyles["node_variable_item_img"]}
                      src={ getNodeIcon(variable)}
                    />
                  )}
                  {variable.nodeName&&(
                          <Text style={{ maxWidth: 100,color: "#364052;" }} ellipsis={{ tooltip: variable.nodeName }}>
                         
                    <span style={{color: "#364052"}} className={variableAggregatorStyles["node_variable_item_title"]}>
                      {variable.nodeName}  
                    </span>
                    </Text>
                  )}
                  <span style={{color: "#364052"}}> /</span> 
                  {variable.variable&&(
                    <div className={variableAggregatorStyles["node_variable_item_variable"]}>
                      {`{{${variable.variable}}}`}
                    </div>
                  )}
                </div>
              ))}
              </div>
              )}
              {item.variableArray.length===0&&(
                <div className={variableAggregatorStyles["node_variable_item_empty"]}>
                  暂无变量
                </div>
              )}
            </div>
          ))}
        </div>

        {data.desc && (
          <div className={styles["custom_node_desc"]}>{data.desc}</div>
        )}
      </div>

      <NodeSourceHandle id={id} isFocus={isFocus} nodeId={id} />
      <NodeTargetHandle id={id} isFocus={isFocus} nodeId={id} />
    </div>
  );
};

export default VariableAggregatorNode;
