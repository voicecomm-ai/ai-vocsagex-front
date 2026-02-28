"use client";
import React, { useState, forwardRef, useImperativeHandle, useRef, useEffect } from "react";
import { Modal, Button, Typography, Form, Input, Radio, message } from "antd";
import { useStore } from "@/store/index";
import styles from "./style.module.css";
import { type } from "os";
import { config } from "process";
import dynamic from "next/dynamic";
import ContentInput from "../ContentInput/index";
// const VariableEditor = dynamic(() => import("../../../../variable-editor"), {
//   ssr: false,
// });

const AuthSettingModel = forwardRef((props, ref) => {
  const { Paragraph, Text } = Typography;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
 const [form] = Form.useForm();
  useImperativeHandle(ref, () => ({
    showModal,
  }));
  const [knowledgeList, setKnowledgeList] = useState([]);
  const [authType, setAuthType] = useState("no-auth");
  const [apiAuthType, setApiAuthType] = useState("basic");
  const [apiKey, setApiKey] = useState("");
  const [header, setHeader] = useState("");
  const [pannerNodeId, setPannerNodeId] = useState("");
  const [authorization, setAuthorization] = useState({});
  const [variableData, setVariableData] = useState([]);
  const formRef = useRef(null);
  const classNames = {
    content: styles["my-modal-content"],
  };

  const authTypes = [
    {
      label: "无",
      value: "no-auth",
    },
    {
      label: "API-Key",
      value: "api-key",
    },
  ];

  const apiAuthTypes = [
    {
      label: "基础",
      value: "basic",
    },
    {
      label: "Bearer",
      value: "bearer",
    },
    {
      label: "自定义",
      value: "custom",
    },
  ];

  const handleChangeAuthType = (e) => {
    // console.log(type, "ttt");
    if (e.target.value === "api-key") {
      setApiAuthType("basic");
    }
    setAuthType(e.target.value);
  };

  const handleChangeApiAuthType = (apiType) => {
  if(props.readOnly) return;
    setApiAuthType(apiType.value);
  };

  const handleHeaderChange = (e) => {
    setHeader(e.target.value);
  };

  //展示模态框
  const showModal = (data, variableData) => {
    // console.log(data, "data");
    setOpen(true);
    setVariableData(variableData);
    setPannerNodeId(pannerNodeId);
    if (data) {
      setAuthType(data.type);
      if (data.type === "api-key") {
        setApiAuthType(data.config?.type);
        // setApiKey(data.config?.api_key);
        if (data.config?.type === "custom") {
          form.setFieldValue("header", data.config?.header);
        }
        form.setFieldValue("apiKey", data.config?.apiKey);
      }
      // authObj = data;
    } else {
      setAuthType("no-auth");
    }
  };
// console.log(form,'formRef.current');

  //模态框关闭事件
  const modelCancelEvent = () => {
    setOpen(false);
  };

  //保存点击
  const saveEvent = async () => {
    // let setArr = sortByOriginalOrder(selectDataCopy, selectData);
    // props.setSelDatabaseFunc(setArr)
    let authObj = {};
    authObj.type = authType;
    if (authType === "no-auth") {
      authObj.config = null;
    } else {
      let value = await form.validateFields();
      let fieldSet = await form.getFieldsValue(true);
      let config = {};
      config.type = apiAuthType;
      if (apiAuthType === "custom") {
        config.header = fieldSet.header;
      }
      config.apiKey = fieldSet.apiKey;
      authObj.config = config;
    }
    resetModal(authObj);

    // setAuthorization(authObj);

    //
  };

  const resetModal = (authObj) => {
    props.setSelAuthFunc(authObj);
    setOpen(false);
  };

  //
  const handleApiKeyChange = (e) => {
    setApiKey(e.target.value);
  };

  return (
    <Modal
      open={open}
      title=''
      footer={null}
      width='480px'
      closable={false}
      onCancel={modelCancelEvent}
      classNames={classNames}
      zIndex={100000}
      styles={{
        content: {
          backgroundImage: 'url("/workflow/auth_bg.png")',
          borderRadius: 16,
          padding: "32px",
          backgroundColor: "#fff",
          backgroundPosition: "top center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "100% auto",
        },
        header: {
          background: "transparent",
        },
      }}
    >
      <div>
        <div className={styles["knowledge_select_container_header"]}>鉴权</div>
        <div className={styles["knowledge_select_container_content"]}>
          <div className={styles["auth_type_wrap"]}>
            <div className={styles["auth_type_label"]}>鉴权类型</div>
            <Radio.Group
              name='authgroup'
              onChange={handleChangeAuthType}
              value={authType}
              disabled={props.readOnly}
              options={[
                {
                  label: <div style={{marginRight:'40px'  }}>无</div>,
                  value: "no-auth",
                },
                {
                  label: <div style={{  }}>API-Key</div>,
                  value: "api-key",
                },
              ]}
            />
          </div>
          <Form layout={"vertical"} ref={formRef}  form={form}>
            {authType === "api-key" && (
              <>
                <div className={styles["auth_type_wrap"]}>
                  <div className={styles["auth_type_label"]}>API鉴权类型</div>
                  <div className={styles["display"]}>
                    {apiAuthTypes.map((apiauth, apiIndex) => (
                      <div
                        onClick={() => handleChangeApiAuthType(apiauth)}
                        className={
                          apiAuthType === apiauth.value
                            ? `${styles["auth_type_item_active"]}`
                            : `${styles["auth_type_item"]}`
                        }
                        key={`${apiauth.value}_${apiIndex}`}
                      >
                        {apiauth.label}
                      </div>
                    ))}
                  </div>
                </div>
                {apiAuthType === "custom" && (
                  <div className={styles["auth_type_wrap"]}>
                    <Form.Item
                      label={"Header"}
                      name={"header"}
                      rules={[{ required: true, message: "请输入" }]}
                    >
                      <Input
                      style={{borderColor:'#dddfe4'}}
                        className={styles["panel_main_header_left_title_input"]}
                        // value={header}
                         disabled={props.readOnly}
                        placeholder='请输入'
                        // onChange={(e) => handleHeaderChange(e)}
                      />
                    </Form.Item>
                  </div>
                )}
                <div className={styles["auth_type_wrap"]} style={{ marginBottom: 0 }}>
                  {/* <ContentInput
                  // nodeData={data}
                  data={apiKey}
                  renderType={"auth"}
                  isHeader={false}
                  updateDataEvent={handleChange}
                  variables={variableData}
                  pannerNodeId={pannerNodeId}
                /> */}
                  <Form.Item
                    label={"API Key"}
                    name={"apiKey"}
                   
                     rules={[
                        {
                          required: true,
                          message: "请输入",
                          trigger: "change",
                        },
                        // {
                        //   pattern: /^[a-zA-Z0-9_]*$/,
                        //   message: "变量名只能包含字母、数字和下划线",
                        // },
                      ]}
                  >
                    <Input
                      className={styles["panel_main_header_left_title_input"]}
                      // value={apiKey}
                       style={{borderColor:'#dddfe4'}}
                       disabled={props.readOnly}
                      placeholder='请输入'
                      // onChange={(e) => handleApiKeyChange(e)}
                    />
                  </Form.Item>
                </div>
              </>
            )}
          </Form>
        </div>
        <div className={styles["knowledge_select_container_footer"]}>
          <div className={styles["knowledge_select_container_footer_btn"]}>
            <Button className={styles["knowledge_cancel"]} onClick={modelCancelEvent}>
              取消
            </Button>
            <Button
              loading={loading}
              className={styles["knowledge_save"]}
              onClick={saveEvent}
              type='primary'
            >
              保存
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
});

export default AuthSettingModel;
