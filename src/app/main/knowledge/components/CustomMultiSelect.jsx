import React, { useState, useRef, useEffect } from "react";
import { Input, Checkbox, message } from "antd";
import styles from "./index.module.css";
import { PlusOutlined, SearchOutlined, CloseOutlined } from "@ant-design/icons";
import { addKnowledgeBaseTag } from "@/api/knowledge";

const CustomMultiSelect = ({
  canCreate,
  tagList,
  onOpenTagModal,
  onSelectedChange,
  onRefresh,
  isNarrowScreen,
}) => {
  const modelTagList = tagList || {}; // 标签列表（默认空数组）

  // 选中状态存储标签ID（更稳定，避免name重复）
  const [selectedIds, setSelectedIds] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [open, setOpen] = useState(false);

  const selectRef = useRef(null);

  // 打开标签编辑Modal
  const tagHandle = () => {
    setOpen(false);
    onOpenTagModal?.();
  };

  // 切换下拉框显示/隐藏
  const toggleOpen = () => setOpen(!open);

  // 切换标签选中状态（根据ID）+ 立即触发回调
  const toggleOption = (tagId) => {
    setSelectedIds((prev) => {
      const newSelectedIds = prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId];
      // 关键1：选中状态变化后，立即触发父组件回调
      onSelectedChange?.(newSelectedIds);
      return newSelectedIds;
    });
  };

  // 筛选后的标签列表（支持搜索）
  const filteredTags = modelTagList.filter((tag) =>
    tag.name.toLowerCase().includes(inputValue.toLowerCase()),
  );

  // 已选中的标签对象
  const selectedTags = modelTagList.filter((tag) =>
    selectedIds.includes(tag.id),
  );
  const createNewTag = async () => {
    if (inputValue.trim() === "") {
      return message.warning("标签名不能为空");
    }

    await addKnowledgeBaseTag(inputValue);
    message.success("新建标签成功");
    setInputValue("");
    onRefresh?.();
  };

  //清空选择
  const clearSelectEvent = (e) => {
    e.stopPropagation(); // 阻止事件穿透
    setSelectedIds([]);
    onSelectedChange?.([]);
  };

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (selectRef.current && !selectRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      ref={selectRef}
      className={styles.selectContainer}
      style={{
        width: isNarrowScreen ? 260 : 320,
      }}
    >
      {/* 已选标签展示区域 */}
      <div className={styles.tagDisplay} onClick={toggleOpen}>
        <div className={styles.selectTagContainer}>
          {" "}
          {selectedTags.length > 0 ? (
            <>
              {selectedTags.map((tag, index) => (
                <React.Fragment key={tag.id}>
                  <span className={styles.tagItem}>{tag.name}</span>
                  {index < selectedTags.length - 1 && (
                    <span style={{ margin: "0 4px" }}>,</span>
                  )}
                </React.Fragment>
              ))}

              {/* {selectedTags.slice(0, 3).map((tag, index) => (
                <React.Fragment key={tag.id}>
                  <span className={styles.tagItem}>{tag.name}</span>
                  {index < selectedTags.slice(0, 3).length - 1 && (
                    <span style={{ margin: "0 4px" }}>,</span>
                  )}
                </React.Fragment>
              ))}
              {selectedTags.length > 3 && (
                <span className={styles.tagEllipsis}>...</span>
              )} */}
            </>
          ) : (
            <span className={styles.placeholder}>全部标签</span>
          )}
        </div>

        {selectedIds.length > 0 ? (
          <CloseOutlined
            onClick={clearSelectEvent}
            className={styles.category_input_del}
            style={{
              fontSize: 14,
              color: "#8f97a8",
              cursor: "pointer",
              marginLeft: "24px",
            }}
          />
        ) : (
          <img
            src="/model/arrow.png"
            alt=""
            className={`${styles.arrow} ${open ? styles.rotate : ""}`}
          />
        )}
      </div>

      {/* 下拉弹窗 */}
      {open && (
        <div className={styles.dropdown}>
          <div className={styles.inputContainer}>
            <Input
              placeholder={canCreate ? "搜索或创建标签" : "搜索标签"}
              className={styles.searchInput}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              suffix={
                <img src="/model/search.png" className={styles.searchIcon} />
              }
            />
            <img
              src="/model/tag_edit.png"
              className={styles.addTagbtn}
              onClick={tagHandle}
              alt="编辑标签"
            />
          </div>
          {inputValue.length > 0 && canCreate && (
            <div className={styles["create-tag"]} onClick={createNewTag}>
              <PlusOutlined
                style={{ fontSize: 12, color: "#898F9F", marginRight: 8 }}
              />
              <span
                style={{ wordBreak: "break-all" }}
              >{`创建"${inputValue}"`}</span>
            </div>
          )}
          <div className={styles.optionsList}>
            {filteredTags.length > 0 ? (
              filteredTags.map((tag) => (
                <div
                  key={tag.id}
                  className={styles.optionItem}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleOption(tag.id);
                  }}
                >
                  <Checkbox
                    checked={selectedIds.includes(tag.id)}
                    onChange={(e) => e.stopPropagation()}
                    className={styles.checkbox}
                  />
                  {tag.name}
                </div>
              ))
            ) : (
              <div style={{ padding: "8px", color: "#999" }}>暂无标签</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomMultiSelect;
