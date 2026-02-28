"use client";

import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
} from "react";
import { Empty } from "antd";
import {
  Button,
  Drawer,
  Form,
  Cascader,
  Radio,
  Input,
  Tree,
  ConfigProvider,
} from "antd";
import { message } from "antd";
import styles from "./test.module.css";
import { useStore } from "@/store/index";
const { TextArea } = Input;
import ReactMarkdown from "react-markdown";
import JsonEditorPage from "./JsonEditorPage";
const TestResult = forwardRef((props, ref) => {
  const { panelVisible, setPanelVisible, pannerNode } = useStore(
    (state) => state
  );
  const [outputs, setOutputs] = useState(null);
  useImperativeHandle(ref, () => ({}));

  // 解析结果数据，将 result 转为 label value 的数组，并判断 value 的类型（仅 string/number/object/array）
  const parseResult = (result) => {
    if (!result) return [];
    try {
      // 如果是字符串，尝试解析为JSON
      const data = typeof result === "string" ? JSON.parse(result) : result;

      // 检查是否有outputs字段
      let outputObj =
        data.outputs && typeof data.outputs === "object" ? data.outputs : data;

      // 类型判断函数
      const getValueType = (value) => {
        if (Array.isArray(value)) return "array";
        if (value !== null && typeof value === "object") return "object";
        if (typeof value === "number") return "number";
        return "string";
      };

      // 如果是对象，转为数组
      if (
        outputObj &&
        typeof outputObj === "object" &&
        !Array.isArray(outputObj)
      ) {
        return Object.entries(outputObj).map(([key, value]) => {
          return {
            label: key,
            value: value,
            valueType: getValueType(value),
          };
        });
      }
      // 不是对象，直接返回
      return [
        {
          label: "result",
          value: outputObj,
          valueType: getValueType(outputObj),
        },
      ];
    } catch (error) {
      // 如果解析失败，当作普通字符串处理
      return [
        {
          label: "result",
          value: result,
          valueType: "string",
        },
      ];
    }
  };

  useEffect(() => {
    let data = parseResult(props.result);

    console.log(data, "结果界面");
    setOutputs(data);
  }, [props.result]);

  return (
    <div className={styles["test_result_container"]}>
      {!props.result && (
        <div className={styles["test_result_container_empty"]}>
          <Empty description="暂无结果" />
        </div>
      )}

      {outputs && outputs.length > 0 && (
        <div className={styles["test_result_container_result"]}>
          {outputs.map((item, index) => (
            <div key={index} className={styles["test_result_item"]}>
              <div className={styles["test_result_title"]}>
                <h4>{item.label}</h4>
              </div>
              {item.valueType === "string"&&item.value!=null&&item.value!="" && (
                <div className={styles["test_result_content"]}>
                  <ReactMarkdown
                    wrapperProps={{
                      className: styles.test_result_content_markdown,
                    }}
                  >
                    {`\`\`\`\n${item.value}\n\`\`\``}
                  </ReactMarkdown>
                </div>
              )}
              {item.valueType === "number" && (
                <div className={styles["test_result_content"]}>
                  {item.value}
                </div>
              )}
              {(item.valueType === "object" || item.valueType === "array") && (
                <div className={styles["test_result_content_json"]}>
                  <JsonEditorPage noHeader={true} content={item.value} />
                </div>
              )}
            </div>
          ))}

          <Button
            className={styles["test_result_container_copy"]}
            type="primary"
            onClick={() => {
              const textToCopy = JSON.stringify(props.result);
              console.log(textToCopy, "textToCopy");
              navigator.clipboard.writeText(textToCopy);
              message.success("复制成功");
            }}
          >
            复制
          </Button>
        </div>
      )}
    </div>
  );
});

export default TestResult;
