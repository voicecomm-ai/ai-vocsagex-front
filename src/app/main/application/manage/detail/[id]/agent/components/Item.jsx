"use client";

import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
} from "react";
import styles from "../page.module.css";
import { Select, Tooltip, Typography } from "antd";
import { deleteMcpBind } from "@/api/mcp";
const { Paragraph, Text } = Typography;
const AgentItem = forwardRef((props, ref) => {
  const [variableList, setVariableList] = useState([]);
  const [itemArr, setItemArr] = useState([]); //数组
  const [isHovered, setIsHovered] = useState(false);
  const [itemSelect, setItemSelect] = useState({});
  const [isExpanded, setIsExpanded] = useState(false);

  useImperativeHandle(ref, () => ({
    showModal,
  }));

  useEffect(() => {
    setIsExpanded(props.data.length > 0);
  }, [props.data]);

  const showModal = (arr) => {
    setVariableList(arr);
  };
  const cancelEvent = () => {
    props.cancelConfirmAddVisible();
  };
  //保存点击事件
  const saveEvent = () => {
    props.batchsaveVariable(variableList);
  };
  //变量hover事件
  const itemHover = (obj) => {
    setIsHovered(true);
    setItemSelect(obj);
  };
  //知识库鼠标移出事件
  const itemMouseOut = (obj) => {
    setIsHovered(false);
    setItemSelect({});
  };
  //新增点击事件
  const addEvent = () => {
    props.addItemEvent();
  };
  //修改点击事件
  const editEvent = () => {};
  //删除点击事件
  const deleteEvent = (obj) => {
    deleteMcpBind({
      mcpId: obj.id,
      applicationId: props.agentId,
    }).then((res) => {
      props.refreshMcpList();
    });
  };
  return (
    <div className={styles["agent_variable_content"]}>
      <div
        className={`${styles["agent_variable_content_header"]} ${
          !isExpanded ? styles["left_tab_item_active"] : ""
        }`}
      >
        <div
          className={`${styles["agent_variable_content_header_left"]}`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <img
            src="/workflow/arrow_bottom.png"
            alt="展开"
            className={`${styles.track_step_expand} ${
              isExpanded ? styles.expanded : ""
            }`}
          />

          {props.title}
          <Tooltip title={props.tooltip}>
            <img className={styles["info_img"]} src="/agent/info.png" alt="" />
          </Tooltip>
        </div>
        {props.canCreate && (
          <div
            className={styles["agent_variable_content_header_right"]}
            onClick={addEvent}
          >
            <img className={styles["add_img"]} src="/agent/add.png" alt="" />
            <span type="text" size="small">
              添加
            </span>
          </div>
        )}
      </div>
      {isExpanded && props.data.length > 0 && (
        <div className={styles["agent_mcp_content_list"]}>
          {props.data &&
            props.data.map((item) => (
              <div
                key={item.id}
                className={styles["agent_mcp_item"]}
                onMouseMove={() => itemHover(item)}
                onMouseEnter={() => itemHover(item)}
                onMouseLeave={() => itemMouseOut(item)}
              >
                <div className={styles["agent_mcp_item_left"]}>
                  <img
                    className={styles["agent_mcp_item_left_icon_img"]}
                    src={process.env.NEXT_PUBLIC_API_BASE + item.mcpIconUrl}
                    alt=""
                  />

                  <div className={styles["agent_mcp_item_left_content"]}>
                    <div className={styles["agent_mcp_item_left_content_top"]}>
                      <div
                        className={styles["agent_mcp_item_left_content_name"]}
                      >
                        <Text
                          style={{ maxWidth: 600 }}
                          ellipsis={{ tooltip: item.displayName }}
                        >
                          <span
                            className={
                              styles["agent_mcp_item_left_content_name_text"]
                            }
                          >
                            {" "}
                            {item.displayName}
                          </span>
                        </Text>
                      </div>
                      <div
                        className={styles["agent_mcp_item_left_content_tag"]}
                      >
                        {item.tagList && (
                          <Tooltip title={item.tagText}>
                            <div className={styles["agent_mcp_content_item"]}>
                              <div
                                className={
                                  styles["knowledge_select_item_tag_first"]
                                }
                              >
                                <Text
                                  className={
                                    styles["knowledge_select_item_tag_other"]
                                  }
                                  style={{ maxWidth: 80 }}
                                  ellipsis={true}
                                >
                                  {item.tagList[0].name}
                                </Text>
                              </div>
                              {item.tagList.length > 1 && (
                                <div
                                  className={
                                    styles["knowledge_select_item_tag_other"]
                                  }
                                >
                                  ,+{item.tagList.length - 1}{" "}
                                </div>
                              )}
                            </div>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                    <div className={styles["agent_mcp_item_left_content_desc"]}>
                      <Text
                        style={{ maxWidth: "100%" }}
                        ellipsis={{ tooltip: item.description }}
                      >
                        <span style={{ fontSize: 12, color: "#60687D" }}>
                          {item.description}
                        </span>
                      </Text>
                    </div>
                  </div>
                </div>

                {props.canCreate && isHovered && itemSelect.id === item.id && (
                  <div className={styles["agent_variable_item_right"]}>
                    <div className={styles["agent_variable_item_btn"]}>
                      <img
                        alt="删除"
                        src="/agent/delete.png"
                        onClick={() => deleteEvent(item)}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
});
export default AgentItem;
