// components/CustomPopover.jsx
import React from "react";
import { Popover, Col, Row } from "antd";
import styles from "./index.module.css";
export default function CustomPopover({ children, placement = "left" }) {
  const content = () => {
    return (
      <div className={`${styles.tip_popover_content} ${styles.tip_popover_content_ollama} `}>
        <div>
          <p className={styles.tip_popover_title}>模型代码文件需包含：</p>
          <div className={styles.directory_table_container}>
            <Row className={styles.directory_table_row}>
             <Col span={4} className={styles.ollama_table_col_left}>
                文件名
              </Col>
              <Col span={7} className={styles.ollama_table_col_left}>
                文件说明
              </Col>

              {/* 右侧内容列 */}
              <Col span={13} className={styles.directory_table_col_right}>
               备注
              </Col>
            </Row>
            <Row className={styles.directory_table_row}>
              <Col span={4} className={styles.directory_table_col_left_light}>
                Modelfile
              </Col>
              <Col span={7} className={styles.directory_table_col_left_light}>
                ollama模型配置文件
              </Col>

              {/* 右侧内容列 */}
              <Col span={13} className={styles.directory_table_col_right}>
                <div>基础模型存放在/mnt/data/input/model/目录内 </div>
                <div>未量化模型命名为model.gguf </div>
                <div>量化模型命名为model_quant.gguf </div>
                平台默认对模型进行量化
              </Col>
            </Row>
          </div>
        </div>
        <div style={{ marginTop: '12px' }}>
          <p className={styles.tip_popover_title}>Modelfile示例：</p>
          <div className={styles.ollama_temple}>
            <span>1</span>
            <span>FROM /mnt/data/input/model/model_quant.gguf</span>
          </div>
        </div>
      </div>
    );
  };
  return (
    <Popover
      placement={placement}
      arrow={false}
      overlayInnerStyle={{
        transform: "translateX(-30px) translateY(-4%)",
        borderRadius: "16px",
        backgroundColor: "rgba(250, 252, 253, 1)",
        padding: "16px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      }}
      content={content}
    >
      {children}
    </Popover>
  );
}
