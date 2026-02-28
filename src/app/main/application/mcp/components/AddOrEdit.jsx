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
  Form,
  Select,
  Radio,
  Input,
  Tooltip,
  Slider,
  ConfigProvider,
  Switch,
  Popover,
} from "antd";
import { message } from "antd";
import styles from "../mcp.module.css";
const { TextArea } = Input;
import { addMcp, updateMcp, getMcpTagList, getMcpDetail } from "@/api/mcp";
import IconSelectorPopover from "./IconSelectorPopover";
import JsonEditorPage from "./JsonEditorPage"; //参数编辑器
import Ajv from "ajv";
const AddOrEdit = forwardRef((props, ref) => {
  useImperativeHandle(ref, () => ({
    showModal,
    hideModal,
  }));
  const [open, setOpen] = useState(false);
  const formRef = useRef(null);
  const [title, setTitle] = useState("添加MCP"); //标题
  const [data, setData] = useState({}); //数据
  const [loading, setLoading] = useState(false); //加载中
  const [action, setAction] = useState("add"); //操作类型 add 新增 update编辑
  const iconRef = useRef(null);
  const [tagList, setTagList] = useState([]); //标签列表
  const [selectedIcon, setSelectedIcon] = useState(
    "/file/voicesagex-console/defaultMcpIcon/1.png"
  ); //默认图标
  const [jsonError, setJsonError] = useState(null);
  const [jsonContent, setJsonContent] = useState({
    json: null,
  });
  const jsonRef = useRef(null);
  const showModal = async (obj, type) => {
    setLoading(true);
    setOpen(true);
    setTitle(type == "add" ? "添加MCP" : "编辑MCP");
    await getTagListEvent();
    setAction(type); //agent 智能体 knowledge 知识库

    if (type == "update") {
      await getDetailEvent(obj);
    } else {
      formRef.current.setFieldsValue({
        transport: "streamable_http",
      });
      //随机生成图标
      setSelectedIcon(randomIcon());
      setLoading(false);
    }
  };


  // 内部定义默认图标数组，避免外部引用，且作为函数内部私有
  const randomIcon = () => {
    const icons = [
      "/file/voicesagex-console/defaultMcpIcon/1.png",
      "/file/voicesagex-console/defaultMcpIcon/2.png",
      "/file/voicesagex-console/defaultMcpIcon/3.png",
      "/file/voicesagex-console/defaultMcpIcon/4.png",
      "/file/voicesagex-console/defaultMcpIcon/5.png",
      "/file/voicesagex-console/defaultMcpIcon/6.png",
      "/file/voicesagex-console/defaultMcpIcon/7.png",
      "/file/voicesagex-console/defaultMcpIcon/8.png",
      "/file/voicesagex-console/defaultMcpIcon/9.png",
      "/file/voicesagex-console/defaultMcpIcon/10.png",
      "/file/voicesagex-console/defaultMcpIcon/11.png",
      "/file/voicesagex-console/defaultMcpIcon/12.png",
      "/file/voicesagex-console/defaultMcpIcon/13.png"
    ];
    if (!Array.isArray(icons) || icons.length === 0) {
      // 兜底，如果数组有误则返回第一个图标路径或者空字符串
      return "/file/voicesagex-console/defaultMcpIcon/1.png";
    }
    const index = Math.floor(Math.random() * icons.length);
    return icons[index];
  };


  //初始化编辑器
  const getDetailEvent = async (obj) => {
    getMcpDetail(obj.id)
      .then((res) => {
        let data = res.data;
        setData(data);
        let tagArr = data.tagList || [];
        let tagIds = [];
        tagArr.forEach((item) => {
          tagIds.push(item.id);
        });
        formRef.current.setFieldsValue({
          displayName: data.displayName,
          internalName: data.internalName,
          description: data.description,
          params: data.params,
          url: data.url,
          tagList: tagIds,
          transport: data.transport,
        });

        setSelectedIcon(data.mcpIconUrl);

        setLoading(false);
      })
      .catch((err) => {
        console.log(err, "测试");
        setLoading(false);
      });
  };
  //获取标签列表
  const getTagListEvent = async () => {
    let data = {
      name: "",
    };
    await getMcpTagList(data).then((res) => {
      let data = res.data;
      setTagList(data);
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
  //提交事件
  const submitEvent = async (e) => {
    e.preventDefault();
    const values = await formRef.current.validateFields();
    let tagIds = [];
    tagList.forEach((item) => {
      if (values.tagList && values.tagList.includes(item.id)) {
        tagIds.push(item);
      }
    });
    let formData = {
      id: null,
      displayName: values.displayName,
      internalName: values.internalName,
      description: values.description,
      params: values.params,
      mcpIconUrl: selectedIcon,
      isShelf: false,
      tagList: tagIds,
      url: values.url,
      transport: values.transport,
    };
    if (action == "add") {
      addMcp(formData)
        .then((res) => {
          submitSuccessEvent();
        })
        .catch((err) => {
          setLoading(false); // 加载结束
        });
    } else {
      formData.id = data.id;
      updateMcp(formData)
        .then((res) => {
          submitSuccessEvent();
        })
        .catch((err) => {
          setLoading(false); // 加载结束
        });
    }
  };
  // 校验 params 字段是否为合法的 JSON Schema 格式
  const validateParams = (value, jsonError) => {
    if (!value) {
      return Promise.reject(new Error("请输入参数"));
    }

    if (jsonError) {
      return Promise.reject(new Error(jsonError));
    }

    try {
      const parsed = typeof value === "string" ? JSON.parse(value) : value;
      const ajv = new Ajv();

      // 尝试编译 schema，判断其合法性
      ajv.compile(parsed);

      return Promise.resolve();
    } catch (err) {
      return Promise.reject(new Error("参数不是一个合法的 JSON Schema"));
    }
  };
  //提交成功事件
  const submitSuccessEvent = () => {
    setLoading(false); // 加载结束
    hideModal();
    message.success("操作成功");
    //调用父元素方法
    props?.searchEvent(action);
  };

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
        width={630}
        onClose={hideModal}
        classNames={classNames}
        footer={null}
      >
        <div className={styles["mcp_update"]}>
          <div className={styles["mcp_update_header"]}>
            <div className={styles["mcp_update_header_title"]}>{title}</div>
            <img
              className={styles["mcp_update_header_close"]}
              src="/close.png"
              alt=""
              onClick={hideModal}
            />
          </div>
          <div className={styles["mcp_update_content"]}>
            <ConfigProvider
              theme={{
                components: {
                  Form: {
                    verticalLabelPadding: "0 0 4px",
                  },
                },
              }}
            >
              <Form
                ref={formRef}
                layout="vertical"
                autoComplete="off"
                disabled={loading}
              >
                <div className={styles["mcp_update_content_header"]}>
                  <div className={styles["mcp_update_content_header_img"]}>
                    <Popover
                      placement="rightTop"
                      content={
                        <IconSelectorPopover
                          value={selectedIcon}
                          onChange={setSelectedIcon}
                        />
                      }
                      arrow={false}
                      ref={iconRef}
                    >
                      <img
                        src={process.env.NEXT_PUBLIC_API_BASE + selectedIcon}
                      />
                    </Popover>
                  </div>

                  <Form.Item
                    name="displayName"
                    label="MCP名称"
                    className={styles["mcp_update_content_header_form"]}
                    rules={[{ required: true, message: "请输入MCP名称" }]}
                  >
                    <Input
                      variant="filled"
                      className={styles["mcp_update_input"]}
                      maxLength={50}
                      placeholder="请输入MCP名称 不超过50字"
                    />
                  </Form.Item>
                </div>
                <Form.Item
                  name="internalName"
                  label="MCP内部名称"
                  rules={[
                    { required: true, message: "请输入MCP内部名称" },
                    {
                      pattern: /^[a-zA-Z0-9_\-:.:\/]+$/,
                      message: "仅支持英文、数字、下划线、-、:、.、/",
                    },
                  ]}
                >
                  <Input
                    variant="filled"
                    className={styles["mcp_update_input"]}
                    maxLength={50}
                    placeholder="仅包含英文、数字、下划线、-、：、.、/ 不超过50个字符"
                  />
                </Form.Item>

                <Form.Item name="tagList" label="标签">
                  <Select
                    variant="borderless"
                    className={styles["mcp_update_input"]}
                    placeholder="请选择标签"
                    mode="multiple"
                    maxTagCount={1}
                    showSearch // 显示搜索框
                    filterOption={(
                      input,
                      option // 自定义搜索逻辑
                    ) =>
                      option.children
                        .toLowerCase()
                        .indexOf(input.toLowerCase()) >= 0
                    }
                    optionFilterProp="children" // 指定搜索的字段
                  >
                    {tagList.map((tag) => (
                      <Select.Option
                        key={tag.id}
                        value={tag.id}
                        label={tag.name}
                      >
                        {tag.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item
                  name="url"
                  label="URL地址"
                  rules={[{ required: true, message: "请输入URL地址" }]}
                >
                  <Input
                    disabled={action == "update"}
                    variant="filled"
                    className={styles["mcp_update_input"]}
                    maxLength={100}
                    placeholder="请输入URL地址"
                  />
                </Form.Item>
                <Form.Item
                  name="description"
                  label="描述"
                  rules={[{ required: true, message: "请输入描述" }]}
                >
                  <TextArea
                    variant="filled"
                    className={styles["mcp_update_input"]}
                    autoSize={{ minRows: 5, maxRows: 6 }}
                    maxLength={200}
                    showCount
                    placeholder="请输入描述，不超过200字"
                  />
                </Form.Item>
                <Form.Item
                  name="transport"
                  label="通信协议"
                  rules={[{ required: true, message: "请选择通信协议" }]}
                >
                  <Radio.Group
                    options={[
                      { value: "streamable_http", label: "StreamableHttp" },
                      { value: "stdio", label: "Stdio" },
                    ]}
                  />
                </Form.Item>
                {/* <Form.Item
                name="params"
                label="参数"
                rules={[
                  {
                    required: true,
                    validator: (_, value) => validateParams(value, jsonError),
                  },
                ]}
              >
                <JsonEditorPage
                  ref={jsonRef}
                  onChange={(updated) => {
                    console.log(updated, "1");
                    formRef.current.setFieldsValue({ params: updated });
                    setJsonContent(updated);
                  }}
                  onError={(errMsg) => {
                    formRef.current.validateFields(["params"]);
                    setJsonError(errMsg);
                  }}
                />
              </Form.Item> */}
              </Form>
            </ConfigProvider>
          </div>
          {/* 底部 */}
          <div className={styles["mcp_update_footer"]}>
            <Button
              key="back"
              className={styles["role_cancel_btn"]}
              onClick={hideModal}
            >
              取消
            </Button>
            <Button
              key="submit"
              className={styles["role_save_btn"]}
              disabled={loading}
              type="primary"
              onClick={submitEvent}
            >
              确定
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
});

export default AddOrEdit;
