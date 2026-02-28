// 导入 Ant Design 组件
import { Input, Popover, Checkbox, Typography, message } from "antd";
// 导入 React hooks
import {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
// 导入样式文件
import styles from "./tagSelect.module.css";
// 导入图标
import { SearchOutlined } from "@ant-design/icons";
import { getExperienceTag, addExperienceTag } from "@/api/find";
import {CloseOutlined} from  '@ant-design/icons'
/**
 * 分类选择器组件
 * 支持分类搜索、选择、创建新分类
 * @param {Array} value - 已选择的分类ID数组
 * @param {Function} onChange - 选择变化回调函数
 * @param {string} placeholder - 占位符文本
 */
const TagSelect = forwardRef((props, ref) => {
  const {
    onSelectChange,
    placeholder = "全部标签",
    tagList,
    addTagEvent,
    canCreate,
  } = props;
  const { Text } = Typography;
  const tagModelRef = useRef(null); //标签管理弹窗ref

  // 分类选择相关状态
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false); // 分类弹窗显示状态
  const [categorySearchText, setCategorySearchText] = useState(""); // 分类搜索文本
  const [experienceTagList, setExperienceTagList] = useState([]); // 标签列表
  const [selectedTags, setSelectedTags] = useState([]); // 已选择标签

  useImperativeHandle(ref, () => ({
    addCallback,
  }));

  //添加标签回调
  const addCallback = () => {
    setCategorySearchText("");
  };
  // 初始化时获取标签列表
  useEffect(() => {
    setExperienceTagList(tagList);
  }, [tagList]);

  /**
   * 处理分类选择变化
   * @param {number} categoryId - 分类ID
   * @param {boolean} checked - 是否选中
   */
  const handleCategoryChange = (categoryId, checked) => {
    let newSelectedTags = [...selectedTags, categoryId];
    setSelectedTags(newSelectedTags);
    if (checked) {
      // 添加到已选择分类列表
    } else {
      // 从已选择分类列表中移除
      newSelectedTags = newSelectedTags.filter((id) => id !== categoryId);
    }
    setSelectedTags(newSelectedTags);
    console.log(newSelectedTags, "newSelectedTags");
    onSelectChange?.(newSelectedTags);
  };

  /**
   * 处理分类搜索输入
   * @param {Event} e - 输入事件
   */
  const handleCategorySearch = (e) => {
    setCategorySearchText(e.target.value);
  };

  // 根据搜索文本过滤分类列表
  const filteredCategories = experienceTagList.filter((category) =>
    category.name.toLowerCase().includes(categorySearchText.toLowerCase()),
  );

  /**
   * 获取已选择分类的名称列表
   * @returns {string} 分类名称字符串
   */
  const getSelectedCategoryNames = () => {
    let names = selectedTags
      .map((id) => experienceTagList.find((cat) => cat.id === id)?.name)
      .filter(Boolean);
    return names.join(",");
  };

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
    addTagEvent?.(addData);
  };

  //标签管理
  const handleShowAllEvent = () => {
    props?.showTagModal();
  };
  //清空选择
  const clearSelectEvent = (e) => {
    e.stopPropagation(); // 阻止事件穿透
    setSelectedTags([]);
    onSelectChange?.([]);
  }

  return (
    <div>
      {/* 分类选择区域 */}
      <div className={styles.category_section}>
        <Popover
          content={
            <div className={styles.category_popover}>
              {/* 分类搜索区域 */}
              <div className={styles.category_search}>
                <Input
                  placeholder={canCreate ? "搜索或创建标签" : "搜索标签"}
                  value={categorySearchText}
                  onChange={handleCategorySearch}
                  suffix={<SearchOutlined />}
                  maxLength={10}
                  className={styles.category_search_input}
                />
                {/* 标签管理按钮 */}
                <div
                  className={styles.category_search_btn}
                  onClick={handleShowAllEvent}
                >
                  <img src="/application/app_store.png" alt="标签管理" />
                </div>
              </div>
              {/* 分类列表 */}
              <div className={styles.category_list}>
                {filteredCategories.map((category) => (
                  <div
                    key={category.id}
                    className={styles.category_item}
                    onClick={() => {}}
                  >
                    <Checkbox
                      style={{ width: "100%" }}
                      checked={selectedTags.includes(category.id)}
                      onChange={(e) =>
                        handleCategoryChange(category.id, e.target.checked)
                      }
                      className={styles.category_checkbox}
                    >
                      <span
                        className={
                          selectedTags.includes(category.id)
                            ? styles.category_name_selected
                            : styles.category_name
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
                      className={styles.category_item_add}
                      onClick={handleCreateCategory}
                    >
                      {`创建"${categorySearchText}"`}
                    </div>
                  )}
              </div>
            </div>
          }
          title={null}
          trigger="click"
          open={categoryPopoverOpen}
          onOpenChange={setCategoryPopoverOpen}
          placement="bottom"
          arrow={false}
          overlayClassName={styles.category_popover_overlay}
        >
          {/* 分类选择输入框 */}
          <div className={styles.category_input}>
            {selectedTags.length > 0 ? (
              <div className={styles.selected_categories}>
               <div className={styles.selected_categories_content}>
                <Text
                  style={{ maxWidth: 275 }}
                  ellipsis={{ tooltip: getSelectedCategoryNames() }}
                >
                  <span className={styles.selected_categories_span}>
                    {getSelectedCategoryNames()}
                  </span>
                </Text>
                </div>
            
                <CloseOutlined  onClick={clearSelectEvent} className={styles.category_input_del} />
            
              </div>
            ) : (
              <span className={styles.category_placeholder}>{placeholder}</span>
            )}
          </div>
        </Popover>
      </div>
    </div>
  );
});

export default TagSelect;
