import React, {
  useState,
  forwardRef,
  useRef,
  useEffect
} from "react";
import styles from "../page.module.css";
import { Input, Button, message,Modal  } from "antd";
import { getUuidByAgent } from "@/api/agent";
import { CopyOutlined, ReloadOutlined } from "@ant-design/icons";
import { Sender } from '@ant-design/x';
import Cookies from "js-cookie";
import {
  Editor,
  EditorState,
  ContentState,
} from "draft-js";
import "draft-js/dist/Draft.css";
import { stateFromHTML } from 'draft-js-import-html';
import { stateToHTML } from 'draft-js-export-html';
import ReplacePrompt from "./ReplacePrompt";
import { getUuid } from "@/utils/utils";
import { fetchEventSource } from "@microsoft/fetch-event-source";
let eventSource = null;
const Optimization = forwardRef((props, ref) => {
  const [tip, setTip] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editorState, setEditorState] = useState(() =>
    EditorState.createEmpty()
  );
  const abortRef = useRef(null);
  const [displayedText, setDisplayedText] = useState("");
  const messageBufferRef = useRef(""); // 缓存完整文本
  const outputIndexRef = useRef(0);    // 当前输出到的索引
  const replacePromptRef=useRef(null);
  let typingTimer = null;

  let isStart =false;

  // 根据文本内容判断类型并返回对应 EditorState
  const createEditorStateFromText = (value) => {
    const trimmed = value;
  

      // 纯文本
    let  contentState = ContentState.createFromText(value);
    

    return EditorState.createWithContent(contentState);
  };

  const handleTipChange = (e) => {
    setTip(e.target.value);
  };

  const typeWriterEffect = () => {
  
    if (outputIndexRef.current >= messageBufferRef.current.length) {
      typingTimer = null;
      clearTimeout(typingTimer);
    // 在打字结束后更新 editorState
    let newEditorState = createEditorStateFromText(displayedText);
    setEditorState(newEditorState);
    setIsLoading(false); 
    console.log(displayedText)
      return;
    }

    const nextChar = messageBufferRef.current[outputIndexRef.current];
    outputIndexRef.current += 1;

    setDisplayedText((prev) => prev + nextChar);
    typingTimer = setTimeout(typeWriterEffect, 40);
  };

  const startSSE = (uuid) => {
    messageBufferRef.current = "";
    outputIndexRef.current = 0;
     const token = Cookies.get("userToken");
     abortRef.current = new AbortController();
    isStart=true;
    setDisplayedText("");
    setIsLoading(true);
    setIsGenerating(true);  
      fetchEventSource("/voicesagex-console/application-web/prompt/promptGenerate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
       modelId: props.agentInfo.modelId,
      instruction: tip,
      prompt: props.agentInfo.promptWords,
      sseConnectId:getUuid()
      }),
     signal: abortRef.current.signal, // ✅ 正确传入 signal
      retryInterval: 2000,
      maxRetries: 1,
      openWhenHidden: false,

      onopen() {
        console.log(1)
      
      },
      onmessage(event) {
        console.log(event)
        if(event.event=='error'){
          handleStop();
       if(event.data){
     message.warning(event.data);
      handleStop(event.data);
      }
        }
       if(event.event=='message'){  
       let data =JSON.parse(event.data);
      if (isStart) {
        setIsGenerating(false);
        messageBufferRef.current += data.prompt;
        if (!typingTimer) {
          typeWriterEffect();
        }
      }
        }
      },

      onclose(event) {
     
         abortRef.current?.abort();
      },

      onerror(event) {
       message.warning('响应错误');
       abortRef.current?.abort();
    
 
      },
    });  
  };

  const cleanupSSE = () => {
    abortRef.current?.abort();
  };

  const clearCahce = () => {
    if (typingTimer) {
      clearTimeout(typingTimer);
      typingTimer = null;
    }
    messageBufferRef.current = "";
    outputIndexRef.current = 0;
  };

  const handleSend = () => {
    cleanupSSE();
    startSSE();
  };

  const handleStop = () => {
  
    isStart=false;
    cleanupSSE();
    clearCahce();
    setTip("");
    setIsLoading(false);
    setIsGenerating(false);
  };

  const handleReplace = () => {
   replacePromptRef.current.showModal();
  
  };
  //替换回调事件
  const  saveCallBack=()=>{
     props.replaceEvent(displayedText);
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(displayedText);
    message.success("复制成功");
  };

  const handleReset = () => {
    handleStop();
    handleSend();
  };

  const closeEvent = () => {
   console.log(eventSource,'11')
    setTip("");
    setIsLoading(false);
    setIsGenerating(false);
    setDisplayedText("");
    handleStop();
    props.closeOptimizationEvent();
  };
  //点击空白区域关闭
 const closeEventByEmpty=()=>{
  console.log(displayedText)
   if(displayedText || isLoading){
    return false;
   }
   closeEvent();
  }
  useEffect(() => {
    return () => {
      cleanupSSE();
    };
  }, []);

useEffect(() => {
  const handleClickOutside = (event) => {
    const container = document.getElementById("optimization_container");
    if (container && !container.contains(event.target)) {
      closeEventByEmpty();
    }
  };
  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, [displayedText, isLoading]);
  return (
    <div className={styles["optimization_container"]} id="optimization_container">
      <div className={styles["optimization_container_content"]}>
        {(isGenerating || displayedText) ? (
          <div className={styles["optimization_container_content_main"]}>
            <div className={styles["optimization_container_header"]}>
              <div className={styles["optimization_container_header_title"]}>生成结果</div>
              <div className={styles["optimization_container_header_close"]} onClick={closeEvent}>
                <img src="/close.png" alt="关闭" />
              </div>
            </div>

            <div className={styles["optimization_container_text"]}>
              <div className={styles["optimization_container_text_content"]}>
                {isGenerating ? (
                  "正在生成中..."
                ) : (
                  <div className="tiptap">
                  <Editor
                    editorState={isLoading&&displayedText?createEditorStateFromText(displayedText):createEditorStateFromText(displayedText)}
                    readOnly={true}
                  /></div>
                )}
                {isGenerating && <span className={styles["cursor"]}>|</span>}
              </div>
              {!isLoading && displayedText && (
                <div className={styles["optimization_container_text_btn"]}>
                  <Button type="primary" onClick={handleReplace}>替换</Button>
                  <div className={styles["optimization_container_text_pause"]}>
                    <CopyOutlined onClick={handleCopy} />
                  </div>
                  <div className={styles["optimization_container_text_refresh"]}>
                    <ReloadOutlined onClick={handleReset} />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}

        <div className={styles["optimization_container_footer"]}>
          <Sender
            value={tip}
            onCancel={handleStop}
            submitType="enter"
            onChange={v => setTip(v)}
            loading={isLoading}
            actions={(_, info) => {
              const { SendButton, LoadingButton } = info.components;
              if (isLoading) {
                return <LoadingButton />;
              }
              return <SendButton onClick={handleSend} disabled={false} />;
            }}
            placeholder="你希望如何优化提示词？"
          />
        </div>
      </div>
      {/* 替换弹框 */}
      <ReplacePrompt ref={replacePromptRef} saveCallBack={saveCallBack}></ReplacePrompt>
    </div>
  );
});

export default Optimization;
