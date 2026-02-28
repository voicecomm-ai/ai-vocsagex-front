// 导入 Ant Design 组件
import {
  Modal,
  Input,
  Button,
  Popover,
  Avatar,
  Form,
  Spin,
  Checkbox,
  Typography,
  Tooltip,
  Switch,
  message,
} from "antd";
// 导入 React hooks
import { forwardRef, useImperativeHandle, useState, useRef } from "react";
// 导入 Next.js 路由
import { useRouter, useParams } from "next/navigation";
// 导入样式文件
import styles from "./publish.module.css";
// 导入图标
import { SearchOutlined } from "@ant-design/icons";
import { getExperienceTag, addExperienceTag } from "@/api/find";
import TagModel from "./TagModel"; //标签管理弹窗
import { agentUp, workflowUp } from "@/api/application";
import { getFindAgentDetail, getFindWorkflowDetail } from "@/api/find";
/**
 * 应用发布模态框组件
 * 用于将应用上架到"发现"页面，支持分类选择和工作流追踪设置
 */
const ReleaseModel = forwardRef((props, ref) => {
  const { Text } = Typography;
  const router = useRouter();
  const tagModelRef = useRef(null); //标签管理弹窗ref
  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    showModal,
  }));
  const params = useParams();
  const { id } = params;
  // 基础状态管理
  const [open, setOpen] = useState(false); // 控制模态框显示/隐藏
  const [loading, setLoading] = useState(false); // 加载状态
  const [type, setType] = useState(""); // 应用类型（agent/workflow等）
  const [form] = Form.useForm(); // 表单实例
  const [workflowTracking, setWorkflowTracking] = useState(false); // 工作流追踪开关
  const [appId, setAppId] = useState(""); // 应用id
  // 分类选择相关状态
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false); // 分类弹窗显示状态
  const [selectedCategories, setSelectedCategories] = useState([]); // 已选择的分类ID数组
  const [categorySearchText, setCategorySearchText] = useState(""); // 分类搜索文本
  const [experienceTagList, setExperienceTagList] = useState([]); // 标签列表
  /**
   * 处理分类选择变化
   * @param {number} categoryId - 分类ID
   * @param {boolean} checked - 是否选中
   */
  const handleCategoryChange = (categoryId, checked) => {
    if (checked) {
      // 添加到已选择分类列表
      setSelectedCategories([...selectedCategories, categoryId]);
    } else {
      // 从已选择分类列表中移除
      setSelectedCategories(
        selectedCategories.filter((id) => id !== categoryId)
      );
    }
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
    category.name.toLowerCase().includes(categorySearchText.toLowerCase())
  );

  /**
   * 获取已选择分类的名称列表
   * @returns {string[]} 分类名称数组
   */
  const getSelectedCategoryNames = () => {
    let names = selectedCategories
      .map((id) => experienceTagList.find((cat) => cat.id === id)?.name)
      .filter(Boolean);
    return names.join("，");
  };

  /**
   * 取消操作，关闭模态框并重置状态
   */
  const handleCancel = () => {
    setOpen(false); // 关闭模态框
    setCategoryPopoverOpen(false); // 关闭分类弹窗
    setSelectedCategories([]); // 清空已选择分类
    setCategorySearchText(""); // 清空搜索文本
  };

  /**
   * 显示模态框
   * @param {string} type - 应用类型
   */
  const showModal = (obj, type) => {
    let appId = obj.id || id ; //应用id
    setType(type);
    setOpen(true);
    setAppId(appId);
    getExperienceTagListEvent(appId);
    resetFormData(); // 重置表单数据
    if (type == "agent") {
      getFindAgentDetailEvent(appId);
    }
    if (type == "workflow") {
      getFindWorkflowDetailEvent(appId);
    }
  };

  //重置表单数据
  const resetFormData = () => {
    setSelectedCategories([]); // 清空已选择分类
    setCategorySearchText(""); // 清空搜索文本
    setWorkflowTracking(false); // 工作流追踪开关
  };

  //获取智能体发布详情
  const getFindAgentDetailEvent = (id) => {
    getFindAgentDetail(id).then((res) => {
      let data = res.data;
      let tagList = data?.tagList || [];
      handleSelectedCategories(tagList);
    });
  };

  //获取工作流发布详情
  const getFindWorkflowDetailEvent = (id) => {
    getFindWorkflowDetail(id).then((res) => {
      let data = res.data;
      let tagList = data?.tags || [];
      let enableWorkflowTrace =data? data?.enableWorkflowTrace:true;
      handleSelectedCategories(tagList);
      setWorkflowTracking(enableWorkflowTrace);
    });
  };
  //处理选中标签回显
  const handleSelectedCategories = (tagList) => {
    let arr = [];
    tagList.forEach((item) => {
      arr.push(item.id);
    });
    console.log(arr, "arr");
    setSelectedCategories(arr);
  };
  //获取标签列表
  const getExperienceTagListEvent = () => {
    let data ={
      all:true
    }
    getExperienceTag(data).then((res) => {
      setExperienceTagList(res.data);
    });
  };

  /**
   * 提交创建信息
   * @param {Object} values - 表单值
   */
  const handleReleaseEvent = () => {
    if (type == "agent") {
      agentReleaseEvent();
    } else if (type == "workflow") {
      workflowReleaseEvent();
    }
  };

  //智能体上架事件
  const agentReleaseEvent = () => {
    let tagIds =[];
    selectedCategories.forEach(id => {
      const tag = experienceTagList.find(item => item.id === id);
      if (tag) {
        tagIds.push(tag.id);
      }
    });
    let data = {
      appId: appId, //应用id
      tagIdList: tagIds, //分类id列表
    };
    agentUp(data).then((res) => {
      message.success("上架成功");
      handleCancel();
      props.releaseSuccessCallback();
    });
  };
  //工作流上架事件
  const workflowReleaseEvent = () => {
    let tagIds =[];
    selectedCategories.forEach(id => {
      const tag = experienceTagList.find(item => item.id === id);
      if (tag) {
        tagIds.push(tag.id);
      }
    });
    let data = {
      appId: appId, //应用id
      tagIdList: tagIds, //分类id列表
      enableWorkflowTrace: workflowTracking, //工作流追踪
    };
    workflowUp(data).then((res) => {
      message.success("上架成功");
      handleCancel();
      props.releaseSuccessCallback();
    });
  };

  // 模态框样式配置
  const classNames = {
    content: styles.small_create_modal,
    header: styles.release_modal_header,
    body: styles.release_modal_body,
    footer: styles.release_modal_footer,
  };

  //创建标签
  const handleCreateCategory = () => {
    let text = categorySearchText.trim();
    if (text === "") {
      message.warning("标签名称不能为空");  
      return;
    }
    let addData = {
      name: text, //标签名称
    };
    addExperienceTag(addData).then((res) => {
      message.success("新建标签成功");
      setCategorySearchText("");
      getExperienceTagListEvent();
    });
  };
  //标签管理
  const handleShowAllEvent = () => {
    setCategoryPopoverOpen(false);
    tagModelRef.current.showModal();
  };

  return (
    <div>
      <Modal
        open={open}
        centered
        footer={null}
        closeIcon={false}
        width="500px"
        classNames={classNames}
        styles={{
          content: {},
          header: {
            background: "transparent",
          },
        }}
        onCancel={handleCancel}
        zIndex={1999}
      >
        <div className={styles.release_modal_content}>
          {/* 模态框标题 */}
          <div className={styles.release_modal_title}>
            上架到&ldquo;发现&rdquo;页
          </div>
          <div className={styles.release_modal_desc}>
            <img className={styles.release_modal_desc_img} src="/application/release_tip.png" alt="" />
            <div className={styles.release_modal_desc_text}>请注意：如果此应用被其他应用引用，将同步更新内容</div>
          </div>
          {/* 分类选择区域 */}
          <div className={styles.category_section}>
            <div className={styles.category_label}>分类</div>
            <Popover
              content={
                <div className={styles.category_popover}>
                  {/* 分类搜索区域 */}
                  <div className={styles.category_search}>
                    <Input
                      placeholder="搜索或创建分类"
                      value={categorySearchText}
                      onChange={handleCategorySearch}
                      suffix={<SearchOutlined />}
                      maxLength={10}
                      className={styles.category_search_input}
                    />
                    {/* 创建分类按钮 */}
                    <div
                      className={styles.category_search_btn}
                      onClick={handleShowAllEvent}
                    >
                      <img src="/application/app_store.png" alt="创建分类" />
                    </div>
                  </div>
                  {/* 分类列表 */}
                  <div className={styles.category_list}>
                    {filteredCategories.map((category) => (
                      <div key={category.id} className={styles.category_item}>
                        <Checkbox
                          checked={selectedCategories.includes(category.id)}
                          onChange={(e) =>
                            handleCategoryChange(category.id, e.target.checked)
                          }
                          className={styles.category_checkbox}
                        />
                        <span className={selectedCategories.includes(category.id)?styles.category_name_selected:styles.category_name}>
                          {category.name}
                        </span>
                      </div>
                    ))}

                    {/* selectedCategories.length 为0 存在搜索文本时显示搜索文本   */}
                    {filteredCategories.length === 0 && categorySearchText && (
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
                {selectedCategories.length > 0 ? (
                  <div className={styles.selected_categories}>
                     <Text style={{ maxWidth: 400 }} ellipsis={{ tooltip:  getSelectedCategoryNames() }}>
                <span className={styles.selected_categories_span}> { getSelectedCategoryNames()}</span> 
           </Text>
                   
                  </div>
                ) : (
                  <span className={styles.category_placeholder}>
                    请选择分类
                  </span>
                )}
              </div>
            </Popover>
          </div>
          {/* 工作流追踪设置区域 */}
          {type == "workflow" && (
            <div className={styles.workflow_tracking_section}>
              <img
                className={styles.workflow_tracking_icon}
                src="/application/workflow_tracking.png"
                alt="工作流追踪"
              />
              <div className={styles.workflow_tracking_title}>工作流追踪</div>
              {/* 工作流追踪说明提示 */}
              <Tooltip title="工作流追踪开启关闭将影响发现页模板试用时，是否显示工作流追踪整个运行流程">
                <img
                  className={styles.workflow_tracking_icon}
                  src="/application/info_publish.png"
                  alt="工作流追踪"
                />
              </Tooltip>
              {/* 工作流追踪开关 */}
              <Switch
                checked={workflowTracking}
                onChange={(checked) => setWorkflowTracking(checked)}
              />
            </div>
          )}

          {/* 模态框底部按钮区域 */}
          <div className={styles.release_modal_footer}>
            <Button
              className={styles.release_modal_footer_btn}
              onClick={handleCancel}
            >
              取消
            </Button>
            <Button
              className={styles.release_modal_footer_btn}
              type="primary"
              onClick={handleReleaseEvent}
            >
              确定
            </Button>
          </div>
        </div>
      </Modal>
      {/* 标签管理弹窗 */}
      <TagModel ref={tagModelRef} refreshTagList={getExperienceTagListEvent} />
    </div>
  );
});

export default ReleaseModel;
