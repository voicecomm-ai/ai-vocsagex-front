"use client";
import { forwardRef, useRef, useImperativeHandle, useState, useEffect } from "react";
import { Drawer, Row, Button, Table, ConfigProvider, Modal, Input, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { modelKeyList, modelKeyAdd, modelKeyDelete } from "@/api/model";
import styles from "../page.module.css";
import DeleteModal from "../../components/DeleteModal";
import { checkPermission } from "@/utils/utils";

const ApiKeyDrawer = forwardRef((props, ref) => {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [apiKey, setApikey] = useState("");
  const [modelId, setModelId] = useState(null);
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const deleteRef = useRef(null);

  useImperativeHandle(ref, () => ({
    open: (id) => {
      setModelId(id);
      setOpen(true);
    },
    onClose: () => setOpen(false),
  }));
  useEffect(() => {
    if (open && modelId) {
      // 确保 open 为 true 且 modelId 有值
      getApiKeyList();
    }
  }, [open, modelId]); // 监听 open 和 modelId 的变化

  const columns = [
    {
      title: "密钥",
      dataIndex: "secret",
      key: "secret",
      width: 180,
      render: (text) => {
        if (!text) return "-";
        const prefix = text.slice(0, 3);
        const suffix = text.slice(-20);
        return `${prefix}...${suffix}`;
      },
    },
    {
      title: "创建时间",
      dataIndex: "createTime",
      key: "createTime",
      ellipsis: true,
      width: 140,
    },
    {
      title: "最后使用",
      dataIndex: "lastUsedTime",
      key: "lastUsedTime",
      ellipsis: true,
      width: 120,
      render: (text) => (text ? text : "从未"),
    },
    {
      title: null,
      key: "option",
      dataIndex: "option",
      width: 60,
      render: (_, record) => (
        <div className={styles["option-wrapper"]}>
          <div
            className={`${styles["option-btn"]} ${styles["copy"]} ${!checkPermission("/main/model/square/operation") ? styles.not_allow : ""}`}
            onClick={() => copyToClipboard(record.secret)}
          ></div>
          <div
            className={`${styles["option-btn"]} ${styles["delete"]} ${!checkPermission("/main/model/square/operation") ? styles.not_allow : ""}`}
            onClick={() => deleteApiHandle(record.id)}
          ></div>
          {/* {checkPermission("/main/model/square/operation") && (
            
          )} */}
        </div>
      ),
    },
  ];
  //删除密钥
  const deleteApiHandle = (id) => {
    if(!checkPermission("/main/model/square/operation")) return
    const config = {
      title: "删除此密钥？",
      content: "删除密钥无法撤销，正在使用中的应用会受影响",
      action: () => modelKeyDelete(id),
      onSuccess: () => {
        getApiKeyList();
      },
    };

    deleteRef.current?.open(config);
  };

  //复制表格密钥
  const copyToClipboard = (secret) => {
    if(!checkPermission("/main/model/square/operation")) return
    // 接收 secret 作为参数
    const textToCopy = secret; // 直接使用传入的 secret 值

    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        message.success("已复制到剪贴板");
      })
      .catch((err) => {
        console.error("复制失败:", err);
        // 回退方案
        const textarea = document.createElement("textarea");
        textarea.value = textToCopy;
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand("copy");
          message.success("已复制到剪贴板");
        } catch (err) {
          console.error("回退复制方法失败:", err);
          message.error("复制失败，请手动复制");
        }
        document.body.removeChild(textarea);
      });
  };

  const getApiKeyList = async () => {
    setLoading(true);
    const res = await modelKeyList({ modelId });
    setDataSource(res.data);
    setLoading(false);
  };

  const createKey = async () => {
    setVisible(true);
    const res = await modelKeyAdd({ modelId: modelId });
    setApikey(res.data);
  };

  const handleCancel = async () => {
    await getApiKeyList();
    setVisible(false);
    setApikey("");
  };

  return (
    <Drawer
      open={open}
      onClose={() => setOpen(false)}
      closable={false}
      width={660}
      styles={{
        content: {
          borderRadius: "24px 0px 0px 24px",
          padding: "24px 32px",
          display: "flex",
          flexDirection: "column",
        },
        body: {
          padding: 0,
          overflow: "hidden",
          flex: 1,
          display: "flex",
          flexDirection: "column",
        },
        footer: {
          padding: "22px 0",
        },
      }}
    >
      <div className={styles["api-drawer"]}>
        <div className={styles["drawer-title"]}>
          <span className={styles["title-text"]}>API密钥</span>
          <img
            src='/model/close_icon.svg'
            style={{ cursor: "pointer" }}
            onClick={() => setOpen(false)}
          />
        </div>
        <p className={styles["tips"]}>
          如果不想你的 API 被滥用，请保护好你的API Key，最佳实践是避免在前端代码中明文引用。
        </p>
        <Row>
          <Button
            type='primary'
            className={styles["add-key"]}
            icon={<PlusOutlined />}
            onClick={createKey}
            disabled={!checkPermission("/main/model/square/operation")}
          >
            创建密钥
          </Button>
        </Row>
        <div className={styles["table-container"]}>
          <ConfigProvider
            theme={{
              components: {
                Table: {
                  headerColor: "#666E82",
                  headerSplitColor: "opacity",
                  cellFontSize: 14,
                  colorText: "#364052",
                },
              },
            }}
          >
            <Table
              dataSource={dataSource}
              columns={columns}
              pagination={false}
              size='small'
              loading={loading}
              rowKey={(record) => record.id}
            />
          </ConfigProvider>
        </div>
      </div>
      <Modal
        open={visible}
        closable={false}
        cancelText='好的'
        onCancel={handleCancel}
        okButtonProps={{ style: { display: "none" } }}
        styles={{
          content: {
            borderRadius: 24,
            padding: "26px",
          },
        }}
      >
        <div className={styles["api-modal-title"]}>API密钥</div>
        <p className={styles["tips"]}>请将此密钥保存在安全目可访问的地方.</p>
        <Input
          placeholder='请输入api密钥'
          className={styles["api-input"]}
          value={apiKey}
          suffix={
            <img
              src='/model/api_copy.png'
              width={16}
              style={{ cursor: "pointer" }}
              onClick={() => copyToClipboard(apiKey)}
            ></img>
          }
        />
      </Modal>

      <DeleteModal ref={deleteRef} />
    </Drawer>
  );
});

export default ApiKeyDrawer;
