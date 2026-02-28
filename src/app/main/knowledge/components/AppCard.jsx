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
import styles from "../page.module.css";
import {
  bindKnowledgeBaseTag,
  addKnowledgeBaseTag,
  getKnowledgeBaseTagList,
} from "@/api/knowledge";
import { useRouter, useParams } from "next/navigation";
import { useStore } from "@/store/index";
const CheckboxGroup = Checkbox.Group;
const AppCard = ({
  app,
  allTagList,
  onEditAppInfo,
  openTagModal,
  updateAppList,
  updatetagList,
  cardOptions,
  tagManageModal,
  deleteAppHandle,
  permission, //面板操作权限
}) => {
  // 操作菜单选项
  // const cardOptions = ["编辑信息", "删除"];
  const { setCurrentNamespaceObj } = useStore((state) => state);
  const { Paragraph, Text } = Typography;
  const [popoverVisible, setPopoverVisible] = useState(false); // 控制操作菜单显示
  const [hovered, setHovered] = useState(false); // 卡片悬停状态
  const [showPanel, setShowPanel] = useState(false); // 控制底部面板显示
  const panelRef = useRef(null); // 用于检测点击外部区域
  const router = useRouter();
  // 搜索标签
  const [searchTag, setSearchTag] = useState("");

  /**
   * 处理操作菜单项点击
   * @param {string} option - 选中的菜单项
   * @param {object} appInfo - 当前应用信息
   */
  const handleMenuClick = (option, app) => {
    if (option === "编辑信息") {
      onEditAppInfo?.(app);
    }
    if (option === "删除") {
      deleteAppHandle?.(app);
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
      console.log(permission, "permission");

      if (!permission) return; // 🔐 没有权限时直接返回，不执行打开操作
      e.stopPropagation();
      setShowPanel(!showPanel);
    };
    return content ? (
      <div
        className={styles["tag-text"]}
        onClick={handleClick}
        style={{
          backgroundColor: hovered ? " #f5f9fc" : "",
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
    ) : null;
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
  //创建标签
  const createNewTag = () => {
    if (searchTag.trim() === "") {
      return message.warning("标签名不能为空");
    }
    addKnowledgeBaseTag(searchTag).then((res) => {
      //   let addId=res.data;
      //   let addData =checkedList;
      //   addData.push(addId);
      //  updateCardTags(addData);
      message.success("新建标签成功");
      setSearchTag("");
      updatetagList();
    });
  };

  //描述超出显示
  function TruncatedTextWithTooltip({ text, isHover, hasTag }) {
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
        placement="rightBottom"
      >
        {content}
      </Tooltip>
    ) : (
      content
    );
  }
  //数字转为千展示
  const formatToThousands = (value) => {
    if (typeof value !== "number") return value;
    if (value === 0) return 0;
    return (value / 1000).toFixed(2);
  };

  //跳转事件
  const goDocumentEvent = (app) => {
    if (app.type == "GRAPH") {
      setCurrentNamespaceObj(app);
      // router.push(`/main/knowledge/graph?id=${app.id}`);
      router.push(`/main/knowledge/graph?id=${app.id}&menu=parent0`);
    } else if (app.type == "TRAD") {
      router.push(`/main/knowledge/document?id=${app.id}&type=list`);
    }
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
        setParentMaxWidth(titleRef.current.parentElement.offsetWidth - 130);
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
        <div
          className={styles["knowledge_card_content"]}
          onClick={() => goDocumentEvent(app)}
        >
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
                src={
                  app.type && app.type == "GRAPH"
                    ? "/knowledge/map.png"
                    : "/knowledge/document.png"
                }
                style={{ borderRadius: 12 }}
              />
              <div className={styles["card-info"]}>
                <div className={styles["card-info-container"]}>
                  {/* 应用描述 */}
                  {/* {app.name && <TruncatedTitleWithTooltip text={app.name} />} */}
                  {app.name && (
                    <span className={styles["sub-text"]} title={app.name}>
                      {app.name}
                    </span>
                  )}
                  {/* 应用标签 */}
                  {/* {app.type && app.type == "GRAPH"
                    ? "图谱知识库"
                    : "文档知识库"} */}
                </div>
                {app.type == "GRAPH" ? (
                  <div className={styles["card_info_num"]}>
                    <div className={styles["card_info_num_item"]}>
                      {app.applicationCount} 关联应用
                    </div>
                  </div>
                ) : (
                  <div className={styles["card_info_num"]}>
                    <div className={styles["card_info_num_item"]}>
                      {app.documentCount} 文档
                    </div>
                    <Divider type="vertical" />
                    <div className={styles["card_info_num_item"]}>
                      {formatToThousands(app.worldCount)} 千字符
                    </div>
                    <Divider type="vertical" />
                    <div className={styles["card_info_num_item"]}>
                      {app.applicationCount} 关联应用
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 应用描述 */}
          {app.description && (
            <TruncatedTextWithTooltip
              text={app.description}
              isHover={hovered}
              hasTag={app.tags && app.tags.length > 0}
            />
          )}
        </div>
        {/* 底部标签和操作菜单区域 */}
        <div className={styles["tag-container"]}>
          <BottomLabel
            tagList={app.tags}
            hovered={hovered}
            permission={permission}
          />
          {/* 操作菜单弹出框 */}
          <Popover
            trigger="click"
            placement="rightTop"
            open={popoverVisible}
            onOpenChange={setPopoverVisible}
            arrow={false}
            content={
              <div
                style={{ width: 120, padding: "4px 3px" }}
                // onMouseLeave={() => setPopoverVisible(false)}
              >
                {cardOptions.map((option) => (
                  <div
                    key={option.label}
                    className={styles["popover-select"]}
                    onClick={() => handleMenuClick(option.label, app)}
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
              style={{
                cursor: "pointer",
                fontSize: 18,
              }}
            />
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
                placeholder="搜索或创建标签"
                maxLength={50}
                suffix={<SearchOutlined />}
              />
              <AppstoreAddOutlined
                className={styles["add-icon"]}
                onClick={openTagModal}
              />
            </div>
            <div>
              {searchTag.length > 0 && (
                <div className={styles["create-tag"]} onClick={createNewTag}>
                  <PlusOutlined
                    style={{ fontSize: 12, color: "#898F9F", marginRight: 8 }}
                  />
                  <div className={styles["create-tag_content"]}>
                    创建"{searchTag}"
                  </div>
                </div>
              )}
              <CheckboxGroup
                options={filteredTagOptions}
                value={checkedList}
                onChange={(list) => setCheckedList(list)}
                className="card-checkbox-group"
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
