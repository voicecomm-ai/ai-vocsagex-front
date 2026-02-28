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
  message,
  Select,
  Tooltip,
  Spin,
  InputNumber,
  Empty,
} from "antd";
import styles from "../node.module.css";
import { getMcpToolList } from "@/api/workflow";
import mcpStyles from "./mcp.module.css";
import { useNodesInteractions, useNodeData } from "../../hooks";
import Image from "next/image";
const { TextArea } = Input;
import debounce from "lodash/debounce";
import VariableCascader from "../../../variableCascader";
import { useStore } from "@/store/index";
import JsonEditor from "./JsonEditor";
import JsonModal from "./JsonModal";
import { useMcp } from "./hooks/use-mcp";
import { getUuid } from "@/utils/utils";
import RunHeader from "../../components/RunHeader";  
const { Paragraph, Text } = Typography;

const booleanList = [
  {
    label: "是",
    value: true,
  },
  {
    label: "否",
    value: false,
  },
];

const defaultValues={//数组类型默认值
  'array[string]':[""],
  'array[number]':[0],
  'array[object]':[
    {
      "key": "value"
    }
  ],
  'object':{
    "key": "value"
  },
  'string':'',
}
const McpPanel = forwardRef((props, ref) => {
  const {
    setPanelVisible,
    readOnly,
    setPannerNode,
    setRunVisible,
    panelVisible,
    pannerNode,
    changeId,
  } = useStore((state) => state);
  const { updateNodeDetail } = useNodesInteractions();
  const { renameVariableReferences, getNodeById, getUpstreamVariables } =
    useNodeData();
  const { validateMcpNode } = useMcp();
  useImperativeHandle(ref, () => ({
    hideModal,
  }));
  
  const deleteModalRef = useRef(null); //变量删除ref
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({}); //数据
  const [loading, setLoading] = useState(false); //加载中
  const jsonModalRef = useRef(null);
  const variableRef = useRef(null);
  const [mcpToolList, setMcpToolList] = useState([]);
  const [title, setTitle] = useState("");
  const [isEditing, setIsEditing] = useState(false);  
  const [paramList, setParamList] = useState([]); //工具参数列表
  const [variableData, setVariableData] = useState([]); //变量数据
  const  [jsonId,setJsonId] = useState(0);
  const  [variableId,setVariableId] = useState(0);
  const [valueTypeList, setValueTypeList] = useState([
    {
      label: "输入",
      value: "Constant",
    },
    {
      label: "引用",
      value: "Variable",
    },
  ]); //引用方式列表
  useEffect(() => {
    if (panelVisible && pannerNode) {
      initFun();
    }
    //getSystemVariablesEvent();
  }, [panelVisible]);
  
  useEffect(() => {
    if (panelVisible) {
      getVariableDataEvent();
    }
  }, [changeId]);
  //初始化
  const initFun = () => {
    setLoading(true);
    setData(pannerNode.data);
    setTitle(pannerNode.data.title);
    getMcpToolListEvent(pannerNode.data);
    getVariableDataEvent();
  };
  const getVariableDataEvent = () => {
    let upstreamVariables = getUpstreamVariables(pannerNode.data.id);
    setVariableData(upstreamVariables);
    setVariableId(getUuid());
  };
  //关闭事件
  const hideModal = () => {
    setOpen(false);
  };

  //根据mcpId获取mcp 工具列表
  const getMcpToolListEvent = (obj) => {
    getMcpToolList({ id: obj.mcp_id })
      .then((res) => {
        let tools = res.data.tools || [];
        setMcpToolList(tools);
        //如果工具列表不为空且工具名称不为空，则初始化更新节点数据
        if (tools.length > 0 && !obj.tool_name) {
          handleMcpToolParamListEvent(tools[0], obj);
        }
        //如果工具列表不为空且工具名称不为空，则设置工具参数列表
        if (tools.length > 0 && obj.tool_name) {
          console.log(obj.param, "obj.param");
          setParamList(obj.param);
        }
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
      });
  };

  //获取工具的参数列表
  const handleMcpToolParamListEvent = (tool, obj) => {
    let paramArray = []; //参数列表
    let args_schema = tool.args_schema;
    let properties = JSON.parse(args_schema.properties); //属性列表
    console.log(properties, "properties");
    let requiredArr = args_schema.required || []; //必填项
    //如果args_schema不为空对象  ，则设置参数列表
    if (properties && Object.keys(properties).length > 0) {
      paramArray = schemaToFields(properties,requiredArr);
    }
    else{
      paramArray = [];
    
    }
    setParamList(paramArray); //设置参数列表   
    initUpdateNodeDetailEvent(tool, obj, paramArray);
  };


  /**
   * 
   * @param {*} schema 
   * @param {*} requiredArr 
   * @returns 
   */
  //
  /**
   * 将 schema 对象转换为字段数组
   * @param {*} schema 参数 schema 对象
   * @param {*} requiredArr 必填字段数组
   * @returns 字段数组，每个字段包含类型、默认值、是否必填等信息
   */
  const schemaToFields = (schema, requiredArr) => {
    const allowedTypes = [
      "object", "string", "number", "array[string]", "array[number]",
      "array[object]", "array[file]", "file", "boolean"
    ];
  
    // 类型归一化
    function normalizeType(t) {
      if (!t) return null;
      const lower = t.toLowerCase();
      if (["number", "integer", "float"].includes(lower)) return "number";
      if (["object", "string", "file", "boolean"].includes(lower)) return lower;
      return null;
    }
  
    // 固定顺序：先取出 key 列表
    const orderedKeys = Object.keys(schema);
  
    return orderedKeys.map(key => {
      const def = schema[key];
      const field = {
        name: key,
        required: requiredArr.includes(key),
        defaultValue: def.default ?? "",//默认值
        value:  "",
        value_type: "Variable",
        filterData: [],
        typeArray: []
      };
  
      const collected = [];
  
      // 处理 type
      if (def.type === "array" && def.items) {
        if (def.items.type) {
          const inner = normalizeType(def.items.type);
          if (inner) collected.push(`array[${inner}]`);
        } else if (def.items.anyOf) {
          def.items.anyOf.forEach(opt => {
            const inner = normalizeType(opt.type);
            if (inner) collected.push(`array[${inner}]`);
          });
        }
      } else if (def.type) {
        const t = normalizeType(def.type);
        if (t) collected.push(t);
      }
  
      // 处理 anyOf
      if (def.anyOf) {
        def.anyOf.forEach(opt => {
          if (opt.type === "array" && opt.items?.anyOf) {
            opt.items.anyOf.forEach(sub => {
              const inner = normalizeType(sub.type);
              if (inner) collected.push(`array[${inner}]`);
            });
          } else if (opt.type === "array" && opt.items?.type) {
            const inner = normalizeType(opt.items.type);
            if (inner) collected.push(`array[${inner}]`);
          } else if (opt.type) {
            const inner = normalizeType(opt.type);
            if (inner) collected.push(inner);
          }
        });
      }
  
      field.typeArray = [...new Set(collected)].filter(t => allowedTypes.includes(t));
      if (field.typeArray.length === 0) {
        field.typeArray = ["string"];
      }
  
      field.type = field.typeArray[0];
      field.filterData = field.typeArray;
  
      return field;
    });
  };
  

  //初始化更新节点数据
  const initUpdateNodeDetailEvent = (tool, obj, paramArray) => {
    let newObj = {
      ...obj,
      tool_name: tool.name, //工具名称
      param: paramArray, //工具参数
    };
    setData(newObj);
    updateNodeDetailEvent(newObj);
  };

  // 关闭面板事件
  const closePanelEvent = () => {
    setPannerNode(null);
    setPanelVisible(false);
  };
  // 更新数据事件处理函数
  const updateDataEvent = (dataPar, dataParValue) => {
    let nodeData = getNodeById(pannerNode.data.id);
    const obj = {
      ...nodeData.data,
      [dataPar]: dataParValue,
    };
    setData(obj);
    updateNodeDetailEvent(obj);
  };
  const updateNodeDetailEvent = useRef(
    debounce(async (data) => {
      let newData = {
        nodeId: pannerNode.id,
        data: { ...data },
      };
      updateNodeDetail(newData);
    }, 10) // 1000ms 无操作后才触发
  ).current;

  // 节点标题改变事件
  const handleNodeTitleChange = (e) => {
    let title = e.target.value;
    setTitle(title);
  };
  const handleNodeDescChange = (e) => {
    updateDataEvent("desc", e.target.value);
  };
  // 保存标题
  const saveTitle = (value) => {
    if (!value.trim()) {
      setTitle(data.title);
      return message.warning("节点名称不能为空");
    }
    updateDataEvent("title", value);
  };
  // 失去焦点时保存标题并关闭编辑
  const handleTitleBlur = () => {
    setIsEditing(false);
    saveTitle(title);
  };

  // 运行面板事件
  const runPanelEvent = () => {
    if(!validateMcpNode(data)){//验证mcp必填参数
      return;
    }
    if (readOnly) return;
    setPannerNode(pannerNode);
    setPanelVisible(false);
    setRunVisible(true);
  };

  //mcp工具选择事件
  const handleMcpToolSelectEvent = (value) => {
    let findTool = mcpToolList.find((item) => item.name === value);
    if (findTool) {
      //如果找到工具，则处理工具参数列表
      handleMcpToolParamListEvent(findTool, data);
    }
  };

  //引用方式选择事件
  const handleValueTypeChange = (value, obj, index) => {
    let newParamList = paramList.map((item, i) => {
      let defaultValue = defaultValues[item.type];//查找对应的默认值
      let defaultVal = item.defaultValue?item.defaultValue:defaultValue;
      if (i === index) {
        //如果索引相同，则更新引用方式 更改引用方式清空输入值
        return { ...item, value_type: value, value:value==="Variable" ? "" : defaultVal };
      }
      return item;
    });
    setParamList(newParamList);
    updateDataEvent("param", newParamList);
  };

  const variableStyle = {
    width: "100%",
    height: "36px",
    background: "#F5F9FC",
    borderRadius: "8px 8px 8px 8px",
    border: "none",
  };
  //引用变量改变事件
  const handleValueVariableChange = (obj, item, index) => {
    let value = handleValueVariable(obj.value_selector); //变量值
    let newParamList = paramList.map((item, i) => {
      if (i === index) {
        return { ...item, value: value };
      }
      return item;
    });
    setParamList(newParamList);
    updateDataEvent("param", newParamList);
  };

  //转换变量 从["38638f54-b6e5-4036-9c5b-2e1056ccc2f3", "test_text"] 转换为 {{#38638f54-b6e5-4036-9c5b-2e1056ccc2f3.test_text#}}
  const handleValueVariable = (value) => {
    if (value && Array.isArray(value)) {
      return `{{#${value.join(".")}#}}`;
    }
    return value;
  };
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
  //处理输入变量改变事件
  const handleValueConstantChange = (value, item, index) => {
    let newParamList = paramList.map((item, i) => {
      if (i === index) {
        return { ...item, value: value };
      }
      return item;
    });
    setParamList(newParamList);
    updateDataEvent("param", newParamList);
  };

  //处理输入类型改变事件
  const handleValueConstantTypeChange = (value, item, index) => {
    let defaultValue = defaultValues[value];//默认值
    let newParamList = paramList.map((item, i) => {
      if (i === index) {
        return { ...item, type: value, value: defaultValue };
      }
      return item;
    });
  setParamList(newParamList);
  updateDataEvent("param", newParamList);
  };

  //渲染输入变量内容
  const renderInputVariable = (item, index) => {
    let type = item.type; // 类型
    if (type == "string") {
      //
      return (
        <Input
          value={item.value}
          variant="borderless"
          disabled={readOnly}
          placeholder="请输入"
          className={mcpStyles.mcp_input}
          onChange={(e) => {
            handleValueConstantChange(e.target.value, item, index);
          }}
        />
      );
    }
    if (type == "number") {
      return (
        <InputNumber
          value={item.value}
          disabled={readOnly}
          variant="borderless"
          className={mcpStyles.mcp_input}
          controls={false}
          min={0}
          placeholder="请输入"
          onChange={(value) => {
            handleValueConstantChange(value, item, index);
          }}
        />
      );
    }
    if (type == "boolean") {
      return (
        <Select
        disabled={readOnly}
          style={{ height: "36px" }}
          value={item.value}
          variant="borderless"
          classNames={{root: mcpStyles.mcp_select}}
          options={booleanList}
          placeholder="请选择"
          onChange={(value) => {
            handleValueConstantChange(value, item, index);
          }}
        />
      );
    }
    if (type == "object") {
      return (
        <div className={mcpStyles["constant_json"]}    key={jsonId}>
        <div className={mcpStyles["constant_json_content"]}>
          <JsonEditor
             readOnly={readOnly}
            content={item.value}
         
            onChange={(value) => {
              handleValueConstantChangeJson(value, item, index);
            }}
          />
          </div>
          <img
            className={mcpStyles["json_full"]}
            onClick={() => handleJsonFullClick(item, index)}
            src="/workflow/json_full.png"
          />
        </div>
      );
    }
    if (
      type == "array" ||
      type == "array[string]" ||
      type == "array[number]" ||
      type == "array[object]"
    ) {
      return (
        <div className={mcpStyles["constant_json"]}  key={jsonId}>
          <div className={mcpStyles["constant_json_content"]}>
          <JsonEditor
             readOnly={readOnly}
            
            content={item.value}
            onChange={(value) => {
              handleValueConstantChangeJson(value, item, index);
            }}
          />
          </div>
          <img
            className={mcpStyles["json_full"]}
            onClick={() => handleJsonFullClick(item, index)}
            src="/workflow/json_full.png"
          />
        </div>
      );
    }
  };
   
  //处理未放大json数据事件
  const handleValueConstantChangeJson = (value, obj, index) => {
    try {
      let jsonObj = typeof value === 'string' ? JSON.parse(value) : value;
      handleValueConstantChange(jsonObj, obj, index);
    } catch (error) {
      message.warning('当前值不是json格式');
      return;
    }
  };

  //json全屏点击事件
  const handleJsonFullClick = (item, index) => {
    console.log(item, index);
    jsonModalRef.current.showModal(item, index);
  };

  //修改json数据事件
  const changeJsonData = (obj, index, json) => {
    setJsonId(getUuid())
    handleValueConstantChange(json, obj, index);
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
      <Spin spinning={loading} wrapperClassName="node_main_spin">
      <RunHeader data={data} updateNodeDataByHeader={updateNodeDataByHeader} runPanelEventByHeader={runPanelEvent}   />
     <div className="node_panel_config">
        <Select
          classNames={{
            root: mcpStyles["mcp_panel_tool"],
          }}
          style={{height:'36px',backgroundColor:'#F5F9FC',borderRadius:'8px'}}
          variant="borderless"
          value={data.tool_name}
          disabled={readOnly}
          placeholder="请选择工具"
          onChange={(value) => {
            handleMcpToolSelectEvent(value);
          }}
        >
          {mcpToolList.map((item) => (
         
            <Select.Option key={item.name} value={item.name}>
              <Tooltip title={item.description}>
              {item.name}
            </Tooltip>
            </Select.Option>
           
          ))}
        </Select>
        <div className={mcpStyles["start_panel_variable"]}>
          <div className={mcpStyles["mcp_panel_variable_title"]}>
            输入
            <Tooltip title="输入变量，MCP服务的输入参数">
              <Image
                src="/workflow/tip.png"
                alt=""
                width="16"
                height="16"
                className={styles["main_con_document_titleicon"]}
              ></Image>
            </Tooltip>
          </div>
        </div>
        {/* 变量列表 */}
        {paramList.length > 0 && (
          <div className={mcpStyles["mcp_param_list"]}>
            <div className={`${mcpStyles.mcp_param_list_item} ${mcpStyles.mcp_param_list_item_title}`}>
              <div className={mcpStyles.mcp_para_list_item_name_title}>
                变量名
              </div>
              <div className={mcpStyles.mcp_para_list_item_citation_title}>
                引用方式
              </div>
              <div className={mcpStyles.mcp_para_list_item_value_title}>值</div>
            </div>
            {paramList.map((item, index) => (
              <div className={mcpStyles.mcp_param_list_item} key={index}>
                <div className={mcpStyles.span_required}>
                  {item.required && <span>*</span>}
                </div>

                <div className={mcpStyles.mcp_para_list_item_name}>
                  <Text ellipsis={{ tooltip: item.name }}>{item.name}</Text>
                </div>
                <div className={mcpStyles.mcp_para_list_item_citation}>
                  <Select
                  
                    style={{ height: "36px" }}
                    variant="borderless"
                    disabled={readOnly || item.type == "file" || item.type == "array[file]"}
                    classNames={{
                      root: mcpStyles.mcp_para_list_item_citation_select,
                    }}
                    onChange={(value) => {
                      handleValueTypeChange(value, item, index);
                    }}
                    value={item.value_type}
                    options={valueTypeList}
                  />
                </div>
                <div className={mcpStyles.mcp_para_list_item_value}>
                  {/* 引用变量 */}
                  {item.value_type === "Variable" && (
                    <VariableCascader
                      data={variableData}
                      filterData={item.filterData}
                      disabled={readOnly}
                      style={variableStyle}
                        key={variableId}
                      allowMiddleSelect={
                        item.type == "file" || item.type == "array[file]"
                      }
                      value_selector={handleVariableToValue(item.value)}
                      onChange={(value) => {
                        handleValueVariableChange(value, item, index);
                      }}
                    />
                  )}
                  {item.value_type === "Constant" && (
                    <div className={mcpStyles.mcp_para_list_item_value_input}>
                      <div
                        className={
                          mcpStyles.mcp_para_list_item_value_input_left
                        }
                      >
                      <Select
                        classNames={{
                          root: mcpStyles.mcp_para_list_item_citation_select,
                        }}
                        value={item.type}
                        variant="borderless"
                        disabled={readOnly}
                        onChange={(value) => {
                          handleValueConstantTypeChange(value, item, index);
                        }}
                      >
                        {item.typeArray.map((type) => (
                          <Select.Option key={type} value={type}>
                            {type}
                          </Select.Option>
                        ))}
                      </Select>
                      </div>
                      <div
                        className={
                          mcpStyles.mcp_para_list_item_value_input_right
                        }
                      >
                        {renderInputVariable(item, index)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {paramList.length == 0 && (
          <div className={mcpStyles["mcp_param_list_empty"]}>
            <Empty description="暂无数据" />
          </div>
        )}
        {/* 输出变量 */}
        <div className={mcpStyles["mcp_panel_output"]}>
          <div className={mcpStyles["mcp_panel_output_title"]}>输出</div>
          <div className={mcpStyles["mcp_panel_output_main"]}>
            <div className={mcpStyles["mcp_panel_output_main_item"]}>
              <div className={mcpStyles["mcp_panel_output_main_item_name"]}>
                result
              </div>
              <div className={mcpStyles["mcp_panel_output_main_item_value"]}>
                String
              </div>
            </div>
            <div className="mcp_panel_output_main_item_desc">工具执行结果</div>
          </div>
        </div>
        </div>
      </Spin>
      
      <JsonModal  readOnly={readOnly} ref={jsonModalRef} changeJsonData={changeJsonData} />
    </div>
  );
});

export default McpPanel;
