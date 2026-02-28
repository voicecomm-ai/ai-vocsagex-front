"use client";

import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
  useMemo,
} from "react";
import {
  Row,
  Col,
  Button,
  Modal,
  Spin,
  Form,
  Input,
  message,
  Cascader,
  Select,
  InputNumber,
} from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import styles from "./component.module.css";
import { useStore } from "@/store/index";
import { useRouter } from "next/navigation";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import {
  getTagEdgeTtlApi,
  getAllTtlFieldApi,
  createTagEdgeTtlApi,
  dropTagEdgeTtlApi,
} from "@/api/graph";

const { Option } = Select;

const SurvivalTime = forwardRef((props, ref) => {
  //子组件暴露方法
  const router = useRouter();
  const { isCommonSpace, currentNamespaceId, currentNamespaceObj } = useStore(
    (state) => state
  );
  const [title, setTitle] = useState("管理存活时间"); //标题
  const [survivalList, setSurvivalList] = useState([]); //存活时间列表
  const [survivalOption, setSurvivalOption] = useState([]); //存活时间选项
  const [isUpdate, setIsUpdate] = useState(false); //是否更新
  const [open, setOpen] = useState(false);
  const [mainType, setMainType] = useState(""); //主类型
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false); //加载状态

  const validator = useMemo(
    () => ({
      trigger: ["change", "blur"],
      validator: (_rule, value) => {
        const val = value?.toString().trim() || "";
        if (!val) {
          return Promise.reject("请输入存活时间");
        }

        if (!/^\d+$/.test(val)) {
          return Promise.reject("请输入正整数");
        }
        const numValue = Number(val);

        if (numValue === 0) {
          return Promise.reject("存活时间不能为零");
        }

        const maxHours = 24 * 365 * 2;
        if (numValue > maxHours) {
          return Promise.reject(`时间不能大于两年（最大${maxHours}小时）`);
        }
        return Promise.resolve();
      },
    }),
    []
  );

  useImperativeHandle(ref, () => ({
    showModal: (type) => {
      setOpen(true);
      setMainType(type);
      setFormDataEvent(type);
    },
  }));

  // 获取存活时间列表
  const getSurvivalList = (type) => {
    let queryData = {
      tagEdgeId: props.data.tagEdgeId,
      type: type === "substance" ? 0 : 1,
    };
    getAllTtlFieldApi(queryData).then((res) => {
      setSurvivalOption(res.data || []);
    });
  };

  // 获取详情
  const getDetail = async (type) => {
    let queryData = {
      tagEdgeId: props.data.tagEdgeId,
      type: type === "substance" ? 0 : 1,
    };
    await getTagEdgeTtlApi(queryData).then((res) => {
      const { ttlCol, ttlDuration } = res.data || {};
      const newSurvivalList =
        ttlCol && ttlDuration ? [{ ttlCol, ttlDuration }] : [];
      setSurvivalList(newSurvivalList);
      form.setFieldsValue({
        survivalList: newSurvivalList,
      });
    });
  };

  //初始化
  const setFormDataEvent = async (type) => {
    await form.setFieldsValue({ survivalList: [] });

    if (props.data) {
      setIsUpdate(true);
      await getDetail(type);
    } else {
      setIsUpdate(false);
      setSurvivalList([]);
    }
    await getSurvivalList(type);
  };

  // 添加存活时间
  const handleAdd = () => {
    const newItem = { ttlCol: "", ttlDuration: "" };
    const newList = [...survivalList, newItem];
    setSurvivalList(newList);
    form.setFieldsValue({ survivalList: newList });
  };

  // 删除存活时间
  const handleDelete = (index) => {
    const newList = survivalList.filter((_, i) => i !== index);
    setSurvivalList(newList);
    form.setFieldsValue({ survivalList: newList });
  };

  //关闭事件
  const modelCancelEvent = () => {
    setOpen(false);
    form.resetFields();
    setSurvivalList([]);
    setLoading(false); // 加载结束
  };
  const classNames = {
    content: "my-modal-content",
  };
  //提交事件
  const submitEvent = async (e) => {
    e.preventDefault();
    const values = await form.validateFields();
    const submitList = values.survivalList || [];
    setLoading(true);

    setSurvivalList(submitList);

    if (isUpdate) {
      const formData = submitList[0] || {
        ttlCol: "",
        ttlDuration: "0",
      };
      let queryData = {
        ...props.data,
        space: props.data.spaceId,
        ...formData,
        type: mainType === "substance" ? 0 : 1,
      };
      if (submitList.length > 0) {
        await createTagEdgeTtlApi(queryData);
      } else {
        await dropTagEdgeTtlApi(queryData);
      }
    } else {
      createTagEdgeTtlApi({
        // ...props.data,
        // space: props.data?.spaceId,
        survivalList: submitList,
        // type: mainType === "substance" ? 0 : 1,
      });
    }
    submitSuccessEvent();
  };
  //提交成功事件
  const submitSuccessEvent = () => {
    setLoading(false); // 加载结束
    modelCancelEvent();
    message.success("操作成功");
    //调用父元素方法
    props?.searchEvent();
  };

  return (
    <Modal
      open={open}
      title=""
      footer={null}
      width="720px"
      closable={false}
      onCancel={modelCancelEvent}
      classNames={classNames}
      destroyOnHidden
    >
      <div
        className={`${styles["knowledge_add_container"]} ${"model_container"}`}
      >
        <div className={styles["knowledge_add_container_header"]}>
          <div className="model_header">
            <div className={styles["knowledge_add_container_header_title"]}>
              {title}
            </div>
            <img
              className={styles["knowledge_add_container_header_close_img"]}
              onClick={modelCancelEvent}
              src="/close.png"
              alt=""
            />
          </div>
        </div>
        <div
          className="model_content"
          style={{
            marginTop: 16,
          }}
        >
          <Spin spinning={loading}>
            <Form
              form={form}
              name="basic"
              layout={"horizontal"}
              wrapperCol={{
                span: 21,
              }}
              initialValues={{
                survivalList: [],
              }}
              autoComplete="off"
            >
              <Row gutter={20} style={{ marginLeft: 32 }}>
                <Col span={24}>
                  <Form.Item style={{ marginTop: 24 }}>
                    <Button
                      disabled={!!survivalList.length}
                      type="dashed"
                      style={{ width: "100%" }}
                      onClick={handleAdd}
                    >
                      <PlusOutlined />
                      存活时间
                    </Button>
                  </Form.Item>
                </Col>
              </Row>
              {survivalList.map((_, index) => (
                <Row
                  gutter={20}
                  key={`survival-${index}`}
                  style={{ marginLeft: 32 }}
                >
                  <Col span={14}>
                    <Form.Item
                      rules={[
                        {
                          required: true,
                          message: "请选择",
                          type: "string",
                          trigger: "blur",
                        },
                      ]}
                      name={["survivalList", index, "ttlCol"]}
                      wrapperCol={{ span: 24, offset: 0 }}
                    >
                      <Select
                        style={{ width: "100%" }}
                        placeholder="请选择"
                        showSearch
                        optionFilterProp="children"
                        // value={item.ttlCol}
                      >
                        {survivalOption.map((option, optIndex) => (
                          <Option key={`option-${optIndex}`} value={option}>
                            {option}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item
                      rules={[validator]}
                      name={["survivalList", index, "ttlDuration"]}
                      wrapperCol={{ span: 24, offset: 0 }}
                    >
                      <Input
                        placeholder="请输入时间"
                        type="number"
                        // value={item.ttlDuration}
                        min={1}
                        suffix="h"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={2}>
                    <DeleteOutlined
                      style={{
                        color: "red",
                        marginTop: "8px",
                        cursor: "pointer",
                      }}
                      onClick={() => handleDelete(index)}
                    />
                  </Col>
                </Row>
              ))}
            </Form>
          </Spin>
        </div>
        <div className="model_footer">
          <Button
            className="model_footer_btn"
            disabled={loading}
            onClick={modelCancelEvent}
          >
            取消
          </Button>
          <Button
            onClick={submitEvent}
            loading={loading}
            className="model_footer_btn"
            type="primary"
          >
            确定
          </Button>
        </div>
      </div>
    </Modal>
  );
});

export default SurvivalTime;
