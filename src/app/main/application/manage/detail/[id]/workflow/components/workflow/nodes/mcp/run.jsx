"use client";

import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
  useCallback,
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
} from "antd";
import { message, Divider } from "antd";
import { useParams } from "next/navigation";
import styles from "../node.module.css";
import Variable from "../../../Dialog/Variable";
import { useStore } from "@/store/index";
import { useNodesInteractions, useNodeData } from "../../hooks";
import { useReactFlow } from '@xyflow/react'
const { TextArea } = Input;
import { runNode, getLastRunResult } from "@/api/workflow";

import TestInput from "../../../test/SingleInput";
import TabItem from "../../../test/TabItem";
import TestDetail from "../../../test/SingleDetail";
import RunStatus from "../../../test/RunStatus";
// 常量定义
const VARIABLE_TYPES = {
  VARIABLE: 'Variable',
  TEXT_INPUT: 'text-input'
};

const NODE_TYPES = {
  START: 'start'
};

const LlmRun = forwardRef((props, ref) => {
  const { id } = useParams();
  const { Paragraph, Text } = Typography;
  useImperativeHandle(ref, () => ({
    hideModal,
  }));
  const { getNodeById,getUpstreamVariables } = useNodeData();
  const { runVisible, setRunVisible, pannerNode, setPannerNode } = useStore(
    (state) => state
  );
  const reactFlowInstance = useReactFlow()
  const [open, setOpen] = useState(false);
  const formRef = useRef(null);
  const [data, setData] = useState({}); //数据
  const [loading, setLoading] = useState(false); //加载中

  const testInputRef = useRef(null);
  const [runData, setRunData] = useState('');
  const [tabKey, setTabKey] = useState("1");
  const testDetailRef = useRef(null);
  const [variables, setVariables] = useState([]);
  const [isExitData, setIsExitData] = useState(false); // 是否存在上一次运行数据
  
  // 运行状态常量
  const RUN_STATUS = {
    SUCCEEDED: "succeeded",
    FAILED: "failed",
    RUNNING: "running",
  };

  // 标签页配置
  const TAB_ITEMS = [
    {
      key: "1",
      label: "输入",
    },
    {
      key: "3",
      label: "详情",
    },
  ];

  // 标签页键值常量
  const TAB_KEYS = {
    INPUT: "1",
    DETAIL: "3",
  };
  useEffect(() => {
    if (pannerNode && runVisible) {
      console.log(pannerNode,'pannerNode');
      getLastRunResultEvent(pannerNode.id);
      let nodeData = getNodeById(pannerNode.id);
      getMcpNodeVariables(nodeData.data);
      setData(nodeData.data);
    }
  }, [runVisible]);

  /**
   * 获取MCP节点中的变量，并对比开始节点变量，只保留在开始节点变量中的MCP变量
   * @param {Object} data - 节点数据
   */
  const getMcpNodeVariables = useCallback((data) => {
    try {
      const upstreamVariables = getUpstreamVariables(pannerNode.data.id);
      const filteredVars = [];
      
      // 获取开始节点变量
      const nodeData = reactFlowInstance.getNodes();
      const startNode = nodeData.find(node => node.type === NODE_TYPES.START);
      const startVars = startNode?.data?.variables || [];
      
      const params = data.param || [];
      
      params.forEach(param => {
        if (param.value_type === VARIABLE_TYPES.VARIABLE) {
          
          const found = findVariableInTree(upstreamVariables, handleVariableToValue(param.value));
          if (found) {
          
            const variableData = createVariableData(found, startVars);
            if (variableData) {
              variableData.label = param.name;//设置变量名称
              filteredVars.push(variableData);
            }
          }
        }
      });
      
      setVariables(filteredVars);
    } catch (error) {
      console.error('获取MCP节点变量时出错:', error);
      setVariables([]);
    }
  }, [getUpstreamVariables, pannerNode, reactFlowInstance]);

  //转换变量 从{{#38638f54-b6e5-4036-9c5b-2e1056ccc2f3.test_text#}} 转换为 ["38638f54-b6e5-4036-9c5b-2e1056ccc2f3", "test_text"]
  const handleVariableToValue = (value) => {
    //判断value是否为boolean类型
    if (value && typeof value === "boolean") {
      return value;
    }
    if (value && isWrappedField(value)) {
      return value.split("{{#")[1].split("#}}")[0].split(".");
    }
    return value;
  };
  //判断value是否为包裹字段
  const isWrappedField = (str) => {
    const pattern = /^\{\{#.*#\}\}$/;
    return pattern.test(str);
  };
  /**
   * 创建变量数据对象
   * @param {Object} found - 找到的变量对象
   * @param {Array} startVars - 开始节点变量数组
   * @returns {Object|null} 变量数据对象
   */
  const createVariableData = useCallback((found, startVars) => {
    const valueQuery = found.value_selector?.join('.') || '';
    
    if (found.nodeType === NODE_TYPES.START) {
      // 从开始节点获取变量
      const foundStart = startVars.find(item => item.variable === found.variable);
      if (foundStart) {
        return {
          ...foundStart,
          variableQuery: valueQuery,
          required: true,
          variable: valueQuery,
        };
      }
    }
    
    // 默认变量配置
    return {
      label: found.label,
      type: VARIABLE_TYPES.TEXT_INPUT,
      max_length: null,
      required: true,
      variable: valueQuery,
      variableQuery: valueQuery,
    };
  }, []);
   
  /**
   * 递归查找树形结构中的变量
   * @param {Array} tree - 树形结构数据
   * @param {Array} valueSelect - 值选择器数组
   * @returns {Object|null} 找到的变量对象或null
   */
  const findVariableInTree = useCallback((tree, valueSelect) => {
    if (!Array.isArray(tree) || !Array.isArray(valueSelect) || valueSelect.length === 0) {
      return null;
    }

    const nodeId = valueSelect[0];
    const valueSelectStr = JSON.stringify(valueSelect);

    /**
     * 递归遍历节点
     * @param {Array} nodes - 节点数组
     * @returns {Object|null} 找到的变量对象或null
     */
    const traverse = (nodes) => {
      if (!Array.isArray(nodes)) return null;

      for (const node of nodes) {
        if (node.nodeId === nodeId && Array.isArray(node.children)) {
          // 在当前节点的子节点中查找匹配的变量
          for (const child of node.children) {
            if (JSON.stringify(child.value_selector) === valueSelectStr) {
              return { ...child };
            }
          }
        }

        // 递归搜索子节点
        if (Array.isArray(node.children)) {
          const result = traverse(node.children);
          if (result) return result;
        }
      }
      return null;
    };

    return traverse(tree);
  }, []);
  /**
   * 关闭模态框事件
   */
  const hideModal = useCallback(() => {
    setOpen(false);
  }, []);

  /**
   * 关闭面板事件
   */
  const closePanelEvent = useCallback(() => {
    testInputRef.current?.clearFormEvent();
    setPannerNode(null);
    setRunVisible(false);
  }, [setPannerNode, setRunVisible]);

  /**
   * 运行单个节点事件
   * @param {Object} value - 用户输入值
   */
  const runSingeNodeEvent = useCallback(async (fieldSet) => {
        let inputs = {};
     for (const key in fieldSet) {
         let keyValue ='#'+key+'#'
         inputs[keyValue] = fieldSet[key]
     }
    try {
      const runData = {
        app_id: id,
        node_id: pannerNode.id,
        user_inputs: inputs,
      };
      setLoading(true);
      setRunData({
        status: RUN_STATUS.RUNNING,
      });

      const res = await runNode(runData);
      const runObj = res.data;
      
      setRunData(runObj);
      setLoading(false);
      setIsExitData(!!runObj);
      setTabKey(TAB_KEYS.DETAIL); // 运行完成后跳转到详情
      testInputRef.current?.closeLoading();
    } catch (error) {
      console.error('运行节点时出错:', error);
      setLoading(false);
      setRunData(null);
      testInputRef.current?.closeLoading();
    }
  }, [id, pannerNode, testInputRef]);

  /**
   * 获取上一次运行结果
   * @param {string} nodeId - 节点ID
   */
  const getLastRunResultEvent = useCallback(async (nodeId) => {
    try {
      const res = await getLastRunResult({
        app_id: id,
        node_id: nodeId,
      });
      const runObj = res.data;
      setIsExitData(!!runObj);
      setRunData(runObj);
    } catch (error) {
      console.error('获取上次运行结果时出错:', error);
      setIsExitData(false);
      setRunData(null);
    }
  }, [id]);
  /**
   * 处理标签页点击事件
   * @param {string} key - 标签页键值
   */
  const handleTabClick = useCallback((key) => {
    setTabKey(key);
  }, []);
  return (
    <div className={styles["start_run_panel_main"]}>
      <div className={styles["panel_run_header"]}>
 
          <div className={styles["panel_main_header_left"]}>
            <img
              className={styles["panel_main_header_left_icon"]}
              src={process.env.NEXT_PUBLIC_API_BASE + data.mcp_url}
            />

            <div className={styles["panel_main_header_left_title"]}>
              <Text
                style={{ maxWidth: '100%' }}
                ellipsis={{ tooltip: data.title }}
              >
                {data.title}
              </Text>
            </div>
          </div>
          <div className={styles["panel_run_header_right"]}>
            <RunStatus runData={runData} />

            <img
              onClick={closePanelEvent}
              className={styles["panel_close"]}
              src="/close.png"
            />
          </div>
    
      </div>
    
      <div className={styles["start_run_panel_content"]}>
      {isExitData && (
        <div className={styles["test_container_tab"]}>
          {TAB_ITEMS.map((item) => (
            <TabItem
              key={item.key}
              item={item}
              isActive={item.key === tabKey}
              onClick={handleTabClick}
            />
          ))}
        </div>
      )}
      
      <div className={`${styles["start_run_panel_content_main"]} ${tabKey !== TAB_KEYS.INPUT ? styles["start_run_panel_content_main_hidden"] : ""}`}>
        <TestInput 
          variables={variables} 
          ref={testInputRef} 
          runSingeNodeEvent={runSingeNodeEvent} 
          isRun={loading} 
        />
      </div>

      {tabKey === TAB_KEYS.DETAIL && (
        <div className={styles["start_run_panel_content_main"]}>
          <TestDetail runData={runData} ref={testDetailRef} />
        </div>
      )}
       

      </div>
    </div>
  );
});

export default LlmRun;
