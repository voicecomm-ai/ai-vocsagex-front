/**
 * 创建模态框组件
 * 用于创建智能体或工作流，支持空白创建和模板创建
 */
import {
  Modal,
  Dropdown,
  Space,
  Input,
  Divider,
  Button,
  Typography,
  Tooltip
} from "antd";
import { forwardRef, useImperativeHandle, useState, useEffect, useRef } from "react";
import styles from "./page.module.css";
import { getFindApplicationList, getExperienceTag } from "@/api/find";
import ReuseModel from "./ReuseModel";

// 菜单列表配置（暂未使用）
const menuList = [
  { icon: "collection", title: "我的收藏", key: "collection" },
];

// 创建类型选项：智能体、工作流
const createItems = [
  {
    label: "智能体",
    key: "agent",
  },
  {
    label: "工作流",
    key: "workflow",
  },
];

// 应用类型文本映射
const TYPE_TEXT = {
  agent: "智能体",
  workflow: "工作流",
  agent_arrangement: "智能体编排",
};

const AGENT_TYPE_LIST = [
  {
    label: "空白智能体",
    key: "agent",
  },
  {
    label: "多智能体合作",
    key: "multi_agent",
  },
];

const WORKFLOW_TYPE_LIST = [
  {
    label: "空白工作流",
    key: "workflow",
  },
];
const { Text,Paragraph  } = Typography;

/**
 * CreateModal 组件
 * @param {Object} props - 组件属性
 * @param {Function} props.onClose - 模态框关闭时的回调函数
 * @param {Object} ref - 父组件传递的 ref，用于暴露子组件方法
 */
const CreateModal = forwardRef(({ onClose }, ref) => {
 

  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    showModal, // 打开模态框方法
  }));

  // ==================== 状态管理 ====================
  const [open, setOpen] = useState(false); // 控制模态框显示/隐藏
  const [createType, setCreateType] = useState("agent"); // 当前创建类型：agent(智能体) 或 workflow(工作流)
  const [tagList, setTagList] = useState([]); // 标签列表数据
  const [templateList, setTemplateList] = useState([]); // 应用模板列表
  const [searchValue, setSearchValue] = useState(''); // 搜索关键词
  const [activeKey, setActiveKey] = useState(-1); // 当前选中的标签ID，-1 表示全部
  const reuseModelRef = useRef(null); // 复用模板模态框的引用
  const [createTypeList, setCreateTypeList] = useState([
    {
      label: "空白智能体",
      key: "agent",
    },
    {
      label: "多智能体合作",
      key: "multi_agent",
    },
  ]); // 创建类型列表

  // ==================== 核心方法 ====================
  /**
   * 打开模态框
   * @param {String} type - 创建类型：'agent' 或 'workflow'
   */
  const showModal = (type) => {
    setSearchValue(''); // 清空搜索关键词
    setCreateType(type); // 设置创建类型
    if (type == "agent") {
      setCreateTypeList(AGENT_TYPE_LIST);
    } else if (type == "workflow") {
      setCreateTypeList(WORKFLOW_TYPE_LIST);
    }
    setActiveKey(-1); // 重置为"全部"标签
    getExperienceTagListEvent(); // 获取标签列表
    getFindApplicationListEvent(type, -1); // 获取应用列表
    setOpen(true); // 显示模态框
  };

  /**
   * 获取体验标签列表
   * 会在列表前添加一个"全部"选项（id 为 -1）
   */
  const getExperienceTagListEvent = () => {
    const data = {
      all: false // 不获取所有标签
    };
    getExperienceTag(data).then((res) => {
      const arr = res.data || [];
      const arrData = [
        {
          id: -1,
          name: "全部",
        },
        ...arr
      ];
      setTagList(arrData);
    });
  };

  /**
   * 监听搜索关键词变化，重新获取应用列表
   */
  useEffect(() => {
    getFindApplicationListEvent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]);

  /**
   * 获取应用列表
   * @param {String} type - 应用类型（可选）
   * @param {Number} tab - 标签ID（可选）
   */
  const getFindApplicationListEvent = (type, tab) => {
    const tabId = tab !== undefined ? tab : activeKey;
    const searchData = {
      type: type || createType, // 应用类型
      tagIdList: handleIdList(tabId), // 标签id列表
      name: searchValue, // 搜索关键词
    };
    getFindApplicationList(searchData).then((res) => {
      const arr = res.data || [];
      // 为每个应用添加 tagText 字段，用于显示标签文本
      arr.forEach(item => {
        item.tagText = item.tagList ? item.tagList.map(tag => tag.name).join('，') : '';
      });
      setTemplateList(arr);
    });
  };

  /**
   * 生成标签ID列表
   * @param {Number} tab - 标签ID
   * @returns {Array} 标签ID数组
   */
  const handleIdList = (tab) => {
    // 如果是 -1 或 '-1'，返回空数组表示全部
    if (tab == -1) {
      return [];
    }
    return [tab];
  };

  /**
   * 关闭模态框
   * 关闭时会调用父组件传入的 onClose 回调
   */
  const closeModal = () => {
    setOpen(false);
    if (onClose) onClose(createType); // 传递当前创建类型
  };

  /**
   * 创建类型点击事件
   * @param {String} key - 创建类型
   */
  const handleCreateClick = (key) => {
    setOpen(false);
    if (onClose) onClose(key); // 传递当前创建类型
  };
  /**
   * 确定按钮点击事件（暂未使用）
   */
  const handleOk = () => {
    setOpen(false);
  };

  /**
   * 取消按钮点击事件
   * 关闭模态框并清空搜索关键词
   */
  const handleCancel = () => {
    setSearchValue("");
    setOpen(false);
  };

  /**
   * 切换创建类型（智能体/工作流）
   * @param {Object} param0 - 包含 key 的对象
   */
  const typeSelectHandle = ({ key }) => {
     if (key == "agent") {
      setCreateTypeList(AGENT_TYPE_LIST);
    } else if (key == "workflow") {
      setCreateTypeList(WORKFLOW_TYPE_LIST);
    }
    setSearchValue(''); // 清空搜索关键词
    setCreateType(key); // 设置新的创建类型
    getFindApplicationListEvent(key); // 重新获取应用列表
  };

  // 获取当前创建类型的中文标签
  const currentLabel = createItems.find((item) => item.key === createType)?.label;

  // ==================== 子组件 ====================
  /**
   * 创建类型选择下拉框组件
   * 用于切换智能体/工作流
   */
  const CreateSelect = () => {
    return (
      <div>
        <Dropdown
          menu={{
            items: createItems,
            onClick: typeSelectHandle,
            selectedKeys: [createType],
          }}
        >
          <Space className={styles.dropdown_wrapper}>
            <span className={styles.dropdown_title}>创建{currentLabel}</span>
            <img src='/layout/arrow_bottom.png' alt='展开' width={16} height={16} />
          </Space>
        </Dropdown>
      </div>
    );
  };

  // ==================== 事件处理 ====================
  /**
   * 标签点击事件
   * @param {Object} item - 标签对象
   */
  const handleTagClick = (item) => {
    setActiveKey(item.id); // 设置选中的标签ID
    getFindApplicationListEvent(createType, item.id); // 根据标签获取应用列表
  };

  /**
   * 使用模板创建点击事件
   * @param {Object} item - 应用模板对象
   */
  const handleCopyClick = (item) => {
    reuseModelRef.current.showModal(item); // 打开复用模板模态框
  };

  /**
   * 复用模板模态框关闭事件
   */
  const onCloseModel = () => {
    setOpen(false);
  };

  /**
   * 应用卡片组件
   * @param {Object} props - 组件属性
   * @param {Object} props.item - 应用数据对象
   */
  const AppCard = ({ item }) => {
    const [isHovered, setIsHovered] = useState(false); // 鼠标悬停状态

    return (
      <div
        className={styles.card_container}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* 卡片顶部：图标、标题、创建者 */}
        <div className={styles.card_top}>
          <div className={styles.card_top_left}>
            <img
              src={process.env.NEXT_PUBLIC_API_BASE + item.iconUrl}
              alt=''
              className={styles.card_pic}
            />
            <div className={styles.card_title}>
              <span className={styles.card_title_text}>
                <Tooltip title={item.name}> {item.name}</Tooltip>
               </span>
              <div className={styles.account_container}>
                <img src='/avatar.png' alt='' />
                <span>{item.createUsername}</span>
              </div>
            </div>
          </div>
          {/* 应用类型标签 */}
          <div className={styles.card_type}>{item.agentType==='multiple'? '多智能体合作' : TYPE_TEXT[item.type]}</div>
        </div>

        {/* 卡片中部：应用描述 */}
        <div className={styles.card_center}>
        <Paragraph
            className={styles["drag_popover_content_desc_text"]}
            ellipsis={{ rows: 2, tooltip: item.description }}
          >
            <span style={{ fontSize: 12, color: "#60687D" }}>
              {item.description}
            </span>
          </Paragraph>
         </div>

        {/* 卡片底部：悬停时显示创建按钮，否则显示标签列表 */}
        <div className={styles.card_bottom}>
          {isHovered ? (
            <Button
              onClick={() => handleCopyClick(item)}
              type='primary'
              className={styles.template_create_btn}
            >
              <img src='/layout/create/white_add.png' className={styles.template_create_icon} alt='' />
              使用此模版创建
            </Button>
          ) : (
            <div className={styles["temp_useInfo_wrap"]}>
              {item.tagText && (
                <div className={styles["temp_tag_list"]}>
                  <img src="/application/tag.png" alt="" />
                  <div className={styles["temp_tag_list_text"]}>
                    <Text style={{ maxWidth: 100 }} ellipsis={{ tooltip: item.tagText }}>
                      <span className={styles["temp_tag_list_text_span"]}>{item.tagText}</span>
                    </Text>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ==================== 渲染 ====================
  return (
    <div>
      <Modal
        className={styles.custom_modal}
        open={open}
        width='1530px'
        onOk={handleOk}
        onCancel={handleCancel}
        footer={null}
        zIndex={9999}
        styles={{
          mask: {
            overflow: 'hidden'
          },wrapper: {
            
          }
        }}
      >
        <div className={styles.create_modal}>
          {/* 左侧菜单：创建类型选择、搜索框、标签列表 */}
          <div className={styles.left_menu}>
            <div className={styles.left_menu_header}>
              <Space direction='vertical' size={24} style={{ width: "100%" }}>
                {/* 创建类型下拉选择 */}
                <CreateSelect />
                {/* 搜索输入框 */}
                <Input
                  className={styles.custom_input}
                  placeholder='搜索'
                  maxLength={50}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  prefix={
                    <img src='/layout/blue_search.png' alt='搜索' className={styles.search_icon} />
                  }
                />
              </Space>
            </div>

            {/* 标签列表 */}
            <div className={styles.menu_options}>
              {tagList.map((item) => (
                <div
                  key={item.id}
                  className={`${styles.menu_item} ${activeKey == item.id ? styles.active : ""}`}
                  onClick={() => handleTagClick(item)}
                >
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 右侧内容：空白创建卡片 + 模板列表 */}
          <div className={styles.create_app_right_content}>
            {/* 空白创建卡片 */}
            {createTypeList.map((item) => (
              <div key={item.key} className={`${styles.card_container} ${styles.create_card}`} onClick={() => handleCreateClick(item.key)}>
                <div className={styles.create_center}>
                  <img className={styles.create_icon} src='/layout/create/add_icon_blue.png' alt='' />
                  <span>{item.label}</span>
                </div>
              </div>
            ))}

            {/* 模板列表 */}
            {templateList.map((item, index) => (
              <AppCard item={item} key={index} />
            ))}
          </div>
        </div>
      </Modal>

      {/* 复用模板模态框 */}
      <ReuseModel ref={reuseModelRef} onCloseModel={onCloseModel} />
    </div>
  );
});

export default CreateModal;
