// components/CustomPopover.jsx
import React from "react";
import { Popover, Col, Row, Table } from "antd";
import styles from "./index.module.css";
export default function CustomPopover({ children, placement = "left" }) {
  const modelTableData = [
    {
      key: "1",
      filename: "Dockerfile",
      fileDesc: "Docker镜像构建文件",
      remark: "系统会对该文件进行过滤<br/>仅保留FROM、RUN、ENV",
    },
    {
      key: "2",
      filename: "train.py",
      fileDesc: "训练任务入口脚本",
      remark: "训练任务需要",
    },
    {
      key: "3",
      filename: "train.yaml",
      fileDesc: "训练任务配置文件",
      remark: "训练任务需要",
    },
    {
      key: "4",
      filename: "fine-tuning.py",
      fileDesc: "微调任务入口脚本",
      remark: "微调任务需要",
    },
    {
      key: "5",
      filename: "fine-tuning.yaml",
      fileDesc: "微调任务配置文件",
      remark: "微调任务需要",
    },
    {
      key: "6",
      filename: "eval.py",
      fileDesc: "评估任务入口脚本",
      remark: "评估任务需要",
    },
    {
      key: "7",
      filename: "eval.yaml",
      fileDesc: "评估任务配置文件",
      remark: "评估任务需要",
    },
    {
      key: "8",
      filename: "server.py",
      fileDesc: "部署任务入口脚本",
      remark: "部署任务需要",
    },
    {
      key: "9",
      filename: "server.yaml",
      fileDesc: "部署任务配置文件",
      remark: "部署任务需要",
    },
  ];
  const scriptTableData = [
    {
      key: "1",
      scriptFile: "train.py",
      fileDesc: "训练任务入口脚本",
      supportParams: "--input_dir 输入文件目录<br/>--output_dir 输出文件目录",
      otherDesc: "--",
    },
    {
      key: "2",
      scriptFile: "fine-tuning.py",
      fileDesc: "微调任务入口脚本",
      supportParams: "--input_dir 输入文件目录<br/>--output_dir 输出文件目录",
      otherDesc: "--",
    },
    {
      key: "3",
      scriptFile: "eval.py",
      fileDesc: "评估任务入口脚本",
      supportParams: "--input_dir 输入文件目录<br/>--output_dir 输出文件目录",
      otherDesc: "--",
    },
    {
      key: "4",
      scriptFile: "server.py",
      fileDesc: "部署任务入口脚本",
      supportParams: "--input_dir 输入文件目录",
      otherDesc: "服务的端口需固定为8080<br/>http route固定为/v1/models/infer",
    },
  ];
  const taskDirData = [
    {
      taskName: "训练任务输入/输出目录：",
      dirList: [
        { key: "t1", io: "输入", subDir: "dataset/", desc: "数据集目录" },
        { key: "t2", io: "输出", subDir: "dist_init", desc: "pytorch分布式共享文件" },
        { key: "t3", io: "输出", subDir: "log/", desc: "训练日志存放目录" },
        { key: "t4", io: "输出", subDir: "weight/", desc: "训练权重存放目录" },
        { key: "t5", io: "输出", subDir: "model/", desc: "量化模型存放目录" },
      ],
    },
    {
      taskName: "微调任务输入/输出目录：",
      dirList: [
        { key: "f1", io: "输入", subDir: "dataset/", desc: "数据集目录" },
        { key: "f2", io: "输入", subDir: "weight/", desc: "预训练权重目录" },
        { key: "f3", io: "输出", subDir: "dist_init", desc: "pytorch分布式共享文件" },
        { key: "f4", io: "输出", subDir: "log/", desc: "微调日志存放目录" },
        { key: "f5", io: "输出", subDir: "weight/", desc: "微调权重存放目录" },
        { key: "f6", io: "输出", subDir: "model/", desc: "量化模型存放目录" },
      ],
    },
    {
      taskName: "评估任务输入/输出目录：",
      dirList: [
        { key: "e1", io: "输入", subDir: "dataset/", desc: "数据集目录" },
        { key: "e2", io: "输入", subDir: "weight/", desc: "权重目录" },
        { key: "e3", io: "输入", subDir: "model/", desc: "量化模型目录" },
        { key: "e4", io: "输出", subDir: "log/", desc: "评估日志存放目录" },
      ],
    },
    {
      taskName: "部署任务输入/输出目录：",
      dirList: [
        { key: "d1", io: "输入", subDir: "weight/", desc: "权重目录" },
        { key: "d2", io: "输出", subDir: "model/", desc: "量化模型目录" },
      ],
    },
  ];

  // 解析备注中的换行符
  const renderRemark = (text) => {
    return <div dangerouslySetInnerHTML={{ __html: text }} />;
  };
  const content = () => {
    return (
      <div className={styles.tip_popover_content}>
        <div>
          <div className={styles.tableTitle}>
            模型代码需包含：
            <span className={styles.tableTitle_light}>可根据任务的不同进行适当地缺省</span>
          </div>
          <div className={styles.tableContainer}>
            <Row className={styles.tableHeader} gutter={0}>
              <Col span={8} className={styles.tableCol}>
                文件名
              </Col>
              <Col span={8} className={styles.tableCol}>
                文件说明
              </Col>
              <Col span={8} className={styles.tableCol}>
                备注
              </Col>
            </Row>
            <div className={styles.tableBody}>
              {modelTableData.map((item) => (
                <Row key={item.key} className={styles.tableRow} gutter={0}>
                  <Col span={8} className={styles.tableCol}>
                    {item.filename}
                  </Col>
                  <Col span={8} className={styles.tableCol}>
                    {item.fileDesc}
                  </Col>
                  <Col span={8} className={styles.tableCol}>
                    {renderRemark(item.remark)}
                  </Col>
                </Row>
              ))}
            </div>
          </div>
        </div>
        <div>
          <div className={styles.tableTitle}>脚本文件说明：</div>
          <div className={styles.tableContainer}>
            <Row className={styles.tableHeader} gutter={0}>
              <Col span={4} className={styles.tableCol}>
                脚本文件
              </Col>
              <Col span={4} className={styles.tableCol}>
                文件说明
              </Col>
              <Col span={7} className={styles.tableCol}>
                支持参数
              </Col>
              <Col span={9} className={styles.tableCol}>
                其他说明
              </Col>
            </Row>
            <div className={styles.tableBody}>
              {scriptTableData.map((item) => (
                <Row key={item.key} className={styles.tableRow} gutter={0}>
                  <Col span={4} className={styles.tableCol}>
                    {item.scriptFile}
                  </Col>
                  <Col span={4} className={styles.tableCol}>
                    {item.fileDesc}
                  </Col>
                  <Col span={7} className={styles.tableCol}>
                    {renderRemark(item.supportParams)}
                  </Col>
                  <Col span={9} className={styles.tableCol}>
                    {renderRemark(item.otherDesc)}
                  </Col>
                </Row>
              ))}
            </div>
          </div>
        </div>
        <div>
          <div className={styles.tableTitle}>配置文件说明：</div>
          <div className={styles.tableList}>
            <div>
              1.于页面上即时修改的配置文件将与任务入口脚本文件存放于同一目录，可读取，不可修改。
            </div>
            <div>2.若未对配置文件进行改动，将默认使用提供的配置文件。</div>
          </div>
        </div>
        <div>
          <div className={styles.tableTitle}>目录说明：</div>

          <div className={styles.tableList}>
            <div>1.平台将根据任务的不同，提供目录供脚本文件使用。</div>
            <div>2.输入目录将通过脚本的--input_dir参数传入，该目录仅可读，磁盘上限为50G。</div>
            <div>3.输出目录将通过脚本的--output_dir参数传入，该目录可读写，磁盘上限为50G。</div>
          </div>
        </div>
        {taskDirData.map((task) => (
          <div>
            {" "}
            <div className={styles.tableTitle}>{task.taskName}</div>
            <div className={styles.tableContainer}>
              <Row className={styles.tableHeader} gutter={0}>
                <Col span={8} className={styles.tableCol}>
                  输入/输出
                </Col>
                <Col span={8} className={styles.tableCol}>
                  子目录/文件名称
                </Col>
                <Col span={8} className={styles.tableCol}>
                  说明
                </Col>
              </Row>
              <div className={styles.tableBody}>
                {task.dirList.map((item) => (
                  <Row key={item.key} className={styles.tableRow} gutter={0}>
                    <Col span={8} className={styles.tableCol}>
                      {item.io}
                    </Col>
                    <Col span={8} className={styles.tableCol}>
                      {item.subDir}
                    </Col>
                    <Col span={8} className={styles.tableCol}>
                      {item.desc}
                    </Col>
                  </Row>
                ))}
              </div>
            </div>
          </div>
        ))}
        <div>
          <div className={styles.tableTitle}>分布式说明：</div>
          <div className={styles.tableList}>
            <div>1.所有架构均可通过架构默认的端口进行分布式通信。</div>
            <div>
              2.
              架构为PyTorch的模型，可额外通过共享文件的方式进行分布式训练，共享文件位于输出目录中，文件名为"dist_init"。
            </div>
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
