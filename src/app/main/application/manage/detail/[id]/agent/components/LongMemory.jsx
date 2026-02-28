"use client";

import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
} from "react";
import {
  Button,
  Drawer,
  Form,
  Select,
  Radio,
  Input,
  InputNumber,
  Tooltip,
  Slider,
  ConfigProvider,
  Switch,
  Modal,
  message,
} from "antd";
import { message as antdMessage,Empty } from "antd";
import styles from "./components.module.css";
import {
  EditOutlined,
  CopyOutlined,
  DeleteOutlined,
  HomeOutlined,
  CloseOutlined,
} from "@ant-design/icons";
const { TextArea } = Input;
import {
  getAgentLongMemoryList,
  getAgentLongMemoryDetail,
  updateAgentLongMemory,
  deleteAgentLongMemory,
  clearAgentLongMemory,
} from "@/api/agent";
import { useRouter, useParams } from 'next/navigation';
import DeleteModel from "@/app/components/common/Delete";
const LongMemory = forwardRef((props, ref) => {
  useImperativeHandle(ref, () => ({
    showModal,
    hideModal,
  }));
  const { id } = useParams();
  const [open, setOpen] = useState(false);
  const [memoryList, setMemoryList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState({});
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm] = Form.useForm();
  const formRef = useRef(null);
  const [agentId, setAgentId] = useState(null);
  const deleteModelRef = useRef(null);
    const showModal = (obj) => {  
    setOpen(true);
    if (obj) {
      setAgentId(obj.id);
      getLongMemoryListEvent();
    }
  };

  const hideModal = () => {
    setOpen(false);
    setMemoryList([]);
    setEditingItem(null);
    setEditModalVisible(false);
  };

  //获取长期记忆列表
  const getLongMemoryListEvent = () => {
    setLoading(true);
    let params = {
      applicationId: id,
      userId: 1,
      type: 'draft',//数据类型 草稿draft，已发布published，试用experience
    };
    console.log(params, "params");
    getAgentLongMemoryList(params)
      .then((res) => {
        setMemoryList(res.data || []);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // 清空长期记忆
  const handleClearMemory = () => {
    if(!props.canCreate){
      return;
    }
    if(memoryList.length === 0){//暂无数据
      return;
    }
    let title = "确认清空数据";
    let tip = "数据清空后不可恢复！";
    deleteModelRef.current.showModal(null,
      title,
      tip,
      );
  };
 const deleteCallBack = () => {
  if(!props.canCreate){
    return;
  }
  clearAgentLongMemory({ applicationId: id, userId: 1, type: 'draft' })
  .then((res) => {
    message.success("清空成功");
    getLongMemoryListEvent();
    deleteModelRef.current.hideModal();
  })
 }
  // 编辑记忆条目
  const handleEditMemory = (item) => {
    if(!props.canCreate){
      return;
    }
    setEditingItem(item);
  };

  // 删除记忆条目
  const handleDeleteMemory = (item) => {
    if(!props.canCreate){
      return;
    }
    deleteAgentLongMemory({ id: item.id })
    .then((res) => {
      message.success("删除成功");
      getLongMemoryListEvent();
    })
    .catch((err) => {
      antdMessage.error("删除失败");
      console.error(err);
    });
  };

  // 保存编辑
  const handleSaveEdit = (e) => {
    let value = e.target.value;
    if(!value){
      return message.warning("请输入内容");
    }
    let params = {
      id: editingItem.id,
      content: value,
      applicationId: id,
      agentId: agentId,
      dataType: 'draft',//数据类型 草稿draft，已发布published，试用experience
    };
    updateAgentLongMemory(params).then(res => {
      setEditingItem({});
      getLongMemoryListEvent();
    }).catch(err => {
      console.log(err);
    })
  };

  // 格式化时间
  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const classNames = {
    content: styles["long-memory-drawer-content"],
    header: styles["long-memory-drawer-header"],
    body: styles["long-memory-drawer-body"],
    footer: styles["long-memory-drawer-footer"],
  };

  return (
    <div>
      <Drawer
        closable={false}
        destroyOnHidden
        title={null}
        placement="right"
        open={open}
        rootStyle={{ boxShadow: "none" }}
        style={{ borderRadius: "24px 0px 0px 24px" }}
        width={640}
        onClose={hideModal}
        classNames={classNames}
        footer={null}
      >
        <div className={styles.long_memory_content}>
          {/* 头部区域 */}
          <div className={styles.long_memory_header}>
            <div className={styles.long_memory_title}>长期记忆</div>
            <div className={styles.long_memory_actions}>
              <div
                className={styles.clear_data_btn}
                onClick={handleClearMemory}
              >
              
            <img  className={styles.clear_data_btn_img} src="/agent/memory_clear.png" alt="" />
                <span>清空数据</span>
              </div>
              <div className={styles.close_btn} onClick={hideModal}>
                <CloseOutlined />
              </div>
            </div>
          </div>

          {/* 记忆列表区域 */}
          <div className={styles.long_memory_list}>
            {loading ? (
              <div className={styles.loading}>加载中...</div>
            ) : memoryList.length === 0 ? (
              <div className={styles.empty_state}>
                <Empty description={<span style={{ color: '#666E82', fontWeight: 500 }}>暂无数据</span>} />
              </div>
            ) : (
              memoryList.map((item) => (
                <div className={styles.memory_group} key={item.id}>
                  <div className={styles.memory_date}>{item.date}</div>
                  {item.memoryList.map((memory, index) => (
                    <div
                      key={memory.id || index}
                      className={styles.memory_item}
                    >
                      <div className={styles.memory_time}>
                        {formatTime(memory.createTime)}
                      </div>
                      {editingItem && editingItem.id === memory.id && (
                        <div className={styles.memory_content_wrapper_edit}>
                          <TextArea
                            value={editingItem.content}
                            onChange={(e) =>
                              setEditingItem({
                                ...editingItem,
                                content: e.target.value,
                              })
                           
                            }
                            onBlur={(e) => handleSaveEdit(e)}
                            placeholder="请输入"
                            maxLength={1000}
                            autoSize={{ minRows: 3, maxRows: 5 }}
                          />
                        </div>
                      )}
                      {editingItem?.id !== memory.id && (
                        <div className={styles.memory_content_wrapper}>
                          <div className={styles.memory_content}>
                            {memory.content}
                          </div>
                          <div className={styles.memory_actions}>
                            <img
                              onClick={() => handleEditMemory(memory)}
                              className={styles.memory_actions_img}
                              src="/agent/memory_edit.png"
                              alt=""
                            />

                            <img
                              onClick={() => handleDeleteMemory(memory)}
                              className={styles.memory_actions_img}
                              src="/agent/memory_del.png"
                              alt=""
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>

      </Drawer>
      <DeleteModel zIndex={10000} ref={deleteModelRef} deleteCallBack={deleteCallBack} />
    </div>
  );
});

export default LongMemory;
