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
  Select,
  Slider,
} from "antd";
import styles from "./dialog.module.css";
import { useRouter } from "next/navigation";
import { getUuid } from '@/utils/utils';
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import FileSelect from "./FileSelect";
const VariableModel = forwardRef((props, ref) => {
  //子组件暴露方法
  const router = useRouter();
  const [title, setTitle] = useState("添加变量"); //标题
  const [actionType, setActionType] = useState("add"); //
  const { TextArea } = Input;
  useImperativeHandle(ref, () => ({
    showModal,
    modelCancelEvent
  }));
  const [open, setOpen] = useState(false);
  const formRef = useRef(null);
  const [loading, setLoading] = useState(false); //加载状态
  const [fieldType, setFieldType] = useState("text-input"); //过滤变量d
  const [variableDetail, setVariableDetail] = useState({}); //变量详情
  const fileSelectRef = useRef(null);
  const [upload_methods, setUploadMethods] = useState("both");
  const [max_length_desc, setMaxLengthDesc] = useState(
    "  文档 < 15.00MB, 图片 < 10.00MB, 音频 < 50.00MB, 视频 < 100.00MB"
  );
  const [max_length, setMaxLength] = useState(5);
  const uploadTypes = [
    {
      label: "本地上传",
      value: "local_file",
    },
    {
      label: "URL上传",
      value: "remote_url",
    },
    {
      label: "两者皆可",
      value: "both",
    },
  ];
  const  fileConfRef = useRef(null);
  const showModal = (type,obj) => {
    setOpen(true);
    let modelTitle = type == "add" ? "添加变量" : "编辑"; //
    setActionType(type);
    setTitle(modelTitle); //标题
    if (type === "update") {
       setFieldType(obj?.type); //过滤变量
      setVariableDetail(obj);
      setFormDataEvent(obj,type);
    } else {
      setFieldType("text-input"); //过滤变量
      setFormDataEvent(obj,type);
    }
  };

  //获取用户信息
  const setFormDataEvent = (obj, type) => {
    setTimeout(() => {
       // 初始化文件类型变量
       let fileType = '';
       // 检查对象类型是否为文件或文件列表
       if (obj.type == "file" || obj.type == "file-list") {
         // 根据 allowed_file_types 是否包含 'custom' 来设置文件类型
         fileType = obj?.allowed_file_types.includes('custom') ? {
           // 若包含 'custom'，则设置为自定义类型，并使用 allowed_file_extensions 作为数据
           type: 'custom',
           data: obj?.allowed_file_extensions,
         } : {
           // 若不包含 'custom'，则设置为默认类型，并使用 allowed_file_types 作为数据
           type: 'default',
           data: obj?.allowed_file_types,
         }
       }
      formRef.current.setFieldsValue({
        maxLength: type=='update'? obj?.max_length:48,
        required:type=='update'? obj?.required:true,
        name: obj?.variable,
        displayName: obj?.label,
        type: obj?.type,
        selectOptions: obj?.options,
        fileType:fileType,
      });
     if (obj.type == "file" || obj.type == "file-list") {
      fileConfRef.current.setDetailEvent(obj);
      setUploadMethods(obj?.allowed_file_upload_methods.length>1?'both':obj?.allowed_file_upload_methods[0]);
      setMaxLength(obj?.max_length);
     } 
    }, 100);
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
    let selectOptionArr = fieldType == "select" ? values.selectOptions : [];
    //当存在selectOptions 且为数组时 且 长度大于0时 判断其中的值是否重复
    if (selectOptionArr && selectOptionArr.length > 0) {
      let selectOptionArrSet = new Set(selectOptionArr);
      if (selectOptionArrSet.size !== selectOptionArr.length) {
        message.warning("下拉选项不能重复");
        return;
      }
    }
    let addData = {
      type: fieldType,
      label: values.displayName,
      options: selectOptionArr,//下拉选项列表
      max_length: values.maxLength?values.maxLength:48,
      required: values.required,
      variable: values.name,
      id:actionType=='add'?getUuid():variableDetail.id,
    };

    if (fieldType == "file" || fieldType == "file-list") {
     let allowed_file_upload_methodsText = upload_methods=='both'?'local_file,remote_url':upload_methods;
     addData.allowed_file_upload_methods = allowed_file_upload_methodsText.split(',');
     addData.allowed_file_extensions =  values.fileType.type=='custom'?values.fileType.data:[];

     addData.allowed_file_types = values.fileType.type!='custom'?values.fileType.data:['custom'];
     addData.max_length = max_length;

    }
    console.log(addData,'测试修改bug');

    if (props.variables) {
      const variableName = values.name;
      const isDuplicate = props.variables.some(variable => variable.name === variableName);
      if (isDuplicate) {
        message.warning("变量名不能重复");
        return;
      }
    }
     props?.updateVariableEvent(addData,actionType);
  
    
  
  };
  const fieldTypeList = [
    //text文本,paragraph段落,select下拉选择，number数字
    { label: "文本", value: "text", type: "text-input" },
    { label: "段落", value: "paragraph", type: "paragraph" },
    { label: "下拉选项", value: "select", type: "select" },
    { label: "数字", value: "number", type: "number" },
    { label: "单文件", value: "file", type: "file" },
    { label: "文件列表", value: "file-list", type: "file-list" },
  ];
  const setFieldTypeEvent=(type)=>{
    setFieldType(type);
    fileConfRef.current?.clearDataEvent();
    setUploadMethods('both');
    setMaxLength(5);
    formRef.current.setFieldsValue({
      maxLength: 48,
    });

  }

  return (
    <Modal
      open={open}
      title=""
      footer={null}
      width="470px"
      closable={false}
      maskClosable={false}
      destroyOnHidden={true}
      onCancel={modelCancelEvent}
      classNames={classNames}
      zIndex={10000}
    >
      <div className={`${styles["variableForm_add_container"]}`}>
        <div className="model_header">
          <div className="model_header_title" style={{ paddingBottom: "16px",paddingLeft: "24px",paddingTop:21,fontSize: "21px" }}>
            {title}
          </div>
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
                        fieldType == item.type
                          ? styles["fieldType_content_item_active"]
                          : ""
                      }`}
                      onClick={() => setFieldTypeEvent(item.type)}
                    >
                      <div className={styles["fieldType_content_item_img"]}>
                        <img alt="" src={"/agent/" + item.value + ".png"} />
                      </div>
                      <div className={styles["fieldType_content_item_label"]}>
                        {item.label}
                      </div>
                      {fieldType === item.type && (
                        <img
                          alt=""
                          className={
                            styles["fieldType_content_item_img_active"]
                          }
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
                <Input
                  variant="borderless"
                  className={styles["variable_input"]}
                  maxLength={20}
                  placeholder="输入不超过20个字符"
                />
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
                <Input
                  variant="borderless"
                  className={styles["variable_input"]}
                  maxLength={50}
                  placeholder="输入不超过50个字符"
                />
              </Form.Item>
              {["text-input", "paragraph"].includes(fieldType) ? (
                <Form.Item label="最大长度" name="maxLength">
                  <InputNumber
                    min={1}
                    variant="borderless"
                    className={styles["variable_input"]}
                    max={fieldType === "text-input" ? 256 : 9999}
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
                          <Form.Item required={false} key={field.key}>
                            <div className={styles["fieldType_form_item"]}>
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
                                  style={{ height: "36px" }}
                                  variant="borderless"
                                  maxLength={50}
                                  placeholder="请输入选项"
                                />
                              </Form.Item>
                              <img
                                alt=""
                                className={styles["fieldType_content_del"]}
                                onClick={() => remove(field.name)}
                                src="/agent/var_del.png"
                                onMouseEnter={(e) => {
                                  e.target.src = "/agent/var_del_hover.png";
                                  e.target.parentElement.classList.add(
                                    styles["fieldType_form_item_hover"]
                                  );
                                }}
                                onMouseLeave={(e) => {
                                  e.target.src = "/agent/var_del.png";
                                  e.target.parentElement.classList.remove(
                                    styles["fieldType_form_item_hover"]
                                  );
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
              {/* 文件 */}
              {["file", "file-list"].includes(fieldType) && (
                <Form.Item
                  rules={[
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        console.log(value,'value')

                        if (!value) {
                            return Promise.reject(new Error('请选择支持的文件类型'));
                        }
                        if(value.type=='custom'&&!value.data){
                          return Promise.reject(new Error('请输入文件拓展名'));
                        }
                        return Promise.resolve();
                      },
                      trigger: "blur",
                    }),
                  ]}
                  label="支持的文件类型"
                  name="fileType"
                >
                  <FileSelect ref={fileConfRef}  onChange={(updated) => {
                    formRef.current.setFieldsValue({ fileType: updated });
                  
                  }} />
                </Form.Item>
              )}
              {/* 文件 */}
              {["file", "file-list"].includes(fieldType) && (
                <Form.Item label="上传文件类型" name="upload_methods">
                  <div className={styles["upload_methods"]}>
                    {uploadTypes.map((item) => (
                      <div
                        onClick={() => setUploadMethods(item.value)}
                        className={`${styles["upload_methods_item"]} ${
                          upload_methods === item.value
                            ? styles["upload_methods_item_active"]
                            : ""
                        }`}
                        key={item.value}
                      >
                        {item.label}
                      </div>
                    ))}
                  </div>
                </Form.Item>
              )}
              {["file-list"].includes(fieldType) && (
                <Form.Item label="最大上传数" name="max_length">
                  <div className={styles["max_length_desc"]}>
                    {max_length_desc}
                    </div>
                    <div className={styles["max_length_input"]}>
                      <InputNumber
                        min={1}
                        step={1}
                        variant="borderless"
                        className={styles["variable_input"]}
                        max={10}
                        value={max_length}
                        onChange={(value) => setMaxLength(value)}
                        stringMode={false}
                        precision={0}
                      />
                      <div className={styles["max_length_slider"]}>
                        <Slider
                          onChange={(value) => setMaxLength(value)}
                          value={max_length}
                          min={1}
                          max={10}
                          step={1}
                        />
                      </div>
                    </div>
                 
                </Form.Item>
              )}
              <Form.Item label="" name="required" valuePropName="checked">
                <Checkbox>必填</Checkbox>
              </Form.Item>
            </Form>
          </div>
        </div>
        <div className={`${styles["add_variable_content_footer"]}`}>
          <Button
            className={styles["knowledge_cancel"]}
            onClick={modelCancelEvent}
          >
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
