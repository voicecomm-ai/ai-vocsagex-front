// components/CustomNode.js or .tsx
import React, { useState, useRef } from "react";
import { Handle, Position } from "@xyflow/react";
import styles from "../node.module.css";
import { Input, Tooltip, Button, Popconfirm, message,Typography } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import startStyles from "./start.module.css";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import Operator from "../../components/Operator";
import { useStore } from "@/store/index";
import { useNodesInteractions } from "../../hooks";
import debounce from "lodash/debounce";
import { NodeSourceHandle, NodeTargetHandle } from "../../node-handle";
const { Text } = Typography;
const StartNode = ({ id, data, selected, type }) => {
    const { updateNodeDetail,isNodeConnected } = useNodesInteractions();
  const startPanelRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(data.title || "");
  const [isFocus, setIsFocus] = useState(false);
 
  const { setNodes, getNodes, deleteElements } = useReactFlow();
  const { setPanelVisible,readOnly, setPannerNode, setRunVisible,panelVisible,pannerNode } = useStore(
    (state) => state
  );
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
      console.log(obj);
    updateNodeDetailEvent(obj);
  };
  const updateNodeDetailEvent = useRef(
    debounce(async (data) => {
      let newData = {
        nodeId: id,
        data: { ...data, id:id.id },
      };
     updateNodeDetail(newData);
    }, 100) // 1000ms 无操作后才触发
  ).current;

  //更新名称
  const updataNameEvent = () => {
    setTitle(data.title);
    setIsEditing(true);
  };
  //节点点击事件
  const onNodeClick = (node) => {
    if(isEditing){
      return;
    }
    setRunVisible(false);
    setPanelVisible(true);
    setPannerNode({ id, data, type });
   
  };
  //处理节点名称改变事件
  const handleTitleChange = (value) => {
    setTitle(value);
  }
 // 失去焦点时保存标题并关闭编辑
  const handleTitleBlur = () => {
    saveTitle(title);
    setIsEditing(false);
  };

  const handleMouseEnter = () => {
    setIsFocus(true);
  }
  const handleMouseLeave = () => {
    setIsFocus(false);
  }

  return (
    <div  onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className={`${styles["custom_node"]} ${startStyles["start_node"]} ${pannerNode && pannerNode.id === id ? styles["selected_node"] : ''}`}>


      {/* ✅ 只有选中节点时显示按钮 */}
      
      <div data-action="panel"
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
          <div className={styles["custom_node_header_type"]}>流程控制</div>
        { ((pannerNode && pannerNode.id == id) || isFocus) && !readOnly && (
        <div className={styles["custom_node_actions"]} onClick={(e) => e.stopPropagation()}>
          <Operator
            id={id}
            isStart={true}
            updataNameEvent={updataNameEvent}
            actionList={actionList}
          ></Operator>
        </div>
        )}
        </div>
         {data.variables &&(
        <div className={startStyles["start_panel_variable_content"]}>
         
           {data.variables.map((item) => (
              <div className={startStyles["start_node_variable_item"]} key={item.id}>
                <div className={styles["start_panel_variable_item_left"]}>

                  <div
                    className={styles["start_panel_variable_item_left_content"]}
                  >
                    <div className={startStyles["start_panel_variable_name"]}>
                      {`{{${item.variable}}}`}
                    </div>
                  </div>
                </div>
                <div className={styles["start_panel_variable_item_right"]}>
                  <div
                    className={styles["start_panel_variable_item_fieldType"]}
                  >
                    {item.required ? "必填" : "非必填"}{" "}
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
      <NodeSourceHandle id={id} isFocus={isFocus} nodeId={id} />
    </div>
  );
};

export default StartNode;
