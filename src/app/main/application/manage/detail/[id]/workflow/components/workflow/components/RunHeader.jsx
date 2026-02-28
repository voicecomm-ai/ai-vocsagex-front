

import styles from './index.module.css';
import React,{forwardRef,useImperativeHandle,useState,useEffect} from 'react';
import { Button, ConfigProvider, Segmented, message,Tooltip,Input } from "antd";
const { TextArea } = Input;
import { useStore } from "@/store/index";

const RunHeader = forwardRef((props, ref) => {
  const {setPanelVisible,readOnly,setPannerNode,setRunVisible,panelVisible,pannerNode,setChangeId,setChangeNodeType} = useStore(
    (state) => state
  );
  const {data,isRun=true,isPadding=false}=props;
  const [title, setTitle] = useState(data.title);
  const [isEditing, setIsEditing] = useState(false);
  useImperativeHandle(ref, () => ({
  
  }));

  useEffect(() => {
    setTitle(data.title);

  }, [data]);
  const handleNodeTitleChange = (e) => {
    setTitle(e.target.value);
  };
  const handleTitleFocus = () => {
    setIsEditing(true);
  };
  const handleTitleBlur = () => {
    setIsEditing(false);
    saveTitle(title);
  };
  const saveTitle = (value) => {
    if (!value || value.trim().length === 0) {
      setTitle(data.title);
      return message.warning("节点名称不能为空");
    }
    setTitle(value);
    let obj = {
      ...data,
      title: value,
    };
    updateNodeDataByHeader(obj);
  };
  const handleNodeDescChange = (e) => {
    let obj = {
      ...data,
      desc: e.target.value,
    };
    updateNodeDataByHeader(obj)
  };
  const  updateNodeDataByHeader = (obj) => {
   props?.updateNodeDataByHeader(obj)
   
  };
  const runPanelEvent = () => {
    props?.runPanelEventByHeader()
  };
  const closePanelEvent = () => {
    setPanelVisible(false);
  };

  const renderNodeIcon = () => {
    if(data.type=='mcp'){
      return process.env.NEXT_PUBLIC_API_BASE + data.mcp_url;
    }
    if(data.type=='agent' || data.type=='workflow'){
      return process.env.NEXT_PUBLIC_API_BASE + data.iconUrl;
    }
    return `/workflow/${data.type}.png`;
  }

  return (
    <div className={`${styles["panel_main_header"]} ${(isPadding ? styles["panel_main_header_padding"] : "")}`}>
        <div className={styles["panel_main_header_top"]}>
          <div className={styles["panel_main_header_left"]}>
            {data.type && (
          
              <img
                className={styles["panel_main_header_left_icon"]}
                src={renderNodeIcon()}
                alt=''
              />
        
            )}

            <div className={styles["panel_main_header_left_title"]}>
              <Input
                disabled={readOnly}
                title={title}
                variant='borderless'
                className={`${styles["panel_main_header_left_title_input"]} ${isEditing ? styles["editing"] : styles["not-editing"]}`}
                value={title}
                maxLength={50}
                onChange={(e) => {
                  handleNodeTitleChange(e);
                }}
                 onFocus={handleTitleFocus}
                onBlur={handleTitleBlur}
              />
            </div>
          </div>
          <div className={styles["panel_main_header_right"]}>
            {!readOnly&&isRun && (
            <Tooltip title='运行'>
              <img
                onClick={runPanelEvent}
                alt=''
                className={styles["panel_close"]}
                src='/workflow/run_panel.png'
              />
              </Tooltip>
            )}

            <img
              onClick={closePanelEvent}
              className={styles["panel_close"]}
              src='/close.png'
              alt=''
            />
          </div>
        </div>

        <div className={styles["panel_main_header_bottom"]}>
          <TextArea
            disabled={readOnly}
            className={styles['panel_main_header_desc']}
            maxLength={200}
            value={data.desc}
            
            onChange={(e) => {
              handleNodeDescChange(e);
            }}
            autoSize={{ minRows: 1, maxRows: 8 }}
            placeholder='添加描述'
            variant='borderless'
          />
        </div>
      </div>
  );
});

export default RunHeader;