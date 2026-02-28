import { useState, useEffect, useRef } from "react";
import { Avatar, Tooltip, Button } from "antd";
import { AppstoreOutlined } from "@ant-design/icons";
import styles from "../page.module.css";
import { useRouter } from "next/navigation";

import EllipsisTooltip from "../../components/EllipsisTooltip";

const AppCard = ({ app }) => {
  //描述超出显示
  function TruncatedTextWithTooltip({ text }) {
    const textRef = useRef(null);
    const [isTruncated, setIsTruncated] = useState(false);

    useEffect(() => {
      const el = textRef.current;
      if (el) {
        // 判断是否截断（即真实内容高度 > 可见高度）
        setIsTruncated(el.scrollHeight > el.clientHeight);
      }
    }, [text]);

    const content = (
      <div ref={textRef} className={styles.describe}>
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
    router.push(`/main/model/squareDetail?id=${app.id}&isSquare=true&pageName=模型广场`);
  };

  return (
    <div
      className={styles["app-card"]}
    >
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
            <EllipsisTooltip maxWidth='92%'>{app.name}</EllipsisTooltip>
          </div>
          <div className={styles["card-info-container"]}>
            <div className={styles["card-author"]}>
              {" "}
              <img src='/model/voice_logo.png' alt='' width={16} height={16} />
              <span>通晓官方@wakwabil.gy</span>
            </div>
          </div>
        </div>
      </div>

      {/* 应用描述 */}
      {app.introduction && <TruncatedTextWithTooltip text={app.introduction} />}
      <div className={styles["card_bottom"]}>
        <div className={styles["card_bottom_left"]}>
          {app.type ? (
            <div className={styles["model_type_pre"]}>
              <img src='/model/color_pre.png' className={styles["model_icon"]} />
              <span>预训练模型</span>
            </div>
          ) : (
            <div className={styles["model_type_algo"]}>
              <img src='/model/color_algo.png' className={styles["model_icon"]} />
              <span>算法模型</span>
            </div>
          )}
          <div className={styles["model_classify"]}>{app.classificationName}</div>
        </div>
        {app.updateTime && <div className={styles["updated-time"]}>{app.updateTime} 更新</div>}
      </div>
      <Button type='primary' className={styles["check_button"]} onClick={goDetail}>
        查看
      </Button>
    </div>
  );
};

export default AppCard;
