import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { Input, Typography } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import {
  flip,
  offset,
  shift,
  useFloating,
  useDismiss,
  useInteractions,
} from '@floating-ui/react';
import styles from "./selector.module.css";
import DragPanel from "./index";
import { useNodeData } from "../hooks/useNodeData";

const NodeSelector = ({ open, referenceElement, onClose, onSelect, handleType = 'source', nodeId }) => {
  const floatingRef = useRef(null);
  const { getNodeById } = useNodeData();
  const [isInParent, setIsInParent] = useState(false);
  // 根据句柄类型确定弹框位置
  // target 类型：弹框在左侧（left-start）
  // source 类型：弹框在右侧（right-start）
  const placement = handleType === 'target' ? 'left-start' : 'right-start';


  // Floating UI 配置
  // 使用 fixed 策略，因为 Portal 渲染到 body 时需要使用 fixed 定位
  const { refs, floatingStyles, isPositioned, context } = useFloating({
    open: open,
    onOpenChange: (isOpen) => {
      if (!isOpen && onClose) {
        onClose();
      }
    },
    elements: {
      reference: referenceElement,
    },
    placement: placement,
    strategy: 'fixed', // Portal 渲染到 body 时需要使用 fixed 定位策略
    middleware: [
      // 动态计算 offset：水平偏移 8px，垂直偏移为负的弹框高度的一半（使弹框中心与句柄对齐）
      offset(({ rects }) => {
        const floatingHeight = rects.floating.height;
        return {
          mainAxis: 8, // 水平方向距离
          crossAxis: -floatingHeight / 2, // 垂直方向：向上偏移弹框高度的一半，使中心对齐
        };
      }),
      shift({
        padding: 8, // 与视口边缘的最小距离
      }),
      flip(), // 自动翻转位置
    ],
    whileElementsMounted: (reference, floating, update) => {
      update();
    },
  });

  const dismiss = useDismiss(context);
  const { getFloatingProps } = useInteractions([dismiss]);

  //根据nodeId获取节点数据
  useEffect(() => {
    let nodeData = getNodeById(nodeId);
    if(nodeData?.parentId){
      setIsInParent(true);
    }else{
      setIsInParent(false);
    }
  }, [nodeId, getNodeById]);

  // 处理节点选择事件
  // 当节点被选择时，调用父组件传入的 onSelect 回调，并关闭弹框
  const handleNodeSelect = (node, type) => {
    // 若存在 onSelect 回调，则调用，传递选中的节点和类型
    if (onSelect) {
      onSelect(node, type,nodeId);
      // 调用 onClose 关闭弹框（防止未及时关闭）
      onClose();
    }
    // 再次判断是否存在 onClose，保证弹框能够被关闭
    if (onClose) {
      onClose();
    }
  };

  if (!open) {
    return null;
  }

  // 使用 Portal 将弹框渲染到 body，避免被 React Flow 容器层级限制
  const popupContent = (
    <div
      ref={(node) => {
        refs.setFloating(node);
        floatingRef.current = node;
      }}
      {...getFloatingProps()}
      className={styles.selector_popup}
      style={{
        ...floatingStyles,
        visibility: isPositioned ? 'visible' : 'hidden',
        zIndex: 10001, // 确保在所有节点之上（节点最高 z-index 为 1111）
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <DragPanel  isSelector={true} isInParent={isInParent} onNodeSelectClick={handleNodeSelect}></DragPanel>
    </div>
  );

  // 使用 Portal 渲染到 document.body
  return createPortal(popupContent, document.body);
};

export default NodeSelector;