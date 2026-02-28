"use client";
import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
} from "react";
import { Button, Modal, Spin, Form, Select, Input, message } from "antd";
import styles from "../page.module.css";
import { debounce } from "lodash-es";
import {
  insertExtractionJobApi,
  updateExtractionJobApi,
} from "@/api/knowledgeExtraction";
import { getKnowledgeBaseList } from "@/api/knowledge";
import { getAllTagEdgesApi } from "@/api/graph";

// 常量定义
const CONSTS = {
  MODAL_WIDTH: 640,
  JOB_NAME_MAX_LENGTH: 20,
  TAG_EDGE_MAX_LENGTH: 10,
  SPACE_TYPE: '"GRAPH"',
  DEBOUNCE_DELAY: 150,
  MESSAGES: {
    REQUIRED_JOB_NAME: "请输入任务名称",
    JOB_NAME_START_WITH_NUMBER: "不能以数字开头",
    JOB_NAME_SPECIAL_CHAR: "不能包含下划线（_）以外的特殊字符",
    REQUIRED_SPACE_ID: "请选择知识库",
    REQUIRED_TAGS: "请设置本体名称",
    REQUIRED_EDGES: "请设置关系名称",
    TAG_EDGE_START_WITH_NUMBER: (type, index) =>
      `${type}第${index + 1}个不能以数字开头`,
    TAG_EDGE_SPECIAL_CHAR: (type, index) =>
      `${type}第${index + 1}个不能包含除下划线(_)以外特殊字符`,
    TAG_EDGE_LENGTH: (type, index) =>
      `${type}第${index + 1}个不能超过${CONSTS.TAG_EDGE_MAX_LENGTH}个字符`,
    FETCH_SPACE_FAIL: "获取图谱知识库列表失败",
    OPERATE_SUCCESS: "操作成功",
  },
};

const ExtractAddOrEdit = forwardRef((props, ref) => {
  const [form] = Form.useForm();
  const [currentTask, setCurrentTask] = useState({});
  const [title, setTitle] = useState("新增抽取"); //标题
  const [actionType, setActionType] = useState("add");
  const [isDisable, setIsDisable] = useState(false);
  const [open, setOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [spaceLoading, setSpaceLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [spaceOptions, setSpaceOptions] = useState([]);
  const [objectOptions, setObjectOptions] = useState([]);
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [lastFetchId, setLastFetchId] = useState(0);
  const [spaceName, setSpaceName] = useState("");
  const [searchValue, setSearchValue] = useState("");

  // 监听spaceId变化
  const formSpaceId = Form.useWatch("spaceId", form);

  useImperativeHandle(ref, () => ({
    showModal,
  }));

  // 表单验证规则
  const extRules = {
    jobName: [
      {
        required: true,
        validator: async (_rule, value) => {
          if (!value) {
            return Promise.reject(CONSTS.MESSAGES.REQUIRED_JOB_NAME);
          }
          if (/^\d/.test(value)) {
            return Promise.reject(CONSTS.MESSAGES.JOB_NAME_START_WITH_NUMBER);
          }
          if (!/^[A-Za-z0-9\u4e00-\u9fa5_]+$/.test(value)) {
            return Promise.reject(CONSTS.MESSAGES.JOB_NAME_SPECIAL_CHAR);
          }
          return Promise.resolve();
        },
        trigger: ["blur", "change"],
      },
    ],
    spaceId: [
      {
        required: true,
        validator: async (_rule, value) => {
          if (!value) {
            return Promise.reject(CONSTS.MESSAGES.REQUIRED_SPACE_ID);
          }
          return Promise.resolve();
        },
        trigger: ["change"],
      },
    ],
    tags: [
      {
        required: true,
        validator: async (_rule, value) => {
          if (!Array.isArray(value) || value.length === 0) {
            return Promise.reject(CONSTS.MESSAGES.REQUIRED_TAGS);
          }
          const errors = [];
          value.forEach((tagName, index) => {
            if (/^\d/.test(tagName)) {
              errors.push(
                CONSTS.MESSAGES.TAG_EDGE_START_WITH_NUMBER("本体", index)
              );
            }
            if (/[^A-Za-z0-9\u4e00-\u9fa5_]/.test(tagName)) {
              errors.push(CONSTS.MESSAGES.TAG_EDGE_SPECIAL_CHAR("本体", index));
            }
            if (tagName.length > CONSTS.TAG_EDGE_MAX_LENGTH) {
              errors.push(CONSTS.MESSAGES.TAG_EDGE_LENGTH("本体", index));
            }
          });
          if (errors.length > 0) {
            return Promise.reject(errors.join("；"));
          }
          return Promise.resolve();
        },
        trigger: ["change"],
      },
    ],
    edges: [
      {
        required: true,
        validator: async (_rule, value) => {
          if (!Array.isArray(value) || value.length === 0) {
            return Promise.reject(CONSTS.MESSAGES.REQUIRED_EDGES);
          }
          const errors = [];
          value.forEach((tagName, index) => {
            if (/^\d/.test(tagName)) {
              errors.push(
                CONSTS.MESSAGES.TAG_EDGE_START_WITH_NUMBER("关系", index)
              );
            }
            if (/[^A-Za-z0-9\u4e00-\u9fa5_]/.test(tagName)) {
              errors.push(CONSTS.MESSAGES.TAG_EDGE_SPECIAL_CHAR("关系", index));
            }
            if (tagName.length > CONSTS.TAG_EDGE_MAX_LENGTH) {
              errors.push(CONSTS.MESSAGES.TAG_EDGE_LENGTH("关系", index));
            }
          });
          if (errors.length > 0) {
            return Promise.reject(errors.join("；"));
          }
          return Promise.resolve();
        },
        trigger: ["change"],
      },
    ],
  };

  const vertexLabel = (name, highlightText = "") => {
    const renderHighlightedName = () => {
      if (!highlightText) {
        return (
          <span className={styles["lable-name"]} title={name}>
            {name}
          </span>
        );
      }

      // 转义特殊字符并创建正则表达式
      const escapedHighlightText = highlightText.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );
      const highlightRegex = new RegExp(`(${escapedHighlightText})`, "gi");

      console.log(name, "name");

      // 分割字符串
      const parts = name.split(highlightRegex).filter((part) => part);

      return (
        <span className={styles["lable-name"]} title={name}>
          {parts.map((part, index) => {
            // 检查是否匹配（忽略大小写）
            if (part.toLowerCase() === highlightText.toLowerCase()) {
              return (
                <span key={index} style={{ color: "#4775fd" }}>
                  {part}
                </span>
              );
            }
            return part;
          })}
        </span>
      );
    };

    return (
      <div className={styles["lable-wrapper-test"]} alt={name}>
        {renderHighlightedName()}
      </div>
    );
  };

  // 防抖搜索
  const getSpaceOptions = async (value) => {
    // if (!value) return;

    setSearchLoading(true);
    setLastFetchId((id) => id + 1);
    const fetchId = lastFetchId;

    try {
      const { data: spaceList } = await getKnowledgeBaseList({
        name: value,
        type: CONSTS.SPACE_TYPE,
      });
      if (fetchId !== lastFetchId) return; // 取消过时的请求

      setSpaceOptions(
        spaceList.map((item) => ({
          // label: item.name,
          label: vertexLabel(item.name, value),
          value: item.id,
          spaceName: item.name,
        }))
      );
    } catch (err) {
      message.error(CONSTS.MESSAGES.FETCH_SPACE_FAIL);
      console.error("搜索图谱知识库失败：", err);
    } finally {
      setSearchLoading(false);
    }
  };

  // 防抖函数
  const searchFetchRef = useRef(
    debounce(async (value) => {
      setSearchValue(value);
      await getSpaceOptions(value);
    }, CONSTS.DEBOUNCE_DELAY)
  );

  // 清理防抖定时器
  useEffect(() => {
    const debouncedFunc = searchFetchRef.current;
    return () => debouncedFunc.cancel();
  }, []);

  //显示弹窗
  const showModal = async (obj, type) => {
    setOpen(true);
    let modelTitle = type === "add" ? "新增抽取" : "编辑抽取"; //
    setActionType(type);
    setCurrentTask(obj);
    setIsDisable(obj ? (obj.spaceId ? obj.spaceId : false) : false);
    setTitle(modelTitle); //标题
    await getSpaceOptions();

    // 编辑场景回显数据
    if (type === "edit" && obj) {
      form.setFieldsValue({
        jobName: obj.jobName,
        spaceId: obj.spaceId,
        tags: obj.tags || [],
        edges: obj.edges || [],
      });
      setSpaceName(obj.spaceName);
    }
  };

  //关闭事件
  const modelCancelEvent = () => {
    setOpen(false);
    form.resetFields();
    setSubmitLoading(false);
  };

  //提交事件
  const submitEvent = async (e) => {
    e.preventDefault();
    try {
      setSubmitLoading(true);
      const { jobName, spaceId, tags, edges } = await form.validateFields();
      const params = {
        ...currentTask,
        jobName,
        spaceId,
        spaceName,
        tags,
        edges,
      };

      let result = null;

      if (actionType === "add") {
        result = await insertExtractionJobApi(params);
      } else {
        result = await updateExtractionJobApi(params);
      }
      result.data &&
        submitSuccessEvent(actionType === "add" ? "新增成功" : "编辑成功");
    } catch (err) {
      console.error("表单提交失败：", err);
      setSubmitLoading(false);
    }
  };

  //提交成功事件
  const submitSuccessEvent = (msg) => {
    modelCancelEvent();
    message.success(msg);
    setOpen(false);
    //调用父元素方法
    props?.searchEvent();
  };

  // 图谱知识库变化时清空本体/关系
  const handleSpaceChange = (space, option) => {
    form.setFieldsValue({
      tags: [],
      edges: [],
    });
    setSpaceName(option.spaceName);

    if (!space) {
      return;
    }

    const params = { spaceId: space, tagName: "", type: 0 };
    Promise.all([
      getAllTagEdgesApi(params),
      getAllTagEdgesApi({ ...params, type: 1 }),
    ]).then(([{ data: res }, { data: subject }]) => {
      if (actionType === "add") {
        setObjectOptions(res.map((item) => ({ value: item.tagName })));
        setSubjectOptions(subject.map((item) => ({ value: item.tagName })));
        form.setFieldsValue({
          tags: res.map((item) => item.tagName),
          edges: subject.map((item) => item.tagName),
        });
      } else {
        const tags = form.getFieldValue("tags") || [];
        const edges = form.getFieldValue("edges") || [];
        setObjectOptions(
          tags
            .map((item) => ({ value: item }))
            .concat(
              res
                .filter((item) => !tags.includes(item.tagName))
                .map((item) => ({ value: item.tagName }))
            )
        );
        setSubjectOptions(
          edges
            .map((item) => ({ value: item }))
            .concat(
              subject
                .filter((item) => !edges.includes(item.tagName))
                .map((item) => ({ value: item.tagName }))
            )
        );
      }
    });
  };

  return (
    <Modal
      open={open}
      title=""
      footer={null}
      width={CONSTS.MODAL_WIDTH}
      closable={false}
      onCancel={modelCancelEvent}
      classNames={{ content: "my-modal-content" }}
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
          <Spin spinning={submitLoading || spaceLoading}>
            <Form
              form={form}
              // name="basic"
              layout={"horizontal"}
              labelCol={{
                span: 4,
              }}
              wrapperCol={{
                span: 18,
              }}
              autoComplete="off"
            >
              <Form.Item
                label="任务名称"
                name="jobName"
                rules={extRules.jobName}
              >
                <Input
                  maxLength={CONSTS.JOB_NAME_MAX_LENGTH}
                  placeholder={`输入不超过${CONSTS.JOB_NAME_MAX_LENGTH}个字符`}
                  autoComplete="off"
                />
              </Form.Item>
              <Form.Item
                label="入图知识库"
                name="spaceId"
                rules={extRules.spaceId}
              >
                <Select
                  className={styles["node-select"]}
                  placeholder="请选择图谱知识库"
                  disabled={!!isDisable && actionType === "edit"}
                  filterOption={false}
                  options={spaceOptions}
                  onSearch={(value) => searchFetchRef.current(value)}
                  onChange={handleSpaceChange}
                  loading={searchLoading}
                  showSearch
                />
              </Form.Item>
              <Form.Item label="本体名称" name="tags" rules={extRules.tags}>
                <Select
                  placeholder="请选择图谱知识库后带出知识库本体"
                  mode="tags"
                  disabled={!formSpaceId}
                  filterOption
                  options={objectOptions}
                />
              </Form.Item>
              <Form.Item label="关系名称" name="edges" rules={extRules.edges}>
                <Select
                  placeholder="请选择图谱知识库后带出知识库关系"
                  mode="tags"
                  disabled={!formSpaceId}
                  filterOption
                  options={subjectOptions}
                />
              </Form.Item>
            </Form>
          </Spin>
        </div>
        <div className="model_footer">
          <Button className="model_footer_btn" onClick={modelCancelEvent}>
            取消
          </Button>
          <Button
            onClick={submitEvent}
            loading={submitLoading}
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

export default ExtractAddOrEdit;
