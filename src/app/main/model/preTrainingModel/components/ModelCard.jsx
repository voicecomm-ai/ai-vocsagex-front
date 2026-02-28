import { useState, useEffect, useRef } from "react";
import { Card, Tag, Avatar, Tooltip, Checkbox, Button, Popover, message } from "antd";
import { AppstoreOutlined, EllipsisOutlined } from "@ant-design/icons";
import styles from "../page.module.css";
import { modelShelfBatch, preTrainModelRegenerate } from "@/api/model";
import EllipsisTooltip from "../../components/EllipsisTooltip";
import { useRouter } from "next/navigation";
const ModelCard = ({
  app,
  onRefresh,
  checked = false,
  onCheck = () => {},
  modelStatus = true,
  edit,
  permission,
  onAction,
}) => {
  const tagList = [app.typeName, app.classificationName];

  const [hovered, setHovered] = useState(false); // 卡片悬停状态
  const panelRef = useRef(null); // 用于检测点击外部区域

  const [popoverVisible, setPopoverVisible] = useState(false); // 控制操作菜单显示

  const putOnOptions = [
    { label: "编辑", isDisabled: false },
    { label: "删除", isDisabled: false },
  ];
  const takeOffOptions = [
    // { label: "加载", isDisabled: false },
    { label: "下架", isDisabled: false },
  ];
  // 操作菜单选项
  const [cardOption, setCardOption] = useState([
    { label: "编辑", isDisabled: false },
    { label: "删除", isDisabled: false },
  ]);

  useEffect(() => {
    let options = modelStatus ? takeOffOptions : putOnOptions;
    if (app.isShelf) {
      options = [{ label: "下架", isDisabled: false }];
    } else {
      if (app.generateStatus === 0) {
        options = [{ label: "删除", isDisabled: false }];
      } else {
        options = [
          { label: "编辑", isDisabled: false },
          { label: "删除", isDisabled: false },
        ];
      }
    }

    setCardOption(options);
  }, [app.generateStatus, modelStatus]);

  const handleMenuClick = async (label, app) => {
    if (label === "编辑") {
      edit(app);
    } else if (label === "重新生成") {
      await preTrainModelRegenerate(app.id);
    } else {
      onAction?.({ label, id: app.id });
    }

    onRefresh();
  };
  // 上架
  const putOnHandle = async (id) => {
    await modelShelfBatch({ ids: [id], isShelf: true });
    onRefresh();
  };

  //描述超出显示
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

  const BottomTag = ({ tags }) => {
    const tagNameArr = tags.map((tag) => tag.name);
    const tagString = tagNameArr.join(", ");
    return (
      <Tooltip
        title={<div style={{ fontSize: 12 }}>{tagString}</div>}
        color={"rgba(54, 64, 82, 0.90)"}
        placement='bottom'
      >
        <div className={styles["tags"]}>{tagString}</div>
      </Tooltip>
    );
  };
  const router = useRouter();
  //进入详情
  const goDetail = () => {
    if (app.generateStatus !== 1) {
      return;
    }
    // router.push(
    //   `/main/model/squareDetail?id=${app.id}&isSquare=false&modelStatus=${modelStatus}&pageName=预训练模型`
    // );
    
    router.push("/main/model/preTrainingModel/" + app.id + "/detail");
  };

  return (
    <div>
      <Card
        className={`${styles["app-card"]} ${checked ? styles["app-card-checked"] : ""}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          setHovered(false);
          setPopoverVisible(false);
        }}
        onClick={goDetail}
      >
        <div className={styles["card-checkbox"]}>
          {/* {app.generateStatus} 0生成中 1生成成功 2生成失败 */}
          {app.generateStatus !== 1 && (
            <span
              className={`${styles["card-status"]} ${
                app.generateStatus === 0 ? styles["status-ing"] : styles["status-fail"]
              }`}
            >
              {app.generateStatus === 2 && (
                <img src='/model/fail.svg' className={styles["fail-icon"]}></img>
              )}
              <span>{app.generateStatus === 0 ? "添加中" : "添加失败"}</span>
            </span>
          )}
          {permission && (
            <Checkbox checked={checked} onChange={onCheck} onClick={(e) => e.stopPropagation()} />
          )}
        </div>

        {/* 卡片头部区域 */}
        <div className={styles["card-header"]}>
          {/* Avatar 不被挤压 */}
          <div className={styles["avatar-wrapper"]}>
            <Avatar
              shape='square'
              size={48}
              icon={<AppstoreOutlined />}
              src={process.env.NEXT_PUBLIC_API_BASE + app.iconUrl}
              style={{ borderRadius: 12 }}
            />
          </div>

          {/* 右侧内容占剩余空间 */}
          <div className={styles["card-info"]}>
             <div className={styles["card-name"]}>
              <EllipsisTooltip maxWidth='88%'>{app.name}</EllipsisTooltip>
            </div>

            <div className={styles["card-info-container"]}>
              <div style={{ display: "flex" }}>
                {tagList.map((tag, index) => (
                  <Tag
                    key={index}
                    style={{
                      color: "#666E82",
                      background: "#fff",
                      height: 20,
                      marginRight: 4,
                      lineHeight: "19px",
                    }}
                  >
                    {tag}
                  </Tag>
                ))}
              </div>
              {app.updateTime && (
                <span className={styles["updated-time"]}>{app.updateTime} 更新</span>
              )}
            </div>
          </div>
        </div>

        {/* 应用描述 */}
        {app.introduction && (
          <TruncatedTextWithTooltip
            text={app.introduction}
            isHover={hovered}
            hasTag={app.tagList.length > 0}
          />
        )}
        <div className={styles["card-bottom"]}>
          {app.tagList.length > 0 && (
            <div className={styles["bottom-left"]}>
              <img src='/application/tag_icon.svg' style={{ marginRight: 4 }} />
              <BottomTag tags={app.tagList}></BottomTag>
            </div>
          )}
          {permission &&  (
            <div className={styles["option-container"]}>
              {/* 当已上架时，根据generateStatus判断是否显示重新生成按钮 */}
              {app.generateStatus === 1 && !app.isShelf && (
                <Button
                  className={styles["put-on-btn"]}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMenuClick("上架", app);
                  }}
                >
                  <img className={styles["batch_icon"]} src={`/model/put_on_icon.png`} />
                  上架
                </Button>
              )}
              {app.generateStatus === 2 && (
                <Button
                  className={styles["put-on-btn"]}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMenuClick("重新生成", app); // 注意：这里事件名改为"重新生成"更合理
                  }}
                >
                  <img className={styles["batch_icon"]} src={`/model/put_on_icon.png`} />
                  重新生成
                </Button>
              )}
              <Popover
                trigger='click'
                placement='rightTop'
                open={popoverVisible}
                onOpenChange={setPopoverVisible}
                arrow={false}
                content={
                  <div style={{ width: 120, padding: "4px 3px" }}>
                    {cardOption.map((option) => (
                      <div
                        key={option.label}
                        className={`${styles["popover-select"]} ${
                          option.label === "删除" ? styles["popover-select-delete"] : ""
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuClick(option.label, app);
                        }}
                        style={{
                          pointerEvents: option.isDisabled ? "none" : undefined,
                          opacity: option.isDisabled ? 0.6 : undefined,
                          color: option.label === "删除" ? "#EE5A55" : "#666e82",
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
                  onClick={(e) => e.stopPropagation()}
                />
              </Popover>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ModelCard;
