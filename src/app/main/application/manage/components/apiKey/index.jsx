"use client";

import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import {
  Button,
  Drawer,
  Table,
  ConfigProvider,
  Row,
  Typography,
  Tooltip,
  message,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import styles from "./index.module.css";
import { useParams } from "next/navigation";
import { getApiKeyList, createApiKey, deleteApiKey } from "@/api/application";
import CreateApiKeyModal from "./Create";
import DeleteApiKeyModal from "./Delete";
const { Text } = Typography;

const Test = forwardRef((props, ref) => {
  const { id } = useParams();
  const [open, setOpen] = useState(false);
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const createApiKeyModalRef = useRef(null);
  const deleteApiKeyModalRef = useRef(null);
  useImperativeHandle(ref, () => ({
    showModal,
    hideModal,
  }));

  const showModal = async (obj) => {
    setOpen(true);
    getApiKeyListEvent();
  };

  //弹框 className
  const classNames = {
    footer: styles["apiKey-drawer-footer"],
    content: styles["apiKey-drawer-content"],
    header: styles["apiKey-drawer-header"],
    body: styles["apiKey-drawer-body"],
  };

  //关闭事件
  const hideModal = () => {
    clearData();
    setOpen(false);
  };

  //清空数据
  const clearData = () => {
    setDataSource([]);
  };

  //创建密钥
  const handleCreateKey = () => {
    createApiKeyModalRef.current.showModal(id);
  };

  //复制密钥
  const copyToClipboard = (secret) => {
    if (!props.canCreate) return;
    if (!secret) return;
    navigator.clipboard
      .writeText(secret)
      .then(() => {
        message.success("复制成功");
      })
  };

  //删除密钥
  const handleDelete = (record) => {
    if (!props.canCreate) return;
    deleteApiKeyModalRef.current.showModal(record.id);
 
  };

  //删除密钥事件
  const deleteApiKeyEvent = (id) => {
    deleteApiKey(id).then(res => {
      message.success("删除成功");
      getApiKeyListEvent();
    }).catch(err => {
      console.error(err);
    });
  };

  //获取密钥列表事件
  const getApiKeyListEvent = () => {
    setLoading(true);
    getApiKeyList(id).then(res => {
     console.log(res);
     setDataSource(res.data);
     setLoading(false);
    }).catch(err => {
      console.error(err);
    });
  };

  //表格列定义
  const columns = [
    {
      title: "密钥",
      dataIndex: "keyValue",
      key: "keyValue",
      width: 200,
      render: (text) => {
        if (!text) return "-";
        const prefix = text.slice(0, 3);
        const suffix = text.slice(-20);
        return  <Tooltip title={text}> <Text style={{ maxWidth: 190}} ellipsis={true}>{prefix}...{suffix}</Text></Tooltip>;
      },
    },
    {
      title: "创建时间",
      dataIndex: "createTime",
      key: "createTime",
      width: 180,
      ellipsis: true,
    },
    {
      title: "最后使用",
      dataIndex: "lastUseTime",
      key: "lastUseTime",
      width: 180,
      ellipsis: true,
      render: (text) => (text ? text : "从未"),
    },
    {
      title: null,
      key: "option",
      dataIndex: "option",
      width: 80,
      render: (_, record) => (
        <div className={styles["option-wrapper"]}>
          <div
            className={`${styles["option-btn"]} ${styles["copy"]} ${!props.canCreate ? styles["option-btn-disabled"] : ""}`}
            onClick={() => { if (props.canCreate) copyToClipboard(record.keyValue); }}
            title="复制"
          ></div>
          <div
            className={`${styles["option-btn"]} ${styles["delete"]} ${!props.canCreate ? styles["option-btn-disabled"] : ""}`}
            onClick={() => { if (props.canCreate) handleDelete(record); }}
            title="删除"
          ></div>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Drawer
         closable={false}
         destroyOnHidden
         title={null}
         placement="right"
         open={open}
         rootStyle={{ boxShadow: "none" }}
         style={{ borderRadius: "24px 0px 0px 24px" }}
         width={700}
         onClose={hideModal}
         classNames={classNames}
         footer={null}
         zIndex={900}
      >
        <div className={styles["apiKey_container"]}>
          {/* 标题 */}
          <div className={styles["apiKey_header"]}>
            <div className={styles["apiKey_header_left"]}>
            <div className={styles["apiKey_title"]}>API 密钥</div>
               {/* 提示信息 */}
          <div className={styles["apiKey_tips"]}>
           如果不想你的API被滥用，请保护好你的API Key，最佳实践是避免在前端代码中明文引用。
          </div>
            </div>
            <div className={styles["apiKey_header_right"]} onClick={hideModal}>
              <img src="/common/close.png" alt="关闭" />
            </div>
         
          </div>

       

          {/* 创建密钥按钮 */}
          <Row className={styles["apiKey_create_btn_container"]}>
            <Button
              type="primary"
              disabled={!props.canCreate}
              className={!props.canCreate?'':styles["apiKey_create_btn"]}
              icon={<PlusOutlined />}
              onClick={handleCreateKey}
            >
              创建密钥
            </Button>
          </Row>

          {/* 表格 */}
          <div className={styles["apiKey_table_container"]}>
            <ConfigProvider
              theme={{
                components: {
                  Table: {
                    headerColor: "#666E82",
                    headerSplitColor: "transparent",
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
                size="small"
                loading={loading}
                rowKey={(record) => record.id || record.key}
              />
            </ConfigProvider>
          </div>
        </div>
      </Drawer>
      <CreateApiKeyModal ref={createApiKeyModalRef} saveCallBack={getApiKeyListEvent} />
      <DeleteApiKeyModal ref={deleteApiKeyModalRef} deleteCallBack={deleteApiKeyEvent} />
    </div>
  );
});

export default Test;
