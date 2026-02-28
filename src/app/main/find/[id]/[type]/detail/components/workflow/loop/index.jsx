import React, { forwardRef, useImperativeHandle, useState,useEffect  } from "react";
import styles from "./runLoop.module.css";
import { Divider } from "antd";
const RunLoop = forwardRef((props, ref) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedItems, setExpandedItems] = useState(new Set()); //展开的节点
  const [loopData, setLoopData] = useState([]);

  useEffect(() => {
    let loopList =props.item.loopList ||[];
    let newLoopList = handleLoopList(loopList);
    setLoopData(newLoopList);
   console.log(newLoopList,'newLoopList');
  }, [props.item]);
  
  //处理loopList数据
  const handleLoopList = (loopList) => {  
    let newLoopList = loopList.map((item,index) => {
      return {
        ...item,
        id: item.id + index +`-loop`,
        expandable: true,
        loopList: handleLoopList(item.loopList),
      };
    });
    return newLoopList;
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  // 切换子节点展开/收起状态
  const toggleChildExpand = (itemId) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };
  //全屏点击事件
  const handleFullscreen = (data, title) => {
    props?.handleFullscreen(data, title);
  };
  return (
    <div className={styles.run_loop}>
      <div className={styles.run_loop_header}   onClick={() => toggleExpand()}>
        {loopData.length} 个循环
      </div>
    </div>
  );
});
export default RunLoop;
