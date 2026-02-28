/* eslint-disable @next/next/no-img-element */
"use client";
import { useState, useEffect, useRef } from "react";
import { Input, Typography, Select, Empty } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import styles from "./page.module.css";
import CreateModal from "../../components/CreateModal";
import CreateAppModal from "../../components/CreateModal/CreateAppModal";
import ReuseModel from "../../components/CreateModal/ReuseModel";
import { useRouter } from "next/navigation";
import { getFindApplicationList, getExperienceTag } from "@/api/find";
import TagGroup from "./components/TagGroup";

/**
 * 创建卡片配置常量
 * 定义了三种应用类型的卡片信息：智能体、工作流、智能体编排
 */
const CREATE_CARD_CONFIG = [
  {
    typeText: "智能体",
    type: "agent",
    desc: "7×24小时接待咨询，客服 / 销售场景秒级答疑，像专属助理一样陪你搞定客户 ",
    img: "/find/agent.png",
  },
  {
    typeText: "工作流",
    type: "workflow",
    desc: "大模型驱动，执行会议分析、任务流等固定逻辑，替代手动反复操作",
    img: "/find/workflow.png",
  },
  {
    typeText: "智能体协作",
    type: "agent_arrangement",
    desc: "处理 '海量数据计算 / 跨系统任务'，自动拆分给 N 个智能体并行跑，复杂活儿也能准时交",
    img: "/find/agent_arrangement.png",
  },
];

/**
 * 卡片背景色配置
 * 根据应用类型返回对应的背景颜色
 */
const CARD_BG_COLORS = {
  agent: "#D6F1FF",
  workflow: "#DCE9FF",
  agent_arrangement: "#E5E2FF",
};

/**
 * 应用类型文本映射
 * 将应用类型值转换为对应的中文显示文本
 */
const TYPE_TEXT = {
  agent: "智能体",
  workflow: "工作流",
  agent_arrangement: "智能体协作",
};

/**
 * 全部标签常量
 * 用于判断是否选中"全部标签"
 */
const ALL_TAG_NAME = "全部标签";

/**
 * 搜索状态枚举
 * 用于区分不同的搜索触发场景
 */
const SEARCH_STATUS = {
  TYPE_CHANGE: 1, // 应用类型变化
  KEYWORD_SEARCH: 2, // 关键词搜索
  DEFAULT: 0, // 默认搜索
};

/**
 * 发现页面组件 - 用于展示和搜索应用模板
 *
 * 主要功能：
 * 1. 展示三种应用类型的创建卡片（智能体、工作流、智能体编排）
 * 2. 提供搜索和筛选功能（按标签、应用类型、关键词搜索）
 * 3. 展示模板列表，支持查看详情和复用模板
 *
 * @returns {JSX.Element} 发现页面组件
 */
export default function FindPage() {
  const { Text, Paragraph } = Typography;

  // ========== 路由和引用 ==========
  const router = useRouter();
  const createModalRef = useRef(null); // 创建模态框引用
  const createAppModalRef = useRef(null); // 创建应用模态框引用
  const reUseModelRef = useRef(null); // 复用模态框引用

  // ========== 数据状态 ==========
  const [searchKeyword, setSearchKeyword] = useState(""); // 搜索关键词
  const [templateList, setTemplateList] = useState([]); // 模板列表数据
  const [tagList, setTagList] = useState([]); // 标签列表
  const [selectedTagValue, setSelectedTagValue] = useState([]); // 选中的标签值（默认选中全部）
  const [appType, setAppType] = useState(null); // 应用类型筛选值

  // ========== UI交互状态 ==========
  const [hoveredId, setHoveredId] = useState(null); // 当前悬停的模板ID
  const [cardHoveredType, setCardHoveredType] = useState(null); // 当前悬停的卡片类型

  // ========== 应用类型选项列表 ==========
  const appTypeList = [
    { label: "智能体", value: "agent" },
    { label: "工作流", value: "workflow" },
    { label: "智能体编排", value: "agent_arrangement" },
  ];

  // ========== 生命周期 ==========
  /**
   * 组件挂载时初始化数据
   * 获取标签列表和应用列表
   */
  useEffect(() => {
    getExperienceTagListEvent();
    getFindApplicationListEvent();
  }, []);

  // ========== 数据获取函数 ==========
  /**
   * 获取体验标签列表
   * 从接口获取所有可用的标签选项
   */
  const getExperienceTagListEvent = () => {
    const data = { all: false };
    getExperienceTag(data)
      .then((res) => {
        setTagList(res.data || []);
      })
      .catch((err) => {
        console.error("获取标签列表失败:", err);
      });
  };

  /**
   * 获取应用列表
   *
   * @param {Array} tagData - 标签数据（可选，不传则使用当前选中的标签）
   * @param {string} type - 应用类型（可选，用于类型筛选）
   * @param {number} status - 搜索状态（1: 类型变化, 2: 关键词搜索, 0: 默认）
   * @param {string} searchVal - 搜索关键词（可选，用于关键词搜索）
   */
  const getFindApplicationListEvent = (tagData, type, status, searchVal) => {
 
    // 确定使用的标签数据
    const currentTags = tagData || selectedTagValue;

    // 提取标签ID列表
    // 如果包含"全部标签"，则tagIds为空数组（表示不过滤）
    const tagIds = currentTags.some((tag) => tag.name === ALL_TAG_NAME)
      ? []
      : currentTags.map((tag) => tag.id);

    // 构建搜索参数
    const searchData = {
      type: status === SEARCH_STATUS.TYPE_CHANGE ? type : appType, // 应用类型
      tagIdList: tagIds, // 标签ID列表
      name: status === SEARCH_STATUS.KEYWORD_SEARCH ? searchVal : searchKeyword, // 搜索关键词
    };

    // 调用接口获取应用列表
    getFindApplicationList(searchData)
      .then((res) => {
        const list = res.data || [];
        // 处理标签文本：将标签列表转换为逗号分隔的字符串
        list.forEach((item) => {
          item.tagText = item.tagList
            ? item.tagList.map((tag) => tag.name).join("，")
            : "";
        });
        setTemplateList(list);
        setHoveredId(null);
      })
      .catch((err) => {
        console.error("获取应用列表失败:", err);
        setTemplateList([]);
      });
  };

  // ========== 工具函数 ==========
  /**
   * 根据标签值查找标签名称
   * @param {string} tagValue - 标签值
   * @returns {string} 标签名称，未找到则返回空字符串
   */
  const findTagName = (tagValue) => {
    return tagList.find((tag) => tag.value === tagValue)?.label || "";
  };

  /**
   * 获取卡片背景色
   * @param {string} type - 卡片类型
   * @returns {string} 背景色，默认返回智能体的背景色
   */
  const getCardBgColor = (type) => {
    return CARD_BG_COLORS[type] || CARD_BG_COLORS.agent;
  };

  // ========== 事件处理函数 ==========
  /**
   * 处理模态框关闭事件
   * 当创建模态框关闭时，打开创建应用模态框
   * @param {string} type - 模态框类型
   */
  const handleModalClose = (type) => {
    createAppModalRef.current?.showModal(type);
  };

  /**
   * 打开创建模态框
   * @param {Event} e - 点击事件对象
   * @param {Object} card - 卡片配置对象
   */
  const openCreateModal = (e, card) => {
    e.stopPropagation();
    // 智能体编排暂不支持创建，直接返回
    if (card.type === "agent_arrangement") return;
    createModalRef.current?.showModal(card.type);
  };

  /**
   * 处理标签选择变化
   * 当用户选择或取消选择标签时触发
   *
   * @param {Object} tag - 选中的标签对象
   * @param {boolean} checked - 是否选中
   */
  const handleSelectTag = (tag, checked) => {
    let nextTags = [];

    // 处理标签选择逻辑
    if (!tag || tag.length === 0) {
      // 如果标签为空，清空选中
      nextTags = [];
    } else if (checked) {
      // 选中标签：移除"全部标签"和重复项，然后添加新标签
      nextTags = [
        ...selectedTagValue.filter(
          (t) => t.name !== ALL_TAG_NAME && t.id !== tag.id
        ),
        tag,
      ];
    } else {
      // 取消选中：从选中列表中移除该标签
      nextTags = selectedTagValue.filter((t) => t.id !== tag.id);
    }

    // 如果取消后没有选中任何标签，默认选中"全部标签"
    if (nextTags.length === 0) {
      const allTag = tagList.find((t) => t.name === ALL_TAG_NAME);
      if (allTag) {
        nextTags = [allTag];
      }
    }

    setSelectedTagValue(nextTags);
    // 更新标签后重新获取应用列表
    getFindApplicationListEvent(nextTags);
  };

  /**
   * 处理应用类型筛选变化
   * @param {string} value - 选中的应用类型值
   */
  const handleChangeAppType = (value) => {
    setAppType(value);
    // 应用类型变化时重新获取列表
    getFindApplicationListEvent(null, value, SEARCH_STATUS.TYPE_CHANGE);
  };

  /**
   * 处理搜索关键词变化
   * @param {string} value - 搜索关键词
   */
  const handleSearchChange = (value) => {
    setSearchKeyword(value);
    // 关键词搜索时重新获取列表
    getFindApplicationListEvent(
      null,
      null,
      SEARCH_STATUS.KEYWORD_SEARCH,
      value
    );
  };

  /**
   * 处理回车搜索或点击搜索图标
   */
  const handleSearch = () => {
    getFindApplicationListEvent();
  };

  /**
   * 处理复用按钮点击
   * 打开复用模板的模态框
   * @param {Object} temp - 模板对象
   */
  const handleReUseModel = (temp) => {
    reUseModelRef.current?.showModal(temp);
  };

  /**
   * 跳转到模板详情页
   * @param {Object} temp - 模板对象，包含appId和type属性
   */
  const navigateToDetail = (temp) => {
    router.push(`/main/find/${temp.appId}/${temp.type}/detail`);
  };

  const renderDescription = (description) => {
    return <div className={styles.findDesc}>{description}</div>;
  };

  // ========== JSX 渲染 ==========
  return (
    <div className={styles["find_container"]}>
      {/* 顶部创建卡片区域 */}
      <div className={styles["find_top_display_wrap"]}>
        {CREATE_CARD_CONFIG.map((card, index) => (
          <div
            key={`card_${card.type}_${index}`}
            className={styles["find_top_display_item"]}
            onMouseEnter={() => setCardHoveredType(card.type)}
            onMouseLeave={() => setCardHoveredType(null)}
            style={{ background: getCardBgColor(card.type) }}
          >
            {/* 卡片标题 */}
            <div className={styles["find_top_display_item_title"]}>
              {card.typeText}
            </div>
            {/* 悬停时显示创建按钮，否则显示描述 */}
            {cardHoveredType === card.type ? (
              <div
                className={styles["find_top_display_item_create"]}
                onClick={(e) => openCreateModal(e, card)}
              >
                立即创建
                <img
                  src="/layout/create_arrow.png"
                  alt="创建箭头"
                  style={{ width: "14px" }}
                />
              </div>
            ) : (
              <div className={styles["find_top_display_item_desc"]}>
                {card.desc}
              </div>
            )}
            {/* 卡片图标 */}
            <div className={styles["find_top_display_item_img"]}>
              <img src={card.img} alt={card.typeText} />
            </div>
          </div>
        ))}
      </div>

      {/* 搜索和筛选区域 */}
      <div className={styles["page_search_wrap"]}>
        {/* 左侧：标签筛选 */}
        <div className={styles["page_search_left"]}>
          <span className={styles["page_search_title"]}>Agent 模板</span>
          <div className={styles["find_tag_list_wrap"]}>
            <TagGroup
              list={tagList}
              selectedTags={selectedTagValue}
              onChange={handleSelectTag}
              keyField="id"
              labelField="name"
            />
          </div>
        </div>
        {/* 右侧：应用类型筛选和搜索框 */}
        <div className={styles["page_search_right"]}>
          {/* 应用类型下拉选择 */}
          <Select
            style={{ height: "36px", width: 160 }}
            className={styles["select_custom"]}
            placeholder="应用类型"
            value={appType}
            allowClear
            onChange={handleChangeAppType}
            options={appTypeList}
          />
          {/* 搜索输入框 */}
          <Input
            style={{
              height: 36,
              marginLeft: 8,
              borderRadius: 8,
              backgroundColor: "#fff",
              border: "1px solid #DBE2EA",
            }}
            className={styles["find_search_input"]}
            placeholder="搜索应用名称,不超过50个字"
            maxLength={50}
            value={searchKeyword}
            onChange={(e) => handleSearchChange(e.target.value)}
            onPressEnter={handleSearch}
            suffix={
              <SearchOutlined
                style={{ cursor: "pointer" }}
                onClick={handleSearch}
              />
            }
          />
        </div>
      </div>
      {/* 模板列表区域 */}
      {templateList.length > 0 ? (
        <div className={styles["find_template_container"]}>
          {templateList.map((temp, index) => {
       
            return (
              <div
                key={`temp_${temp.id || temp.appId}_${index}`}
                className={`${styles["find_template_item"]} ${
                  hoveredId === temp.id ? styles["find_template_item_hover"] : ""
                }`}
                onClick={() => navigateToDetail(temp)}
                onMouseEnter={() => setHoveredId(temp.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* 模板图标区域 */}
                <div className={styles["tempImg_wrap"]}>
                  <img
                    src={process.env.NEXT_PUBLIC_API_BASE + temp.iconUrl}
                    alt={temp.name || "模板图标"}
                    className={styles["temp_img"]}
                    style={{ height: "100%" }}
                  />
                </div>

                {/* 模板名称和类型 */}
                <div className={styles["temp_name_wrap"]}>
                  <Text
                    style={{ maxWidth: 213 }}
                    ellipsis={{ tooltip: temp.name }}
                  >
                    <span className={styles["temp_name_wrap_title"]}>
                      {temp.name}
                    </span>
                  </Text>
                  <div className={styles["temp_name_wrap_tag"]}>
                    {temp.agentType==='multiple'? '多智能体合作' : TYPE_TEXT[temp.type] || "未知类型"}
                  </div>
                </div>

                {/* 作者信息 */}
                <div className={styles["temp_author_wrap"]}>
                  <div className={styles["temp_author_icon_wrap"]}>
                    <img
                      src="/avatar.png"
                      style={{ width: "100%", height: "100%" }}
                      alt="作者头像"
                    />
                  </div>
                  <span className={styles["temp_author_info"]}>
                    {temp.createUsername}
                  </span>
                </div>

                {/* 悬停时显示的额外信息 */}
                { hoveredId === temp.id && (
                  <>
                    {/* 模板描述 */}
                    {temp.description && (
                      <div className={styles["temp_desc_wrap"]}>
                        <Paragraph  className={styles.findDesc_span}
                          ellipsis={{
                            rows: 2,
                            tooltip: renderDescription(temp.description),
                          }}
                        >
                          <span className={styles.findDesc_span}>
                            {" "}
                            {temp.description}
                          </span>
                        </Paragraph>
                      </div>
                    )}

                    {/* 标签信息 */}

                    {temp.tagText && (
                      <div className={styles["temp_tag_list"]}>
                        <img src="/application/tag.png" alt="标签图标" />
                        <div className={styles["temp_tag_list_text"]}>
                          <Text
                          className={styles["temp_tag_list_text_span"]}
                            style={{ maxWidth: 120 }}
                            ellipsis={{ tooltip: temp.tagText }}
                          >
                            <span className={styles["temp_tag_list_text_span"]}>
                              {temp.tagText}
                            </span>
                          </Text>
                        </div>
                      </div>
                    )}

                    {/* 操作按钮区域 */}
                    <div className={styles["use_btn_wrap"]}>
                      <div
                        className={styles["use_btn"]}
                        style={{ background: "#3772FE", color: "#fff" }}
                      >
                        查看
                      </div>
                      <div
                        className={styles["use_btn"]}
                        style={{
                          color: "#364052",
                          border: "1px solid #dbe2ea",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReUseModel(temp);
                        }}
                      >
                        复用
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* 空状态展示 */
        <div className={styles["find_template_empty_wrap"]}>
          <Empty
            image={"/application/app_empty.png"}
            styles={{ image: { height: 220, width: 220 } }}
            description={
              <span style={{ color: "#666E82", fontWeight: 500 }}>
                暂无数据
              </span>
            }
          />
        </div>
      )}

      {/* 模态框组件 */}
      <CreateModal ref={createModalRef} onClose={handleModalClose} />
      <CreateAppModal ref={createAppModalRef} />
      <ReuseModel ref={reUseModelRef} />
    </div>
  );
}
