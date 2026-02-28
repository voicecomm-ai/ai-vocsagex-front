// components/CustomNode.jsx or .tsx
import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import styles from "../node.module.css";
import { useStore } from "@/store/index";
import { useNodesInteractions } from "../../hooks";
import Operator from "../../components/Operator";
import { Input, Popover, Tooltip, Drawer, message,Typography } from "antd";
import debounce from "lodash/debounce";
import { useKnowledge } from "./hooks/use-knowledge";
import knowledgeStyles from "./style.module.css";
import { NodeSourceHandle, NodeTargetHandle } from "../../node-handle";
const { Text } = Typography;
const actionList = [
  {
    name: "重命名",
    icon: "/workflow/update.png",
    type: "rename",
  },
  {
    name: "复制",
    icon: "/workflow/copy.png",
    type: "copy",
  },
  {
    name: "删除",
    icon: "/workflow/delete.png",
    type: "delete",
  },
];

const KnowledgeRetrievalNode = ({ id, data, selected, type }) => {
  const { updateNodeDetail, isNodeConnected } = useNodesInteractions();
  const [isFocus, setIsFocus] = useState(false);
  const { validateKnowledgeNode } = useKnowledge();
  const {
    setPanelVisible,
    readOnly,
    setPannerNode,
    pannerNode,
    setRunVisible,
    emitEvent 
  } = useStore((state) => state);
  
  const reactFlowInstance = useReactFlow();

  useEffect(() => {}, []);

  //节点点击事件
  const onNodeClick = () => {
    emitEvent('NODE_CLICK', { id: id, data: data, type: type });
    setRunVisible(false);
    setPannerNode({ id, data, type });
    setPanelVisible(true);
  };


  // 打开测试运行知识检索弹窗
  const handleRun = (event) => {  
  if(!validateKnowledgeNode(data)){
    return;
  }   
    const nodeData = reactFlowInstance
      .getNodes()
      .find((item) => item.id === id);

    setPanelVisible(false);
    setPannerNode(nodeData);
    setRunVisible(true);
  };
  // 鼠标进入节点
  const handleMouseEnter = () => {
    setIsFocus(true);
  };
  // 鼠标离开节点
  const handleMouseLeave = () => {
    setIsFocus(false);
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`${styles["custom_node"]} ${knowledgeStyles["knowledgeNode"]} ${
        pannerNode && pannerNode.id == id ? styles["selected_node"] : ""
      }`}
    >
      <div
        onClick={() => onNodeClick()}
        className={"custom_node_content"+' '+styles["knowledge_retrieval_node_content"]}
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
          <div className={styles["custom_node_header_type"]}>AI核心</div>
          {((pannerNode && pannerNode.id == id) || isFocus) && !readOnly && (
            <div
              className={styles["custom_node_actions"]}
              onClick={(e) => e.stopPropagation()}
            >
              <Operator id={id} runKnowledgeRetrievalEvent={handleRun}></Operator>
            </div>
          )}
        </div>

        {data.dataSet_list && data.dataSet_list.length > 0 &&(
        <div className={knowledgeStyles["knowledge_panel_variable_content"]}>
         
           {data.dataSet_list.map((item,index) => (
              <div key={index} className={knowledgeStyles["knowledge_node_variable_item"]}>
                <div className={styles["start_panel_variable_item_left"]}>
                  <img
                    className={
                      styles["start_panel_variable_item_left_icon_img"]
                    }
                    src="/workflow/word_icon.png"
                    alt=""
                  />

                  <div
                    className={styles["start_panel_variable_item_left_content"]}
                  >
                    <div className={knowledgeStyles["data_set_panel_variable_name"]}>
                      {item.name}
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}  

         {data.desc && (
        <div className={styles['custom_node_desc']}>
          {data.desc}
        </div>
      )} 
      
      </div>
      <NodeTargetHandle id={id} isFocus={isFocus} nodeId={id} />  
      <NodeSourceHandle id={id} isFocus={isFocus} nodeId={id} />
    </div>
  );
};  

export default KnowledgeRetrievalNode;
