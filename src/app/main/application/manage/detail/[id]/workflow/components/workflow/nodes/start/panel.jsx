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
  Typography,
  message
} from "antd";
import styles from "../node.module.css";
import Variable from "../../../Dialog/Variable";
import startStyles from "./start.module.css";

import { useNodesInteractions,useNodeData } from "../../hooks";
import DeleteModal from "./confirm";
import RunHeader from "../../components/RunHeader";

const { TextArea } = Input;
const { Paragraph, Text } = Typography;
import debounce from "lodash/debounce";
import { getSystemVariables } from "@/api/workflow";
import { useStore } from "@/store/index";
import { getUuid } from "@/utils/utils";
const StartPanel = forwardRef((props, ref) => {

     const {setPanelVisible,readOnly,setPannerNode,setRunVisible,panelVisible,pannerNode,setChangeId,setChangeNodeType} = useStore(
    (state) => state
  );
  const  imgList = {
    'text-input':"text",
    'paragraph': 'paragraph',
    'select': 'select',
    'number': 'number',
    'file': 'file',
    'file-list': 'file-list',
  }

  const  typeList = {
    'text-input':"String",
    'paragraph': 'String',
    'select': 'String',
    'number': 'Number',
    'file': 'File',
    'file-list': 'Array[File]',
  }
  const { updateNodeDetail } = useNodesInteractions();
  const  {findVariableReferences,deleteVariableReferences,renameVariableReferences} = useNodeData();
  useImperativeHandle(ref, () => ({
    hideModal,
  }));
  const deleteModalRef = useRef(null);//变量删除ref
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({}); //数据
  const [loading, setLoading] = useState(false); //加载中
  const variableRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [selectVariable, setSelectVariable] = useState({});
  const [systemVariable, setSystemVariable] = useState([]);
  const [title, setTitle] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const runHeaderRef = useRef(null);
  useEffect(() => {
    if (panelVisible && pannerNode) {

      setData(pannerNode.data);
      setTitle(pannerNode.data.title);
    }
  //getSystemVariablesEvent();
  }, [panelVisible]);

  //关闭事件
  const hideModal = () => {
    setOpen(false);
  };
  //添加变量
  const addVariable = () => {
    if(readOnly) return;
    variableRef.current.showModal("add", "");
  };

  // 关闭面板事件
  const closePanelEvent = () => {
    setPannerNode(null);
    setPanelVisible(false);
  };

  const updateNodeDetailEvent = useRef(
    debounce(async (data) => {
      let newData = {
        nodeId: props.nodeData.id,
        data: { ...data, id: props.nodeData.id },
      };
      setData(newData.data);
      updateNodeDetail(newData);
      setChangeId(getUuid())
      setChangeNodeType(props.nodeData.type);
    }, 50) // 1000ms 无操作后才触发
  ).current;
  
  // 节点标题改变事件
  const handleNodeTitleChange = (e) => {
    let title = e.target.value;
      setTitle(title);

  };
  
  // 输入框获得焦点时
  const handleTitleFocus = () => {
    setIsEditing(true);
  };
  const handleNodeDescChange = (e) => {
    let obj = {
      ...data,
      desc: e.target.value,
    };
    setData({ ...obj });
    updateNodeDetailEvent(obj);
  };
  // 保存标题
  const saveTitle = (value) => {
      if (!value.trim()) {
      setTitle(data.title);
      return message.warning("节点名称不能为空");
    
    }
      let obj = {
      ...data,
      title: value,
    };
      console.log(obj);
    updateNodeDetailEvent(obj);
  };
   // 失去焦点时保存标题并关闭编辑
  const handleTitleBlur = () => {
    setIsEditing(false);
    saveTitle(title);
  };
  //更新节点数据
const updateVariableEvent = (validatorObj, action) => {
  let variableArr = data.variables || [];

  // 检查变量名是否重复
  const isDuplicate = variableArr.some((v) => {
    // 排除自身（更新时）
    if (action === "update" && v.id === validatorObj.id) return false;
    return v.variable === validatorObj.variable;
  });

  if (isDuplicate) {
    message.warning('变量名称重复');
    return;
  }

  if (action === "add") {
    variableArr.push(validatorObj);
  } else {
    //更新变量的值
    const index = variableArr.findIndex((i) => i.id === validatorObj.id);
    const oldVarName = variableArr[index].variable;
    variableArr[index] = validatorObj;

    if (oldVarName !== validatorObj.variable) {
      // 名称变更才触发重命名引用
      renameVariableReferences(props.nodeData.id, oldVarName, validatorObj.variable);
    }
  }

  const obj = {
    ...data,
    variables: variableArr,
  };
  setData(obj);
  updateNodeDetailEvent(obj);
    variableRef.current.modelCancelEvent();
};

  const variableHover = (item) => {
    setIsHovered(true);
    setSelectVariable(item);
  };

  const variableMouseOut = () => {
    setIsHovered(false);
    setSelectVariable({});
  };
  const editVariableEvent = (item) => {
    if(readOnly) return;
    variableRef.current.showModal("update", item);
  };

  //删除变量点击事件
  const deleteVariableEvent = (item) => {
    if(readOnly) return;
    let isReferenced = findVariableReferences(props.nodeData.id, item.variable);
      console.log(isReferenced,'1findVariableReferences')
    if(isReferenced&&isReferenced.length){
      deleteModalRef.current.showModal(item);
      return;

    }
    else{
      deleteVariableSuccessEvent(item);
    }
  };
  
  //删除变量调用
  const deleteVariableSuccessEvent = (item,isDeleteAll) => {
    if(isDeleteAll){
      deleteVariableReferences(props.nodeData.id, item.variable);
    }
    let variableArr = data.variables || [];
    variableArr = variableArr.filter((i) => i.id != item.id);
    let obj = {
      ...data,
      variables: variableArr,
    };
    setData(obj);
    updateNodeDetailEvent(obj);
  }

   console.log(data,'111')

  const getSystemVariablesEvent = () => {
    getSystemVariables().then((res) => {
      setSystemVariable(res.data);
    });
  };

  // 运行面板事件
  const runPanelEvent = () => {
    if(readOnly) return;
      setPannerNode(props.nodeData)
     setPanelVisible(false)
  setRunVisible(true)
  }
 const updateNodeDataByHeader =(obj)=>{
  setData(obj);
  updateNodeDetailEvent(obj);
 }

  return (
    <div className={styles["panel_main"]}>
      <RunHeader ref={runHeaderRef} data={data} updateNodeDataByHeader={updateNodeDataByHeader} runPanelEventByHeader={runPanelEvent}   />
      {/* <div className={styles["panel_main_header"]}>
        <div className={styles["panel_main_header_top"]}>
          <div className={styles["panel_main_header_left"]}>
            <img
              className={styles["panel_main_header_left_icon"]}
              src={`/workflow/${data.type}.png`}
            />

            <div className={styles["panel_main_header_left_title"]}>
              <Input
               disabled={readOnly}
                variant="borderless"
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
          <div className={styles['panel_main_header_right']}>
              
             <img
            onClick={runPanelEvent}

            className={`${styles["panel_close"]} ${readOnly ? 'readOnly' : ''}`}
            src="/workflow/run_panel.png"
          />
          

          <img
            onClick={closePanelEvent}
            className={styles["panel_close"]}
            src="/close.png"
          />
          </div> 
        </div>

        <div className={styles["panel_main_header_bottom"]}>
          <TextArea
           disabled={readOnly}
            maxLength={200}
            value={data.desc}
            onChange={(e) => {
              handleNodeDescChange(e);
            }}
            autoSize={{ minRows: 1, maxRows: 8 }}
            placeholder="添加描述"
            variant="borderless"
          />
        </div>
      </div> */}
   <div className="node_panel_config">
      <div className={styles["start_panel_variable"]}>
        <div className={styles["start_panel_variable_title"]}>添加变量</div>
        
        <div
          className={`${styles["start_panel_variable_add"]} ${readOnly ? 'readOnly' : ''}`}
          onClick={addVariable}
        >
          <img src="/workflow/add.png" /> 添加
        </div>
      
      </div>
     <div className={styles['start_panel_content']}>
      <div className={startStyles["start_panel_variable_content"]}>
        {data.variables &&
          data.variables.map((item) => (
            <div
            key={item.id}
              className={startStyles["start_panel_variable_item"]}
              onMouseMove={() => variableHover(item)}
              onMouseEnter={() => variableHover(item)}
              onMouseLeave={() => variableMouseOut(item)}
            >
              <div className={styles["start_panel_variable_item_left"]}>
            

                <div
                  className={styles["start_panel_variable_item_left_content"]}
                >
                  <div className={styles["start_panel_variable_name"]}>
                    <Text
                      style={{ maxWidth: 100 }}
                      ellipsis={{ tooltip: item.variable }}
                    >
 
                   <span className={startStyles["start_panel_variable_name_text"]}>   {`{{${item.variable}}}`}</span>
                    </Text>
                  </div>
                  <div className={styles["start_panel_variable_displayName"]}>
                    <Text
                      style={{ maxWidth: 100 }}
                      ellipsis={{ tooltip: item.label }}
                    >
                   <span className={startStyles.start_panel_variable_displayName_span}>   {item.label}</span>
                    </Text>
                  </div>
                </div>
              </div>
              <div className={styles["start_panel_variable_item_right"]}>
                {(!isHovered ||
                  (isHovered && selectVariable.id !== item.id)) && (
                  <div
                    className={startStyles["start_panel_variable_item_fieldType"]}
                  >
                    <div className={startStyles["start_panel_variable_item_fieldType_text"]}>{typeList[item.type]}</div>

                       <img className={startStyles["start_panel_variable_item_fieldType_img"]} alt="" src={"/agent/" + imgList[item.type] + ".png"} />
                  </div>
                )}
                { isHovered && selectVariable.id === item.id && (
                  <div className={styles["start_panel_variable_item_btn"]}>
                    <img
                      className={`${readOnly ? 'readOnly' : ''}`}
                      src="/agent/edit.png"
                      onClick={() => editVariableEvent(item)}
                    />
                    <img
                      className={`${readOnly ? 'readOnly' : ''}`}
                      src="/agent/delete.png"
                      onClick={() => deleteVariableEvent(item)}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
      </div>
    
     </div> 
     </div>
      <Variable
        ref={variableRef}
        variables={data.variables}
        updateVariableEvent={updateVariableEvent}
      ></Variable>
      {/* 变量删除弹框 */}
      <DeleteModal ref={deleteModalRef} deleteVariableSuccessEvent={deleteVariableSuccessEvent}></DeleteModal>

    </div>
  );
});

export default StartPanel;
