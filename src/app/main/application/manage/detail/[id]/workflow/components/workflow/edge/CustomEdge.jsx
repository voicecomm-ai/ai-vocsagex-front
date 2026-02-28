import React, { useState, useRef, useEffect } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
} from '@xyflow/react';
import styles from './edge.module.css';
import NodeSelector from "../drag-panel/selector";
import { useNodeAdd } from "../hooks/useNodeAdd";
import { useStore } from "@/store/index";
export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  source,
  target,
  style = {},
  markerEnd,
  selected,

}) {
  const { readOnly } = useStore((state) => state);
  const { addNodeBySelector } = useNodeAdd();
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const [isHovered, setIsHovered] = useState(false);
  const { setEdges } = useReactFlow();
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [handleElement, setHandleElement] = useState(null);
  const onEdgeClick = () => {
    console.log(source,target,'source,target');
    if(readOnly){
      return;
    }
    setSelectorOpen(true);
  };
  const handleClose = () => {
    setSelectorOpen(false);
  };
  const handleNodeSelect = (node,type,nowNodeId,sourcePosition) => {
    addNodeBySelector(node, node.type,source,source,target,true,id);
  };
  const addRef = useRef(null);
  // 查找句柄元素
  useEffect(() => {
    if (selectorOpen) {
      const element = addRef.current;
      if (element) {
        setHandleElement(element); 
      }
    }
  }, [selectorOpen,addRef]);

  // 根据选中状态动态设置样式
  const edgeStyle = {
    ...style,
    stroke: selected ? '#4070FD' : style.stroke,
    strokeWidth: selected ? 2 : (style.strokeWidth || 1),
    zIndex:9999999,
  };
 
  return (
    <>
      <g
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ cursor: 'pointer' }}
      >
        {/* 绘制基础的贝塞尔线 */}
        <BaseEdge 
          path={edgePath} 
          markerEnd={markerEnd} 
          style={edgeStyle}
        />

        {/* 不可见的路径覆盖层，用于捕获鼠标事件 */}
        <path
          d={edgePath}
          fill="none"
          strokeWidth={20}
          stroke="transparent"
          strokeLinecap="round"
          pointerEvents="stroke"
        />
      </g>

      {/* 自定义标签渲染 */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all', // 允许点击事件
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.2s ease-in-out',
            cursor: 'pointer',
            zIndex: 10001,
          }}
          className={styles.button_edge_label}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={onEdgeClick}
        >
          <img   ref={addRef} src="/workflow/line_add.png" alt="" className={styles.button_edge_img} />
          <NodeSelector
        open={selectorOpen}
        referenceElement={handleElement}
        onClose={handleClose}
        onSelect={handleNodeSelect}
        handleType="source"
        nodeId={source}
      ></NodeSelector> 
        </div>
       
      </EdgeLabelRenderer>
   
    </>
  );
}
