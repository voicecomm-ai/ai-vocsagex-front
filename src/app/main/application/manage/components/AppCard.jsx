"use client";

// 应用管理：应用卡片组件
// 说明：展示应用的基础信息（图标、名称、状态、更新时间、描述），
// 提供标签管理与操作菜单（编辑、删除等）。不改动原有功能，仅增强可读性与注释。

import { useState, useEffect, useRef,useMemo } from "react";
import { Card, Tag, Avatar, Popover, Input, Checkbox, Modal, message, Tooltip } from "antd";
import {
  AppstoreOutlined,
  EllipsisOutlined,
  SearchOutlined,
  AppstoreAddOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import styles from "../manage.module.css";
import {
  updateApplicationAppTag,
  applicationGetById,
  deleteApplication,
  addApplicationTag,
} from "@/api/application";
import { useRouter } from "next/navigation";
import EllipsisTooltip from "../../../model/components/EllipsisTooltip";

// antd 复选框组
const CheckboxGroup = Checkbox.Group;
// 类型文案映射
const tabTypeMap = {
  agent: "智能体",
  agent_arrangement: "智能体编排",
  workflow: "工作流",
};

const AppCard = ({
  app,
  allTagList,
  onEditAppInfo,
  openTagModal,
  updateAppList,
  updatetagList,
  cardOptions,
  tagManageModal,
  permission, // 面板操作权限开关：无权限时禁止展开底部标签面板
  deleteApp,
  offShelfEvent
}) => {
  // 路由
  const router = useRouter();
  // 控制操作菜单显示
  const [popoverVisible, setPopoverVisible] = useState(false);
  // 卡片悬停状态
  const [hovered, setHovered] = useState(false);
  // 控制底部标签面板显示
  const [showPanel, setShowPanel] = useState(false);
  // 外部点击区域检测（用于关闭底部面板）
  const panelRef = useRef(null);
  // 标签搜索关键词
  const [searchTag, setSearchTag] = useState("");

  
  //处理操作按钮权限
  const actionOptions = useMemo(() => {
      let arr =JSON.parse(JSON.stringify(cardOptions));
  
      if(app.onShelf){//当前应用已经上架
        arr.splice(1,0,{label:"下架",isDisabled:!permission,key:"offShelf"});
      }
    
      return arr;
  },[app.onShelf,permission]);
  /**
   * 处理操作菜单项点击
   * @param {string} option - 选中的菜单项
   * @param {object} appInfo - 当前应用信息
   */
  const handleMenuClick = (option, obj) => {
    let appId = obj.id;
    if (option.key === "edit") { //编辑
      applicationGetById(appId).then((res) => {
        onEditAppInfo?.(res.data);
      });
    }
    if (option.key === "delete") { //删除
      deleteApp(obj);
    }
    if (option.key === "offShelf") {//下架
      offShelfEvent(obj);
    }
    setPopoverVisible(false);
  };

  /**
   * 点击外部区域关闭面板
   * 使用事件委托检测点击是否发生在面板外部
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setShowPanel(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /**
   * 修复：卡片挂载时若鼠标已在卡片内（如刚进入界面、切换列表后），不会触发 mouseEnter，
   * 导致 hovered 一直为 false，BottomLabel 不显示。在首次 mousemove 时补检并设置 hovered。
   */
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        setHovered(true);
      }
      document.removeEventListener("mousemove", onMove);
    };
    document.addEventListener("mousemove", onMove);
    return () => document.removeEventListener("mousemove", onMove);
  }, []);

  /**
   * 底部标签组件
   * 根据是否有标签显示不同内容，并处理点击事件
   */
  // 底部标签展示与入口（有标签显示标签，无标签在 hover 时显示“添加标签”）
  const BottomLabel = ({ tagList, hovered, permission }) => {
    const content =
      tagList && tagList.length > 0
        ? tagList.map((tag, index) => (
            <span key={tag.id}>
              {tag.name}
              {index !== tagList.length - 1 && ","}
            </span>
          ))
        : hovered
        ? "添加标签"
        : null;
    const handleClick = (e) => {
      // 🔐 无权限不展开面板
      if (!permission) return;
      e.stopPropagation();
      setShowPanel(!showPanel);
    };
    return content ? (
      <div
        className={styles["tag-text"]}
        onClick={handleClick}
        style={{
          backgroundColor: hovered ? " #F5F9FC" : "",
        }}
      >
        <img src='/application/tag_icon.svg' style={{ marginRight: 3 }} />
        <Tooltip
          title={<div style={{ fontSize: 12 }}>{content}</div>}
          color={"rgba(54, 64, 82, 0.90)"}
        >
          <div className={styles["tag-text-content"]}>{content}</div>
        </Tooltip>
      </div>
    ) : null;
  };
  // 标签多选：从全部标签（去掉首项）构建 antd CheckboxGroup 的 options
  const tagOptions = JSON.parse(JSON.stringify(allTagList)).map((item) => {
    return {
      label: item.name,
      value: item.id,
    };
  });
  // 标签搜索过滤
  const filteredTagOptions = tagOptions.filter((option) =>
    option.label.toLowerCase().includes(searchTag.toLowerCase())
  );

  // 当前应用拥有的标签 id 列表
  const formatAppTagList =
    app.tagList && Array.isArray(app.tagList) && app.tagList.length > 0
      ? app.tagList.map((item) => item.id)
      : [];

  const [checkedList, setCheckedList] = useState(formatAppTagList);

  // 标签搜索框变化
  const onSearchTag = (value) => {
    setSearchTag(value);
  };

  // 记录上一次的面板展开状态（用于在关闭面板时触发保存）
  const prevShowPanelRef = useRef(showPanel);
  // 保存逻辑：当从展开 -> 收起 且不在标签管理弹窗中时，触发保存
  useEffect(() => {
    if (prevShowPanelRef.current && !showPanel && !tagManageModal) {
      updateApplicationAppTag({
        id: app.id,
        tagIdList: checkedList,
      }).then(() => {
        updateAppList();
        setSearchTag("");
        updatetagList();
      });
    }
    prevShowPanelRef.current = showPanel;
  }, [showPanel]);

  // 创建标签
  const createNewTag = () => {
    if (searchTag.trim() === "") {
      return message.warning("标签名不能为空");
    }
    addApplicationTag({ name: searchTag }).then((res) => {
      message.success("新建标签成功");
      setSearchTag("");
      updatetagList();
    });
  };

  // 描述超出省略与悬浮展示完整内容
  function TruncatedTextWithTooltip({ text, isHover, hasTag }) {
    const textRef = useRef(null);
    const [isTruncated, setIsTruncated] = useState(false);

    useEffect(() => {
      const el = textRef.current;
      if (el) {
        setIsTruncated(el.scrollHeight > el.clientHeight);
      }
    }, [text, isHover]);

    const lineClamp = isHover || hasTag ? 2 : 4;

    const content = (
      <div
        ref={textRef}
        className={styles.describe}
        style={{
          WebkitLineClamp: lineClamp,
        }}
      >
        {text}
      </div>
    );

    return isTruncated ? (
      <Tooltip
        title={<div style={{ fontSize: 12 }}>{text}</div>}
        color={"rgba(54, 64, 82, 0.90)"}
        placement='rightBottom'
      >
        {content}
      </Tooltip>
    ) : (
      content
    );
  }
  // 卡片点击跳转：根据类型跳转至 agent 或 workflow 页面
  const cardClickEvent = (e) => {
    e.stopPropagation(); // 阻止事件冒泡，防止点击事件被 Popover 捕获
    // 仅当操作菜单未展开时才允许跳转
    if (!popoverVisible) {
      if (app.type === "agent") {
        // 智能体类型区分单/多智能体
        if (app.agentType === "multiple") {
             router.push(`/main/application/manage/detail/${app.id}/agent/multi`);
         
        } else  {
        router.push(`/main/application/manage/detail/${app.id}/agent`);
        }
      } else {
        // 非 agent 类型统一进 workflow 页面
        router.push(`/main/application/manage/detail/${app.id}/workflow`);
      }
    }
  };

  return (
    <div ref={panelRef}>
      <Card
        className={styles["app-card"]}
        classNames={{
          body: styles["app_card_body"],
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          setHovered(false);
          setPopoverVisible(false);
        }}
      >
        <div className={styles["app_card_body_content"]} onClick={cardClickEvent}>
          {/* 卡片头部区域 */}
          <div className={styles["card-header"]} style={{ width: "100%" }}>
            <Avatar
              shape='square'
              size={48}
              icon={<AppstoreOutlined />}
              src={process.env.NEXT_PUBLIC_API_BASE + app.iconUrl}
              style={{ borderRadius: 12 }}
            />
            <div className={styles["card-info"]}>
              <div className={styles["card-info-container"]}>
                <div className={styles["card-name"]}>
                  <EllipsisTooltip maxWidth='100%'>{app.name}</EllipsisTooltip>
                  {app.status === 1 && (
                    <Tooltip title="已发布">
                    <img
                        src='/application/publish_icon.svg'
                        style={{ width: 14, marginLeft: 4, flexShrink: 0 }}
                      />
                     </Tooltip>
                    
               
                  )}
                </div>

           
             {/* 已上架 */}
             {app.onShelf && <span className={styles["app__onShelf"]}>已上架</span>}  
              </div>

              <div className={styles["card-info-container"]}>
                <Tag
                  style={{ color: "#666E82", height: 20, background: "#fff", lineHeight: "19px" }}
                >
                  {app.type=='agent'&&app.agentType == 'multiple'?'多智能体合作':tabTypeMap[app.type]}
                </Tag>
                {app.updateTime && (
                  <span className={styles["updated-time"]}>{app.updateTime} 更新</span>
                )}
              </div>
            </div>
          </div>

          {/* 应用描述 */}
          {app.description && (
            <TruncatedTextWithTooltip
              text={app.description}
              isHover={hovered}
              hasTag={app.tagList?.length > 0}
            />
          )}
        </div>
        {/* 底部标签和操作菜单区域 */}
        <div className={styles["tag-container"]}>
          <BottomLabel tagList={app.tagList} hovered={hovered} permission={permission} />
          {/* 操作菜单弹出框 */}
          <Popover
            trigger='click'
            placement='rightTop'
            open={popoverVisible}
            onOpenChange={setPopoverVisible}
            arrow={false}
            content={
              <div
                style={{ width: 120, padding: "4px 3px" }}
                // onMouseLeave={() => setPopoverVisible(false)}
              >
                {actionOptions.map((option) => (
                  <div
                    key={option.label}
                    className={
                      `${styles["popover-select"]} ${
                        option.key === "delete"
                          ? styles["popover-select-delete"]
                          : option.key === "edit"
                          ? styles["popover-select-edit"]
                          : option.key === "offShelf"
                          ? styles["popover-select-delete"]
                          : ""
                      }`
                    }
                    onClick={() => handleMenuClick(option, app)}
                    style={{
                      pointerEvents: option.isDisabled ? "none" : undefined,
                      opacity: option.isDisabled ? 0.6 : undefined,
                    
                    }}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            }
          >
            <div className={styles["ellipsis-icon-container"]}>
              <img src='/application/more_btn.png' className={styles["ellipsis-icon"]} />
            </div>

            {/* <EllipsisOutlined
              className={styles["ellipsis-icon"]}
              style={{ cursor: "pointer", fontSize: 18,background:"red" }}
            /> */}
          </Popover>
        </div>

        {/* 底部展开面板 */}
        {showPanel && (
          <div className={styles["tag-list-container"]}>
            <div className={styles["tag-search-container"]}>
              <Input
                style={{
                  marginRight: 10,
                  backgroundColor: "rgba(220, 220, 220, 0.3)",
                  border: "0",
                }}
                value={searchTag}
                onChange={(e) => onSearchTag(e.target.value)}
                placeholder='搜索或创建标签'
                maxLength={50}
                suffix={<SearchOutlined />}
              />
              <AppstoreAddOutlined className={styles["add-icon"]} onClick={openTagModal} />
            </div>
            <div>
              {searchTag.length > 0 && (
                <div className={styles["create-tag"]} onClick={createNewTag}>
                  <PlusOutlined style={{ fontSize: 12, color: "#898F9F", marginRight: 8 }} />
                  <span style={{ wordBreak: "break-all" }}>{`创建"${searchTag}"`}</span>
                </div>
              )}
              <CheckboxGroup
                options={filteredTagOptions}
                value={checkedList}
                onChange={(list) => setCheckedList(list)}
                className='card-checkbox-group'
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  padding: " 8px 0 ",
                  maxHeight: 300,
                  overflowY: "scroll",
                  flexWrap: "nowrap",
                }}
              />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AppCard;
