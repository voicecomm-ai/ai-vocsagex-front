import React, {
  forwardRef,
  useImperativeHandle,
  useEffect,
  useState,
  useRef,
} from "react";
import styles from "./workflow.module.css";
import RunInput from "@/app/components/workflow/RunInput";
import { Button, ConfigProvider, Segmented, message,Tooltip } from "antd";
import RunResult from "./result";
import RunDetail from "./detail";
import RunTrack from "./track";
import { getUuid } from "@/utils/utils";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import Cookies from "js-cookie";
import { getPublishedWorkflowParams } from "@/api/workflow";
/**
 * 工作流主组件
 * @param {Object} props - 组件属性
 * @param {Object} props.applicationInfo - 应用信息
 * @param {Function} props.tipClickEvent - 提示点击事件
 * @param {Function} props.onRun - 运行回调
 * @param {Function} props.onClear - 清空回调
 * @param {Object} props.containerStyle - 容器样式
 */
const WorkflowIndex = forwardRef(
  (
    {
      applicationInfo,
      tipClickEvent,
      onRun,
      onClear,
      containerStyle = {},
      ...props
    },
    ref
  ) => {
    const runInputRef = useRef(null);
    const runResultRef = useRef(null);
    const runDetailRef = useRef(null);
    const runTrackRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [tabKey, setTabKey] = useState("1");
    const abortRef = useRef(null);
    const [runId, setRunId] = useState(null);
    const [result, setResult] = useState(null);
    const [nodes,setNodes] = useState([]);
    const [tabItems,setTabItems] = useState([
      {
        key: "1",
        label: "结果",
      },
      {
        key: "2",
        label: "详情",
      },
    ]);
    // 标签页配置
   

    // 暴露给父组件的方法
    useImperativeHandle(ref, () => ({}));

    // 初始化运行模块
    useEffect(() => {
      if (applicationInfo?.id) {
        initRunModule(applicationInfo);
      }
    }, [applicationInfo]);
     //处理标签页配置 当enableWorkflowTrace 为true 时展示追踪

    const getTabItems = (appInfo) => {
      let items =tabItems;
      if(appInfo?.enableWorkflowTrace){
        items.push({
          key: "3",
          label: "追踪",
        });
      }
      setTabItems(items);
    }
    // 初始化运行模块
    const initRunModule = (appInfo) => {
      console.log(appInfo,'appInfo');
      try {
        getWorkflowParamsEvent(appInfo.app_id);
        const graph = appInfo.graph;
        const nodes = graph?.nodes;
        setNodes(nodes);
        getTabItems(appInfo);
      } catch (error) {
      }
    };

    //获取运行参数列表
    const getWorkflowParamsEvent =(id)=>{
      getPublishedWorkflowParams({
        appId: id,
      }).then((res)=>{
        console.log(res,'res');
        let data = res.data;
        runInputRef.current.initFun(data);
      });
    }

    // 清除表单数据
    const clearFormEvent = () => {
      if(loading){
        return;
      }
      try {
        runInputRef.current?.clearFormEvent();
      } catch (error) {
        console.error("清空表单失败:", error);
    
      }
    };

    //创建sse 运行
    const runClickEvent = async () => {
      console.log("runClickEvent",applicationInfo);
      setTabKey("1");
      try {
        let formData = await runInputRef.current?.getFormData();
        let runId = getUuid();
        let runData = {
          app_id: applicationInfo.app_id,
          user_inputs: formData,
          workflow_run_id: runId, //
        };
        const token = Cookies.get("userToken");
        abortRef.current = new AbortController();
        setRunId(runId);
        setResult(null);
        setLoading(true);
        setTabKey("1");
        fetchEventSource(
          "/voicesagex-console/application-web/workflow/experienceRun",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + token,
              Accept: "text/event-stream",
            },
            body: JSON.stringify(runData),
            signal: abortRef.current.signal,
            // 添加重试配置
            retry: false,
            openWhenHidden: true,
            retryDelay: () => Infinity, //禁止重连
            onopen(response) {},
            onmessage(event) {
              if (event.event === "message") {
                let data = JSON.parse(event.data);

                if (data.event == "workflow_started") {
                  //开始运行
                  setLoading(true);
         
                }
                if (
                  data.event == "node_started" ||
                  data.event == "node_succeeded" ||
                  data.event == "node_failed"
                ) {
                  //结束运行
                  runTrackRef.current?.updateStepStatus();
                }
                if (data.event == "workflow_succeeded") {
                  //结束运行
                  setLoading(false);
                  let outputs = data.data.outputs;
                  setResult(data.data.outputs);
            
                  //判断outputs是否为空对象
                  if (Object.keys(outputs).length === 0) {
                    //没有输出
                    setTabKey("2");
                  } else {
                    setTabKey("1");
                  }
               
                  setLoading(false);
                }
                if (data.event == "workflow_failed") {
                  //结束运行-运行失败
                  setLoading(false);
                  setTabKey("2");
                }
              }
              if (event.event == "error") {
                console.log("error".event);
          
                closeEvent();
              }
              if (event.event == "close") {
                console.log("error".event);
                closeEvent();
              }
            },
            onerror(err) {
              console.error("SSE连接错误:", err);
              closeEvent();
              throw err;
            },
            onclose(err) {
              closeEvent();
              console.log("SSE连接已关闭");
              setIsRun(false);
            },
          }
        );
      } catch (err) {
        console.error("运行失败:", err);
        closeEvent();
        return false;
      }
    };
    //关闭事件
    const closeEvent = () => {
      abortRef.current?.abort();
      setLoading(false);
    };

    // 处理标签页切换
    const handleTabChange = (value) => {
      setTabKey(value);
    };

    // 渲染标签页内容
    const renderTabContent = () => {
      switch (tabKey) {
        case "1":
          return <RunResult result={result} ref={runResultRef} runId={runId} />;
        case "2":
          return <RunDetail ref={runDetailRef} runId={runId} />;
        case "3":
          return <RunTrack ref={runTrackRef} runId={runId} nodes={nodes} />;
        default:
          return null;
      }
    };

    return (
      <div className={styles["workflow_index"]} style={containerStyle}>
        {/* 左侧运行区域 */}
        <div className={styles["workflow_index_left"]}>
          <div className={styles["workflow_index_left_header"]}>运行</div>
          <div className={styles["workflow_index_left_content"]}    style={loading ? { pointerEvents: "none", opacity: 0.5 } : {}}>
            <RunInput ref={runInputRef} />
          </div>
          <div className={styles["workflow_index_left_footer"]}>
            <Tooltip title='清空内容'>
            <div
              className={styles["workflow_index_left_footer_clear"]}
              style={loading ? { pointerEvents: "none", opacity: 0.5 } : {}}
              onClick={clearFormEvent}
            
              
            >
              <img
                src="/agent/clear.png"
                alt=""
                className={styles["workflow_index_left_footer_btn_clear_img"]}
              />
            </div>
            </Tooltip>
            <Button
              className={styles["workflow_index_left_footer_btn"]}
              type="primary"
              loading={loading}
              onClick={runClickEvent}
           
            >
               {loading ?"": <img className={styles["workflow_index_left_footer_btn_img"]} src="/find/find_run.png" alt="运行" />}
              {loading ? "运行中..." : "运行"}
            </Button>
          </div>
        </div>

        {/* 右侧结果区域 */}
        <div className={styles["workflow_index_right"]}>
          <div className={styles["workflow_right_header"]}>
            <ConfigProvider
              theme={{
                components: {
                  Segmented: {
                    itemColor: "#666E82",
                    borderRadius: 8,
                    fontSize: 14,
                    trackBg: "rgba(219,226,234,0.6)",
                  },
                },
              }}
            >
              <Segmented
                className="custom-segmented"
                value={tabKey}
                style={{
                  padding: 3,
                  height: 36,
                }}
                onChange={handleTabChange}
                options={tabItems.map((item) => ({
                  value: item.key,
                  label: (
                    <div
                      style={{
                        padding: "0 14px",
                        height: 30,
                        lineHeight: "30px",
                      }}
                    >
                      {item.label}
                    </div>
                  ),
                }))}
              />
            </ConfigProvider>
            <Tooltip title="显示/隐藏右侧面板">
            <img
              src="/find/tip.png"
              onClick={tipClickEvent}
              className={styles["workflow_right_header_right"]}
              alt="提示"
            
            />
            </Tooltip>
          </div>
          <div className={styles["workflow_right_content"]}>
            {renderTabContent()}
          </div>
        </div>
      </div>
    );
  }
);

export default WorkflowIndex;
