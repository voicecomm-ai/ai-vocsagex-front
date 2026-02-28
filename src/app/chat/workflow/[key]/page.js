'use client';
import React, {
  forwardRef,
  useImperativeHandle,
  useEffect,
  useState,
  useRef,
} from "react";
import styles from "./components/workflow.module.css";
import RunInput from "@/app/components/workflow/RunInput";
import { Button, ConfigProvider, Segmented, message,Typography,Spin, Tooltip } from "antd";
import RunResult from "./components/result";
import RunDetail from "./components/detail";
import RunTrack from "./components/track";
import { getUuid } from "@/utils/utils";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import Cookies from "js-cookie";
import { getApplicationInfoByUrlKey } from "@/api/chat";
import { useParams } from "next/navigation";
const { Text } = Typography;
import { getWorkflowParams } from "@/api/workflow";
import { useRouter } from "next/navigation";
const WorkflowIndex = forwardRef(
  (
    props,
    ref
  ) => {
    const { key } = useParams();
    const router = useRouter();
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
    const [applicationInfo,setApplicationInfo] = useState(null);
    const [initLoading,setInitLoading] =useState(true);
 const [tabItems,setTabItems] = useState([
  {
    key: "1",
    label: "结果",
  },
  {
    key: "2",
    label: "详情",
  },
  {
    key: "3",
    label: "追踪",
  },
 ]);
 
 const goto404Page =()=>{
  router.push(`/chat/${key}`);
 }

    // 暴露给父组件的方法
    useImperativeHandle(ref, () => ({}));

    // 初始化运行模块
    useEffect(() => {
      setInitLoading(true);
      initRunModule();
    }, [key]);


    // 初始化运行模块
    const initRunModule = () => {
      
      getApplicationInfoByUrlKey(key).then((res) => {
        let data = res.data;
        if(!data){
          return goto404Page();
        }
        setApplicationInfo(data);
        getWorkflowParamsEvent(data.id);
      }).catch((err)=>{
        console.error("获取应用信息失败:", err);
        goto404Page();
      });
    };

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

    //获取运行参数列表
    const getWorkflowParamsEvent =(id)=>{
      getWorkflowParams({
        appId: id,
      }).then((res)=>{
        setInitLoading(false);
        let data = res.data;
        runInputRef.current.initFun(data);
      }).catch((err)=>{
        console.error("获取运行参数列表失败:", err);
        setInitLoading(false);
      });
    }


    //创建sse 运行
    const runClickEvent = async () => {
      setTabKey("1");
      try {
        let formData = await runInputRef.current?.getFormData();
        let runId = getUuid();
        let runData = {
          app_id: applicationInfo.id,
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
          "/voicesagex-console/application-web/workflow/publishRunUrl",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
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
                  ||data.event == "node_completed"
                  ||data.event == "workflow_succeeded"
                  ||data.event == "workflow_failed"
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
      <div className={styles["workflow_index"]}>
            {/* 全屏加载提示 */}
            <Spin
        spinning={initLoading}
        wrapperClassName="node_main_spin"
        fullscreen
        tip="加载中..."
      >
        {" "}
      </Spin>
        {/* 左侧运行区域 */}
        <div className={styles["workflow_index_left"]}>
          <div className={styles["workflow_index_left_header"]}>
  
          <img className={styles["workflow_index_left_header_icon"]} src={process.env.NEXT_PUBLIC_API_BASE + applicationInfo?.iconUrl} alt="" />
          <div className={styles["workflow_index_left_header_name"]}>
          <Text ellipsis={{ tooltip: applicationInfo?.name }} style={{ maxWidth: 350 }}>
            <span className={styles["workflow_index_left_header_name_text"]}> {applicationInfo?.name}</span>
          </Text>
          </div>
          </div>
          <div className={styles["workflow_index_left_title"]}>
          运行 
         </div> 
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
                alt="清空"
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
