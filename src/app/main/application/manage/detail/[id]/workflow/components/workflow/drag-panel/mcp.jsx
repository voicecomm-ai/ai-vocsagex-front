"use client";
import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
} from "react";
import { getMcpList } from "@/api/workflow";
import styles from "./drag.module.css";
import { Tooltip, Typography, message, Empty, Popover } from "antd";
import { isMcpAvailable } from "@/api/mcp";
const { Text, Paragraph } = Typography;
import { useStore } from "@/store/index";
const Mcp = forwardRef((props, ref) => {
  const { isSelector=false } = props;
  const [mcpList, setMcpList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { mcpIsDrag, setMcpIsDrag, mcpRefresh, setMcpRefresh } = useStore(
    (state) => state
  );
  useImperativeHandle(ref, () => ({
    getMcpList,
  }));

  useEffect(() => {
    getMcpListEvent();
  }, [props.searchKeyword]);

  useEffect(() => {
    console.log(mcpRefresh, "mcpRefresh");
    if (mcpRefresh) {
      getMcpListEvent();
    }
  }, [mcpRefresh]);

  const getMcpListEvent = () => {
    getMcpList({ name: props.searchKeyword }).then((res) => {
      setMcpList(res.data);
      setMcpRefresh(false);
    });
  };

  //拖拽开始事件
  const onDragStart = (e, mcp) => {
    setMcpIsDrag(true);
    let obj = {
      ...mcp,
      type: "mcp",
    };
    console.log(obj, "测试拖拽");
    props.onDragStart(e, obj);
  };

  const handleMcpSelectClick = (mcp) => {
      let obj = {
        ...mcp,
        type: "mcp",
      };
      props.handleNodeSelectClick(obj,'mcp');
  };

  const renderContent = (obj) => {
    return (
      <div className={styles["drag_popover_content"]}>
        <div className={styles["drag_popover_content_header"]}>
          <img
            className={styles["drag_panel_content_item_content_item_icon"]}
            src={process.env.NEXT_PUBLIC_API_BASE + obj.mcpIconUrl}
            alt=""
          />
          <Text
            style={{ maxWidth: 230 }}
            ellipsis={{ tooltip: obj.displayName }}
          >
            {obj.displayName}
          </Text>
        </div>
        <div className={styles["drag_popover_content_desc"]}>
          <Paragraph
            className={styles["drag_popover_content_desc_text"]}
            ellipsis={{ rows: 2, tooltip: obj.description }}
          >
            <span style={{ fontSize: 12, color: "#60687D" }}>
              {obj.description}
            </span>
          </Paragraph>
        </div>
      </div>
    );
  };
  if(mcpList.length === 0){
    return <div>
 
    </div>
  }

  return (
    <div className={styles.mcp_content}>
      {mcpList.length > 0 && (
        <div className={styles["drag_panel_mcp_title"]}>MCP</div>
      )}
      {mcpList.length > 0 &&
        mcpList.map((item) => (
          <div className={styles.mcp_content_item} key={item.id}>
            <div className={styles.mcp_content_item_tag}>{item.tagName}</div>
            <div className={styles.mcp_content_item_content}>
              {item.mcps &&
                item.mcps.map((mcp) => (
                  <Popover
                    placement="right"
                    arrow={false}
                    content={renderContent(mcp)}
                    title=""
                    trigger="hover"
                    key={mcp.id}
                    zIndex={10001}
                  >
                    <div
                    onClick={() => handleMcpSelectClick(mcp)}
                      onDragStart={
                        props.readOnly || item.disabled
                          ? undefined
                          : (e) => onDragStart(e, mcp)
                      }
                      onDragEnd={() => setMcpIsDrag(false)}
                      draggable={isSelector?false:!props.readOnly && !item.disabled}
                      style={
                        props.readOnly || item.disabled
                          ? { cursor: "not-allowed" }
                          : {}
                      }
                      className={styles.mcp_content_item_content_item}
                      key={mcp.id}
                    >
                      <div
                        className={styles.mcp_content_item_content_item_header}
                      >
                        <img
                          className={
                            styles.mcp_content_item_content_item_header_img
                          }
                          src={
                            process.env.NEXT_PUBLIC_API_BASE + mcp.mcpIconUrl
                          }
                          alt=""
                        />
                        <div
                          className={
                            styles.mcp_content_item_content_item_header_text
                          }
                        >
                          <Text
                            style={{ maxWidth: 120 }}
                            ellipsis={{
                              tooltip: mcpIsDrag ? "" : mcp.displayName,
                            }}
                          >
                            {mcp.displayName}
                          </Text>
                        </div>
                      </div>
                    </div>
                  </Popover>
                ))}
            </div>
          </div>
        ))}
    </div>
  );
});
export default Mcp;
