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
  Select,
  Radio,
  Input,
  InputNumber,
  Tooltip,
  Slider,
  ConfigProvider,
  Switch,
  Popover,
  Typography,
  Avatar
} from "antd";
import { message } from "antd";
import styles from "../mcp.module.css";
import { useRouter } from "next/navigation";
const { TextArea } = Input;
const { Paragraph, Text } = Typography;
import { addMcp, updateMcp, getMcpTagList, getMcpDetail } from "@/api/mcp";
import Form from "@rjsf/antd";
import validator from "@rjsf/validator-ajv8";
import "antd/dist/reset.css";
const McpDetail = forwardRef((props, ref) => {
  useImperativeHandle(ref, () => ({
    showModal,
    hideModal,
  }));
  const [open, setOpen] = useState(false);
  const formRef = useRef(null);
  const [data, setData] = useState({}); //数据
  const [loading, setLoading] = useState(false); //加载中
  const [schema, setSchema] = useState({});
  const showModal = async (obj) => {
    await getDetailEvent(obj);
    setOpen(true);
  };

  //初始化编辑器
  const getDetailEvent = async (obj) => {
    setLoading(true);
    getMcpDetail(obj.id)
      .then((res) => {
        let data = res.data;
        data.tagText = data.tagList
          ? data.tagList.map((tag) => tag.name).join(",")
          : "";
        let schema = JSON.parse(data.params);
        console.log(schema, "11");
        setSchema(schema);
        setData(data);
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
      });
  };
  //弹框 className
  const classNames = {
    footer: styles["role-drawer-footer"],
    content: styles["knowledge-drawer-content"],
    header: styles["role-drawer-header"],
    body: styles["knowledge-drawer-body"],
  };
  //关闭事件
  const hideModal = () => {
    setOpen(false);
  };
  const handleSubmit = () => {};

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
        width={560}
        onClose={hideModal}
        classNames={classNames}
        footer={null}
      >
        <div className={styles["mcp_detail"]}>
          <div className={styles["mcp_update_header"]}>
            <div className={styles["mcp_update_header_title"]}></div>
            <img
              className={styles["mcp_update_header_close"]}
              src="/close.png"
              alt=""
              onClick={hideModal}
            />
          </div>
          <div className={styles["mcp_update_content"]}>
            <div className={styles["mcp_detail_header"]}>
              <div   className={styles["mcp_detail_header_left"]}>
                         <Avatar
                shape="square"
                size={48}
                 src={process.env.NEXT_PUBLIC_API_BASE+data.mcpIconUrl}
                style={{ borderRadius: 12 }}
              />
              </div>
              <div className={styles["mcp_detail_header_right"]}>
                <div className={styles["mcp_detail_header_right_title"]}>
                  <Text
                    style={{ maxWidth: 430 }}
                    ellipsis={{ tooltip: data.displayName }}
                  >
                    {data.displayName}
                  </Text>
                </div>
                <div className={styles["mcp_detail_header_right_tag"]}>
                  {data.updateTime} 更新
                </div>
              </div>
            </div>
            <div className={styles["mcp_detail_desc"]}>{data.description}</div>

            {data.tagText && (
              <div className={styles["mcp_detail_tag"]}>
                <img
                  src="/application/tag_icon.svg"
                  style={{ marginRight: 3 }}
                />
                <Text
                  style={{ maxWidth: 430 }}
                  ellipsis={{ tooltip: data.tagText }}
                >
                  {data.tagText}
                </Text>
              </div>
            )}

            <div className={styles["mcp_detail_form_title"]}>
              <div className={styles["mcp_detail_form_left"]}></div>
              通信协议
            </div>
            <div className={styles["mcp_detail_tagbox"]}>
                  <div className={styles["mcp_detail_tagbox_item"]}>
  {data.transport == "streamable_http"
                ? "Streamable Http"
                : "Stdio"}
                  </div>
            
            </div>
            <div className={styles["mcp_detail_form_title"]}>
              <div className={styles["mcp_detail_form_left"]}></div>
              URL地址
            </div>
            <div className={styles["mcp_detail_url"]}>{data.url}</div>
            {/* <div className={styles["mcp_detail_form"]}>
              <div className={styles["mcp_detail_form_title"]}>
                <div className={styles["mcp_detail_form_left"]}></div>
                MCP参数
              </div>
             <div className={styles['mcp_detail_form_content']}>
              
              <Form
                submitButtonProps={{ style: { display: "none" } }}
                liveValidate
                showErrorList={false}
                validator={validator}
                schema={schema}
                onSubmit={handleSubmit}
              >
                <div style={{ textAlign: "right", marginTop: 24 }}>
                  <Button type="primary" htmlType="submit" disabled>
                    提交
                  </Button>
                </div>
              </Form>
             </div> 
            </div> */}
          </div>
        </div>
      </Drawer>
    </div>
  );
});

export default McpDetail;
