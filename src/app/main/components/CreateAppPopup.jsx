import React, { forwardRef, useEffect } from "react";
import styles from "./index.module.css";

/**
 * 创建卡片配置常量
 * 三种应用类型：智能体、工作流、智能体编排
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
    desc: "处理 '海量数据计算 / 跨系统任务'，自动拆分给 N 个智能体并行跑，复杂活也能准时交",
    img: "/find/agent_arrangement.png",
  },
];

// 卡片背景色映射
const CARD_BG_COLORS = {
  agent: "#D6F1FF",
  workflow: "#DCE9FF",
  agent_arrangement: "#E5E2FF",
};

// 禁用状态的卡片样式映射（新增）
const DISABLED_STYLES = {

  // 禁用光标
  cursor: "not-allowed",
};

// 预加载图片函数
const preloadImages = (imagePaths) => {
  imagePaths.forEach((path) => {
    const img = new Image();
    img.src = path; // 发起请求，缓存图片
  });
};

/**
 * CreateAppPopup 弹窗组件
 * @param {Function} onItemClick - 点击卡片项的回调（用于关闭弹窗）
 * @param {Ref} ref - 父组件传递的 ref（用于判断点击区域）
 */
const CreateAppPopup = forwardRef(({ onItemClick }, ref) => {
  // 组件挂载时预加载所有卡片图片
  useEffect(() => {
    const imagePaths = CREATE_CARD_CONFIG.map((card) => card.img);
    preloadImages(imagePaths);
  }, []);

  // 获取卡片样式（新增：区分禁用/可用状态）
  const getCardStyles = (type) => {
    const isDisabled = type === "agent_arrangement";
    return {
      // 禁用时用浅灰背景，否则用原有背景色
      background: isDisabled ? getCardBgColor(type) : getCardBgColor(type),
      // 禁用时显示禁止光标
      cursor: isDisabled ? "pointer" : "pointer",
      // 可选：禁用时添加半透明遮罩，视觉提示更明显
     
    };
  };

  // 获取卡片文字样式（新增：区分禁用/可用状态）
  const getTextStyles = (type) => {
    const isDisabled = type === "agent_arrangement";
    return {
      color: isDisabled ? DISABLED_STYLES.textColor : "inherit",
    };
  };

  // 原有：获取卡片背景色
  const getCardBgColor = (type) => {
    return CARD_BG_COLORS[type] || CARD_BG_COLORS.agent;
  };

  // 处理卡片点击（新增：过滤禁用类型）
  const handleCardClick = (type) => {
    // 仅当类型不是 agent_arrangement 时触发回调
    if (type !== "agent_arrangement" && onItemClick) {
      onItemClick(type);
    }
  };

  return (
    <div ref={ref} className={styles.create_app_popup}>
      {CREATE_CARD_CONFIG.map((card, index) => {
        const isDisabled = card.type === "agent_arrangement"; // 判断是否禁用
        return (
          <div
            key={`card_${card.type}_${index}`}
            className={styles.create_type_item}
            // 应用卡片样式（背景、光标、透明度）
            style={getCardStyles(card.type)}
            // 点击事件：仅非禁用卡片触发回调
            onClick={() => handleCardClick(card.type)}
            // 可选：禁用时添加 title 提示（鼠标悬浮显示说明）
            title={isDisabled ? "智能体协作功能暂未开放" : ""}
          >
            {/* 标题：禁用时文字变灰 */}
            <div
              className={styles.find_top_display_item_title}
              style={getTextStyles(card.type)}
            >
              {card.typeText}
            </div>
            {/* 描述：禁用时文字变灰 */}
            <div
              className={styles.find_top_display_item_desc}
              style={getTextStyles(card.type)}
            >
              {card.desc}
            </div>
            {/* 图片：禁用时可添加透明度 */}
            <div className={styles.find_top_display_item_img}>
              <img
                src={card.img}
                alt={card.typeText}
              
              />
            </div>
          </div>
        );
      })}
    </div>
  );
});

export default CreateAppPopup;