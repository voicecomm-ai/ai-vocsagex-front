import { useMemo, useState, useEffect } from "react";
import { Handle, Position } from "@xyflow/react";

import styles from "./handle.module.css";
import { useNodesInteractions } from "../hooks";
import NodeSelector from "../drag-panel/selector";
import { useNodeAdd } from "../hooks/useNodeAdd";
import { useStore } from "@/store/index";
import {Tooltip} from "antd";
/**
 * 计算节点连接点的样式类名
 * @param {boolean} isFocus - 节点是否处于聚焦状态
 * @param {string} id - 节点ID
 * @param {Object} pannerNode - 当前平移的节点对象
 * @param {Function} isNodeConnected - 检查节点是否已连接的函数
 * @returns {string} 样式类名
 */
/**
 * 根据句柄类型计算节点连接点的样式类名
 * @param {boolean} isFocus - 节点是否处于聚焦状态
 * @param {string} id - 节点ID
 * @param {Object} pannerNode - 当前平移的节点对象
 * @param {Function} isNodeConnected - 检查节点是否已连接的函数
 * @param {string} type - 句柄类型："source" 或 "target"
 * @returns {string} 样式类名
 */
const getHandleClassName = (isFocus, id, pannerNode, isNodeConnected, type) => {
  // target 句柄（输入）与 source 句柄（输出）使用不同样式
  
  // source 句柄根据状态判断样式
  const isConnected = isNodeConnected(id,type);
  const shouldShowContent = isFocus || (pannerNode && pannerNode.id == id);
  if (shouldShowContent) {
    return type === "source" ? styles.customHandleSourceContent : isConnected?styles.customHandleTargetLink:styles.customHandleTarget;
  }

  if(type === "source"){
    return styles.sourceHandleHidden;
  }
    if(type === "target"){
    return styles.targetHandleHidden;
  }
};

const getChildHandleClassName = (isFocus, id, pannerNode, isNodeConnected, type) => {

  const isConnected = isNodeConnected(id,type);
  const shouldShowContent = isFocus || (pannerNode && pannerNode.id == id);
  if (shouldShowContent) {
    return styles.classesHandleSource;
  }
  return styles.classesSourceHandleHidden;
};
  

/**
 * 节点目标连接点组件（左侧输入点）
 * 用于接收来自其他节点的连接
 * 
 * @param {Object} props - 组件属性
 * @param {string} props.id - 节点ID
 * @param {boolean} props.isFocus - 节点是否处于聚焦状态
 */
export const NodeTargetHandle = ({ id, isFocus, nodeId, suffix = true, childHandle = false }) => {
  const { isNodeConnected } = useNodesInteractions();
  const { addNodeBySelector } = useNodeAdd();
  const { pannerNode,readOnly } = useStore((state) => state);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [handleElement, setHandleElement] = useState(null);
  const handleId = suffix ? `${id}-target` : id;
  
  // 使用 useMemo 优化 className 计算，避免不必要的重新计算
  const className = useMemo(
    () => getHandleClassName(isFocus, id, pannerNode, isNodeConnected, 'target'),
    [isFocus, id, pannerNode, isNodeConnected]
  );



  // 查找句柄元素
  useEffect(() => {
    if (selectorOpen) {
      const element = document.querySelector(`[data-handleid="${handleId}"]`);
      if (element) {
        setHandleElement(element);
      }
    }
  }, [selectorOpen, handleId]);

  // 句柄点击事件
  const handleHandleClick = (e) => {
    let isTarget =isNodeConnected(id,'target');
    if(isTarget || readOnly){//当前节点被连接不能选择再选择节点
      return;
    }
    e.stopPropagation();
    const element = e.currentTarget;
    setHandleElement(element);
    setSelectorOpen(true);
  };

  // 左侧句柄处理节点选择
  const handleNodeSelect = (node,type,nowNodeId,sourcePosition) => {
    addNodeBySelector(node, node.type,nowNodeId,null,handleId);
  };
  
  // 关闭选择器
  const handleClose = () => {
    setSelectorOpen(false);
  };
  
  return (
    <>
    <Tooltip title="添加节点">
      <Handle
        type="target" 
        className={className}
        id={handleId}
        position={Position.Left}
        onClick={handleHandleClick}
        data-handleid={handleId}
      />
     </Tooltip> 
      <NodeSelector
        open={selectorOpen}
        referenceElement={handleElement}
        onClose={handleClose}
        onSelect={handleNodeSelect}
        handleType="target"
        nodeId={nodeId}
      />
    </>
  );
};

/**
 * 节点源连接点组件（右侧输出点）
 * 用于连接到其他节点
 * 
 * @param {Object} props - 组件属性
 * @param {string} props.id - 节点ID
 * @param {boolean} props.isFocus - 节点是否处于聚焦状态
 */
export const NodeSourceHandle = ({ id, isFocus, nodeId, suffix = true, childHandle = false }) => {

  const { isNodeConnected } = useNodesInteractions();
  const { addNodeBySelector } = useNodeAdd();
  const { pannerNode,readOnly } = useStore((state) => state);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [handleElement, setHandleElement] = useState(null);
  const handleId = suffix ? `${id}-source` : id;
  // 使用 useMemo 优化 className 计算，避免不必要的重新计算
  const className = useMemo(
    () => getHandleClassName(isFocus, nodeId, pannerNode, isNodeConnected, 'source'),
    [isFocus, id, pannerNode, isNodeConnected]
  );
  const childClassName = useMemo(
    () => getChildHandleClassName(isFocus, nodeId, pannerNode, isNodeConnected, 'source'),
    [isFocus, id, pannerNode, isNodeConnected]
  );  
  // 查找句柄元素
  useEffect(() => {
    if (selectorOpen) {
      const element = document.querySelector(`[data-handleid="${handleId}"]`);
      if (element) {
        setHandleElement(element);
      }
    }
  }, [selectorOpen, handleId]);

  // 句柄点击事件
  const handleHandleClick = (e) => {
    if(readOnly){
      return;
    }
    e.stopPropagation();
    const element = e.currentTarget;
    setHandleElement(element);
    setSelectorOpen(true);
  };

  // 处理节点选择
  const handleNodeSelect = (node,type,nowNodeId,sourcePosition  ) => {
    addNodeBySelector(node, node.type,nowNodeId,handleId,null);
  };

  // 关闭选择器
  const handleClose = () => {
    setSelectorOpen(false);
  };
  
  return (
    <>
    <Tooltip title="添加节点">
      <Handle
        type="source"
        id={handleId}
        className={childHandle ? childClassName : className}
        position={Position.Right}
        onClick={handleHandleClick}
        data-handleid={handleId}
      />
      </Tooltip>
      <NodeSelector
        open={selectorOpen}
        referenceElement={handleElement}
        onClose={handleClose}
        onSelect={handleNodeSelect}
        handleType="source"
        nodeId={nodeId}
      />
    </>
  );
};
