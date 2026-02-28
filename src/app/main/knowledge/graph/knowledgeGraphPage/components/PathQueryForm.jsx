import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  Form,
  Select,
  InputNumber,
  Radio,
  Checkbox,
  Divider,
  Spin,
  Tooltip,
  Tag,
  AutoComplete,
  Input,
  message,
} from "antd";
import { SearchOutlined, QuestionCircleFilled } from "@ant-design/icons";
import { debounce } from "lodash-es";
import styles from "../page.module.css";
import { useStore } from "@/store/index";
import { getEdgeListApi, selectVertexInfoApi } from "@/api/graphVisualization";

const PathQueryForm = ({ form, currentNode }) => {
  const { currentNamespaceId } = useStore((state) => state);
  const [typeOptions, setTypeOptions] = useState([]);
  const selectedTypes = Form.useWatch("edgeNameList", form);
  const [indeterminate, setIndeterminate] = useState(false);

  // 起点状态管理
  const [startDisplayValue, setStartDisplayValue] = useState("");
  const [startLastSelectedValue, setStartLastSelectedValue] = useState(null);
  const [startOptions, setStartOptions] = useState([]);
  const [startFetching, setStartFetching] = useState(false);
  const [startLastFetchId, setStartLastFetchId] = useState(0);

  // 终点状态管理
  const [endDisplayValue, setEndDisplayValue] = useState("");
  const [endLastSelectedValue, setEndLastSelectedValue] = useState(null);
  const [endOptions, setEndOptions] = useState([]);
  const [endFetching, setEndFetching] = useState(false);
  const [endLastFetchId, setEndLastFetchId] = useState(0);

  // 初始化起点值
  useEffect(() => {
    if (currentNode) {
      const initValue = {
        label: currentNode.data?.("name") || currentNode.name,
        value: currentNode.id?.() || currentNode.id,
        originName: currentNode.data?.("name") || currentNode.name,
        vertexName: currentNode.data?.("name") || currentNode.name,
        vertexId: currentNode.id?.() || currentNode.id,
        tags: currentNode.data?.("vertexTagName") || [],
      };
      setStartLastSelectedValue(initValue);
      setStartDisplayValue(initValue.label);
      // 同步到表单
      form.setFieldsValue({
        startLabel: {
          label: initValue.label,
          value: initValue.value,
          originName: initValue.originName,
          vertexName: initValue.vertexName,
          vertexId: initValue.vertexId,
          tags: initValue.tags,
        },
      });
    }
  }, [currentNode, form]);

  useEffect(() => {
    const startLabelValue = form.getFieldValue("startLabel");
    if (startLabelValue && startLabelValue.originName) {
      setStartDisplayValue(startLabelValue.originName);
      setStartLastSelectedValue(startLabelValue);
    }

    const endLabelValue = form.getFieldValue("endLabel");
    if (endLabelValue && endLabelValue.originName) {
      setEndDisplayValue(endLabelValue.originName);
      setEndLastSelectedValue(endLabelValue);
    }
  }, []);

  // 步数查询类型选项
  const stepType = useMemo(
    () => [
      { label: "最短路径", value: 1, key: "1" },
      { label: "非循环路径", value: 2, key: "2" },
      { label: "全路径", value: 0, key: "0" },
    ],
    []
  );

  // 拓展方向选项
  const expandDirectionOptions = useMemo(
    () => [
      { label: "流入", value: 0 },
      { label: "流出", value: 1 },
      { label: "双向", value: 2 },
    ],
    []
  );

  // 获取边列表
  useEffect(() => {
    const fetchEdgeList = async () => {
      try {
        const { data } = await getEdgeListApi({ spaceId: currentNamespaceId });
        setTypeOptions(data.map((item) => ({ label: item, value: item })));
      } catch (error) {
        console.error("获取边列表失败:", error);
        message.error("获取边列表失败");
      }
    };
    fetchEdgeList();
  }, [currentNamespaceId]);

  useEffect(() => {
    if (selectedTypes && typeOptions.length > 0) {
      setIndeterminate(
        selectedTypes.length > 0 && selectedTypes.length < typeOptions.length
      );
      form.setFieldsValue({
        isChecked: selectedTypes.length === typeOptions.length,
      });
    } else {
      setIndeterminate(false);
    }
  }, [selectedTypes, typeOptions.length]);

  const vertexLabel = (name, tags, highlightText = "") => {
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

    const remark = tags.join(",");
    return (
      <div className={styles["lable-wrapper-test"]} alt={name}>
        {renderHighlightedName()}
        <span className={styles["lable-remark"]} title={remark}>
          {remark}
        </span>
      </div>
    );
  };

  // 防抖搜索节点
  const fetchVertices = async (type, value) => {
    if (!value) {
      type === "start" ? setStartOptions([]) : setEndOptions([]);
      return;
    }

    // 过滤特殊字符
    const filteredValue = value.replace(
      /[^A-Za-z0-9\u4e00-\u9fa5-——_（）""()“”]/g,
      ""
    );

    const fetchId =
      type === "start" ? startLastFetchId + 1 : endLastFetchId + 1;

    type === "start"
      ? (setStartLastFetchId(fetchId), setStartFetching(true))
      : (setEndLastFetchId(fetchId), setEndFetching(true));

    try {
      const { data: body } = await selectVertexInfoApi({
        spaceId: currentNamespaceId,
        vertexName: value,
      });

      // 防止竞态问题
      if (
        (type === "start" && fetchId !== startLastFetchId + 1) ||
        (type === "end" && fetchId !== endLastFetchId + 1)
      ) {
        return;
      }

      const options = body.map((node) => {
        const name = node.vertexName;
        const remark = node.vertexTagName.join(",");
        return {
          label: vertexLabel(
            node.vertexName,
            node.vertexTagName,
            filteredValue
          ),
          // label: node.vertexName,
          value: node.vertexId,
          originName: name,
          vertexName: name,
          vertexId: node.vertexId,
          tags: node.vertexTagName,
          key: node.vertexId,
        };
      });

      type === "start"
        ? (setStartOptions(options), setStartFetching(false))
        : (setEndOptions(options), setEndFetching(false));
    } catch (error) {
      console.error("获取顶点数据失败:", error);
      type === "start" ? setStartFetching(false) : setEndFetching(false);
    }
  };

  const startFetchRef = useRef(
    debounce(async (value) => {
      await fetchVertices("start", value);
    }, 300)
  );

  const endFetchRef = useRef(
    debounce(async (value) => {
      await fetchVertices("end", value);
    }, 300)
  );

  // ===================== 起点相关处理 =====================
  const handleStartSearch = (value) => {
    startFetchRef.current(value);
  };

  const handleStartSelect = (value, option) => {
    setStartLastSelectedValue(option);
    setStartDisplayValue(option.originName || option.vertexName || "");
    // 同步到表单
    form.setFieldsValue({
      startLabel: {
        label: option.originName || option.vertexName || "",
        value: option.value,
        originName: option.originName,
        vertexName: option.vertexName,
        vertexId: option.vertexId,
        tags: option.tags,
      },
    });
    // 选中后清空搜索选项
    setStartOptions([]);
  };

  const handleStartInputChange = (e) => {
    setStartDisplayValue(e.target.value);
  };

  const handleStartInputFocus = () => {
    // 聚焦时清空显示值（保留选中值）
    if (startLastSelectedValue) {
      setStartDisplayValue("");
    }
  };

  const handleStartInputBlur = () => {
    // 失焦时恢复选中值显示
    if (startLastSelectedValue) {
      setStartDisplayValue(startLastSelectedValue.originName);
      form.setFieldsValue({
        startLabel: {
          label:
            startLastSelectedValue.originName ||
            startLastSelectedValue.vertexName ||
            "",
          value: startLastSelectedValue.value,
          originName: startLastSelectedValue.originName,
          vertexName: startLastSelectedValue.vertexName,
          vertexId: startLastSelectedValue.vertexId,
          tags: startLastSelectedValue.tags,
        },
      });
    } else {
      setStartDisplayValue("");
      form.setFieldsValue({
        startLabel: null,
      });
      setStartOptions([]);
    }
  };

  const handleStartClear = () => {
    setStartLastSelectedValue(null);
    setStartDisplayValue("");
    setStartOptions([]);
    // 同步清空表单
    form.setFieldsValue({
      startLabel: null,
    });
  };

  // ===================== 终点相关处理 =====================
  const handleEndSearch = (value) => {
    endFetchRef.current(value);
  };

  const handleEndSelect = (value, option) => {
    setEndLastSelectedValue(option);
    setEndDisplayValue(option.originName || option.vertexName || "");
    // 同步到表单
    form.setFieldsValue({
      endLabel: {
        label: option.originName || option.vertexName || "",
        value: option.value,
        originName: option.originName,
        vertexName: option.vertexName,
        vertexId: option.vertexId,
        tags: option.tags,
      },
    });
    // 选中后清空搜索选项
    setEndOptions([]);
  };

  const handleEndInputChange = (e) => {
    setEndDisplayValue(e.target.value);
  };

  const handleEndInputFocus = () => {
    // 聚焦时清空显示值（保留选中值）
    if (endLastSelectedValue) {
      setEndDisplayValue("");
    }
  };

  const handleEndInputBlur = () => {
    // 失焦时恢复选中值显示
    if (endLastSelectedValue) {
      setEndDisplayValue(endLastSelectedValue.originName);
      form.setFieldsValue({
        endLabel: {
          label:
            endLastSelectedValue.originName ||
            endLastSelectedValue.vertexName ||
            "",
          value: endLastSelectedValue.value,
          originName: endLastSelectedValue.originName,
          vertexName: endLastSelectedValue.vertexName,
          vertexId: endLastSelectedValue.vertexId,
          tags: endLastSelectedValue.tags,
        },
      });
    } else {
      setEndDisplayValue("");
      form.setFieldsValue({
        endLabel: null,
      });
      setEndOptions([]);
    }
  };

  const handleEndClear = () => {
    setEndLastSelectedValue(null);
    setEndDisplayValue("");
    setEndOptions([]);
    // 同步清空表单
    form.setFieldsValue({
      endLabel: null,
    });
  };

  // 处理全选边
  const handleSelect = (e) => {
    const checked = e.target.checked;
    form.setFieldsValue({
      isChecked: checked,
      edgeNameList: checked ? typeOptions.map((item) => item.value) : [],
    });
  };

  // 自定义下拉渲染
  const popupRender = (menu) => (
    <div onMouseDown={(e) => e.preventDefault()}>
      {menu}
      <Divider style={{ margin: "4px 0" }} />
      <div style={{ padding: "5px 12px" }}>
        <Checkbox
          indeterminate={indeterminate}
          checked={form.getFieldValue("isChecked")}
          onChange={handleSelect}
        >
          全部
        </Checkbox>
      </div>
    </div>
  );

  const renderDropdown = (type) => {
    // const fetching = type === "start" ? startFetching : endFetching;
    const options = type === "start" ? startOptions : endOptions;
    // const value = type === "start" ? startDisplayValue : endDisplayValue;

    // if (fetching) {
    //   return <Spin size="small" />;
    // }

    // if (!fetching && options.length === 0 && value) {
    //   return <span>暂无数据</span>;
    // }

    // if (options.length > 0 && value && !fetching) {
    return (
      <div className={styles["dropdown_container"]}>
        {options.map((item) => (
          <div
            className={styles["dropdown_item"]}
            key={item.value}
            onClick={() =>
              type === "start"
                ? handleStartSelect(item.value, item)
                : handleEndSelect(item.value, item)
            }
          >
            {vertexLabel(
              item.vertexName,
              item.tags,
              type === "start" ? startDisplayValue : endDisplayValue
            )}
          </div>
        ))}
      </div>
    );
    // }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      labelCol={{ span: 20 }}
      initialValues={{
        edgeNameList: [],
        direction: 0,
        queryType: 1,
        stepInterval: 1,
        isChecked: false,
      }}
      className={styles["path-query-form"]}
    >
      {/* 起点 */}
      <Form.Item
        name="startLabel"
        label="起点"
        rules={[{ required: true, message: "请输入起点" }]}
        // onMouseDown={(e) => {
        //   e.preventDefault();
        //   e.stopPropagation();
        // }}
      >
        <div className={styles["select-wrapper"]}>
          <AutoComplete
            value={startDisplayValue}
            options={startOptions}
            onSearch={handleStartSearch}
            onSelect={handleStartSelect}
            allowClear
            style={{ width: "100%" }}
            filterOption={false}
            getPopupContainer={(trigger) => trigger.parentNode}
            onClear={handleStartClear}
            // popupRender={() => renderDropdown("start")}
            notFoundContent={startFetching ? <Spin size="small" /> : null}
          >
            <Input
              prefix={<SearchOutlined className={styles["st-search"]} />}
              value={startDisplayValue}
              className={`${styles["node-select"]} ${styles["custom-input"]}`}
              placeholder={
                startLastSelectedValue
                  ? startLastSelectedValue.originName || "实体名称"
                  : "实体名称"
              }
              onChange={handleStartInputChange}
              onFocus={handleStartInputFocus}
              onBlur={handleStartInputBlur}
            />
          </AutoComplete>
        </div>
      </Form.Item>

      {/* 终点 */}
      <Form.Item
        name="endLabel"
        label="终点"
        rules={[{ required: true, message: "请输入终点" }]}
      >
        <div className={styles["select-wrapper"]}>
          <AutoComplete
            value={endDisplayValue}
            options={endOptions}
            onSearch={handleEndSearch}
            onSelect={handleEndSelect}
            allowClear
            style={{ width: "100%" }}
            filterOption={false}
            getPopupContainer={(trigger) => trigger.parentNode}
            onClear={handleEndClear}
            // popupRender={() => renderDropdown("end")}
            notFoundContent={endFetching ? <Spin size="small" /> : null}
          >
            <Input
              prefix={<SearchOutlined className={styles["st-search"]} />}
              value={endDisplayValue}
              className={`${styles["node-select"]} ${styles["custom-input"]}`}
              placeholder={
                endLastSelectedValue
                  ? endLastSelectedValue.originName || "实体名称"
                  : "实体名称"
              }
              onChange={handleEndInputChange}
              onFocus={handleEndInputFocus}
              onBlur={handleEndInputBlur}
            />
          </AutoComplete>
        </div>
      </Form.Item>

      {/* 边选择 */}
      <Form.Item
        name="edgeNameList"
        label="边"
        rules={[{ required: true, message: "请选择边" }]}
      >
        <Select
          mode="multiple"
          maxTagCount={5}
          placeholder="请选择边"
          //   options={typeOptions}
          popupRender={popupRender}
          style={{ width: "100%" }}
          className={styles["edge-select"]}
          menuItemSelectedIcon={null}
        >
          {typeOptions.map((option) => (
            <Select.Option
              key={option.value}
              value={option.value}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <Checkbox
                  checked={selectedTypes.includes(option.value)}
                  style={{ marginRight: 8 }}
                />
                {option.label}
              </div>
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      {/* 方向 */}
      <Form.Item label="方向" name="direction">
        <Radio.Group options={expandDirectionOptions} />
      </Form.Item>

      {/* 步数查询类型 */}
      <Form.Item
        label={
          <span>
            步数查询类型
            <Tooltip
              className={styles["question-tip"]}
              title="全路径：检索两个节点的所有路径；最短路径：仅检索两个节点的所有最短路径；非循环路径：所有节点仅出现一次的路径"
            >
              <QuestionCircleFilled className={styles["question-icon"]} />
            </Tooltip>
          </span>
        }
        name="queryType"
      >
        <Radio.Group options={stepType} />
      </Form.Item>

      {/* 步数区间 */}
      <Form.Item label="步数区间" name="stepInterval">
        <InputNumber style={{ width: "30%" }} min={1} max={5} />
      </Form.Item>
    </Form>
  );
};

export default PathQueryForm;
