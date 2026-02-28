"use client";

import React, { useState, forwardRef, useImperativeHandle, useRef, useEffect } from "react";
import { Input, Form, message } from "antd";
import styles from "../node.module.css";
import { useNodesInteractions, useNodeData } from "../../hooks";
import debounce from "lodash/debounce";

const { TextArea } = Input;
import { useStore } from "@/store/index";
import { mapVariablesToNodeInfo } from "./useEndData";
import VariableCascader from '../../../variableCascader';
import RunHeader from "../../components/RunHeader";   
const EndPanel = forwardRef((props, ref) => {
  const { updateNodeDetail } = useNodesInteractions();
  const { getUpstreamVariables, getNodeById } = useNodeData();
  // const { Text } = Typography; // 已不再使用
  const [form] = Form.useForm();
  const {
    panelVisible,
    pannerNode,
    readOnly,
    setPannerNode,
    setPanelVisible,
    setRunVisible,
    changeId,
  } = useStore((state) => state);
  const [title, setTitle] = useState("");
  const [data, setData] = useState({});
  const [nodeData, setNodeData] = useState({});
  const [validateList, setValidateList] = useState([]);
  const isInitializing = useRef(false);
  const renderDataRef = useRef([]);
  const nodeId = useRef("");
  const [isEditing, setIsEditing] = useState(false);  
  // 1. 新增ref，用来保存add函数
  const addVariableRef = useRef(null);
  // 用于跟踪是否是第一次打开弹框
  const isFirstOpen = useRef(true);

  useImperativeHandle(ref, () => ({
    // showModal,
    // hideModal,
  }));

  // const showModal = async () => {
  //   setOpen(true);
  // };

  // const hideModal = () => {
  //   setOpen(false);
  // };

  const closePanelEvent = () => {
    setPannerNode(null);
    setPanelVisible(false);
    setRunVisible(false);
    // 重置第一次打开标记，下次打开时重新验证
    isFirstOpen.current = true;
  };

  useEffect(() => {
    if (panelVisible && pannerNode) {
      initFun();
    }
  }, [panelVisible, pannerNode, changeId]);

  const initFun = () => {
    isInitializing.current = true;
    setTitle(pannerNode.data.title);
    nodeId.current = pannerNode.id;
    let nodeObj = getNodeById(pannerNode.id);
    setNodeData(nodeObj);
    const arr = getUpstreamVariables(pannerNode.id);
    handleRenderPanel(nodeObj, arr);
    setValidateList(arr);
    setData(nodeObj.data);

    setTimeout(() => {
      isInitializing.current = false;
      
      // 第一次打开弹框时进行验证
      if (isFirstOpen.current) {
        isFirstOpen.current = false;
        // 获取所有变量字段路径
        const variables = form.getFieldValue("variables") || [];
        if (variables.length > 0) {
          const fieldNames = variables.flatMap((_, index) => [
            ['variables', index, 'variable'],
            ['variables', index, 'value_selector']
          ]);
          // 触发验证
          form.validateFields(fieldNames).catch(() => {
            // 验证失败是正常的，这里只是触发验证
          });
        }
      }
    }, 100);
  };

  const handleRenderPanel = (nodeData, validateArr) => {
    let arr = nodeData.data.outputs || [];
    renderDataRef.current = arr;

    form.setFieldsValue({ variables: arr }, false);

    // 确保 renderDataRef 数组长度与表单变量数量一致
    const currentVariables = form.getFieldValue("variables") || [];
    while (renderDataRef.current.length < currentVariables.length) {
      renderDataRef.current.push({});
    }
  };


  // 2. 改写添加变量事件，调用add函数，防止清空
  const addEndVariableEvent = () => {
    if(readOnly) return;
    if (addVariableRef.current) {
      const newIndex = addVariableRef.current({
        value_selector: [],
        variable: "",
      });
      // 确保 renderDataRef 数组长度与表单变量数量一致
      const currentVariables = form.getFieldValue("variables") || [];
      while (renderDataRef.current.length < currentVariables.length) {
        renderDataRef.current.push({});
      }
    }
  };

  // 辅助函数：更新 renderDataRef 中指定索引的数据
  const updateRenderDataRef = (index, data) => {
    let updateData = {};
    // 确保 renderDataRef 数组足够长
    while (renderDataRef.current.length <= index) {
      renderDataRef.current.push({});
    }

    let valueSelectArr = data.value_selector || []; //所选择值的value_selector
    if (valueSelectArr.length) {
      updateData = valueSelectArr;
    }

    // console.log(updateData, 'updateData')
    // 更新指定索引的数据
    renderDataRef.current[index] = {
      ...renderDataRef.current[index],
      ...updateData,
    };
  };

  // 辅助函数：清理 renderDataRef 中指定索引的数据
  const clearRenderDataRef = (index) => {
    if (renderDataRef.current[index]) {
      renderDataRef.current[index] = {};
    }
  };

  // 辅助函数：删除 renderDataRef 中指定索引的数据并重新排列
  const removeRenderDataRef = (index) => {
    if (renderDataRef.current[index]) {
      // 删除指定索引的数据
      renderDataRef.current.splice(index, 1);
    }
  };

  const handleFormValuesChange = (changedValues, allValues) => {
    if (!("variables" in changedValues) || isInitializing.current) return;

    const currentVariables = allValues.variables || [];
    console.log(currentVariables, 'currentVariables')

    // 找出哪个变量发生了变化
    const changedVariableKeys = Object.keys(changedValues.variables);
    
    // 标记是否有变量名发生变化
    let hasVariableNameChanged = false;

    // 处理每个发生变化的变量
    changedVariableKeys.forEach((changedKey) => {
      const changedVariable = changedValues.variables[changedKey];
      const index = parseInt(changedKey);
     console.log(changedVariable, 'changedVariable')
      // 确保 renderDataRef 数组长度与表单变量数量一致
      while (renderDataRef.current.length < currentVariables.length) {
        renderDataRef.current.push({});
      }

      // 如果有 value_selector 变化，更新 renderDataRef
      if (changedVariable && changedVariable.value_selector) {
        updateRenderDataRef(index, {
          value_selector: changedVariable.value_selector,
        });
      }

      // 如果有 variable 变化，也更新 renderDataRef
      if (changedVariable && changedVariable.variable !== undefined) {
        updateRenderDataRef(index, { variable: changedVariable.variable });
        hasVariableNameChanged = true;
      }
    });

    // 处理所有有效的变量
    const arr = currentVariables.filter(Boolean);
    // 检查重复变量名
    console.log(arr, 'arr')
    const seen = new Set();
    const uniqueArr = arr.filter((item) => {
      if (seen.has(item.variable)) {
        return false;
      }
      seen.add(item.variable);
      return true;
    });
    setData((prev) => ({
      ...prev,
      outputs: arr,
    }));

    // 如果有变量名变化，重新验证所有变量名字段，清除缓存的状态
    if (hasVariableNameChanged) {
      // 使用 setTimeout 确保在表单值更新后再验证
      setTimeout(() => {
        // 获取所有变量名字段的路径
        const variableFieldNames = currentVariables.map((_, index) => ['variables', index, 'variable']);
        
        // 先清除所有变量名字段的错误状态
        const fieldsToClear = variableFieldNames.map(fieldName => ({
          name: fieldName,
          errors: [],
        }));
        form.setFields(fieldsToClear);
        
        // 然后重新验证所有变量名字段
        form.validateFields(variableFieldNames).catch(() => {
          // 验证失败是正常的，这里只是触发重新验证
        });
      }, 0);
    }
  };

  const updateNodeDetailEvent = useRef(
    debounce((data) => {
      let newData = {
        nodeId: nodeId.current,
        data: { ...data, id: nodeId.current },
      };
     console.log(newData, 'newData')
      updateNodeDetail(newData);
      // 不要在这里重新设置 data，避免覆盖 outputs
      // setData(newData.data);
    }, 50)
  ).current;

  useEffect(() => {
    if (!isInitializing.current) {
      updateNodeDetailEvent(data);
    }
  }, [data]);

  const handleNodeTitleChange = (e) => {
    const title = e.target.value;
    setTitle(title);
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

    updateNodeDetailEvent(obj);
  };
  // 失去焦点时保存标题并关闭编辑
  const handleTitleBlur = () => {
    setIsEditing(false);
    saveTitle(title);
  };
  const handleNodeDescChange = (e) => {
    const desc = e.target.value;
    setData((prev) => ({
      ...prev,
      desc,
    }));
  };

  const handleTitleFocus = () => {
    setIsEditing(true);
  };
  const updateNodeDataByHeader =(obj)=>{
    setData(obj);
    updateNodeDetailEvent(obj);
   }

    return (
    <div className={styles["panel_main"]}>
     <RunHeader  data={data} updateNodeDataByHeader={updateNodeDataByHeader}  isRun={false}  />
       <div className="node_panel_config">
      <div className={styles["start_panel_variable"]}>
        <div className={styles["start_panel_variable_title"]}>输出</div>
       
          <div onClick={addEndVariableEvent} className={`${styles["start_panel_variable_add"]} ${readOnly ? 'readOnly' : ''}`}>
            <img src='/workflow/add.png' />
            添加
          </div>
        
      </div>

      <div className={styles["end_panel_variable_content"]}>
        <Form
          form={form}
          layout='vertical'
          initialValues={{ variables: [] }}
          disabled={readOnly}
          onValuesChange={handleFormValuesChange}
      
        >
          <Form.List name='variables'>
            {(fields, { add, remove }) => {
              // 直接赋值，不调用 Hook
              addVariableRef.current = add;
              return (
                <>
                  {fields.map((item, index) => (
                    <div key={item.key} style={{ display: "flex", gap: "3px" }}>
                      <Form.Item
                        {...item}
                        shouldUpdate
                        name={[item.name, "variable"]}
                        rules={[
                          {
                            required: true,
                            message: "请输入变量名",
                            trigger: "blur",
                          },
                          {
                            pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
                            message: "变量名只能包含字母、数字和下划线，且不能以数字开头",
                          },
                          {
                            validator: (_, value) => {
                              if (!value) return Promise.resolve();

                              const variables = form.getFieldValue("variables") || [];

                              // 获取当前 index
                              const currentIndex = item.name;

                              // 检查是否存在相同变量名（忽略当前项）
                              const duplicate = variables.some((item, idx) => {
                                return idx !== currentIndex && item && item.variable === value;
                              });
                            
                              if(duplicate){
                                return Promise.reject(new Error("变量名已存在"));
                              }
                              return Promise.resolve();
                            },
                            trigger: ["blur", "change"],
                          },
                        ]}
                        style={{ flex: 1 }}
                      >
                        <Input variant="borderless"   className={styles.custom_input} style={{background:'#F5F9FC'}} maxLength={20} placeholder='请输入变量名' />
                      </Form.Item>

                      <Form.Item
                        {...item}
                        name={[item.name, "value_selector"]}
                        rules={[{ required: true, message: "请选择变量值" }]}
                        style={{ width: 232 }}
                      >
                       
                          <VariableCascader
                            data={validateList}
                            isSingle={true}
                            disabled={readOnly}

                            renderWidth='60px'
                            labelMaxWidth={65}
                            style={{borderColor: '#dddfe4'}}
                            value_selector={form.getFieldValue(['variables', index, 'value_selector'])}
                            onChange={(selectedItem) => {
                             console.log(selectedItem, 'selectedItem')
                             
                                form.setFieldValue(['variables', index, 'value_selector'], selectedItem);
                            
                                // 触发级联变化事件（已移除 cascaderChangeEvent 函数）
                              
                            }}
                            placeholder='请选择变量值'
                          />
                 
                      </Form.Item>
                    
                        <div className='node_delete_icon' style={{marginTop: '6px'}}>
                        <img
                          onClick={() => {
                            if(readOnly) return;
                            // 先删除 renderDataRef 中对应索引的数据
                            removeRenderDataRef(item.name);
                            // 然后删除表单项
                            remove(item.name);
                          }}
                          alt='删除变量'
                          onMouseEnter={(e) => (e.currentTarget.src = "/workflow/common/delete_hover.png")}
                          onMouseLeave={(e) => (e.currentTarget.src = "/workflow/common/delete.png")}
                          className={`${styles["end_panel_variable_content_item_del"]} ${readOnly ? 'readOnly' : ''}`}
                          src='/workflow/common/delete.png'
                        />
                        </div>
                     
                    </div>
                  ))}
                </>
              );
            }}
          </Form.List>
        </Form>
      </div>
      </div>
    </div>
  );
});

export default EndPanel;
