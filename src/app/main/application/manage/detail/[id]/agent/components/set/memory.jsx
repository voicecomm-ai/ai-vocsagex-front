import React, { useState, forwardRef, useRef, useEffect } from "react";
import styles from "./set.module.css";
import { InputNumber, Switch, Slider, Tooltip } from "antd";
import Image from "next/image";
import debounce from "lodash/debounce";

/**
 * 记忆配置组件
 * 用于配置 Agent 的短期记忆和长期记忆参数
 *
 * @component
 * @param {Object} props - 组件属性
 * @param {Object} props.data - 记忆数据配置
 * @param {number} props.data.shortTermMemoryRounds - 短期记忆轮数
 * @param {boolean} props.data.longTermMemoryEnabled - 是否启用长期记忆
 * @param {string} props.data.longTermMemoryType - 长期记忆类型 ("always" | "custom")
 * @param {number} props.data.longTermMemoryExpired - 长期记忆过期天数
 * @param {boolean} props.canCreate - 是否有创建/编辑权限
 * @param {Function} props.onMemoryChange - 记忆数据变更回调函数
 * @param {React.Ref} ref - 转发引用
 */
const Memory = forwardRef((props, ref) => {
  const [isMemoryExpanded, setIsMemoryExpanded] = useState(true); // 记忆是否展开
  // ========== 常量定义 ==========
  /** 短期记忆轮数最小值 */
  const SHORT_TERM_MEMORY_MIN = 0;
  /** 短期记忆轮数最大值 */
  const SHORT_TERM_MEMORY_MAX = 20;
  /** 长期记忆过期天数最小值 */
  const LONG_TERM_MEMORY_EXPIRED_MIN = 1;
  /** 长期记忆过期天数最大值 */
  const LONG_TERM_MEMORY_EXPIRED_MAX = 999;
  /** 防抖延迟时间（毫秒） */
  const DEBOUNCE_DELAY = 100;
  /** 长期记忆类型：永久有效 */
  const MEMORY_TYPE_ALWAYS = "always";
  /** 长期记忆类型：自定义过期时间 */
  const MEMORY_TYPE_CUSTOM = "custom";

  // ========== 状态管理 ==========
  /**
   * 记忆数据状态
   * @type {Object}
   * @property {number} shortTermMemoryRounds - 短期记忆轮数（0-20）
   * @property {boolean} longTermMemoryEnabled - 是否启用长期记忆
   * @property {string} longTermMemoryType - 长期记忆类型 ("always" | "custom")
   * @property {number} longTermMemoryExpired - 长期记忆过期天数（1-999）
   */
  const [memoryData, setMemoryData] = useState({
    shortTermMemoryRounds: 5,
    longTermMemoryEnabled: false,
    longTermMemoryType: MEMORY_TYPE_ALWAYS,
    longTermMemoryExpired: 365,
  });

  // ========== 副作用处理 ==========
  /**
   * 监听外部传入的 data 变化，同步更新内部状态
   * 当 props.data 发生变化时，更新组件的记忆数据状态
   */
  useEffect(() => {
    if (props.data) {
      setMemoryData({
        ...props.data,
        longTermMemoryType: props.data.longTermMemoryType || MEMORY_TYPE_ALWAYS,
        longTermMemoryExpired: props.data.longTermMemoryExpired,
        longTermMemoryEnabled: props.data.longTermMemoryEnabled,
        shortTermMemoryRounds: props.data.shortTermMemoryRounds,
      });
    }
  }, [props.data]);

  // ========== 防抖保存函数 ==========
  /**
   * 防抖保存记忆数据
   * 使用 useRef 确保防抖函数在组件生命周期内保持稳定引用
   */
  const debouncedSaveMemoryData = useRef(
    debounce((data) => {
      props.onMemoryChange(data);
    }, DEBOUNCE_DELAY)
  ).current;

  // ========== 事件处理函数 ==========
  /**
   * 保存记忆数据事件处理
   * 根据是否需要防抖来决定立即保存还是延迟保存
   *
   * @param {Object} data - 要保存的记忆数据
   * @param {boolean} isDebounce - 是否使用防抖保存（true: 防抖保存, false: 立即保存）
   */
  const saveMemoryDataEvent = (data, isDebounce) => {
    // 更新本地状态
    setMemoryData(data);

    // 根据是否需要防抖来决定保存方式
    if (isDebounce) {
      // 使用防抖保存，适用于频繁触发的操作（如滑块拖拽、输入框输入）
      debouncedSaveMemoryData(data);
    } else {
      // 立即保存，适用于开关切换等需要即时反馈的操作
      props.onMemoryChange(data);
    }
  };


  //短期记忆失去焦点事件
  const handleShortTermMemoryRoundsBlur=(e)=>{
   let value =e.target.value;
   let shortRounds =value?value:1;
   const data = {
    ...memoryData,
    shortTermMemoryRounds: shortRounds,
  };
  // 使用防抖保存，避免频繁触发保存操作
  saveMemoryDataEvent(data, true);
  }

  /**
   * 短期记忆轮数变更处理
   * 当用户修改短期记忆轮数时触发（使用防抖保存）
   *
   * @param {number} value - 新的短期记忆轮数
   */
  const handleShortTermMemoryRoundsChange = (value) => {
    // 检查是否有编辑权限
    if (!props.canCreate) {
      return;
    }

    const data = {
      ...memoryData,
      shortTermMemoryRounds: value,
    };
    // 使用防抖保存，避免频繁触发保存操作
    saveMemoryDataEvent(data, true);
  };

  /**
   * 长期记忆启用状态变更处理
   * 当用户切换长期记忆开关时触发（立即保存）
   *
   * @param {boolean} value - 是否启用长期记忆
   */
  const handleLongTermMemoryEnabledChange = (value) => {
    // 检查是否有编辑权限
    if (!props.canCreate) {
      return;
    }

    const data = {
      ...memoryData,
      longTermMemoryEnabled: value,
    };
    // 立即保存，开关操作需要即时反馈
    saveMemoryDataEvent(data, false);
  };

   //长期记忆失去焦点事件
 const handleLongTermMemoryRoundsBlur =(e)=>{
  let value =e.target.value;
  let longExpired =value?value:365;
  const data = {
    ...memoryData,
    longTermMemoryExpired: longExpired,
  };
  // 使用防抖保存，避免频繁触发保存操作
  saveMemoryDataEvent(data, true);
 }
  /**
   * 长期记忆过期天数变更处理
   * 当用户修改长期记忆过期天数时触发（使用防抖保存）
   *
   * @param {number} value - 新的过期天数
   */
  const handleLongTermMemoryExpiredChange = (value) => {
    // 检查是否有编辑权限
    if (!props.canCreate) {
      return;
    }

    const data = {
      ...memoryData,
      longTermMemoryExpired: value,
    };
    // 使用防抖保存，避免频繁触发保存操作
    saveMemoryDataEvent(data, true);
  };

  /**
   * 长期记忆类型切换处理
   * 当用户在"永久有效"和"自定义"之间切换时触发（立即保存）
   *
   * @param {string} value - 新的记忆类型 ("always" | "custom")
   */
  const handleLongTermMemoryTypeChangeEvent = (value) => {
    // 检查是否有编辑权限
    if (!props.canCreate) {
      return;
    }

    const data = {
      ...memoryData,
      longTermMemoryType: value,
    };
    // 立即保存，类型切换需要即时反馈
    saveMemoryDataEvent(data, false);
  };

  // ========== 渲染 ==========
  return (
    <div className={styles["agent_long_memory_content"]}>
      {/* 标题区域 */}
      <div className={`${styles["agent_long_memory_content_header"]} ${!isMemoryExpanded?styles["left_tab_item_active"]:""}`}   onClick={() => setIsMemoryExpanded(!isMemoryExpanded)}>
        <img
          src="/workflow/arrow_bottom.png"
          alt="展开"
        
          className={`${styles.track_step_expand} ${
            isMemoryExpanded ? styles.expanded : ""
          }`}
        />
        记忆
      </div>
   
      {/* 内容区域 */}
      {isMemoryExpanded && (
      <div className={styles["agent_long_memory_content_body"]}>
        {/* 短期记忆配置区域 */}
        <div className={styles["agent_long_memory_content_body_left"]}>
          <div className={styles["memory_section_header"]}>
          <div className={styles["memory_section_title"]}>短期记忆</div></div>
          <div className={styles["memory_input_group"]}>
            {/* 数字输入框 */}
            <InputNumber
              value={memoryData.shortTermMemoryRounds}
              min={SHORT_TERM_MEMORY_MIN}
              max={SHORT_TERM_MEMORY_MAX}
              onBlur={handleShortTermMemoryRoundsBlur}
              suffix="轮对话"
              disabled={!props.canCreate}
              className={styles["memory_number_input"]}
            />
            {/* 滑块控件 */}
            <div className={styles["memory_slider_container"]}>
              <Slider
                min={SHORT_TERM_MEMORY_MIN}
                max={SHORT_TERM_MEMORY_MAX}
                value={memoryData.shortTermMemoryRounds}
                onChange={handleShortTermMemoryRoundsChange}
                disabled={!props.canCreate}
              />
            </div>
          </div>
        </div>

        {/* 长期记忆配置区域 */}
        <div className={styles["agent_long_memory_content_body_right"]}>
          {/* 长期记忆头部：标题和开关 */}
          <div className={styles["memory_section_header"]}>
            <div className={styles["memory_section_title"]}>
              长期记忆
              {/* 提示信息 */}
              <Tooltip title="总结聊天对话的内容，并用于更好的响应用户的消息。">
                <img
                  src="/agent/info.png"
                  alt="长期记忆说明"
                  className={styles["info_img"]}
                />
              </Tooltip>
            </div>
            {/* 长期记忆开关 */}
            <Switch
              checked={memoryData.longTermMemoryEnabled}
              onChange={handleLongTermMemoryEnabledChange}
              className={styles["memory_switch"]}
              disabled={!props.canCreate}
            />
          </div>

          {/* 长期记忆详细配置（仅在启用时显示） */}
          {memoryData.longTermMemoryEnabled && (
            <div className={styles["memory_expiration_options"]}>
              {/* 记忆类型选择按钮组 */}
              <div className={styles["memory_option_buttons"]}>
                {/* 永久有效选项 */}
                <div
                  className={`${styles["memory_option_buttons_item"]} ${
                    memoryData.longTermMemoryType === MEMORY_TYPE_ALWAYS
                      ? styles["memory_option_btn_active"]
                      : ""
                  }`}
                  onClick={() =>
                    handleLongTermMemoryTypeChangeEvent(MEMORY_TYPE_ALWAYS)
                  }
                >
                  永久有效
                </div>
                {/* 自定义过期时间选项 */}
                <div
                  className={`${styles["memory_option_buttons_item"]} ${
                    memoryData.longTermMemoryType === MEMORY_TYPE_CUSTOM
                      ? styles["memory_option_btn_active"]
                      : ""
                  }`}
                  onClick={() =>
                    handleLongTermMemoryTypeChangeEvent(MEMORY_TYPE_CUSTOM)
                  }
                >
                  自定义
                </div>
              </div>

              {/* 自定义过期时间配置（仅在选择"自定义"时显示） */}
              {memoryData.longTermMemoryType === MEMORY_TYPE_CUSTOM && (
                <div className={styles["memory_input_group_custom"]}>
                  {/* 过期天数输入框 */}
                  <InputNumber
                    value={memoryData.longTermMemoryExpired}
                    onBlur={handleLongTermMemoryRoundsBlur}
                    min={LONG_TERM_MEMORY_EXPIRED_MIN}
                    max={LONG_TERM_MEMORY_EXPIRED_MAX}
                    suffix="天过期"
                    className={styles["memory_number_input"]}
                    disabled={!props.canCreate}
                  />
                  {/* 过期天数滑块 */}
                  <div className={styles["memory_slider_container"]}>
                    <Slider
                      min={LONG_TERM_MEMORY_EXPIRED_MIN}
                      max={LONG_TERM_MEMORY_EXPIRED_MAX}
                      value={memoryData.longTermMemoryExpired}
                      onChange={handleLongTermMemoryExpiredChange}
                      disabled={!props.canCreate}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
});

export default Memory;
