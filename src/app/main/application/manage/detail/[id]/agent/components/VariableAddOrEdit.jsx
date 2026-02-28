"use client";

import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import {
  Button,
  Modal,
  Spin,
  Form,
  Input,
  message,
  InputNumber,
  Checkbox,
} from "antd";
import styles from "../page.module.css";
import { useRouter } from "next/navigation";
import {
  createAgentVariable,
  getAgentVariableDetail,
  editAgentVariable,
} from "@/api/agent";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";

const VariableModel = forwardRef((props, ref) => {
  //子组件暴露方法
  const router = useRouter();
  const [title, setTitle] = useState("添加变量"); //标题
  const [actionType, setActionType] = useState("add"); //
  const { TextArea } = Input;
  useImperativeHandle(ref, () => ({
    showModal,
  }));
  const [open, setOpen] = useState(false);
  const formRef = useRef(null);
  const [loading, setLoading] = useState(false); //加载状态
  const [fieldType, setFieldType] = useState("text"); //过滤变量
  const [applicationId, setApplicationId] = useState(""); //应用id
  const [variableDetail, setVariableDetail] = useState({}); //变量详情
  const showModal = (id, obj, type) => {
    setOpen(true);
    let modelTitle = type === "add" ? "添加变量" : "编辑"; //
    setApplicationId(id);
    setActionType(type);
    setTitle(modelTitle); //标题
    if (type === "update") {
      setFieldType(obj?.fieldType); //过滤变量
      getVariableDetailEvent(obj?.id); //获取变量详情
    } else {
      setFieldType("text"); //过滤变量
      setFormDataEvent(obj, type);
    }
  };
  //获取变量详情
  const getVariableDetailEvent = async (id) => {
    getAgentVariableDetail(id)
      .then((res) => {
        let data = res.data;
        setVariableDetail(res.data); //过滤变量
        let selectOptions = data.selectOptions
          ? data.selectOptions.split(",")
          : [];
        formRef.current.setFieldsValue({
          maxLength: data.maxLength,
          required: data.required,
          selectOptions: selectOptions,
          name: data.name,
          displayName: data.displayName,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  };

  //获取用户信息
  const setFormDataEvent = (obj, type) => {
    setTimeout(() => {
      formRef.current.setFieldsValue({
        maxLength: 48,
        required: true,
      });
    }, 0);
  };

  //关闭事件
  const modelCancelEvent = () => {
    setOpen(false);
    formRef.current.resetFields();
    setLoading(false); // 加载结束
  };
  const classNames = {
    content: styles["my-modal-content"],
  };
  //提交事件
  const submitEvent = async (e) => {
    e.preventDefault();
    const values = await formRef.current.validateFields();
    if (actionType === "add") {
      addSubmitEvent(values);
    } else {
      editSubmitEvent(values);
    }
  };
  //新增提交事件
  const addSubmitEvent = async (values) => {
    let selectOptionArr = fieldType == "select" ? values.selectOptions : [];
    //当存在selectOptions 且为数组时 且 长度大于0时 判断其中的值是否重复
    if (selectOptionArr && selectOptionArr.length > 0) {
      let selectOptionArrSet = new Set(selectOptionArr);
      if (selectOptionArrSet.size !== selectOptionArr.length) {
        message.warning("下拉选项不能重复");
        return;
      }
    }
    let selectOptions = selectOptionArr.join(",");
    let addData = {
      applicationId: applicationId,
      fieldType: fieldType,
      displayName: values.displayName,
      selectOptions: selectOptions,
      maxLength: values.maxLength,
      required: values.required,
      name: values.name,
    };
    createAgentVariable(addData)
      .then((res) => {
        submitSuccessEvent();
      })
      .catch((err) => {
        setLoading(false); // 加载结束
        console.log(err);
      });
  };
  //修改提交事件
  const editSubmitEvent = async (values) => {
    let selectOptionArr = fieldType == "select" ? values.selectOptions : [];
    //当存在selectOptions 且为数组时 且 长度大于0时 判断其中的值是否重复
    if (selectOptionArr && selectOptionArr.length > 0) {
      let selectOptionArrSet = new Set(selectOptionArr);
      if (selectOptionArrSet.size !== selectOptionArr.length) {
        message.warning("下拉选项不能重复");
        return;
      }
    }

    let selectOptions = selectOptionArr.join(",");
    let addData = {
      id: variableDetail.id,
      applicationId: applicationId,
      fieldType: fieldType,
      displayName: values.displayName,
      selectOptions: selectOptions,
      maxLength: values.maxLength,
      required: values.required,
      name: values.name,
    };
    editAgentVariable(addData)
      .then((res) => {
        submitSuccessEvent();
      })
      .catch((err) => {
        setLoading(false); // 加载结束
        console.log(err);
      });
  };
  //提交成功事件
  const submitSuccessEvent = () => {
    setLoading(false); // 加载结束
    modelCancelEvent();
    message.success("操作成功");
    //调用父元素方法
    props?.updateVaiableList();
  };
  const fieldTypeList = [
    //text文本,paragraph段落,select下拉选择，number数字
    { label: "文本", value: "text" },
    { label: "段落", value: "paragraph" },
    { label: "下拉选项", value: "select" },
    { label: "数字", value: "number" },
  ];
  return (
    <Modal
      open={open}
      title=""
      footer={null}
      width="480px"
      closable={false}
      onCancel={modelCancelEvent}
      classNames={classNames}
      zIndex={10000}
    >
      <div className={`${styles["variableForm_add_container"]}`}>
        <div className="model_header">
          <div className="model_header_title" style={{ paddingBottom: '16px' }}>{title}</div>
        </div>
        <div className={`${styles["add_variable_content"]}`}>
            <div className={`${styles["add_variable_content_main"]}`}>
          <Form
            ref={formRef}
            name="basic"
            layout={"vertical"}
            wrapperCol={{
              span: 24,
            }}
            initialValues={{
              maxLength: 48,
              required: true,
            }}
            autoComplete="off"
          >
            <Form.Item label="字段类型" name="fieldType">
              <div className={styles["fieldType_content"]}>
                {fieldTypeList.map((item) => (
                  <div
                    key={item.value}
                    className={`${styles["fieldType_content_item"]} ${
                      fieldType === item.value
                        ? styles["fieldType_content_item_active"]
                        : ""
                    }`}
                    onClick={() => setFieldType(item.value)}
                  >
                    <div className={styles["fieldType_content_item_img"]}>
                      <img alt="字段类型" src={"/agent/" + item.value + ".png"} />
                    </div>
                    <div className={styles["fieldType_content_item_label"]}>
                      {item.label}
                    </div>
                    {fieldType === item.value && (
                      <img
                      alt="选中"
                        className={styles["fieldType_content_item_img_active"]}
                        src="/agent/variable_select.png"
                      />
                    )}
                  </div>
                ))}
              </div>
            </Form.Item>
            <Form.Item
              label="变量名称"
              name="name"
              rules={[
                {
                  required: true,
                  message: "请输入变量名称",
                  trigger: "blur",
                },
                {
                  // 修改正则表达式，使其不能以数字开头，且只能包含英文字符、下划线和数字
                  pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
                  message: "不能以数字开头，只能包含英文字符、下划线和数字",
                  trigger: "blur",
                },
              ]}
            >
              <Input  variant="borderless" className={styles['variable_input']} maxLength={20}  placeholder="输入不超过20个字符" />

            </Form.Item>
            <Form.Item
              label="显示名称"
              name="displayName"
              rules={[
                {
                  required: true,
                  message: "请输入显示名称",
                  trigger: "blur",
                },
                {
                  // 正则修改为不能全为空格
                  pattern: /^(?!\s+$).+$/,
                  message: "格式错误",
                  trigger: "blur",
                },
              ]}
            >
              <Input variant="borderless" className={styles['variable_input']} maxLength={50} placeholder="输入不超过50个字符" />
            </Form.Item>
            {["text", "paragraph"].includes(fieldType) ? (
              <Form.Item label="最大长度" name="maxLength">
                <InputNumber
                  min={1}
                  variant="borderless" className={styles['variable_input']}
                  max={fieldType === "text" ? 256 : 9999}
                  style={{ width: "100%" }}
                />
              </Form.Item>
            ) : null}
            {/* 选项 */}

            {fieldType === "select" && (
              <Form.Item
                label="选项"
                name="selectOptions"
                rules={[
                  {
                    required: true,
                    message: "请输入选项",
                    trigger: "blur",
                    type: "array",
                  },
                ]}
              >
                <Form.List name="selectOptions" label="选项">
                  {(fields, { add, remove }, { errors }) => (
                    <>
                      {fields.map((field, index) => (
                        <Form.Item  required={false} key={field.key}>
                          <div className={styles["fieldType_form_item"]} >
                          <Form.Item
                            {...field}
                            validateTrigger={["onChange", "onBlur"]}
                            rules={[
                              {
                                required: true,
                                whitespace: true,
                                message: "请输入选项",
                              },
                            ]}
                            noStyle
                          >
                            <Input
                            variant="borderless"
                            className={styles['variable_input_select']}
                              maxLength={50}
                              placeholder="请输入选项"
                            
                            />
                          </Form.Item>
                          <img 
                            className={styles["fieldType_content_del"]} 
                            alt="删除"
                            onClick={() => remove(field.name)} 
                            src='/agent/var_del.png' 
                            onMouseEnter={(e) => {
                              e.target.src = '/agent/var_del_hover.png';
                              e.target.parentElement.classList.add(styles["fieldType_form_item_hover"]);
                            }}
                            onMouseLeave={(e) => {
                              e.target.src = '/agent/var_del.png';
                              e.target.parentElement.classList.remove(styles["fieldType_form_item_hover"]);
                            }}
                          />
                          </div>
                        </Form.Item>
                      ))}
                      <Form.Item>
                        <Button
                       
                          onClick={() => add()}
                        className={styles["fieldType_content_add"]} 
                          icon={<PlusOutlined />}
                        >
                          添加选项
                        </Button>
                        <Form.ErrorList errors={errors} />
                      </Form.Item>
                    </>
                  )}
                </Form.List>
              </Form.Item>
            )}
            <Form.Item label="" name="required" valuePropName="checked">
              <Checkbox>必填</Checkbox>
            </Form.Item>
          </Form>
          </div>
        </div>
        <div  className={`${styles["add_variable_content_footer"]}`}>
          <Button   className={styles["knowledge_cancel"]} onClick={modelCancelEvent}>
            取消
          </Button>
          <Button
            onClick={submitEvent}
         className={styles["knowledge_save"]}
            type="primary"
          >
            保存
          </Button>
        </div>
      </div>
    </Modal>
  );
});

export default VariableModel;
