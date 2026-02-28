import { useState, useRef } from "react";
import { Input, Tag, Modal, message, Space } from "antd";
import styles from "../manage.module.css";
import {
  addApplicationTag,
  deleteApplicationTag,
  deleteCheckApplicationTag,
  updateApplicationTag,
} from "@/api/application";
import DeleteModal from "../components/DeleteModal";

export default function TagModal({
  visible,
  tagList,
  onClose,
  setTagList,
  fetApplicationTagList,
  fetchApplications,
  canCreate,
}) {
  //管理标签弹窗
  const [inputValue, setInputValue] = useState("");
  // 关闭管理标签modal
  const handleClose = () => {
    setInputValue("");
    onClose();
  };
  //添加标签
  const addTagHandle = (e) => {
    if (e.target.value.trim() === "") {
      setInputValue("");
      return;
    }
    addApplicationTag({ name: e.target.value }).then((res) => {
      setInputValue(""); // 请求成功后清空输入框
      fetApplicationTagList();
    });
  };

  // 修改标签
  const editTagHandle = (tag) => {
    setTagList(
      tagList.map((t) => (t.id === tag.id ? { ...t, isEditing: true } : t))
    );
  };

  const saveTagName = (tag, newName) => {
    if (newName === tag.name || newName.trim() === "") {
      setTagList(
        tagList.map((t) => (t.id === tag.id ? { ...t, isEditing: false } : t))
      );
      return;
    }

    updateApplicationTag({ ...tag, name: newName })
      .then((res) => {
        message.success("修改成功");
        fetApplicationTagList();
        fetchApplications();
      })
      .catch((err) => {
        fetApplicationTagList();
        fetchApplications();
      });
  };

  //删除标签
  const [deleteModalShow, setDeleteModalShow] = useState(false);
  const [deleteTag, setDeleteTag] = useState(null);

  // 外部定义一个锁对象（组件外部或 useRef）
  const deletingTagIds = new Set();
  const deleteTagHandle = async (tag) => {
    const tagId = tag.id;

    if (deletingTagIds.has(tagId)) {
      console.warn(`Tag ${tagId} 正在删除中，忽略重复点击`);
      return;
    }

    deletingTagIds.add(tagId); // 上锁
    const unlock = () => deletingTagIds.delete(tagId); // 解锁函数
    setDeleteUnlock(() => unlock); // 把 unlock 暴露出去，在弹窗关闭时调用

    try {
      const checkRes = await deleteCheckApplicationTag(tagId);

      const doDelete = async () => {
        await deleteApplicationTag(tagId);
        fetApplicationTagList();
        fetchApplications();
      };

      if (!checkRes.data) {
        setDeleteTag(tag);
        setDeleteModalShow(true); // 触发自定义弹窗
      } else {
        await doDelete();
        unlock(); // 直接解锁
      }
    } catch (err) {
      console.error("删除失败", err);
      unlock(); // 错误也要解锁
    }
  };

  // 解锁函数 state（用于在弹窗中取消/确认时调用）
  const [deleteUnlock, setDeleteUnlock] = useState(() => () => {});

  const confirmDeleteHandle = async () => {
    try {
      await deleteApplicationTag(deleteTag.id);
      fetApplicationTagList();
      fetchApplications();
    } finally {
      setDeleteModalShow(false);
      deleteUnlock(); // 解锁
    }
  };

  const cancelDeleteHandle = () => {
    setDeleteModalShow(false);
    deleteUnlock(); // 解锁
  };

  return (
    <Modal
      open={visible}
      onCancel={handleClose}
      className="app-custom-modal"
      width={640}
      centered={true}
      height={440}
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
      zIndex={1050}
    >
      <Space size={[8, 12]} wrap>
        <Input
          placeholder="输入并按回车添加标签"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onPressEnter={addTagHandle}
          onBlur={addTagHandle}
          maxLength={50}
          disabled={!canCreate}
          style={{ width: 320, height: 34, borderRadius: 8 }}
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
                style={{ padding: 0 }}
                variant="borderless"
              />
            ) : (
              <div className={styles["tag-item"]}>
                <div>
                  <span>{tag.name}</span>{" "}
                  <span style={{ color: "#666E82", marginLeft: 6 }}>
                    {tag.tagUsedNumber}
                  </span>
                </div>
                {canCreate && (
                <div style={{ display: "flex" }}>
                  <img
                    src="/application/edit_icon.svg"
                    className={styles["edit-icon"]}
                    onClick={() => editTagHandle(tag)}
                  ></img>
                  <div
                    className={styles["delete-icon"]}
                    onClick={() => deleteTagHandle(tag)}
                  ></div>
                </div>
                )}
              </div>
            )}
          </div>
        ))}
      </Space>
      <DeleteModal
        visible={deleteModalShow}
        onCancel={cancelDeleteHandle}
        onOk={confirmDeleteHandle}
        title={`删除标签「${deleteTag?.name}」`}
        content="标签正在使用中，是否删除？"
      />
    </Modal>
  );
}
