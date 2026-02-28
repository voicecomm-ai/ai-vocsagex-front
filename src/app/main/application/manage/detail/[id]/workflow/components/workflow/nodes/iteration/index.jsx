import React, { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { Handle, Position, Background, NodeResizeControl, useReactFlow, useNodes } from "@xyflow/react";
import styles from "./iteration.module.css";
import { useStore } from "@/store/index";
import nodeStyles from "../node.module.css";
import Operator from "../../components/Operator";
import NodeSelector from "../../drag-panel/selector";
import { useNodeAdd } from "../../hooks/useNodeAdd";
import { NodeSourceHandle, NodeTargetHandle } from "../../node-handle";
import { useParent } from "../../hooks";
import { Typography } from "antd";
const { Text } = Typography;
const IterationNode = ({ id, data, type }) => {
  const {
    setPanelVisible,
    readOnly,
    setPannerNode,
    pannerNode,
    setRunVisible,
  } = useStore((state) => state);
  const reactFlowInstance = useReactFlow();
  const nodeArr = useNodes();
  const contentRef = useRef(null);
  const [isFocus, setIsFocus] = useState(false);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [handleElement, setHandleElement] = useState(null);
  const addRef = useRef(null);
  const [isHasChild, setIsHasChild] = useState(false);
  const [minSize, setMinSize] = useState({ width: 500, height: 200 });
  const [maxSize, setMaxSize] = useState({ width: Infinity, height: Infinity });
  const { addNodeBySelector } = useNodeAdd();
  const { calculateChildNodesBounds } = useParent();
  const iterationNodeRef = useRef(null);
  // 使用 ref 存储上一次的尺寸值，避免不必要的状态更新
  const lastMinSizeRef = useRef({ width: 500, height: 200 });
  // 使用 ref 存储最大尺寸值，避免在回调依赖中包含状态
  const maxSizeRef = useRef({ width: Infinity, height: Infinity });
  const controlStyle = {
    background: "none",
    border: "none",
    position: "absolute",
    bottom: 0,
    right: 0,
    zIndex: 1000,
  };
  // 鼠标进入节点
  const handleMouseEnter = () => {
    setIsFocus(true);
  };
  // 鼠标离开节点
  const handleMouseLeave = () => {
    setIsFocus(false);
  };
  const handleClose = () => {
    setSelectorOpen(false);
  };
  // 处理节点选择添加事件  //nowNodeId 当前节点Id
  const handleNodeSelect = (node,type,nowNodeId) => {
    let nodes = reactFlowInstance.getNodes();
    let loopStartNode = nodes.find(node => node.type == "iteration-start" && node.parentId == id); //获取批处理开始节点id
    let sourceId = loopStartNode?.id+'-source';
    addNodeBySelector(node, node.type,loopStartNode?.id,sourceId,null);
  };
  // 查找句柄元素
  useEffect(() => {
    if (selectorOpen) {
      const element = addRef.current;
      if (element) {
        setHandleElement(element);
      }
    }
  }, [selectorOpen]);
 
  //查找当前节点的子节点 存在返回true 不存在返回false
  const findChildNodes = useCallback((data) => {
    const childNodes = data.filter(node => node.parentId == id &&node.type != "iteration-start");
    if(childNodes.length > 0){
      return true;
    }
    return false;
  }, [id]);

  // 获取当前节点的子节点（使用 useMemo 避免不必要的重新计算）
  const childNodes = useMemo(() => {
    return nodeArr.filter(
      (node) => node.parentId === id && node.type !== "iteration-start"
    );
  }, [nodeArr, id]);

  // 获取子节点的关键信息用于依赖项（只包含影响尺寸计算的属性）
  const childNodesKey = useMemo(() => {
    return childNodes.map((node) => ({
      id: node.id,
      x: node.position?.x || 0,
      y: node.position?.y || 0,
      width: node.measured?.width || node.width || 320,
      height: node.measured?.height || node.height || 100,
    }));
  }, [childNodes]);

  useEffect(() => {
    try {
      
      let hasChild = findChildNodes(nodeArr);
      setIsHasChild(hasChild);
    } catch (error) {
      console.warn('useEffect findChildNodes 执行出错:', error);
    }
  }, [nodeArr, findChildNodes]);

  // 初始化时根据子元素的位置计算父元素的最大最小宽度
  useEffect(() => {
    const initializeSize = () => {
      try {
        // 计算子节点边界并获取所需的最小尺寸
        const bounds = calculateChildNodesBounds(id);
        
        if (bounds) {
          const { width, height } = bounds;
          
          // 验证尺寸值是否有效
          if (
            typeof width === 'number' && 
            typeof height === 'number' && 
            isFinite(width) && 
            isFinite(height) &&
            width > 0 && 
            height > 0
          ) {
            // 更新最小尺寸
            setMinSize(prevSize => {
              // 只在尺寸真正改变时才更新状态，避免无限循环
              const widthChanged = Math.abs(width - prevSize.width) > 0.1;
              const heightChanged = Math.abs(height - prevSize.height) > 0.1;
              
              if (widthChanged || heightChanged) {
                lastMinSizeRef.current = { width, height };
                return { width, height };
              }
              return prevSize;
            });

            // 计算最大尺寸（基于子节点的分布，添加合理的缓冲）
            // 最大宽度 = 最小宽度 * 2 或根据子节点最右边位置计算
            const nodes = reactFlowInstance.getNodes();
            const currentChildNodes = nodes.filter(
              (node) => node.parentId === id && node.type !== "iteration-start"
            );
            
            if (currentChildNodes.length > 0) {
              // 找到最右边的子节点
              let maxRight = -Infinity;
              currentChildNodes.forEach((childNode) => {
                const childX = childNode.position?.x || 0;
                const childWidth = childNode.measured?.width || childNode.width || 320;
                const childRight = childX + childWidth;
                maxRight = Math.max(maxRight, childRight);
              });
              
              // 设置最大宽度为最小宽度的 2.5 倍或根据子节点位置计算（取较大值）
              const calculatedMaxWidth = Math.max(width * 2.5, maxRight + 200);
              const calculatedMaxHeight = height * 2;
              
              const newMaxSize = {
                width: calculatedMaxWidth,
                height: calculatedMaxHeight,
              };
              setMaxSize(newMaxSize);
              maxSizeRef.current = newMaxSize;
            } else {
              // 没有子节点时，使用默认的最大尺寸
              const newMaxSize = {
                width: width * 2,
                height: height * 2,
              };
              setMaxSize(newMaxSize);
              maxSizeRef.current = newMaxSize;
            }
          }
        } else {
          // 如果没有子节点，使用默认尺寸
          setMinSize({ width: 500, height: 200 });
          const defaultMaxSize = { width: Infinity, height: Infinity };
          setMaxSize(defaultMaxSize);
          maxSizeRef.current = defaultMaxSize;
        }
      } catch (error) {
        console.warn('初始化尺寸计算错误:', error);
      }
    };

    // 初始化计算
    initializeSize();
    // 只当当前节点的子节点信息变化时重新计算，而不是所有节点变化时
  }, [id, childNodesKey, calculateChildNodesBounds, reactFlowInstance]);


    //节点点击事件
    const onNodeClick = (node) => {
      setRunVisible(false);
      setPanelVisible(true);
      setPannerNode({ id, data, type });
     
    };
  
  //添加子节点点击事件
  const handleAddNode = (event) => {
    event.stopPropagation();
    setSelectorOpen(true);
  };


  return (
    <>
      <div
        ref={iterationNodeRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={styles.iteration_node}
        onClick={() => onNodeClick({ id, data })}
        data-id={id}
      >
        <NodeResizeControl  style={controlStyle} minWidth={minSize.width} minHeight={minSize.height}>
          <img
            className={styles.resize_icon}
            src="/workflow/resize.png"
            alt=""
          />
        </NodeResizeControl>

        {/* Header，阻止拖拽 */}
        <div className={styles.iteration_node_header}>
          <img
            className={nodeStyles["custom_node_header_icon"]}
            src={`/workflow/${data.type}.png`}
            alt=""
          />
          <div className={nodeStyles["custom_node_header_title"]}>
            <Text style={{maxWidth: 200}} ellipsis={{ tooltip: data.title }}>
              <span style={{fontSize: 16,fontWeight: '600',color: "#101A28"}}> {data.title}</span></Text>
            </div>
          <div className={nodeStyles["custom_node_header_type"]}>逻辑关系</div>
          {data.is_parallel && (
            <div className={styles["custom_node_header_parallel"]}>并行模式</div>
          )}
          {((pannerNode && pannerNode.id == id) || isFocus) && !readOnly && (
            <div
              className={styles["custom_node_actions"]}
              onClick={(e) => e.stopPropagation()}
            >
              <Operator id={id}></Operator>
            </div>
          )}
        </div>

        {/* 内容区，允许拖拽子节点 */}
        <div ref={contentRef} className={styles.iteration_node_content}>
          <div className={styles.iteration_node_content_main}>
            {!isHasChild && (
            <div
              className={styles.iteration_node_add_node}
              ref={addRef}
              onClick={(e)=>handleAddNode(e)}
            >
                <div className={styles.iteration_node_add_node_line}></div>
              <div className={styles.iteration_node_add_node_text}>
                <img
                  className={styles.iteration_node_add_node_text_img}
                  src="/workflow/line_add.png"
                  alt=""
                />
                添加节点
              </div>
            </div>
            )}
          </div>
        </div>

        <div
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <NodeTargetHandle id={id} isFocus={isFocus} nodeId={id} />
          <NodeSourceHandle id={id} isFocus={isFocus} nodeId={id} />
        </div>
      </div>
      <NodeSelector
        open={selectorOpen}
        referenceElement={handleElement}
        onClose={handleClose}
        onSelect={handleNodeSelect}
        handleType="source"
        nodeId={data.start_node_id}
      ></NodeSelector>
    </>
  );
};

export default IterationNode;
