// components/CustomNode.js or .tsx
import React, { useState, useRef,useEffect  } from "react";
import { Handle, Position } from "@xyflow/react";
import styles from "../node.module.css";
import { Input, Tooltip, Button, Popconfirm, message, Typography } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import Operator from "../../components/Operator";
import { useStore } from "@/store/index";
import { useNodesInteractions , useTemplate,useCheck} from "../../hooks";
import debounce from "lodash/debounce";
import workflowStyles from "./index.module.css";
import { checkApplicationStatus } from "@/api/workflow";
import { NodeSourceHandle, NodeTargetHandle } from "../../node-handle";
const { Paragraph,Text } = Typography;
const WorkflowNode = ({ id, data, selected, type }) => {
  const { checkWorkflowNodeRequired } = useCheck();
  const { updateNodeDetail, isNodeConnected } = useNodesInteractions();
  const startPanelRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(data.title || "");
  const [isFocus, setIsFocus] = useState(false);
  const [tagTitle, setTagTitle] = useState('');

  const { setNodes, getNodes, deleteElements } = useReactFlow();
  const {
    setPanelVisible,
    readOnly,
    setPannerNode,
    setRunVisible,
    panelVisible,
    pannerNode,
  } = useStore((state) => state);


  //更新名称
  const updataNameEvent = () => {
    setTitle(data.title);
    setIsEditing(true);
  };
  //节点点击事件
  const onNodeClick = (node) => {
    if (isEditing) {
      return;
    }
    checkApplicationStatus(data.appId).then((res) => {
      if(!res.data){
        message.warning("模板已下架!"); 
        return;
      }
      setRunVisible(false);
      setPanelVisible(true);
      setPannerNode({ id, data, type });
    });
  };

  const handleMouseEnter = () => {
    setIsFocus(true);
  };
  const handleMouseLeave = () => {
    setIsFocus(false);
  };

  useEffect(() => {
    let tagList = data.tagList;
    let tagText = '其他';
    if(tagList && tagList.length > 0){
      tagText = tagList.map((item) => item.name).join(",");
    }
    setTagTitle(tagText);
  }, [data]);
  //运行MCP事件
  const runWorkflowEvent = () => {
    checkApplicationStatus(data.appId).then((res) => {
      
      if(!res.data){
        message.warning("模板已下架!");
        return;
      }
      let isPassed = checkWorkflowNodeRequired(data);
      if(!isPassed){
        message.warning("必填项未完成配置!");
        return;
      }
      setRunVisible(true);
      setPanelVisible(false);
      setPannerNode({ id, data, type });
    });
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`${styles["custom_node"]} ${workflowStyles["workflow_node"]} ${
        pannerNode && pannerNode.id === id ? styles["selected_node"] : ""
      }`}
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
            src={process.env.NEXT_PUBLIC_API_BASE + data.iconUrl}
          />

          <div className={styles["custom_node_header_title"]}>
            <Text style={{maxWidth: 110}} ellipsis={{ tooltip: data.title }}>
              <span style={{fontSize: 16,fontWeight: '600',color: "#101A28"}}>{data.title}</span></Text>
            </div>
          <div className={workflowStyles["custom_node_header_tag"]}>
          <Text style={{ maxWidth:data.tagList&&data.tagList.length == 1? 48:36,color:'#60687D' }} ellipsis={{ tooltip: tagTitle }}>
            <span className={workflowStyles["custom_node_header_tag_text"]}> {tagTitle}</span>
            </Text>
            {data.tagList && data.tagList.length > 1 && (
              <span className={workflowStyles["custom_node_header_tag_add"]}>
                +{data.tagList.length - 1}
              </span>
            )}
          
    
          </div>
          <div
            className={styles["custom_node_actions"]}
            onClick={(e) => e.stopPropagation()}
          >
            {((pannerNode && pannerNode.id == id) || isFocus) && !readOnly && (
              <Operator
                id={id}
                updataNameEvent={updataNameEvent}
                runWorkflowEvent={runWorkflowEvent}
              ></Operator>
            )}
          </div>
        </div>

        {data.desc && (
          <div className={styles["custom_node_desc"]}>{data.desc}</div>
        )}
      </div>
      <NodeTargetHandle id={id} isFocus={isFocus} nodeId={id} />
      <NodeSourceHandle id={id} isFocus={isFocus} nodeId={id} />
    </div>
  );
};

export default WorkflowNode;
