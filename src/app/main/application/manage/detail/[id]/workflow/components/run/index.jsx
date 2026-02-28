"use client";

import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
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
} from "antd";
import { message } from "antd";
import styles from "./test.module.css";
import { useStore } from "@/store/index";
const { TextArea } = Input;
import TestInput from "./testInput";
import TestTrack from "./track/index";
import TestDetail from "./detail";
import TestResult from "./result";
import TabItem from "./TabItem";
import {runWorkflow} from "@/api/workflow";
import { getUuid } from "@/utils/utils";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import Cookies from "js-cookie";
import RunStatus from "./RunStatus";
import { getWorkflowRunDetail } from "@/api/workflow";
const Test = forwardRef((props, ref) => {
  const { panelVisible, setPanelVisible, pannerNode,setReadOnly,changeId } = useStore(
    (state) => state
  );
  useImperativeHandle(ref, () => ({
    showModal,
    hideModal,
  }));
  const abortRef = useRef(null);
  const [open, setOpen] = useState(false);
  const formRef = useRef(null);
  const [index, setIndex] = useState(1); //标题
  const [data, setData] = useState({}); //数据
  const [loading, setLoading] = useState(false); //加载中
  const [tabKey, setTabKey] = useState("1");
  const [nodeData, setNodeData] = useState({}); //选中的节点数据
  const testInputRef = useRef(null);
  const [runId,setRunId] = useState(null);//工作流运行id
  const [isRun,setIsRun] = useState(false);//是否运行中
  const testTrackRef = useRef(null);
  const [runData,setRunData] = useState(null);//运行数据
  const [result,setResult] = useState('');//结果
  const [tabItems,setTabItems] = useState([
    
    {
      key: "1",
      label: "输入",
      disabled:false,
    },
    {
      key: "2",
      label: "结果",
      disabled:true,
    },
    {
      key: "3",
      label: "详情",
      disabled:true,
    },
    {
      key: "4",
      label: "追踪",
      disabled:true,
    },
  ]);
  const showModal = async (obj, type, selectDepartment) => {
    console.log("测试")
    setLoading(true);
    setOpen(true);
    setTabKey("1");
    setRunId(null);
    setResult('');
   setRunData(null);
   clearData();
    setTimeout(() => {
      testInputRef.current.initFun();
    }, 100);
  };

  //弹框 className
  const classNames = {
    footer: styles["test-drawer-footer"],
    content: styles["test-drawer-content"],
    header: styles["test-drawer-header"],
    body: styles["test-drawer-body"],
  };
  //关闭事件
  const hideModal = () => {
    clearData();
    setOpen(false);
    props.setRunStatusEvent(null);
    abortRef.current?.abort();
  };

  //清空数据
  const clearData = () => {
    setReadOnly(false);
    setResult('');
    setRunData(null);
    setRunId(null);
    setIsRun(false);
    setTabKey("1");
    tabItems.forEach((item) => {
      if(item.key === '1'){
        item.disabled = false;
      }else{
        item.disabled = true;
      }

    });
    setTabItems(tabItems);
  }
  //创建sse 运行    
  const runSingeNodeEvent = (node) => {
    try{
      
   
    let runId = getUuid();
 
    let runData = {
      app_id: props.id,
      user_inputs: node,
      workflow_run_id: runId,//
    }
    const token = Cookies.get("userToken");
    abortRef.current = new AbortController();
    changeTabStatus();
    setRunId(runId);
    setResult(null);
    setRunDataEvent("running");
    setReadOnly(true);
    fetchEventSource("/voicesagex-console/application-web/workflow/draftWorkflowRun", {
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
      onopen(response) {
   
      },
      onmessage(event) {
         if (event.event === "message") {
        let data = JSON.parse(event.data);
          
        if(data.event=='workflow_started'){//开始运行
          setIsRun(true);
          handleRunStatus(runId);
        }
        if(data.event=='node_started' || data.event=='node_succeeded' || data.event=='node_failed'  || data.event=='node_completed' ||data.event=='workflow_succeeded' ||data.event=='workflow_failed'){//结束运行
          testTrackRef.current?.updateStepStatus();
        }
        if(data.event=='workflow_succeeded'){//结束运行
          setIsRun(false);
          let outputs = data.data.outputs;
          setResult(data.data.outputs);
          testInputRef.current?.closeLoading();
          //判断outputs是否为空对象
          if(Object.keys(outputs).length === 0){//没有输出
            setTabKey("3");
          }else{
            setTabKey("2");
          }
          handleRunStatus(runId);
          setReadOnly(false);
        }
        if(data.event=='workflow_failed'){//结束运行-运行失败
          setIsRun(false);
          setTabKey("3");
          testInputRef.current?.closeLoading();
          handleRunStatus(runId);
          setReadOnly(false);
        }
      }
      if(event.event == 'error'){
        console.log('error'.event);
        handleRunStatus(runId);
        closeEvent();
      }
      if(event.event == 'close'){
        console.log('error'.event);
        closeEvent();
      }
      },
      onerror(err) {
        console.error('SSE连接错误:', err);
        closeEvent();
        throw err;
       
      },
      onclose(err) {
        closeEvent();
        console.log('SSE连接已关闭');
        setIsRun(false);
      },
    });
  }catch(err){
    closeEvent();
    return false;
  }
  }
  //关闭事件
  const closeEvent = () => {
    abortRef.current?.abort();
    setIsRun(false);
    testInputRef.current?.closeLoading();
    setReadOnly(false);
  }
   
  //处理运行状态展示
  const handleRunStatus = (id) => {
    getWorkflowRunDetail({
      workflowRunId: id,
    }).then(res => {
      let obj = res.data;
      props.setRunStatusEvent(obj);
      setRunData(obj);
    })
  }
  //设置运行数据
  const setRunDataEvent = (status) => {
    let obj = {
      status: status,
      elapsed_time: 0,
      outputs: {},
    }
    props.setRunStatusEvent(obj);
    setRunData(obj);
  }
  //更改标签页状态
  const changeTabStatus = () => {
  setTabItems(tabItems.map((item) => {
    item.disabled = false;
    return item;
  }));
  }
  // 渲染标签内容
  const renderTabContent = () => {
    switch (tabKey) {

      case "2":
        return <TestResult runId={runId} isRun={isRun} result={result} />;
      case "3":
        return <TestDetail runId={runId} />;
      case "4":
        return <TestTrack ref={testTrackRef} runId={runId}   />;
      default:
        return null;
    }
  };
  // 标签点击事件
  const handleTabClick = (key) => {
    setTabKey(key);
  };
  return (
    <div>
      <Drawer
        maskClosable={false}
        closable
        title={null}
        placement="right"
        open={open}
        mask={false}
        rootStyle={{ boxShadow: "none", position: "absolute",}}
        width={480}
        destroyOnHidden={true}
        getContainer={() => document.getElementById("workflow_page")}
        zIndex={1000}
        classNames={classNames}
      >
        <div className={styles["test_container"]}>
          <div className={styles["test_container_header"]}>
            <div className={styles["test_container_header_title"]}>
              测试
            </div>
        
           <div className={styles["test_container_header_right"]}>
         
             { runData &&  <RunStatus runData={runData} />}

            <img
              className={styles["test_container_close"]}
              src="/close.png"
              onClick={hideModal}
            />
          </div>  
          </div>
          <div className={styles["test_container_tab"]}>
            {tabItems.map((item) => (
              <TabItem
                key={item.key}
                item={item}
                isActive={item.key === tabKey}
                onClick={handleTabClick}
              />
            ))}
          </div>
          <div className={styles['test_container_content']} style={{display: tabKey === '1' ? 'flex' : 'none'}}>
          <TestInput  isRun={isRun}   runSingeNodeEvent={runSingeNodeEvent} ref={testInputRef} />
          
            </div>
          {tabKey!='1'&&(
            <div className={styles['test_container_content']} >
              {renderTabContent()}
            </div>   
          )}
          
        </div>
      </Drawer>
    </div>
  );
});

export default Test;
