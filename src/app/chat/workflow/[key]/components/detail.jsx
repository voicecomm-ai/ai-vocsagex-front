import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
  useRef,
} from "react";
import styles from "./workflow.module.css";
import { Empty, message, Typography } from "antd";
import JsonViewer from "./JsonViewer";
import { getWorkflowRunDetail } from "@/api/workflow";
import {getUuid} from '@/utils/utils'
import JsonEditor  from '@/app/components/JsonEditor'

const RunDetail = forwardRef((props, ref) => {
  const { Text } = Typography;
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenData, setFullscreenData] = useState({});
  const [fullscreenTitle, setFullscreenTitle] = useState("");

  const [runData, setRunData] = useState(null);
  const runDetailInputRef = useRef(null);
  const runDetailOutputRef = useRef(null);

  const handleFullscreenEvent = (data,title) => {
    setIsFullscreen(true);
    setFullscreenData(data);
    setFullscreenTitle(title);
  };

  //退出全屏事件
  const handleExitFullscreen = () => {
    setIsFullscreen(false);
  };

  const handleCopy = (data) => {
    navigator.clipboard.writeText(JSON.stringify(data));
    message.success("复制成功");
  };
  useEffect(() => {
    if (props.runId) {
      getRunData();
    }
  }, []);

  //获取运行数据
  const getRunData = () => {
    getWorkflowRunDetail({
      workflowRunId: props.runId,
    }).then((res) => {
      let data = res.data;
      console.log(data, "运行数据");
      setRunData(data);
    });
  };

  const renderErrorContent = () => {
    return <div className={styles["run_tooltip_content"]}>{runData.error}</div>;
  };

  return (
    <div className={styles["run_detail"]}>
      {!runData && (
        <div className={styles["run_result_empty"]}>
          <Empty
            description="暂无详情"
            image={"/find/empty.png"}
            styles={{ image: { height: 220, width: 220 } }}
          />
        </div>
      )}
      {runData && runData.error && (
        <div className={styles["run_panel_result_error"]}>
          <img
            className={styles["run_panel_result_error_left"]}
            src="/workflow/run/error.png"
            alt="error"
          />
          <div className={styles["run_panel_result_error_content"]}>
            <Text
              style={{ maxWidth: "100%", color: "#CC372B", fontSize: 14 }}
              ellipsis={{ tooltip: renderErrorContent }}
            >
              <span className={styles["run_panel_result_error_right_text"]}>
                {" "}
                {runData.error}
              </span>
            </Text>
          </div>
        </div>
      )}
      {runData && (
        <div className={styles["run_detail_item"]} ref={runDetailInputRef}>
          <div className={styles["run_detail_item_header"]}>
            <div className={styles["run_detail_item_header_title"]}>输入</div>
            <div className={styles["run_detail_item_header_right"]}>
              <div className={styles["run_detail_item_header_right_btn"]}>
                <img
                  src="/workflow/json_copy.png"
                  onClick={() => handleCopy(runData.inputs)}
                  alt="复制"
                />
              </div>
              <div className={styles["run_detail_item_header_right_btn"]}   onClick={() => handleFullscreenEvent(runData.inputs,'输入')}>
                <img
                  src="/workflow/json_full.png"
                
                  alt="全屏"
                />
              </div>
            </div>
          </div>
          <div className={styles["run_detail_item_content"]}>
            <JsonEditor backgroundColor='#FAFCFD' content={runData.inputs} key={getUuid()} />
          </div>
        </div>
      )}
      {runData && (
        <div className={styles["run_detail_item"]} ref={runDetailOutputRef}>
          <div className={styles["run_detail_item_header"]}>
            <div className={styles["run_detail_item_header_title"]}>输出</div>
            <div className={styles["run_detail_item_header_right"]}>
              <div className={styles["run_detail_item_header_right_btn"]}>
                <img
                  src="/workflow/json_copy.png"
                  onClick={() => handleCopy(runData.outputs)}
                  alt="复制"
                />
              </div>
              <div className={styles["run_detail_item_header_right_btn"]}   onClick={() => handleFullscreenEvent(runData.outputs,'输出')}>
                <img
                  src="/workflow/json_full.png"
                
                  alt="全屏"
                />
              </div>
            </div>
          </div>
          <div className={styles["run_detail_item_content"]}>
            <JsonEditor backgroundColor='#FAFCFD' content={runData.outputs} key={getUuid()} />
          </div>
        </div>
      )}

      {isFullscreen && (
        <div className={styles.fullscreen_container}>
          <div
            className={`${styles["run_detail_item"]} ${styles.fullscreen_item}`}
          >
            <div className={styles["run_detail_item_header"]}>
              <div className={styles["run_detail_item_header_title"]}>{fullscreenTitle}</div>
              <div className={styles["run_detail_item_header_right"]}>
                <div className={styles["run_detail_item_header_right_btn"]}>
                  <img
                    src="/workflow/json_copy.png"
                    onClick={() => handleCopy(fullscreenData)}
                    alt="复制"
                  />
                </div>
                <div className={styles["run_detail_item_header_right_btn"]}    onClick={() => handleExitFullscreen(runDetailInputRef)}>
                  <img
                    src="/find/exitFull.png"
                 
                    alt="全屏"
                  />
                </div>
              </div>
            </div>
            <div className={styles["run_detail_item_content"]}>
              <JsonEditor backgroundColor='#FAFCFD' content={fullscreenData} key={getUuid()} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default RunDetail;
