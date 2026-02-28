

import { useCallback, useEffect, useState } from "react";
import { useReactFlow } from "@xyflow/react";


export const useNodeChange = () => {

const handleNodeChange = (changes,nodes) => {
  const updatedChanges = changes.map((change) => {
    if(change.type=='dimensions'){//
     console.log(change,'change')
     change.dimensions.width=800;
     change.width=800;
     
    }
    if (change.type != "position") return change;
    const node = nodes.find((n) => n.id === change.id);
    if (!node || !node.parentId) return change;

    const parentNode = nodes.find((n) => n.id === node.parentId);
    if (!parentNode) return change;

    const positionX = change.position?.x ?? node.position.x;
    const positionY = change.position?.y ?? node.position.y;
    const measured = node.measured;
    const parentMeasured = parentNode.measured;

    // 获取节点尺寸（默认值如果不存在）
    const nodeWidth = measured.width ;
    const nodeHeight = measured.height ;
    const parentWidth = parentMeasured.width ;
    const parentHeight = parentMeasured.height ;

    // 限制边距为 16px
    const margin = 16;
    const minX = margin;
    const maxX = parentWidth - nodeWidth - margin;
    const minY = 58; // 顶部限制保持 47px
    const maxY = parentHeight - nodeHeight - margin; // 底部限制 16px

    let newX = positionX;
    let newY = positionY;
    // 限制 X 坐标（左右边距 16px）
    if (positionX < minX) {
      newX = minX;
    } else if (positionX > maxX) {
      newX = maxX;
    }

    // 限制 Y 坐标（顶部 47px，底部 16px）
    if (positionY < minY) {
      newY = minY;
    } else if (positionY > maxY) {
      newY = maxY;
    }

    // 如果位置有变化，返回更新后的位置
    if (newX !== positionX || newY !== positionY) {
      return {
        ...change,
        position: {
          ...change.position,
          x: newX,
          y: newY,
        },
      };
    }

    return change;
  });
  return updatedChanges;
}


return {
  handleNodeChange
}

  
} 