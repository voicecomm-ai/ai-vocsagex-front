"use client";
// 节点配置抽屉组件,目前先保留,后续处理流中节点配置完善后可删除
import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
  useMemo,
} from "react";
import {
  Button,
  Drawer,
  Form,
  Cascader,
  Radio,
  Input,
  Tree,
  ConfigProvider,
  Transfer,
  Checkbox,
  Popover,
  Slider,
  Select,
  InputNumber,
} from "antd";
import {
  RightOutlined,
  LeftOutlined,
  QuestionCircleOutlined,
  HolderOutlined,
  DownOutlined,
  UpOutlined,
} from "@ant-design/icons";
import { message } from "antd";
import styles from "./panel.module.css";
import { debounce } from "lodash-es";
// 引入 dnd-kit 相关组件
import { DndContext, closestCorners, DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const { TextArea } = Input;
const CheckboxGroup = Checkbox.Group;

// 定义可排序的单个选项元素
const SortableItem = ({
  item,
  rightPanelOpenKey,
  openPanel,
  closePanel,
  handleIconClick,
  renderSteps,
  renderConfig,
}) => {
  // 初始化排序能力
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    setActivatorNodeRef,
  } = useSortable({
    id: item.id,
    data: {
      type: "item",
      item,
    },
  });

  // 拖拽中的样式
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    margin: "0",
    cursor: "default",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={styles["sortable-item"]}
      {...attributes}
    >
      <Checkbox value={item.value}>
        <div>
          {item.label}
          <Popover
            className={styles["custom-tip"]}
            content={() => (
              <div className={styles["custom-tip-content"]}>{item.desc}</div>
            )}
          >
            <QuestionCircleOutlined />
          </Popover>
        </div>
        <div className={styles["transfer_bottom_right"]}>
          {/* 拖拽手柄 */}
          <HolderOutlined
            ref={setActivatorNodeRef} // 拖拽激活器
            className={`${styles["holder-icon"]} ${styles["sortable-handle"]}`}
            onClick={(e) => handleIconClick(e)}
            {...listeners} // 绑定拖拽事件
            style={{ cursor: isDragging ? "grabbing" : "grab" }} // 手柄光标提示
          />
          {rightPanelOpenKey.includes(item.value) ? (
            <UpOutlined
              onClick={(e) => {
                handleIconClick(e);
                closePanel(item.value);
              }}
            />
          ) : (
            <DownOutlined
              onClick={(e) => {
                handleIconClick(e);
                openPanel(item.value);
              }}
            />
          )}
        </div>
      </Checkbox>
      <div
        className={`${styles["item_config"]} ${
          rightPanelOpenKey.includes(item.value)
            ? styles["item_config_open"]
            : styles["item_config_close"]
        }`}
      >
        {renderSteps(item)}
        <div
          className={`${styles["item_config_content"]} ${
            item.config?.find((c) => c.key === "isSatisfied")
              ? styles["content_padding"]
              : ""
          }`}
        >
          {renderConfig(item)}
        </div>
      </div>
    </div>
  );
};

// 生成{childId-key: value}格式的表单数据
const generateFormData = (data) => {
  const targetFirstLevelItem = data;
  if (!targetFirstLevelItem || !targetFirstLevelItem.children) {
    return {};
  }

  const formData = {};

  targetFirstLevelItem.children.forEach((childItem) => {
    const childId = childItem.id;
    if (!childItem.config) return;

    childItem.config.forEach((configItem) => {
      const configKey = configItem.key;
      // 核心拼接规则
      const formKey = `${childId}-${configKey}`;
      formData[formKey] = configItem.value;

      // 处理子配置
      if (configItem.extra) {
        const extraFormKey = `${childId}-${configItem.extra.key}`;
        formData[extraFormKey] = configItem.extra.value;
      }

      if (configItem.extras && configItem.extras.length > 0) {
        configItem.extras.forEach((element) => {
          const extraFormKey = `${childId}-${configKey}-${element.key}`;
          formData[extraFormKey] = element.value;
        });
      }
    });
  });

  return formData;
};

const PanelContent = forwardRef((props, ref) => {
  useImperativeHandle(ref, () => ({
    showModal,
    hideModal,
  }));

  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [title, setTitle] = useState(""); //标题
  const [data, setData] = useState({}); //数据
  const [loading, setLoading] = useState(false); //加载中
  const [action, setAction] = useState("add"); //操作类型 add 新增 edit 编辑
  const [nodeData, setNodeData] = useState({}); //选中的节点数据
  const [modalKey, setModalKey] = useState(0);

  // 穿梭框数据
  const [mockData, setMockData] = useState([]);
  const [targetKeys, setTargetKeys] = useState([]);
  // 记录左右侧复选框选中的key
  const [leftCheckedKeys, setLeftCheckedKeys] = useState([]);
  const [rightCheckedKeys, setRightCheckedKeys] = useState([]);

  // 右侧面板打开key
  const [rightPanelOpenKey, setRightPanelOpenKey] = useState([]);
  const [saveOldOpenKey, setSaveOldOpenKey] = useState([]);

  // 左侧复选框数据
  const leftOptions = useMemo(() => {
    return mockData.filter((item) => !targetKeys.includes(item.value));
  }, [targetKeys, mockData]);

  // 右侧复选框数据
  const rightOptions = useMemo(() => {
    const filteredItems = mockData.filter((item) =>
      targetKeys.includes(item.value),
    );
    // 按照 targetKeys 的顺序重新排序
    const sortedItems = filteredItems.sort((a, b) => {
      return targetKeys.indexOf(a.value) - targetKeys.indexOf(b.value);
    });
    return sortedItems;
    // return mockData.filter((item) => targetKeys.includes(item.value));
  }, [targetKeys, mockData]);

  // 复选框状态
  const leftIndeterminate = useMemo(() => {
    return (
      leftCheckedKeys.length > 0 && leftCheckedKeys.length < leftOptions.length
    );
  }, [leftOptions, leftCheckedKeys]);

  const leftCheckAll = useMemo(() => {
    return (
      leftCheckedKeys.length === leftOptions.length && leftOptions.length > 0
    );
  }, [leftOptions, leftCheckedKeys]);

  const rightIndeterminate = useMemo(() => {
    return (
      rightCheckedKeys.length > 0 &&
      rightCheckedKeys.length < rightOptions.length
    );
  }, [rightOptions, rightCheckedKeys]);

  const rightCheckAll = useMemo(() => {
    return (
      rightCheckedKeys.length === rightOptions.length && rightOptions.length > 0
    );
  }, [rightOptions, rightCheckedKeys]);

  const showModal = async (obj = {}) => {
    setLoading(true);
    setOpen(true);
    setTitle(obj.name || "");
    setData(obj);
    setModalKey(obj.id);
    onReset();

    // 初始化表单数据
    const initialFormData = generateFormData(obj);
    console.log(initialFormData, "initialFormData");

    form.setFieldsValue(initialFormData);

    if (obj?.children && Array.isArray(obj.children)) {
      const newMockData = obj.children.map((item) => ({
        ...item,
        label: item.name || "未命名",
        value: item.id?.toString() || "",
      }));
      setMockData(newMockData);
    } else {
      setMockData([]);
    }
    setLoading(false);
  };

  const leftCheckAllChange = (e) => {
    setLeftCheckedKeys(
      e.target.checked ? leftOptions.map((item) => item.value) : [],
    );
  };

  const rightCheckAllChange = (e) => {
    setRightCheckedKeys(
      e.target.checked ? rightOptions.map((item) => item.value) : [],
    );
  };

  const leftCheckChange = (checkedKeys) => {
    setLeftCheckedKeys(checkedKeys);
  };

  const rightCheckChange = (checkedKeys) => {
    setRightCheckedKeys(checkedKeys);
  };

  const onChange = (nextTargetKeys) => {
    setTargetKeys(nextTargetKeys);
    setRightCheckedKeys([]);
    setLeftCheckedKeys([]);
  };

  const selectLeftKeys = (checkedKeys) => {
    setLeftCheckedKeys(checkedKeys);
  };

  const selectRightKeys = (checkedKeys) => {
    setRightCheckedKeys(checkedKeys);
  };

  //   右移
  const onLeftToRight = () => {
    const newTargetKeys = [...new Set([...targetKeys, ...leftCheckedKeys])];
    setTargetKeys(newTargetKeys);
    setLeftCheckedKeys([]);
    setRightPanelOpenKey(newTargetKeys);
  };

  //   左移
  const onRightToLeft = () => {
    const newTargetKeys = targetKeys.filter(
      (key) => !rightCheckedKeys.includes(key),
    );
    setTargetKeys(newTargetKeys);
    setRightCheckedKeys([]);
    setRightPanelOpenKey([]);
  };

  //   打开面板
  const openPanel = (key) => {
    setRightPanelOpenKey((prev) => prev.concat(key));
  };

  //   关闭面板
  const closePanel = (key) => {
    setRightPanelOpenKey((prev) => prev.filter((item) => item !== key));
  };

  //   重置
  const onReset = () => {
    setTargetKeys([]);
    setLeftCheckedKeys([]);
    setRightCheckedKeys([]);
    setRightPanelOpenKey([]);
    setSaveOldOpenKey([]);
  };

  // 关闭事件
  const hideModal = () => {
    setOpen(false);
    setLoading(false);
    setMockData([]);
    onReset();
  };

  // 阻止冒泡
  const handleIconClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    e.nativeEvent.stopImmediatePropagation();
  };

  const onStepsCount = (name, value) => {
    console.log(name, value);
    form.setFieldsValue({ [name]: value });
  };

  // 步长计算函数
  const getSliderStep = (data, fieldName) => {
    const { value, scope } = data;
    const { min, max } = scope;
    const formValue = form.getFieldValue(fieldName);
    const stepValue = formValue || value;
    const validValue = isNaN(Number(stepValue)) ? 0 : Number(stepValue);
    const validMax = isNaN(Number(max)) ? 1 : Number(max);
    const validMin = isNaN(Number(min)) ? 0 : Number(min);

    if (validMax > 1) return 1;

    // 根据value的小数精度计算步长
    const valueStr = validValue.toString();
    const decimalPart = valueStr.includes(".") ? valueStr.split(".")[1] : "";
    const decimalLength = decimalPart.length;

    let step;
    if (decimalLength === 0 || decimalLength === 1) {
      // value是整数或是1位小数
      step = 0.1;
    } else if (decimalLength === 2) {
      // value是2位小数
      step = 0.01;
    } else {
      // value是3位及以上小数
      step = 0.001;
    }

    return parseFloat(step.toFixed(Math.max(2, decimalLength + 1)));
  };

  const formatValue = (value, precision = 4) => {
    if (isNaN(value)) return 0;
    return parseFloat(Number(value).toFixed(precision));
  };

  const parseArrayPath = (pathStr) => {
    const reg = /^(\w+)\[(\d+)\]$/;
    const matchResult = pathStr.match(reg);

    if (matchResult) {
      return {
        arrName: matchResult[1],
        index: parseInt(matchResult[2], 10),
      };
    }
    return { arrName: "", index: -1 };
  };

  // 修改数据
  const modifyData = (id, key, ele, value, type) => {
    let newMockData;
    if (type) {
      newMockData = mockData.map((item) => {
        if (item.id === id) {
          const newConfig = item.config.map((configItem) => {
            if (configItem.key === key) {
              const { arrName, index } = parseArrayPath(ele);

              const newExtras = [...configItem[arrName]];
              newExtras[index] = {
                ...newExtras[index],
                value,
              };
              return {
                ...configItem,
                [arrName]: newExtras,
              };
            }
            return configItem;
          });
          return {
            ...item,
            config: newConfig,
          };
        }
        return item;
      });
    } else {
      newMockData = mockData.map((item) => {
        if (item.id === id) {
          const newConfig = item.config.map((configItem) => {
            if (configItem.key === key) {
              return {
                ...configItem,
                [ele]: value,
              };
            }
            return configItem;
          });
          return {
            ...item,
            config: newConfig,
          };
        }
        return item;
      });
    }

    setMockData(newMockData);
  };

  //   步骤条渲染
  const renderSteps = (data) => {
    const { id, config } = data;
    const stepItem = config.find((c) => c.key === "isSatisfied");
    if (!stepItem) return null;

    const targetOption = stepItem.options.find(
      (o) => o.value === stepItem.value,
    );
    const buttonLabel = targetOption?.label || "";

    const handleButtonClick = () => {
      const newMockData = mockData.map((item) => {
        if (item.id === id) {
          const newConfig = item.config.map((configItem) => {
            if (configItem.key === "isSatisfied") {
              return {
                ...configItem,
                value: !configItem.value,
              };
            }
            return configItem;
          });
          return {
            ...item,
            config: newConfig,
          };
        }
        return item;
      });
      setMockData(newMockData);
    };

    return (
      <div className={styles["config_steps"]}>
        <div className={styles["steps_line"]}></div>
        <Button onClick={handleButtonClick}>{buttonLabel}</Button>
        <div className={styles["steps_line"]}></div>
      </div>
    );
  };

  // 表单渲染
  const renderConfig = (data) => {
    const { id, name } = data;
    if (!data.config || data.config.length === 0)
      return (
        <div
          style={{ width: "100%", textAlign: "center" }}
          className={styles["font_class"]}
        >
          暂无参数
        </div>
      );
    return data.config.map((item) => {
      const fieldName = `${id}-${item.key}`;

      switch (item.type) {
        case "input":
          return (
            <Form.Item label={item.label} name={fieldName} key={fieldName}>
              <Input value={item.value} placeholder={item.placeholder} />
            </Form.Item>
          );
        case "radio":
          return (
            <Form.Item label={item.label} name={fieldName} key={fieldName}>
              <Radio.Group value={item.value}>
                {item.options.map((option) => (
                  <Radio value={option.value} key={option.value}>
                    {option.label}
                  </Radio>
                ))}
              </Radio.Group>
            </Form.Item>
          );
        case "radioBtn":
          const currentLabel = item.options.find(
            (option) => option.value === item.value,
          )?.label;

          const handleRadioChange = (e) => {
            const selectedValue = e.target.value;
            modifyData(id, item.linkKey, "value", selectedValue);
            const selectedLabel = item.options.find(
              (opt) => opt.value === selectedValue,
            )?.label;
            modifyData(id, item.linkKey, "label", selectedLabel);
          };

          return (
            <Form.Item label={item.label} name={fieldName} key={fieldName}>
              <Radio.Group
                value={item.value}
                optionType="button"
                onChange={handleRadioChange}
              >
                {item.options.map((option) => (
                  <Radio value={option.value} key={option.value}>
                    {option.label}
                  </Radio>
                ))}
              </Radio.Group>
            </Form.Item>
          );
        case "radioExtra":
          return (
            <Form.Item label={item.label} name={fieldName} key={fieldName}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <Radio.Group value={item.value} optionType="button">
                  {item.options.map((option) => (
                    <Radio
                      value={form.getFieldValue(`${id}-${item.key}`)}
                      key={option.value}
                    >
                      {option.label}
                    </Radio>
                  ))}
                </Radio.Group>
                <Select
                  style={{ flex: 1, marginLeft: "16px" }}
                  value={form.getFieldValue(`${id}-${item.extra.key}`)}
                  placeholder={item.extra.placeholder}
                  options={item.extra.options}
                />
              </div>
            </Form.Item>
          );
        case "select":
          return (
            <Form.Item label={item.label} name={fieldName} key={fieldName}>
              <Select
                value={item.value}
                placeholder={item.placeholder}
                options={item.options}
              />
            </Form.Item>
          );
        case "percent":
          return (
            <Form.Item
              label={item.label}
              name={fieldName}
              key={fieldName}
              initialValue={item.value}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <InputNumber
                  min={item.scope.min}
                  max={item.scope.max}
                  style={{ width: "100px", marginRight: "16px" }}
                  value={form.getFieldValue(fieldName)}
                  step={getSliderStep(item, fieldName)}
                  onChange={(value) => {
                    const formatted = formatValue(value);
                    form.setFieldValue(fieldName, formatted);
                    modifyData(id, item.key, "value", formatted);
                  }}
                />
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    paddingRight: "34px",
                    gap: "2px",
                  }}
                >
                  {item.scope.min}
                  <Slider
                    style={{ flex: 1 }}
                    min={item.scope.min}
                    max={item.scope.max}
                    value={form.getFieldValue(fieldName)}
                    step={getSliderStep(item, fieldName)}
                    onChange={(value) => {
                      const formatted = formatValue(value);
                      form.setFieldValue(fieldName, formatted);
                      modifyData(id, item.key, "value", formatted);
                    }}
                  />
                  {item.scope.max}
                  {item.unit ? item.unit : null}
                </div>
              </div>
            </Form.Item>
          );
        case "interval":
          const [minVal, maxVal] = form.getFieldValue(fieldName) || [
            item.scope.min,
            item.scope.max,
          ];
          return (
            <Form.Item
              label={item.label}
              name={fieldName}
              key={fieldName}
              initialValue={item.value}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <div className={styles["input_number_com"]}>
                  <InputNumber
                    className={`${styles["input_number"]} ${styles["input_number_left"]}`}
                    min={item.scope.min}
                    max={item.scope.max}
                    style={{ width: "50px" }}
                    value={form.getFieldValue(fieldName)[0]}
                    step={getSliderStep(item, fieldName)}
                    controls={false}
                    onChange={(value) => {
                      const formatted = formatValue(value);
                      const newRange = [formatted, maxVal];
                      debounce(async (value) => {
                        form.setFieldValue(fieldName, newRange);
                        modifyData(id, item.key, "value", newRange);
                      }, 100)();
                    }}
                  />
                  <div style={{ width: "6px" }}>-</div>
                  <InputNumber
                    className={`${styles["input_number"]} ${styles["input_number_right"]}`}
                    min={item.scope.min}
                    max={item.scope.max}
                    style={{ width: "50px" }}
                    value={form.getFieldValue(fieldName)[1]}
                    step={getSliderStep(item, fieldName)}
                    controls={false}
                    onChange={(value) => {
                      const formatted = formatValue(value);
                      const newRange = [minVal, formatted];
                      debounce(async (value) => {
                        form.setFieldValue(fieldName, newRange);
                        modifyData(id, item.key, "value", newRange);
                      }, 100)();
                    }}
                  />
                </div>
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: "2px",
                  }}
                >
                  {item.scope.min}
                  <Slider
                    style={{ flex: 1 }}
                    range
                    min={item.scope.min}
                    max={item.scope.max}
                    value={[minVal, maxVal]}
                    step={getSliderStep(item, fieldName)}
                    onChange={(values) => {
                      const [formattedMin, formattedMax] = values.map((v) =>
                        formatValue(v),
                      );
                      const newRange = [formattedMin, formattedMax];
                      debounce(async (value) => {
                        form.setFieldValue(fieldName, newRange);
                        modifyData(id, item.key, "value", newRange);
                      }, 100)();
                    }}
                  />
                  {item.scope.max}
                </div>
              </div>
            </Form.Item>
          );
        case "inputNumber":
          return (
            <Form.Item label={item.label} name={fieldName} key={fieldName}>
              <InputNumber
                value={form.getFieldValue(fieldName)}
                onChange={(value) => {
                  const format = formatValue(value);
                  debounce(async (value) => {
                    form.setFieldValue(fieldName, format);
                    modifyData(id, item.key, "value", format);
                  }, 100)();
                }}
              />
            </Form.Item>
          );
        case "inputNumbers":
          return (
            <Form.Item label={item.label} name={fieldName} key={fieldName}>
              <div>
                <InputNumber
                  value={form.getFieldValue(
                    `${fieldName}-${item.extras[0].key}`,
                  )}
                  onChange={(value) => {
                    const formatted = formatValue(value);
                    debounce(async (value) => {
                      form.setFieldValue(
                        `${fieldName}-${item.extras[0].key}`,
                        formatted,
                      );
                      modifyData(id, item.key, "extras[0]", formatted, true);
                    }, 100)();
                  }}
                />
                <span style={{ margin: "0 8px" }}>:</span>
                <InputNumber
                  value={form.getFieldValue(
                    `${fieldName}-${item.extras[1].key}`,
                  )}
                  onChange={(value) => {
                    const formatted = formatValue(value);
                    debounce(async (value) => {
                      form.setFieldValue(
                        `${fieldName}-${item.extras[1].key}`,
                        formatted,
                      );
                      modifyData(id, item.key, "extras[1]", formatted, true);
                    }, 100)();
                  }}
                />
              </div>
            </Form.Item>
          );

        case "textArea":
          return (
            <Form.Item label={item.label} name={fieldName} key={fieldName}>
              <TextArea
                rows={3}
                value={form.getFieldValue(fieldName)}
                onChange={(e) => {
                  form.setFieldValue(fieldName, e.target.value);
                  modifyData(id, item.key, "value", e.target.value);
                }}
              />
            </Form.Item>
          );
      }
    });
  };

  //   拖拽开始
  const handleDragStart = (event) => {
    setSaveOldOpenKey(rightPanelOpenKey);
    setRightPanelOpenKey([]);
  };

  // 拖拽结束回调
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      // 找到拖拽项在 rightOptions 中的原索引和新索引
      const oldIndex = rightOptions.findIndex((item) => item.id === active.id);
      const newIndex = rightOptions.findIndex((item) => item.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      // 更新 targetKeys 的顺序
      setTargetKeys((prev) => {
        // 先根据 rightOptions 拿到当前 targetKeys 的顺序
        const currentTargetKeys = rightOptions.map((item) => item.value);
        // 复制数组，避免修改原数组
        const newTargetKeys = [...currentTargetKeys];

        // 删除原索引位置的元素
        const [draggedItem] = newTargetKeys.splice(oldIndex, 1);

        // 判断拖拽方向，动态计算插入位置
        let insertIndex;
        // 向上拖拽
        if (oldIndex > newIndex) {
          insertIndex = newIndex;
        }
        // 向下拖拽
        else {
          insertIndex = newIndex;
        }

        // 插入元素
        newTargetKeys.splice(insertIndex, 0, draggedItem);
        return newTargetKeys;
      });
    }

    setRightPanelOpenKey(saveOldOpenKey);
    setSaveOldOpenKey([]);
  };

  return (
    <div>
      <Drawer
        maskClosable={false}
        closable
        onClose={hideModal}
        title={null}
        placement="right"
        open={open}
        mask={false}
        destroyOnHidden={true}
        rootStyle={{ boxShadow: "none", position: "absolute", right: 12 }}
        width={658}
        key={modalKey}
        getContainer={() => document.getElementById("workflow_page")}
        classNames={{
          footer: styles["node-drawer-footer"],
          content: styles["node-drawer-content"],
          header: styles["node-drawer-header"],
          body: styles["node-drawer-body"],
        }}
      >
        <div className={styles["panel_main"]}>
          <div className={styles["panel_header"]}>
            <div className={styles["panel_header_title"]}>
              <img src={`/data/stream/${data.icon}.svg`} alt={title} />
              {title}
            </div>
            <img
              src="/close.png"
              alt="关闭"
              style={{ width: "24px", cursor: "pointer" }}
              onClick={hideModal}
            />
          </div>
          <div className={styles["panel_content"]}>
            <div className={styles["transfer_left"]}>
              <div className={styles["transfer_top"]}>
                <Checkbox
                  indeterminate={leftIndeterminate}
                  onChange={leftCheckAllChange}
                  checked={leftCheckAll}
                >
                  {leftIndeterminate
                    ? `已选${leftCheckedKeys.length}项`
                    : leftCheckAll
                    ? `已选${leftOptions.length}项`
                    : `${leftOptions.length}项`}
                </Checkbox>
                <span>可选算子</span>
              </div>
              <div className={styles["transfer_bottom"]}>
                {leftOptions.length > 0 ? (
                  <CheckboxGroup
                    value={leftCheckedKeys}
                    onChange={leftCheckChange}
                  >
                    {leftOptions.map((item) => (
                      <Checkbox key={item.value} value={item.value}>
                        <div>
                          {item.label}
                          <Popover
                            className={styles["custom-tip"]}
                            content={() => (
                              <div className={styles["custom-tip-content"]}>
                                {item.desc}
                              </div>
                            )}
                          >
                            <QuestionCircleOutlined />
                          </Popover>
                        </div>
                      </Checkbox>
                    ))}
                  </CheckboxGroup>
                ) : (
                  <div className={styles["transfer_empty"]}>
                    <img src="/common/content_empty.png" />
                    <span>已开启全部算子</span>
                  </div>
                )}
              </div>
            </div>
            <div className={styles["transfer_middle"]}>
              <Button
                className={`${styles["transfer_button"]} ${
                  leftCheckedKeys.length > 0 ? styles["active_btn"] : ""
                }`}
                disabled={leftCheckedKeys.length <= 0}
                onClick={onLeftToRight}
              >
                <RightOutlined />
              </Button>
              <Button
                className={`${styles["transfer_button"]} ${
                  rightCheckedKeys.length > 0 ? styles["active_btn"] : ""
                }`}
                disabled={rightCheckedKeys.length <= 0}
                onClick={onRightToLeft}
              >
                <LeftOutlined />
              </Button>
            </div>
            <div className={styles["transfer_right"]}>
              <div className={styles["transfer_top"]}>
                <Checkbox
                  indeterminate={rightIndeterminate}
                  onChange={rightCheckAllChange}
                  checked={rightCheckAll}
                >
                  {rightIndeterminate
                    ? `已选${rightCheckedKeys.length}项`
                    : rightCheckAll
                    ? `已选${rightOptions.length}项`
                    : `${rightOptions.length}项`}
                </Checkbox>
                <div className={styles["transfer_top_right"]}>
                  <span>已选算子</span>
                  <div className={styles["line"]}></div>
                  <div className={styles["config_btn"]}>
                    配置
                    {rightPanelOpenKey.length === targetKeys.length &&
                    targetKeys.length > 0 ? (
                      <UpOutlined
                        className={styles["holder-icon"]}
                        onClick={(e) => {
                          handleIconClick(e);
                          setRightPanelOpenKey([]);
                        }}
                      />
                    ) : (
                      <DownOutlined
                        onClick={(e) => {
                          handleIconClick(e);
                          setRightPanelOpenKey(targetKeys);
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
              <div className={styles["transfer_bottom"]}>
                {rightOptions.length > 0 ? (
                  <Form form={form} layout={"vertical"}>
                    <CheckboxGroup
                      value={rightCheckedKeys}
                      onChange={rightCheckChange}
                    >
                      {/* DndContext 包裹整个可排序列表 */}
                      <DndContext
                        collisionDetection={closestCorners}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        // keyboardCoordinates={sortableKeyboardCoordinates}
                        modifiers={[
                          ({ transform }) => ({
                            ...transform,
                            x: 0, // 限制X轴为0
                          }),
                        ]}
                      >
                        {/* SortableContext 定义排序策略（垂直列表） */}
                        <SortableContext
                          items={rightOptions.map((item) => item.id)} // 传入所有可排序项的ID
                          strategy={verticalListSortingStrategy}
                        >
                          {/* 渲染所有可排序项 */}
                          {rightOptions.map((item) => (
                            <SortableItem
                              key={item.id}
                              item={item}
                              rightPanelOpenKey={rightPanelOpenKey}
                              openPanel={openPanel}
                              closePanel={closePanel}
                              handleIconClick={handleIconClick}
                              renderSteps={renderSteps}
                              renderConfig={renderConfig}
                            />
                          ))}
                        </SortableContext>
                      </DndContext>
                    </CheckboxGroup>
                  </Form>
                ) : (
                  <div className={styles["transfer_empty"]}>
                    <img src="/common/content_empty.png" />
                    <span>从左侧选择需要开启的算子</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  );
});

export default PanelContent;
