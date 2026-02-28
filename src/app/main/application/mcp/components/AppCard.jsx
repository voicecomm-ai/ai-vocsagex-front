import { useState, useEffect, useRef } from "react";
import {
  Card,
  Tag,
  Avatar,
  Popover,
  Input,
  Checkbox,
  Modal,
  message,
  Tooltip,
  Dropdown,
  Button,
  Divider,
  Typography,
} from "antd";
import {
  AppstoreOutlined,
  EllipsisOutlined,
  SearchOutlined,
  AppstoreAddOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import styles from "../mcp.module.css";
import {
  bindKnowledgeBaseTag,
  addKnowledgeBaseTag,
  getKnowledgeBaseTagList,
} from "@/api/knowledge";

const CheckboxGroup = Checkbox.Group;
const AppCard = ({
  app,
  allTagList,
  onEditAppInfo,
  changeMcpStatusEvent,
  updateAppList,
  updatetagList,
  cardOptions,
  tagManageModal,
  deleteAppHandle,
  onCheck,
  permission, //面板操作权限
  checked,
  mcpStatus,
  isSquare,//是否为广场
  detailClickEvent,
}) => {
  // 操作菜单选项
  // const cardOptions = ["编辑信息", "删除"];
  const { Paragraph, Text } = Typography;
  const [popoverVisible, setPopoverVisible] = useState(false); // 控制操作菜单显示
  const [hovered, setHovered] = useState(false); // 卡片悬停状态
  const [showPanel, setShowPanel] = useState(false); // 控制底部面板显示
  const panelRef = useRef(null); // 用于检测点击外部区域
  // 搜索标签
  const [searchTag, setSearchTag] = useState("");

  /**
   * 处理操作菜单项点击
   * @param {string} option - 选中的菜单项
   * @param {object} appInfo - 当前应用信息
   */
  const handleMenuClick = (option, app) => {
    switch (option.key) {
      case "edit"://编辑
        onEditAppInfo?.(app);
        break;
      case "del": //删除
        deleteAppHandle?.(app);
        break;
      case "remove"://下架
        changeMcpStatusEvent(app, false);
        break;
      default:
        break;
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
   * 底部标签组件
   * 根据是否有标签显示不同内容，并处理点击事件
   */
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
      if (!permission) return; // 🔐 没有权限时直接返回，不执行打开操作
      e.stopPropagation();
    };
    return content ? (
      <div
        className={styles["tag-text"]}
        onClick={handleClick}
        style={{
          backgroundColor: hovered ? " rgba(220, 220, 220, 0.3)" : "",
        }}
      >
        <img src="/application/tag_icon.svg" style={{ marginRight: 3 }} />
        <Tooltip
          title={<div style={{ fontSize: 12 }}>{content}</div>}
          color={"rgba(54, 64, 82, 0.90)"}
        >
          <div className={styles["tag-text-content"]}>{content}</div>
        </Tooltip>
      </div>
    ) : <div
        className={styles["tag-text"]}></div>;
  };
  // 标签多选
  let tagOptions = JSON.parse(JSON.stringify(allTagList.slice(0))).map(
    (item) => {
      return {
        label: item.name,
        value: item.id,
      };
    }
  );
  let filteredTagOptions = tagOptions.filter((option) =>
    option.label.toLowerCase().includes(searchTag.toLowerCase())
  );
  const formatAppTagList =
    app.tags && Array.isArray(app.tags) && app.tags.length > 0
      ? app.tags.map((item) => item.id)
      : [];

  const [checkedList, setCheckedList] = useState(formatAppTagList);

  const onSearchTag = (value) => {
    setSearchTag(value);
  };

  const prevShowPanelRef = useRef(showPanel); // 初始化为当前 showPanel 状态
  // 标签发生变化后，关闭下拉面板才触发保存
  useEffect(() => {
    if (prevShowPanelRef.current && !showPanel && !tagManageModal) {
      updateCardTags();
    }
    prevShowPanelRef.current = showPanel;
  }, [showPanel]);

  // 标签多选框更新事件
  const updateCardTags = (arr) => {
    bindKnowledgeBaseTag({
      knowledgeBaseId: app.id,
      tagIds: arr ? arr : checkedList,
    }).then(() => {
      updateAppList();
      setSearchTag("");
      updatetagList();
    });
  };

  //描述超出显示
  function TruncatedTextWithTooltip({ text, isHover,hasTag }) {
    const textRef = useRef(null);
    const [isTruncated, setIsTruncated] = useState(false);

    useEffect(() => {
      const el = textRef.current;
      if (el) {
        // 判断是否截断（即真实内容高度 > 可见高度）
        setIsTruncated(el.scrollHeight > el.clientHeight);
      }
    }, [text]);
  const lineClamp = isHover || hasTag ? 2 : 4;

    const content = (
      <div ref={textRef} className={styles.describe} 
        style={{
        WebkitLineClamp: lineClamp,
      }}>
        {text}
      </div>
    );

    return isTruncated ? (
      <Tooltip
        title={<div style={{ fontSize: 12 }}>{text}</div>}
        color={"rgba(54, 64, 82, 0.90)"}
        placement="rightBottom"
      >
        {content}
      </Tooltip>
    ) : (
      content
    );
  }
  //跳转详情事件
  const goDetailEvent = (app) => {
    detailClickEvent(app);
  };
  //描述超出显示
  function TruncatedTitleWithTooltip({ text }) {
    const titleRef = useRef(null);
    const [titleTruncated, setTitleTruncated] = useState(false);
    const [parentMaxWidth, setParentMaxWidth] = useState(0);

    useEffect(() => {
      const el = titleRef.current;
      if (el) {
        // 判断是否截断（即真实内容高度 > 可见高度）
        setParentMaxWidth(titleRef.current.parentElement.offsetWidth - 5);
        setTitleTruncated(el.scrollWidth > el.clientWidth);
      }
    }, [text]);

    const content = (
      <div
        ref={titleRef}
        style={{ width: parentMaxWidth }}
        className={styles["card_info_title"]}
      >
        {text}
      </div>
    );

    return text.length > 15 ? (
      <Tooltip style={{ fontSize: 12 }} title={text}>
        {content}
      </Tooltip>
    ) : (
      content
    );
  }
  return (
    <div ref={panelRef} style={{ height: 160 }}>
      <Card
        classNames={{
          body: styles["app_card_body"],
        }}
        className={styles["app-card"]}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          setHovered(false);
          setPopoverVisible(false);
        }}
      >
        {permission && (
          <Checkbox
            checked={checked}
            onChange={onCheck}
            className={styles["card_checkbox"]}
          />
        )}
        <div    className={styles["mcp_card_content"]} onClick={() => goDetailEvent(app)}>
          {/* 卡片头部区域 */}
          <div className={styles["card-header"]}>
            <div
              className={styles["card_top"]}
              style={{ display: "flex", flex: 1 }}
            >
              <Avatar
                shape="square"
                size={48}
                icon={<AppstoreOutlined />}
                 src={process.env.NEXT_PUBLIC_API_BASE+app.mcpIconUrl}
                style={{ borderRadius: 12 }}
              />
              <div className={styles["card-info"]}>
                <div className={styles["card-info-container"]}>
                  {/* 显示名称· */}
                  {app.displayName && <TruncatedTitleWithTooltip text={app.displayName} />}
                </div>
                <div className={styles["card_info_time"]}>
                  {app.updateTime} 更新
                </div>
              </div>
            </div>
          </div>

          {/* 应用描述 */}
          {app.description && (
            <TruncatedTextWithTooltip text={app.description} isHover={hovered} hasTag={app.tagList&&app.tagList.length > 0} />
          )}
        </div>
        {/* 底部标签和操作菜单区域 */}
        <div className={styles["tag-container"]}>
          <BottomLabel
            tagList={app.tagList}
            hovered={false}
            permission={permission}
          />
          {/* 按钮操作区域 */}
          {!isSquare&&permission && (
          <div className={styles['action_content']}>
          {!mcpStatus&&(
          <div className={styles['action_content_push']} onClick={()=>{
             changeMcpStatusEvent(app,true);

          }}>
            <img src='/mcp/push.png' /> 上架
          </div> 
      )}
          <Popover
            trigger="click"
            placement="rightTop"
            open={popoverVisible}
            onOpenChange={setPopoverVisible}
            arrow={false}
            content={
              <div
                style={{ width: 120, padding: "4px 3px" }}
              >
                {cardOptions.map((option) => (
                  <div
                    key={option.label}
                    className={styles["popover-select"]}
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
            <EllipsisOutlined
              className={styles["ellipsis-icon"]}
              style={{ cursor: "pointer", fontSize: 18 }}
            />
          </Popover>
         </div>
         )}
        </div>
      </Card>
    </div>
  );
};

export default AppCard;
