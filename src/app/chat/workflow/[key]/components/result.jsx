import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from "react";
import styles from "./workflow.module.css";
import { Empty, Button, message } from "antd";
import ReactMarkdown from "react-markdown";
import JsonViewer from "./JsonViewer";
import { getWorkflowRunDetail } from "@/api/workflow";
import JsonEditor  from '@/app/components/JsonEditor'
import { getUuid } from "@/utils/utils";
const RunResult = forwardRef((props, ref) => {
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
  
  //获取运行结果详情
  const getRunResultDetail = () => {
    getWorkflowRunDetail({
      workflowRunId: props.runId,
    }).then(res => {
      console.log(res, "运行结果详情");
    });
  };



  return (
    <div className={styles["run_detail"]}>
      {!props.result && (
        <div className={styles["run_result_empty"]}>
          <Empty
            description="暂无结果"
            image={"/find/empty.png"}
            styles={{ image: { height: 220, width: 220 } }}
          />
        </div>
      )}
         {outputs && outputs.length > 0 && (
        <div className={styles["find_result_container"]}>  
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
           
                 <JsonEditor backgroundColor='#FAFCFD' content={item.value} key={getUuid()} />
                </div>
              )}
            </div>
          ))}

        </div>
        
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

export default RunResult;
