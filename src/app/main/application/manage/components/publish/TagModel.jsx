import { useState, useRef, useImperativeHandle, forwardRef } from "react";
import { Input, Modal, message, Space } from "antd";
import styles from "../../manage.module.css";
import {
  addExperienceTag,
  updateExperienceTag,
  deleteExperienceTag,
  getExperienceTag 
} from "@/api/find";
import DeleteModal from "../DeleteModal";

/**
 * 分类管理模态框组件
 * 提供分类的增删改查功能，支持分类编辑和删除确认
 */
const TagModel = forwardRef((props, ref) => {
  // 基础状态管理
  const [visible, setVisible] = useState(false); // 控制模态框显示/隐藏
  const [tagList, setTagList] = useState([]); // 分类列表数据
  const [inputValue, setInputValue] = useState(""); // 输入框的值状态
  
  // 删除确认弹窗相关状态
  const [deleteModalShow, setDeleteModalShow] = useState(false); // 删除确认弹窗显示状态
  const [deleteTag, setDeleteTag] = useState(null); // 待删除的分类对象
  const [deleteUnlock, setDeleteUnlock] = useState(() => () => {}); // 解锁函数状态（用于在弹窗中取消/确认时调用）

  // 防重复删除的锁对象（使用Set存储正在删除的分类ID）
  const deletingTagIds = useRef(new Set());

  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    showModal,
    hideModal,
  }));

  /**
   * 显示分类管理模态框
   * 获取分类列表数据
   */
  const showModal = () => {
    setVisible(true);
    getExperienceTagListEvent();
  };

  /**
   * 隐藏分类管理模态框
   */
  const hideModal = () => {
    setVisible(false);
  };

  /**
   * 获取体验分类列表
   */
  const getExperienceTagListEvent = () => {
    let data ={all:true}
    getExperienceTag(data)
      .then((res) => {
        setTagList(res.data || []);
      })
      .catch((error) => {
        console.error("获取分类列表失败:", error);
        message.error("获取分类列表失败");
      });
  };

  /**
   * 关闭分类管理弹窗
   * 清空输入框并重置状态
   */
  const handleClose = () => {
    setInputValue("");
    props.refreshTagList();
    setVisible(false);
  };

  /**
   * 添加新分类
   * @param {Event} e - 输入框事件对象
   */
  const addTagHandle = (e) => {
    const tagName = e.target.value.trim();
    // 如果输入为空，清空输入框并返回
    if (tagName === "") {
      setInputValue("");
      return;
    }
    // 检查分类名称长度
    if (tagName.length > 10) {
      message.warning("分类名称不能超过10个字符");
      return;
    }

    // 调用API添加分类
    addExperienceTag({ name: tagName })
      .then((res) => {
        message.success("分类添加成功");
        setInputValue(""); // 请求成功后清空输入框
        getExperienceTagListEvent(); // 刷新分类列表
      })
  };

  /**
   * 进入分类编辑模式
   * @param {Object} tag - 要编辑的分类对象
   */
  const editTagHandle = (tag) => {
    setTagList(
      tagList.map((t) => (t.id === tag.id ? { ...t, isEditing: true } : t))
    );
  };

  /**
   * 保存分类名称修改
   * @param {Object} tag - 要修改的分类对象
   * @param {string} newName - 新的分类名称
   */
  const saveTagName = (tag, newName) => {
    const trimmedName = newName.trim();
    
    // 如果名称没有变化或新名称为空，退出编辑模式
    if (trimmedName === tag.name || trimmedName === "") {
      setTagList(
        tagList.map((t) => (t.id === tag.id ? { ...t, isEditing: false } : t))
      );
      return;
    }
    // 检查分类名称长度
    if (trimmedName.length > 10) {
      message.warning("分类名称不能超过10个字符");
      return;
    }

    // 调用API更新分类名称
    updateExperienceTag({ ...tag, name: trimmedName })
      .then((res) => {
        message.success("分类修改成功");
        getExperienceTagListEvent(); // 刷新分类列表
      })
      .catch((error) => {
        getExperienceTagListEvent();
      });
  };

  /**
   * 删除分类处理函数
   * 包含防重复点击机制和删除前检查
   * @param {Object} tag - 要删除的分类对象
   */
  const deleteTagHandle = async (tag) => {
    const tagId = tag.id;

    // 检查是否正在删除中，防止重复点击
    if (deletingTagIds.current.has(tagId)) {
      console.warn(`Tag ${tagId} 正在删除中，忽略重复点击`);
      return;
    }

    // 添加删除锁
    deletingTagIds.current.add(tagId);
    const unlock = () => deletingTagIds.current.delete(tagId); // 解锁函数
    setDeleteUnlock(() => unlock); // 将解锁函数暴露给弹窗组件

    try {
      // 直接显示确认弹窗，让用户确认是否删除
      setDeleteTag(tag);
      setDeleteModalShow(true);
    } catch (err) {
      console.error("删除失败", err);
      unlock(); // 出错时也要解锁
    }
  };

  /**
   * 确认删除分类
   * 在确认弹窗中点击确定时调用
   */
  const confirmDeleteHandle = async () => {
    if (!deleteTag) return;
    
    try {
      await deleteExperienceTag(deleteTag.id);
      message.success("分类删除成功");
      getExperienceTagListEvent(); // 刷新分类列表
    } catch (error) {
      console.error("删除分类失败:", error);
      message.error("删除分类失败");
    } finally {
      setDeleteModalShow(false);
      setDeleteTag(null);
      deleteUnlock(); // 解锁
    }
  };

  /**
   * 取消删除分类
   * 在确认弹窗中点击取消时调用
   */
  const cancelDeleteHandle = () => {
    setDeleteModalShow(false);
    setDeleteTag(null);
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
      zIndex={2000}
      title={<div style={{ fontSize: 24, marginBottom: 20 }}>管理分类</div>}
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
      {/* 分类输入和展示区域 */}
      <Space size={[8, 12]} wrap>
        {/* 添加分类输入框 */}
        <Input
          placeholder="输入并按回车添加分类"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onPressEnter={addTagHandle}
          onBlur={addTagHandle}
          maxLength={10}
          style={{ width: 320, height: 34, borderRadius: 8 }}
        />
        
        {/* 分类列表渲染 */}
        {tagList.map((tag) => (
          <div key={tag.id} className={styles["manage-tag-item"]}>
            {tag.isEditing ? (
              // 编辑模式：显示输入框
              <Input
                autoFocus
                defaultValue={tag.name}
                onBlur={(e) => saveTagName(tag, e.target.value)}
                onPressEnter={(e) => saveTagName(tag, e.target.value)}
                maxLength={10}
                style={{ padding: 0 }}
                variant="borderless"
              />
            ) : (
              // 显示模式：显示分类名称、使用次数和操作按钮
              <div className={styles["tag-item"]}>
                {/* 分类信息区域 */}
                <div>
                  <span>{tag.name}</span>{" "}
                  <span style={{ color: "#666E82", marginLeft: 6 }}>
                    {tag.tagUsedNumber || 0}
                  </span>
                </div>
                
                {!tag.isBuiltIn && (
                   <div style={{ display: "flex" }}>
            
                   <img
                     src="/application/edit_icon.svg"
                     className={styles["edit-icon"]}
                     onClick={() => editTagHandle(tag)}
                     alt="编辑分类"
                     title="编辑分类"
                   />
            
                   <div
                     className={styles["delete-icon"]}
                     onClick={() => deleteTagHandle(tag)}
                     title="删除分类"
                   />
                 </div> 
                )}
              </div>
            )}
          </div>
        ))}
      </Space>
      
      {/* 删除确认弹窗 */}
      <DeleteModal
        visible={deleteModalShow}
        onCancel={cancelDeleteHandle}
        onOk={confirmDeleteHandle}
        title={`删除分类「${deleteTag?.name || ''}」`}
        content="删除后将不可恢复！发现页将不再显示此分类!"
      />
    </Modal>
  );
});
export default TagModel;
