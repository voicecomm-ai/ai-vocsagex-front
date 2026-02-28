// components/CustomNode.jsx or .tsx
import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import styles from "../node.module.css";
import pageStyles from "./style.module.css";
import { useStore } from "@/store/index";
import { useNodesInteractions } from "../../hooks";
import Operator from "../../components/Operator";
import { Input, Popover, Tooltip, Drawer,message,Typography } from "antd";
import debounce from "lodash/debounce";
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

const IntentionClassification = ({ id, data, selected, type }) => {
  const { updateNodeDetail, isNodeConnected } = useNodesInteractions();
  const [isFocus, setIsFocus] = useState(false);
  const reactFlowInstance = useReactFlow();
  const {
    setPanelVisible,
    readOnly,
    setPannerNode,
    pannerNode,
    setRunVisible,
  } = useStore((state) => state);
  useEffect(() => {
 
  }, [])

  //节点点击事件
  const onNodeClick = () => {
    setRunVisible(false);
    setPannerNode({ id, data, type });
    setPanelVisible(true);
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
      className={`${styles["custom_node"]} ${pageStyles["params_node"]} ${
        pannerNode && pannerNode.id == id ? styles["selected_node"] : ""
      }`}
    >
      <div
        onClick={() => onNodeClick()}
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
              <Operator id={id}></Operator>
            </div>
          )}
        </div>

        {data.model?.id &&(
        <div className={styles["start_panel_variable_content"]}>
         
              <div className={styles["start_node_variable_item"]}>
                <div className={styles["start_panel_variable_item_left"]}>
                  <img
                    className={
                      styles["start_panel_variable_item_left_icon_img"]
                    }
                    src={process.env.NEXT_PUBLIC_API_BASE +data.model.iconUrl}
                    alt=""
                  />

                  <div
                    className={styles["start_panel_variable_item_left_content"]}
                  >
                    <div className={styles["start_panel_variable_name"]}>
         
                      <Text style={{ maxWidth: 150 }} ellipsis={{ tooltip: data.model?.name }}>
                      <span style={{fontSize: 12,fontWeight: 'normal',color: "#364052"}}> {data.model?.name}</span>
                      </Text>
                    </div>
                  </div>
                  
               
                <div className={styles['model_label_render_type']}>
                {data.model.classificationName ? data.model.classificationName : null}
              </div>
              {data.model && data.model.tagList && data.model.tagList.length > 0 && (
                <div className={styles['model_label_render_tag']}>
                  {data.model && data.model.tagList.map(tag => tag.name).join(',')}
                </div>
              )}
               </div>
              </div>
            
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

export default IntentionClassification;
