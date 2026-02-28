"use client";
import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
} from "react";
import styles from "../../../workflow.module.css";
import dragStyle from "./drag.module.css";
import { Input, Typography, Popover } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useStore } from "@/store/index";
import { getMcpList } from "@/api/mcp";
import DraftTemplate from "./template";
import Mcp from "./mcp";

const { Text } = Typography;
const DragPanel = forwardRef((props, ref) => {
  const { readOnly } = useStore((state) => state);
  const { isSelector=false,isInParent=false } = props;
  const nodeRef = useRef(null); //节点ref
  const templateRef = useRef(null); //模板ref
  const defaultNodeList =[
 
    {
      title: "流程控制",
      showInSelector: true,
      children: [
        {
          name: "结束",
          type: "end",
          disabled: false,
          desc: "定义一个工作流的结束，输出工作流的最终结果。",
        },
        {
          name: "意图分类",
          type: "question-classifier",
          disabled: false,
          desc: "调用大模型，根据用户问题和分类进行意图判断，决定分支走向。",
        },
        {
          name: "条件分支",
          type: "if-else",
          disabled: false,
          desc: "根据 If/else/elif 条件将工作流流程拆分成多个分支。",
        },
      
      ],
      disabled: false,
    },
    {
      title: "AI核心",
      showInSelector: true,
      children: [
        {
          name: "大模型",
          type: "llm",
          disabled: false,
          desc: "根据要求调用大语言模型处理用户需求，并给出有效的回应。",
        },
        {
          name: "知识检索",
          type: "knowledge-retrieval",
          disabled: false,
          desc: "从知识库中查询与用户问题相关的文本内容。",
        },
      ],
      disabled: false,
    },
    {
      title: "逻辑关系",
      showInSelector: false,
      children: [
        {
          name: "循环",
          type: "loop",
          disabled: false,
          desc: "执行循环逻辑，直至达到结束条件或者循环次数。",
        },
        {
          name: "批处理",
          type: "iteration",
          disabled: false,
          desc: "批量处理列表对象，直至输出所有结果。",
        },
      ],
      disabled: false,
    },
    {
      title: "数据处理",
      showInSelector: true,
      children: [
        {
          name: "变量赋值",
          type: "assigner",
          disabled: false,
          desc: "用于向可写入的变量进行赋值（例如循环变量）。",
        },
        {
          name: "参数提取",
          type: "parameter-extractor",
          disabled: false,
          desc: "调用大模型，从自然语言中提取结构化参数，以备后续调用。",
        },
        {
          name: "路径聚合",
          type: "variable-aggregator",
          disabled: false,
          desc: "将多路分支的变量聚合为一个变量，以供下游节点统一配置。",
        }
      ],
      disabled: false,
    },

    {
      title: "工具核心",
      showInSelector: true,
      children: [
        {
          name: "文档解析",
          type: "document-extractor",
          disabled: false,
          desc: "解析并读取用户上传的文件内容。",
        },
        {
          name: "执行代码",
          type: "code",
          disabled: false,
          desc: "通过Python/Javascript代码自主定义执行逻辑。",
        },
        {
          name: "外部接口",
          type: "http-request",
          disabled: false,
          desc: "通过调用外部API实现数据的发送或者接收。",
        },
      ],
      disabled: false,
    },
  ]; //节点列表
  const [mcpList, setMcpList] = useState([]); //mcp列表
  const mcpRef = useRef(null); //mcp ref
  const [appList, setAppList] = useState([]); //应用列表
  const [searchKeyword, setSearchKeyword] = useState(""); //搜索关键词
  const [tabIndex, setTabIndex] = useState("node"); //tab索引
  const [data, setData] = useState([]); //数据列表
  const containerRef = useRef(null); // 新增：用于监听滚动容器
  const [nodeList, setNodeList] = useState(defaultNodeList);
  const isUserClickingRef = useRef(false); // 标记用户是否主动点击标签
  const userClickedTabRef = useRef(null); // 记录用户点击的目标标签名
  const scrollTimeoutRef = useRef(null); // 用于清除滚动完成的定时器
  const nodeTypes = [
    {
      name: "node",
      label: "节点",
      disabled: false,
    },
    {
      name: "mcp",
      label: "MCP",
      disabled: false,
    },
    {
      name: "template",
      label: "发现",
      disabled: false,
    },
    {
      name: "custom",
      label: "自定义",
      disabled: true,
    },
  ];
  //搜索事件
  const searchEvent = () => {
    console.log(searchKeyword);
  };
  useEffect(() => {
   let  removeData = isInParent ? ['end', 'loop', 'iteration'] : [];
   let arr = filterNodesByType(defaultNodeList, removeData);
   console.log(arr,'arr')
    setData(arr);
  }, [isInParent]);


  const filterNodesByType = (nodes, typesToRemove) => {
    return nodes
      .map(node => {
        if (!node.children) return node; // 没有子节点直接返回
        // 过滤子节点
        const filteredChildren = node.children.filter(child => !typesToRemove.includes(child.type));
        if (filteredChildren.length === 0) {
          return null; // 如果子节点全部被过滤，则父节点也过滤
        }
        return { ...node, children: filteredChildren }; // 保留父节点但更新子节点
      })
      .filter(Boolean); // 去掉 null 的父节点
  };
  
  
  // 拖动开始事件
  const onDragStart = (e, obj) => {
 
    props.onDragStart(e, obj);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchKeyword(value);
    if (!value) {
      setData(nodeList);
      setTabIndex("node");
      return;
    }
 
    // 仅匹配子节点名称
    const filtered = nodeList
      .map((group) => {
        const matchedChildren = group.children.filter((child) =>
          child.name.toLowerCase().includes(value.toLowerCase())
        );

        // 如果有匹配项则保留该分组
        if (matchedChildren.length > 0) {
          return { ...group, children: matchedChildren };
        }
        return null;
      })
      .filter(Boolean); // 去除空分组
    console.log(filtered,'filtered')
    setData(filtered);
  };
  //tab点击事件
  const tabClickEvent = (item) => {
    if (item.disabled) {
      //禁用
      return;
    }
    let name = item.name;
    
    // 清除之前的定时器（如果存在）
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // 标记为用户主动点击，暂停自动滚动监听
    isUserClickingRef.current = true;
    userClickedTabRef.current = name; // 记录用户点击的目标标签
    setTabIndex(name);
    setSearchKeyword("");
    
    switch(name){
      case "node":
        nodeRef.current?.scrollIntoView({ behavior: 'smooth' });
        break;
      case "mcp":
        mcpRef.current?.scrollIntoView({ behavior: 'smooth' });
        break;
      case "template":
        templateRef.current?.scrollIntoView({ behavior: 'smooth' });
        break;
    }
    
    // 滚动完成后恢复自动监听（smooth 滚动大约需要 300-500ms，延长到 1200ms 确保滚动完成）
    scrollTimeoutRef.current = setTimeout(() => {
      isUserClickingRef.current = false;
      userClickedTabRef.current = null; // 清除用户点击标记
      scrollTimeoutRef.current = null;
    }, 1200);
  };

// ✅ 自动监听滚动区域并高亮 tab
useEffect(() => {
  const container = containerRef.current;
  if (!container) return;

  const observerOptions = {
    root: container,
    rootMargin: '-20% 0px -20% 0px', // 使用负边距来更精确地判断中心区域
    threshold: [0, 0.1, 0.5, 1], // 多个阈值点，更精确地跟踪可见性
  };

  // 用于跟踪每个区域的可见性比例
  const visibilityMap = {
    'node-section': 0,
    'mcp-section': 0,
    'template-section': 0,
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const sectionId = entry.target.id;
      if (sectionId === 'node-section' || sectionId === 'mcp-section' || sectionId === 'template-section') {
        // 更新可见性比例
        visibilityMap[sectionId] = entry.intersectionRatio;
      }
    });

    // 如果是用户主动点击导致的滚动，完全不处理自动更新 tabIndex
    if (isUserClickingRef.current || userClickedTabRef.current) {
      return;
    }

    // 根据可见性比例决定高亮哪个tab
    // 优先选择可见性更高的区域
    const nodeVisibility = visibilityMap['node-section'] || 0;
    const mcpVisibility = visibilityMap['mcp-section'] || 0;
    const templateVisibility = visibilityMap['template-section'] || 0;

    // 找到可见性最高的区域
    const maxVisibility = Math.max(nodeVisibility, mcpVisibility, templateVisibility);
    
    if (maxVisibility > 0.1) {
      if (templateVisibility === maxVisibility) {
        setTabIndex("template");
      } else if (mcpVisibility === maxVisibility) {
        setTabIndex("mcp");
      } else if (nodeVisibility === maxVisibility) {
        setTabIndex("node");
      }
    }
  }, observerOptions);

  // 使用 setTimeout 确保 DOM 已渲染
  const timer = setTimeout(() => {
    if (nodeRef.current) observer.observe(nodeRef.current);
    if (mcpRef.current) observer.observe(mcpRef.current);
    if (templateRef.current) observer.observe(templateRef.current);
  }, 100);

  return () => {
    clearTimeout(timer);
    observer.disconnect();
  };
}, []);

//节点选择事件
const handleNodeSelectClick = (child,type) => {
  if(isSelector){
    props.onNodeSelectClick(child,type);
  }
};

  const renderContent = (obj) => {
    return (
      <div className={dragStyle["drag_popover_content"]}>
        <div className={dragStyle["drag_popover_content_header"]}>
          <img
            className={dragStyle["drag_panel_content_item_content_item_icon"]}
            src={`/workflow/${obj.type}.png`}
            alt=""
          />
          <Text style={{ maxWidth: 150 }} ellipsis={{ tooltip: obj.name }}>
            {obj.name}
          </Text>
        </div>
        <span className={dragStyle["drag_popover_content_desc"]}>
          {obj.desc}
        </span>
      </div>
    );
  };

  return (
    <div className={dragStyle["drag_panel"]}>
      <div className={dragStyle["drag_panel_header"]}>
      <div className={dragStyle["drag_panel_search"]}>
        <Input
          style={{
            width: '100%',
            marginRight: 16,
            borderRadius: 8,
            backgroundColor: "#F5F9FC",
            height: 36,
            border: "none",
          }}
          placeholder="搜索名称"
          maxLength={50}
          value={searchKeyword}
          onChange={handleSearchChange}
          suffix={
            <SearchOutlined
              style={{ cursor: "pointer" }}
              onClick={() => searchEvent()}
            />
          }
        />
      </div>
      {!isSelector && (
        <div className={dragStyle["drag_panel_header_right"]}>
        <img
          onClick={() => props.handlePanelShow(false)}
          className={dragStyle["drag_panel_header_right_img"]}
          src="/workflow/pane_collect.png"
          alt=""
        />
        </div>
        )}
      </div>
    
      <div className={dragStyle["drag_panel_tab"]}>
        {nodeTypes.map((item, index) => {
          return (
            <div
              onClick={() => tabClickEvent(item)}
              className={
                dragStyle["drag_panel_tab_item"] +
                (tabIndex === item.name
                  ? " " + dragStyle["drag_panel_tab_item_active"]
                  : "")
              }
              key={index}
            >
              {item.label}
            </div>
          );
        })}
      </div>
      <div
        className={`${dragStyle["drag_panel_content_container"]} ${
          !isSelector ? dragStyle["hide-scrollbar"] : dragStyle["hide-scrollbar"]
        }`}
        ref={containerRef}
      >
          {data.length > 0 && (
        <div className={dragStyle["drag_panel_content"]} id="node-section" ref={nodeRef}>
        
            <div className={dragStyle["drag_panel_content_title"]}>节点</div>
        
          {data.map((item, index) => {
            return (
              <div className={dragStyle["drag_panel_content_item"]} key={index}>
              
                  <div className={dragStyle["drag_panel_content_item_title"]}>
                    {item.title}
                  </div>
                
                <div className={dragStyle["drag_panel_content_item_content"]}>
                  {item.children
                    .filter((child) => {
                      // 如果在parent节点中，则过滤掉"结束"和"循环"
                      if (isInParent) {
                        return child.name !== "结束" && child.name !== "循环";
                      }
                      return true;
                    })
                    .map((child, childIndex) => {
                    return (
                        <Popover
                          placement="right"
                          arrow={false}
                          content={renderContent(child)}
                          title=""
                          trigger="hover"
                          key={childIndex}
                          zIndex={10001}
                        >
                        <div
                        onClick={() => handleNodeSelectClick(child,'node')}
                          onDragStart={
                            readOnly || child.disabled
                              ? undefined
                              : (e) => onDragStart(e, child)
                          }
                          draggable={isSelector?false:!readOnly && !child.disabled}
                          className={
                            dragStyle["drag_panel_content_item_content_item"] +
                            (readOnly || child.disabled
                              ? " " + styles["drag_panel_content_item_disabled"]
                              : "")
                          }
                          key={index}
                        >
                          <img
                            className={
                              dragStyle[
                                "drag_panel_content_item_content_item_icon"
                              ]
                            }
                            src={`/workflow/${child.type}.png`}
                            alt=""
                          />
                          <Text
                            style={{ maxWidth: 150 }}
                            ellipsis={{ tooltip: child.name }}
                          >
                            {child.name}
                          </Text>
                        </div>
                      </Popover>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
  )}
        <div id="mcp-section" ref={mcpRef}>
        <Mcp
          handleNodeSelectClick={handleNodeSelectClick}
          readOnly={readOnly}
          isSelector={isSelector}
          searchKeyword={searchKeyword}
          onDragStart={onDragStart}
        />
        </div>
        <div id="template-section" ref={templateRef}>
        <DraftTemplate
          handleNodeSelectClick={handleNodeSelectClick}
          readOnly={readOnly}
          isSelector={isSelector}
          searchKeyword={searchKeyword}
          onDragStart={onDragStart}
        />
        </div>
      </div>
    </div>
  );
});
export default DragPanel;
