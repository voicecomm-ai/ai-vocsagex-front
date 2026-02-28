
import React, {
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import {
  Tag,
  Modal,
  Input,
  Button,
  Typography,
  Popover,
  Checkbox,
  message,
} from "antd";
import styles from "../index.module.css";
import tagStyle from "./tag.module.css";
import { SearchOutlined } from "@ant-design/icons";
import { addApplicationTag, updateApplicationAppTag } from "@/api/application";
const { Text } = Typography;

/**
 * 标签组件
 * 用于展示和管理项目的标签信息
 * @param {Object} props - 组件属性
 * @param {Object} props.item - 当前项目数据
 * @param {Object} props.hoveredItem - 鼠标悬停的项目
 * @param {Object} ref - 父组件引用，用于调用组件内部方法
 */
const TagComponent = forwardRef((props, ref) => {
  const { item, hoveredItem, canCreate } = props;
  const [categorySearchText, setCategorySearchText] = useState("");
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false);
  // 声明标签编辑模态框的可见状态
  const [visible, setVisible] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]); // 已选择标签
  const [isInput, setIsInput] = useState(false);
  // 向父组件暴露方法
  useImperativeHandle(ref, () => ({
    showModal,
    hideModal,
  }));

  // 显示标签编辑模态框
  const showModal = () => {
    setVisible(true);
  };

  // 隐藏标签编辑模态框
  const hideModal = () => {
    setVisible(false);
  };
  useEffect(() => {
    let tagList = item.tagList || [];
    setSelectedTags(tagList.map((tag) => tag.id));
  }, [item]);
  /**
   * 渲染标签文本
   * @param {Object} obj - 包含标签列表的对象
   * @returns {string} 标签文本，多个标签用逗号分隔
   */
  const renderTagText = (obj) => {
    // 获取标签列表，默认为空数组
    let tagList = obj.tagList || [];
    let tagTextArr = [];

    // 提取标签名称
    tagList.forEach((element) => {
      tagTextArr.push(element.name);
    });

    // 生成标签文本，无标签时显示"添加标签"
    let renderText = tagTextArr.length > 0 ? tagTextArr.join("，") : "添加标签";
    return renderText;
  };
  const handleCategorySearch = (e) => {
    setIsInput(true);
    setCategorySearchText(e.target.value);
  };
  // 显示所有标签事件
  const handleShowAllEvent = () => {
    props?.showTagModal();
  };
  // 根据搜索文本过滤分类列表
  const filteredCategories = props.tagList.filter((category) =>
    category.name.toLowerCase().includes(categorySearchText.toLowerCase()),
  );
  //创建标签
  const handleCreateCategory = () => {
    if (!canCreate) {
      return;
    }
    let text = categorySearchText.trim();
    if (text === "") {
      message.warning("标签名称不能为空");
      return;
    }
    let addData = {
      name: text, //标签名称
    };
    addTagEvent(addData);
  };
  const addTagEvent = (tag) => {
    addApplicationTag({ name: tag.name })
      .then((res) => {
        props?.getTagListEvent();
        message.success("添加成功");
        setCategorySearchText("");
      })
      .catch((err) => {
        console.log(err);
      });
  };
  const handleCategoryChange = (categoryId, checked) => {
    let newSelectedTags;
    if (checked) {
      // 添加到已选择分类列表
      newSelectedTags = [...selectedTags, categoryId];
    } else {
      // 从已选择分类列表中移除
      newSelectedTags = selectedTags.filter((id) => id !== categoryId);
    }
    setSelectedTags(newSelectedTags);
  };

  //更新应用标签
  const updateAppTagEvent = () => {
   updateApplicationAppTag({
        id: item.id,
        tagIdList: selectedTags,
      }).then(() => {
        props?.updateAppList();
        setCategorySearchText("");
        props?.getTagListEvent();
      });
    
  };
  //渲染下拉框详情
  const handleMouseEnter = (status) => {
    props.setIsEditingTag(status);
  };
  const handleMouseLeave = (status) => {
    if (!isInput) {
      props.handleTagMouseLeave(status);
      updateAppTagEvent();
    }
  };
  const renderPopoverContent = () => {
    return (
      <div
        className={tagStyle.category_popover}
        onMouseLeave={() => handleMouseLeave(false)}
        onMouseEnter={() => handleMouseEnter(true)}
      >
        {/* 分类搜索区域 */}
        <div className={tagStyle.category_search}>
          <Input
            placeholder={canCreate ? "搜索或创建标签" : "搜索标签"}
            value={categorySearchText}
            onChange={handleCategorySearch}
            suffix={<SearchOutlined />}
            maxLength={10}
            onBlur={() => setIsInput(false)}
            onClick={(e) => e.stopPropagation()}
            className={tagStyle.category_search_input}
          />
          {/* 标签管理按钮 */}
          <div
            className={tagStyle.category_search_btn}
            onClick={handleShowAllEvent}
          >
            <img src="/application/app_store.png" alt="标签管理" />
          </div>
        </div>
        {/* 分类列表 */}
        <div className={tagStyle.category_list}>
          {filteredCategories.map((category) => (
            <div
              key={category.id}
              className={tagStyle.category_item}
              onClick={() => {}}
            >
              <Checkbox
                style={{ width: "100%" }}
                checked={selectedTags.includes(category.id)}
                onChange={(e) =>
                  handleCategoryChange(category.id, e.target.checked)
                }
                onClick={(e) => e.stopPropagation()}
                className={tagStyle.category_checkbox}
              >
                <span
                  className={
                    selectedTags.includes(category.id)
                      ? tagStyle.category_name_selected
                      : tagStyle.category_name
                  }
                >
                  {category.name}
                </span>
              </Checkbox>
            </div>
          ))}

          {/* 当没有搜索结果且存在搜索文本时显示创建选项 */}
          {filteredCategories.length === 0 &&
            categorySearchText &&
            canCreate && (
              <div
                className={tagStyle.category_item_add}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCreateCategory();
                }}
              >
                {`创建"${categorySearchText}"`}
              </div>
            )}
        </div>
      </div>
    );
  };

 const  popoverOpenChange = (open) => {
   if(!open){
    setCategorySearchText("");
   }
    setCategoryPopoverOpen(open);
  }
  return (
    <Popover
      content={renderPopoverContent()}
      getPopupContainer={(triggerNode) => triggerNode.parentNode}
      open={categoryPopoverOpen}
      onOpenChange={popoverOpenChange}
      trigger="click"
      placement="bottomLeft"
    >
      <div
        className={`${styles.integrated_tag} ${
          // 鼠标悬停时添加 hover 样式
          hoveredItem && item.id == hoveredItem.id
            ? styles.integrated_tag_hover
            : ""
        }`}
      >
        {/* 标签图标 */}
        <img src="/application/tag_icon.svg" style={{ marginRight: 3 }} />

        {/* 标签文本容器 */}
        <div className={styles.integrated_tag_text}>
          <Text
            style={{ maxWidth: "100%", color: "#8D96A7" }}
            // 标签文本过长时显示 tooltip
            ellipsis={{ tooltip: renderTagText(item) }}
          >
            <span className={styles.integrated_tag_text_span}>
              {renderTagText(item)}{" "}
            </span>
          </Text>
        </div>
      </div>
    </Popover>
  );
});

export default TagComponent;
