/* eslint-disable @next/next/no-img-element */
"use client";
import { forwardRef, useState, useRef, useEffect, useImperativeHandle } from "react";
import { Modal, Button, message, ConfigProvider, Segmented, Badge } from "antd";
import { deleteDocumentProperty } from "@/api/knowledge";
import { useRouter } from "next/navigation";
import styles from "./message.module.css";
// 定义样式对象，提高代码可维护性
import {
  getAllMessageList,
  getAllUnReadMessageList,
  clearOneMessage,
  clearAllMessage,
} from "@/api/messageCenter";

const MessageCenterModal = forwardRef((props, ref) => {
  const [isOpenMessage, setIsOpenMessage] = useState(false); // 是否展示消息中心
  /**
   * 消息状态对应的图标映射
   * 0: 成功, 1: 失败
   */
  const messageStatusMap = {
    0: "/menu/success.png",
    1: "/menu/fail.png",
  };
  const [activeMessageTabKey, setActiveMessageTabKey] = useState("unRead"); // 当前激活的消息标签页
  const [messageList, setMessageList] = useState([]); // 消息列表
  const [unReadMessageNum, setUnReadMessageNum] = useState(0); // 未读消息数量
  // Modal的样式
  const [modalStyle, setModalStyle] = useState({});
  // let messageButtonRef = useRef(null);
  const router = useRouter();
  useImperativeHandle(ref, () => ({
    showModal,
    hideModal,
  }));

  // 当Modal显示状态变化或窗口大小改变时重新计算位置
  useEffect(() => {
    if (isOpenMessage) {
      calculateModalPosition();
      window.addEventListener("resize", calculateModalPosition);
    }

    return () => {
      window.removeEventListener("resize", calculateModalPosition);
    };
  }, [isOpenMessage]);

  // 计算Modal位置
  const calculateModalPosition = () => {
    if (!props.messageButtonRef.current) return;

    // 获取按钮的位置信息
    const buttonRect = props.messageButtonRef.current.getBoundingClientRect();

    // 计算Modal位置：按钮右侧20px，与按钮顶部对齐
    setModalStyle({
      position: "fixed",
      left: buttonRect.right + 20, // 按钮右侧+20px
      top: buttonRect.bottom - 700, // 与按钮底部对齐
      margin: 0, // 清除默认margin
      zIndex: 1000, // 确保在其他元素上方
    });
  };

  // 显示模态框，将 visible 状态设置为 true
  const showModal = () => {
    setIsOpenMessage(true);
    setActiveMessageTabKey("unRead");
    getList("unRead");
  };

  /**
   * 切换消息标签页
   * @param {string} key - 标签页key
   */
  const onChangeMessageTab = (key) => {
    setActiveMessageTabKey(key);
    getList(key);
  };

  /**
   * 获取消息列表
   * @param {string} key - 消息类型key
   */
  const getList = async (key) => {
    if (key === "unRead") {
      // 获取未读消息列表
      getAllUnReadMessageList().then((res) => {
        let data = res.data.records || [];
        data.forEach((item) => {
          const attachment = JSON.parse(item.attachment);
          item.reason = attachment?.reason;
          item.typeName = attachment?.typeName;
        });
        setMessageList(data);
        sessionStorage.setItem("unReadMessageNum", res.data.total);
        setUnReadMessageNum(res.data.total);
      });
    } else {
      // 获取全部消息列表
      getAllMessageList().then((res) => {
        let data = res.data.records || [];
        data.forEach((item) => {
          const attachment = JSON.parse(item.attachment);
          item.reason = attachment?.reason;
          item.typeName = attachment?.typeName;
        });
        const unReadNum = data.filter((item) => !item.isRead).length;
        sessionStorage.setItem("unReadMessageNum", unReadNum);
        setUnReadMessageNum(unReadNum);
        setMessageList(data);
      });
    }
  };

  /**
   * 清空所有消息
   */
  const onClickMessageClearAll = async () => {
    clearAllMessage().then((res) => {
      message.success(res.msg);
      getList(activeMessageTabKey);
    });
  };

  /**
   * 处理单条消息点击
   * @param {Object} item - 消息项
   */
  const handleMessageItem = (item) => {
    clearOneMessage(item.id).then((res) => {
      if (!item.isRead) {
        setActiveMessageTabKey("all");
        getList("all");
      } else {
        getList(activeMessageTabKey);
      }
    });
  };

  /**
   * 关闭消息中心
   */
  const onClickMessageClose = () => {
    setActiveMessageTabKey("unRead");

    // setIsOpenMessage(false);
  };
  // 隐藏模态框，将 visible 状态设置为 false
  const hideModal = () => {
    props.onClickMessageClose();
    setIsOpenMessage(false);
    setActiveMessageTabKey("unRead");
  };

  /**
   * 跳转到我的模型页面
   * @param {number} msgType - 消息类型
   */
  const onJumptoMyModel = (msgType, type) => {
    switch (msgType) {
      case 301:
        router.push("/main/model/myModel");
        break;
      case 303:
        router.push("/main/model/dataManage");
        break;
      case 304:
        router.push("/main/model/preTrainingModel");
        break;
      case 305:
        if (!type) {
          //成功
          router.push("/main/model/preTrainingModel");
        } else {
          //失败
          router.push("/main/model/myModel");
        }
        break;
      case 306:
        router.push("/main/model/modelFineTuning");
        break;
      case 308:
        router.push("/main/model/algorithmEvaluation");
        break;
      case 309:
        router.push("/main/model/preEvaluation");
        break;
      case 307:
        if (!type) {
          //成功
          router.push("/main/model/preTrainingModel");
        } else {
          //失败
          router.push("/main/model/modelFineTuning");
        }
        break;
      case 601:
        router.push("/main/dataGovernance/dataset");
        break;
    }
    setIsOpenMessage(false);
    setActiveMessageTabKey("unRead");
  };
  /**
   * 预训练模型下载处理
   * @param {Event} e - 事件对象
   * @param {Object} data - 下载数据
   * @param {string} from - 来源标识，默认为"card"
   */
  const downloadHandle = (e, data, from = "card") => {
    if (!data.downloadPath) {
      return message.warning("下载路径不存在");
    }

    // 创建下载链接
    const link = document.createElement("a");
    link.href = process.env.NEXT_PUBLIC_API_BASE + data.downloadPath;
    link.download = ""; // 浏览器按URL推断文件名
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 处理消息项
    handleMessageItem(data);

    // 如果来自列表，切换到全部标签页并刷新
    if (from === "list") {
      setActiveMessageTabKey("all");
      getList("all");
    }

    e.stopPropagation();
  };
  // 点击确认按钮的回调函数，当前为空实现
  // const onOk = async () => {
  //   setLoading(true)
  //   const data = {
  //     id: actionObj,
  //   }
  //   deleteDocumentProperty(data)
  //     .then(res => {
  //       submitSuccess()
  //     })
  //     .catch(err => {})
  // }
  // const submitSuccess = () => {
  //   message.success('操作成功')
  //   props.updateList()
  //   hideModal()
  //   setLoading(false)
  // }

  const messageConditions = (item) => {
    const { msg, type, createTime, attachment, msgType } = item;
    const msgTypeMap = {
      301: "模型",
      302: "生成",
      303: "解析",
      501: "数据导入",
      304: "-模型添加",
      305: "部署",
      306: "模型",
      307: "部署",
      308: "算法模型",
      309: "预训练模型",
      601: "解析",
    };
    const trainStatusMap = {
      0: "训练中",
      1: "排队中",
      2: "训练成功",
    };
    //评测状态
    const evalStatusMap = {
      0: "评测中",
      1: "排队中",
      2: "评测成功",
      3: "评测失败",
    };
    const title = msgTypeMap[msgType];
    const attachmentObj = JSON.parse(attachment);
    let status = "";
    if (msgType === 301 || msgType === 306) {
      if (type === 1) {
        status = "训练失败";
      } else {
        status = trainStatusMap[attachmentObj.trainStatus];
      }
    } else if (msgType === 308 || msgType === 309) {
      status = `${evalStatusMap[attachmentObj.trainStatus]}`;
    } else {
      status = !type ? "成功" : "失败";
    }
    return (
      <>
        <span>{title || ""}</span>
        {item.msgType !== 501 && <span>{status}</span>}
        {/* {item.msgType === 302 && item.typeName && (
          <div className={styles["info_top_model_type"]}>{item.typeName}</div>
        )} */}
      </>
    );
  };
  return (
    <Modal
      // rootClassName={styles["root-custom-style"]}
      open={isOpenMessage}
      onClose={hideModal}
      closeIcon={null}
      mask={false}
      maskClosable={false}
      footer={null}
      // 应用自定义样式
      style={modalStyle}
      styles={{
        content: {
          backgroundImage: 'url("/menu/message_bg.png")',
          borderRadius: 16,
          padding: "0px",
          backgroundColor: "#fff",
          backgroundPosition: "top center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "100% auto",
        },
        header: {
          background: "transparent",
        },
      }}
      width={480}
      // 点击弹窗外关闭的实现
      afterOpenChange={(open) => {
        if (open) {
          // 为document添加点击事件监听
          const handleClickOutside = (e) => {
            // 获取Modal元素
            const modalElement = document.querySelector(".ant-modal-root .ant-modal");
            // 判断点击是否在Modal外且不在按钮上
            if (
              modalElement &&
              !modalElement.contains(e.target) &&
              props.messageButtonRef.current &&
              !props.messageButtonRef.current.contains(e.target)
            ) {
              setIsOpenMessage(false);
            }
          };

          document.addEventListener("mousedown", handleClickOutside);

          // 移除事件监听
          return () => {
            document.removeEventListener("mousedown", handleClickOutside);
          };
        }
      }}
      // className={styles["custom-drawer_style"]}
    >
      <div className={styles["main_content_message_center"]}>
        <div className={styles["main_content_message_action_wrap"]}>
          <ConfigProvider
            theme={{
              components: {
                Segmented: {
                  itemColor: "#666E82",
                  borderRadius: 8,
                  fontSize: 14,
                  trackBg: "#E3E5ED",
                },
              },
            }}
          >
            <Segmented
              value={activeMessageTabKey}
              onChange={(e) => onChangeMessageTab(e)}
              options={[
                {
                  label: <div className={styles["main_content_message_segment_label"]}>未读</div>,
                  value: "unRead",
                },
                {
                  label: <div className={styles["main_content_message_segment_label"]}>全部</div>,
                  value: "all",
                },
              ]}
            />
          </ConfigProvider>
          <div className={styles["main_content_message_action_btns"]}>
            <img
              className={styles["message_action_btn"]}
              src='/menu/clear.png'
              onClick={onClickMessageClearAll}
              alt=''
            />
            <img
              className={styles["message_action_btn"]}
              src='/menu/close.png'
              onClick={hideModal}
              alt=''
            />
          </div>
        </div>
        <div className={styles["message_center_list"]}>
          {messageList.length > 0 &&
            messageList.map((item) => (
              <div
                className={styles["message_center_list_item"]}
                key={item.id}
                onClick={() => handleMessageItem(item)}
              >
                {!item.isRead ? (
                  <Badge dot>
                    <img
                      className={styles["info_top_message_icon"]}
                      src={messageStatusMap[item.type]}
                      alt=''
                    />
                  </Badge>
                ) : (
                  <img
                    className={styles["info_top_message_icon"]}
                    src={messageStatusMap[item.type]}
                    alt=''
                  />
                )}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    width: "100%",
                    flexDirection: "column",
                    paddingBottom: 15,
                    borderBottom: "0.5px solid #F2F4F6",
                  }}
                >
                  <div className={styles["message_center_list_item_top"]}>
                    <div className={styles["message_item_info_wrap"]}>
                      {/* <div className={styles['message_item_info_top']}>
                          </div> */}
                      {item.msgType !== 501 && (
                        <div className={styles["info_top_model_name"]} title={item.msg}>
                          {item.msg}
                        </div>
                      )}
                      {item.msgType === 501 && (
                        <div title={item.msg} className={styles["import_name"]}>
                          {item.msg}
                        </div>
                      )}

                      {/* <span>
                        {{
                          302: "生成",
                          301: "模型训练",
                          303: "解析",
                          304: "预训练模型添加",
                          305: "部署",
                          306: "模型训练", //微调
                        }[item.msgType] || ""}
                      </span>
                      {item.msgType !== 501 && <span>{item.type === 1 ? "失败" : "成功"}</span>} */}
                      {messageConditions(item)}
                      {item.msgType === 302 && item.typeName && (
                        <div className={styles["info_top_model_type"]}>{item.typeName}</div>
                      )}
                    </div>
                    {(() => {
                      switch (item.msgType) {
                        case 302:
                          return item.type === 0 ? (
                            <div
                              className={styles["message_center_list_item_right"]}
                              onClick={(e) => downloadHandle(e, item, "list")}
                            >
                              下载
                            </div>
                          ) : null;

                        case 501:
                          return item.type === 1 ? (
                            <div
                              className={styles["message_center_list_item_right"]}
                              onClick={(e) => downloadHandle(e, item, "list")}
                            >
                              下载失败数据
                            </div>
                          ) : null;

                        default:
                          return (
                            <div
                              className={styles["message_center_list_item_right"]}
                              onClick={(e) => {
                                e.stopPropagation();
                                onJumptoMyModel(item.msgType, item.type);
                              }}
                            >
                              查看
                            </div>
                          );
                      }
                    })()}
                  </div>
                  {item.reason && (
                    <div className={styles["info_top_model_reason"]}>{item.reason}</div>
                  )}
                  <div className={styles["info_top_model_time"]}>{item.createTime}</div>
                </div>
              </div>
            ))}
          {messageList.length === 0 && (
            <div className={styles["message_center_list_nodata"]}>
              <img
                className={styles["message_nodata_icon"]}
                src='/menu/no_content.png'
                onClick={hideModal}
                alt=''
              />
              <div className={styles["message_nodata_text"]}>暂无内容</div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
});

export default MessageCenterModal;
