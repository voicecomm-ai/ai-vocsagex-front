"use client";
import { useEffect, useRef, useState } from "react";

import { Input, Modal, Space } from "antd";
import { modelCategoryInfo, modelTagSave, modelTagUpdate, modelTagDelete } from "@/api/model";
import styles from "./index.module.css";
import DeleteModal from "./DeleteModal";

export default function TagModal({
  visible,
  onClose,
  currentId,
  onRefreshCategory,
  onRefreshModalList,
  readOnly,
}) {
  useEffect(() => {
    if (visible && currentId) {
      getModelCategoryInfo();
    }
  }, [visible, currentId]);

  const [inputValue, setInputValue] = useState(""); //管理标签input

  const [tagList, setTagList] = useState([{ label: 1, id: 1 }]); //标签列表
  const [isClosing, setIsClosing] = useState(false); //modal是否关闭
  const modalRef = useRef(null);
  //处理关闭modal触发input失焦
  const handleClose = () => {
    setIsClosing(true);
    setInputValue("");
    onClose(); // 原本的关闭逻辑
  };
  useEffect(() => {
    if (!visible) {
      setIsClosing(false); // 关闭后重置状态
    }
  }, [visible]);
  //根据id获取分类信息
  const getModelCategoryInfo = async () => {
    const res = await modelCategoryInfo(currentId);

    setTagList(res.data.modelTagList);
  };
  //编辑标签
  const saveTagName = async (tag, newName) => {
    if (newName === tag.name || newName.trim() === "") {
      setTagList(tagList.map((t) => (t.id === tag.id ? { ...t, isEditing: false } : t)));
      return;
    }
    try {
      await modelTagUpdate({
        id: tag.id,
        name: newName,
        categoryId: currentId,
      });
      getModelCategoryInfo();
      onRefreshCategory();
      onRefreshModalList();
    } catch (err) {
      getModelCategoryInfo();
      onRefreshCategory();
      onRefreshModalList();
    }
  };
  //新增标签
  const addTagHandle = async (e) => {
    if (isClosing) {
      setInputValue("");
      return;
    }

    if (e.target.value.trim() === "") {
      setInputValue("");
      return;
    }

    await modelTagSave({ categoryId: currentId, name: e.target.value });
    setInputValue("");
    getModelCategoryInfo();
    onRefreshCategory();
  };

  //删除标签
  const deleteTagCheck = (tag) => {
    const config = {
      title: `删除标签「${tag.name}」`,
      content: "删除后将不可恢复！标签下的模型，将不再显示对应的标签！（模型广场同理）",
      action: async (keys) => {
        await modelTagDelete(keys);
      },
      keys: tag.id,
      onSuccess: () => {
        getModelCategoryInfo();
        onRefreshCategory();
        onRefreshModalList();
      },
    };
    modalRef.current?.open(config);
  };

  // 修改标签
  const editTagHandle = (tag) => {
    setTagList(tagList.map((t) => (t.id === tag.id ? { ...t, isEditing: true } : t)));
  };
  return (
    <Modal
      open={visible}
      onCancel={handleClose}
      width={640}
      centered={true}
      title={<div style={{ fontSize: 24, marginBottom: 20 }}>管理标签</div>}
      footer={null}
      styles={{
        content: {
          backgroundImage: 'url("/application/app_modal_back.png")',
          borderRadius: 24,
          padding: "24px 24px 32px",
          backgroundColor: "#fff",
          backgroundPosition: "top center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "100% auto",
        },
        header: {
          background: "transparent",
        },
      }}
    >
      <Space size={[8, 12]} wrap>
        <Input
          placeholder='输入并按回车添加标签'
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onPressEnter={addTagHandle}
          onBlur={addTagHandle}
          maxLength={50}
          style={{ width: 320, height: 34, borderRadius: 8 }}
          disabled={!readOnly}
        />
        {tagList.map((tag) => (
          <div key={tag.id} className={styles["manage-tag-item"]}>
            {tag.isEditing ? (
              <Input
                autoFocus
                defaultValue={tag.name}
                onBlur={(e) => saveTagName(tag, e.target.value)}
                onPressEnter={(e) => saveTagName(tag, e.target.value)}
                maxLength={50}
                variant='borderless'
                style={{ padding: 0 }}
              />
            ) : (
              <div className={styles["tag-item"]}>
                <div>
                  <span>{tag.name}</span>
                  <span style={{ color: "#666E82", marginLeft: 6 }}>{tag.modelRelationNum}</span>
                </div>
                {readOnly && (
                  <div style={{ display: "flex" }}>
                    <img
                      src='/application/edit_icon.svg'
                      className={styles["tag-edit-icon"]}
                      onClick={() => editTagHandle(tag)}
                    ></img>
                    <div
                      className={styles["delete-icon"]}
                      onClick={() => deleteTagCheck(tag)}
                    ></div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </Space>
      <DeleteModal ref={modalRef} />
    </Modal>
  );
}
