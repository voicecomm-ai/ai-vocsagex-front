import React, { forwardRef, useImperativeHandle, useState,useEffect  } from "react";
import styles from "./runLoop.module.css";
import JsonEditorPage from "../JsonEditorPage";
import { Divider } from "antd";
import TrackItem from "../track/item";
import {getUuid} from "@/utils/utils";
const RunLoop = forwardRef((props, ref) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedItems, setExpandedItems] = useState(new Set()); //展开的节点
  const [loopData, setLoopData] = useState([]);
  const [title,setTitle] = useState("");

  useEffect(() => {
    let loopList =props.item.loopList ||[];
    let newLoopList = handleLoopList(loopList);
    setLoopData(newLoopList);
   console.log(newLoopList,'newLoopList');
  }, [props.item]);


  useEffect(() => {
    let nodeTitle = props.nodeType == "iteration"?"批处理":"循环";
    setTitle(nodeTitle);
  }, [props.nodeType]);
  
  //处理loopList数据
  const handleLoopList = (loopList) => {  
    let newLoopList = loopList.map((item,index) => {
      return {
        ...item,
        id: item.id,
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
        <img
          src="/workflow/arrow_bottom.png"
          alt="展开"
          className={`${styles.track_step_expand} ${
            isExpanded ? styles.expanded : ""
          }`}
        
        />
        {props.nodeType == "iteration" ? (
          <img src="/workflow/iteration_track.png" alt="批处理" className={styles.run_loop_icon} />
        ) : (
          <img src="/workflow/loop_track.png" alt="循环" className={styles.run_loop_icon} />
        )}
        {loopData.length} 个 {title}
      </div>
      {isExpanded &&
        loopData.map((item, index) => (
          <div className={styles.run_loop_item} key={item.id}>
            <div className={styles.run_loop_item_header}   onClick={() => toggleChildExpand(item.id)}>
              <div className={styles.run_loop_item_header_left}>
                <img
                  src="/workflow/arrow_bottom.png"
                  alt="展开"
                  className={`${styles.track_step_expand} ${
                    expandedItems.has(item.id) ? styles.expanded : ""
                  }`}
                
                />
                <img
                  src={props.nodeType == "iteration"?"/workflow/iteration.png":"/workflow/loop.png"}
                  alt={props.nodeType == "iteration"?"批处理":"循环"}
                  className={styles.run_loop_item_icon}
                />
                <div className={styles.run_loop_item_name}>{title}{index + 1}</div>
              </div>
              <div className={styles.run_loop_item_header_right}>
                {item?.status != "running" &&
                  item.outputs?.usage?.total_tokens && (
                    <>
                      <div className={styles.run_loop_item_header_right_token}>
                        {item.outputs?.usage?.total_tokens} Tokens
                      </div>
                      <Divider type="vertical" />
                    </>
                  )}
                <div className={styles.run_loop_item_header_right_time}>
                  {item?.status != "running" && (
                    <span className={styles.track_step_duration}>
                      {Number(item.elapsed_time).toFixed(3)}秒
                    </span>
                  )}
                  {item?.status === "running" && (
                    <span className={styles.track_step_running_text}>
                      运行中...
                    </span>
                  )}
                </div>
              </div>
            </div>
            {expandedItems.has(item.id) && (
              <div className={styles.run_loop_item_content}>
                {props.nodeType == "loop" && (
                <JsonEditorPage content={item.inputs} backgroundColor='#FFFFFF'    handleFullscreen={handleFullscreen} title={props.nodeType == "iteration"?"批处理变量":"循环变量"} headerBgColor='#FFFFFF' />
                )}
                {item.loopList.map((trackItem, index) => (
                  <TrackItem
                    key={trackItem.id}
                    item={trackItem}
                    index={index}
                    handleFullscreen={handleFullscreen}
               
                  />
                ))}{" "}
              </div>
            )}
          </div>
        ))}
    </div>
  );
});
export default RunLoop;
