"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  createContext,
  forwardRef,
} from "react";
import { Button, message } from "antd";
import styles from "./page.module.css";
import cytoscape from "cytoscape";
import { useStore } from "@/store/index";
import { useRouter, useParams } from "next/navigation";
import {
  getColor,
  standardGraphData,
  useDestroyTags,
} from "@/utils/graph/graph";
import {
  createCytoscapeInstance,
  destroyCytoscapeInstance,
  reLayout,
  forceLayout,
  cancelSelectedNode,
} from "@/utils/graph/cytoscape";
import {
  statisticalStateApi,
  getGraphVisualApi,
  singleVertexInfoApi,
  singleEdgeInfoApi,
  extendOrNotApi,
  queryFullGraphApi,
} from "@/api/graphVisualization";
import GraphUtil from "./components/GraphUtil";
import GraphTotal from "./components/GraphTotal";
import GraphLegend from "./components/GraphLegend";
import NodeCenterModal from "./components/NodeCenterModal";
import NodeDetailModal from "./components/NodeDetailModal";
import EdgeDetailModal from "./components/EdgeDetailModal";
import ContextMenu from "./components/ContextMenu";
import NodeExpandModal from "./components/NodeExpandModal";
import PathQueryModal from "./components/PathQueryModal";
import { removeLabelDetail } from "@/utils/graph/createTag";

// 创建Context，用于传递共享数据
export const GraphContext = createContext({
  core: null,
  selectNode: [],
  currentNode: null,
});

const KnowledgeGraph = forwardRef((props, ref) => {
  const router = useRouter();
  const { currentNamespaceId, isCommonSpace, setColorTags } = useStore(
    (state) => state
  );

  const fullDom = useRef(null);
  const graphDom = useRef(null);
  const core = useRef(null); // Cytoscape实例
  const coreComputedRef = useRef(null); // 工具栏
  const removedCollection = useRef([]); // 存储被隐藏的元素
  let tampTags = useRef([]); // 缓存图例数据

  const [hasGraphData, setHasGraphData] = useState(2); // 0 去本体观数据 1 对应无实体数据 2 有数据
  const [nodeExpandVisible, setNodeExpandVisible] = useState(false);
  const nodeExpandVisibleRef = useRef(false);
  const [expandActionDisabled, setExpandActionDisabled] = useState(true);
  const [pathQueryVisible, setPathQueryVisible] = useState(false);
  const [nodeCenterVisible, setNodeCenterVisible] = useState(false);
  const [nodeDetailVisible, setNodeDetailVisible] = useState(false);
  const [edgeDetailVisible, setEdgeDetailVisible] = useState(false);
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [selectedNode, setSelectedNode] = useState([]); // 多选节点
  const [nodeDetailInfo, setNodeDetailInfo] = useState({}); // 节点详情
  const [edgeDetailInfo, setEdgeDetailInfo] = useState(null); // 边详情
  const [currentNode, setCurrentNode] = useState(null); // 当前操作节点
  const [currentShowNodes, setCurrentShowNodes] = useState(0); // 显示节点数
  const [tags, setTags] = useState([]); // 图例数据
  const [position, setPosition] = useState({ left: 0, top: 0 }); // 右键菜单位置
  const [pathList, setPathList] = useState([]); // 路径拓展列表

  const [actions, setActions] = useState([]);

  useEffect(() => {
    nodeExpandVisibleRef.current = nodeExpandVisible;
  }, [nodeExpandVisible]);

  const [modalPosition, setModalPosition] = useState({
    left: 0,
    right: 0,
    top: 0,
  }); // 左侧弹窗位置

  // 右键菜单动作
  // const actions = useMemo(
  //   () => [
  //     {
  //       label: "节点隐藏",
  //       icon: "menu_node_hidden",
  //       action: () => processNodeHidden(currentNode),
  //     },
  //     {
  //       label: "节点拓展",
  //       icon: "menu_node_expand",
  //       disabled: expandActionDisabled,
  //     },
  //     {
  //       label: "路径查询",
  //       icon: "menu_path_query",
  //       action: () => processPathQuery(),
  //     },
  //     {
  //       label: "节点居中",
  //       icon: "menu_node_center",
  //       action: () => processNodeCenter(currentNode),
  //     },
  //   ],
  //   [currentNode]
  // );

  useEffect(() => {
    setActions([
      {
        label: "节点隐藏",
        icon: "menu_node_hidden",
        action: () => processNodeHidden(currentNode),
      },
      {
        label: "节点拓展",
        icon: "menu_node_expand",
        disabled: expandActionDisabled,
      },
      {
        label: "路径查询",
        icon: "menu_path_query",
        action: () => processPathQuery(),
      },
      {
        label: "节点居中",
        icon: "menu_node_center",
        action: () => processNodeCenter(currentNode),
      },
    ]);
  }, [currentNode, expandActionDisabled]);

  // 计算 fullDom 左上角位置

  const calculateFullDomPosition = () => {
    if (!fullDom.current) return;
    const rect = fullDom.current.getBoundingClientRect(); // 获取相对于视口的位置
    setModalPosition({
      left: rect.left, // fullDom 左上角的 x 坐标
      right: rect.right,
      top: rect.top, // fullDom 左上角的 y 坐标
    });
  };

  // 监听弹窗显示/隐藏，更新位置
  useEffect(() => {
    calculateFullDomPosition();
    const handleResize = () => calculateFullDomPosition();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    handleGraphStatus();
    return () => {
      if (core.current) {
        core.current.destroy();
        core.current = null;
      }
      useDestroyTags(); // 调用工具函数清理标签
    };
  }, []);

  // 初始化图谱
  const initGraph = useCallback((elements) => {
    if (!graphDom.current) {
      console.warn("图谱内容不存在");
      return;
    }
    // 更新图例
    const newTags = [...elements.tagSet].map((tag, index) => ({
      tagName: tag,
      color: getColor(index),
    }));
    setTags(newTags);
    setColorTags(newTags);
    tampTags.current = [...newTags];

    // 销毁旧实例
    if (core.current) {
      core.current.destroy();
    }

    // 创建新实例
    core.current = createCytoscapeInstance(elements, graphDom.current, {});
    coreComputedRef.current = core.current;

    // 初始化设置
    setCurrentNodesNum(core.current);
    bindEvent(core.current);

    requestAnimationFrame(() => {
      if (core.current && core.current.nodes().length > 0) {
        reLayout(core.current);
      }
    });

    // core.current.zoom({
    //   level: 1.5,
    //   renderedPosition: {
    //     x: core.current.width() / 2,
    //     y: core.current.height() / 2,
    //   },
    // });
  }, []);

  // 获取图谱状态（0/1/2）
  const handleGraphStatus = useCallback(async () => {
    try {
      const { data } = await statisticalStateApi({
        spaceId: currentNamespaceId,
      });
      setHasGraphData(data);
      if (data === 2) {
        const elements = await handleGraphData();
        if (graphDom.current) {
          initGraph(elements);
        }
      }
    } catch (e) {
      console.error("获取图谱状态失败:", e);
    }
  }, [currentNamespaceId]);

  // 获取图谱数据
  const handleGraphData = useCallback(async () => {
    const { data } = await getGraphVisualApi({
      spaceId: currentNamespaceId,
    });
    return standardGraphData(data);
  }, [currentNamespaceId]);

  // 处理多选事件
  const processMultipleSelect = (core, target) => {
    //获取被选中的节点
    setTimeout(() => {
      const $selected = core.$(":selected").filter((ele) => ele.isNode());
      if ($selected.size() < 7) {
        setSelectedNode($selected);
        // console.log($selected, "$selected");
      } else {
        // message.
        target.unselect();
        message.warning("最多只能选择6个");
      }
    });
  };

  // 更新显示节点数量
  const setCurrentNodesNum = useCallback((coreInstance) => {
    const visibleNodes = coreInstance.nodes(":visible");
    setCurrentShowNodes(visibleNodes.size());
  }, []);

  // 获取边详情
  const handleFetchEdgeInfo = async (edge) => {
    const { edgeName, subjectId, objectId, rank } = edge.data();
    const params = {
      spaceId: currentNamespaceId,
      edgeName,
      subjectId,
      objectId,
      rank,
    };
    await singleEdgeInfoApi(params).then(({ data }) => {
      setEdgeDetailInfo(data);
      setNodeExpandVisible(false);
      setNodeCenterVisible(false);
      setPathQueryVisible(false);
      setNodeDetailVisible(false);

      if (data?.edgePropertyVOList?.length) {
        setEdgeDetailVisible(true);
      }
    });
  };

  function calculateExpandPath(node, pathList) {
    // 计算节点可拓展路径
    const edgeCollection = node.outgoers().filter((edge) => edge.isEdge());

    return pathList.filter((item) => {
      const edges = edgeCollection.filter(
        (edge) => edge.data("edgeName") === item.extendEdge
      );

      return edges.length < item.edgeExtendNumber;
    });
  }

  // 绑定事件
  const bindEvent = useCallback(
    (coreInstance) => {
      let target = null;

      // 节点点击事件
      coreInstance.on("click", "node", async (params) => {
        target = params.target;
        const { altKey, shiftKey, ctrlKey } = params.originalEvent;
        console.log(nodeExpandVisibleRef.current, "nodeExpandVisible");

        if (altKey || shiftKey || ctrlKey) {
          if (nodeExpandVisibleRef.current) {
            processMultipleSelect(coreInstance, params.target);
          }
          return;
        }

        const reqData = {
          spaceId: currentNamespaceId,
          vertexId: target.data("id"),
        };
        const { data } = await singleVertexInfoApi(reqData);
        setNodeDetailInfo(data);
        setEdgeDetailVisible(false);
        setNodeExpandVisible(false);
        setNodeCenterVisible(false);
        setPathQueryVisible(false);
        setNodeDetailVisible(true);
      });

      // 边点击事件
      coreInstance.on("click", "edge", async (params) => {
        target = params.target;
        const { altKey, shiftKey, ctrlKey } = params.originalEvent;
        if (altKey || shiftKey || ctrlKey) {
          return;
        }

        await handleFetchEdgeInfo(target);
      });

      // 画布点击事件
      coreInstance.on("click", (params) => {
        setContextMenuVisible(false);

        if (params.target === params.cy) {
          setNodeDetailVisible(false);
          setEdgeDetailVisible(false);
          return;
        }

        if (target?.isNode() && params.target?.isEdge()) {
          setNodeDetailVisible(false);
        }
        if (target?.isEdge() && params.target?.isNode()) {
          setEdgeDetailVisible(false);
        }
      });

      // 元素添加/移除事件
      coreInstance.on("add remove", () => {
        setCurrentNodesNum(coreInstance);
      });

      // 右键菜单事件
      coreInstance.on("cxttapstart", "node", async (event) => {
        removeLabelDetail(); // 移除标签title
        const targetNode = event.target;
        setCurrentNode(targetNode);

        const { clientX: left, clientY: top } = event.originalEvent;
        setPosition({ left, top });

        const { data } = await extendOrNotApi({
          spaceId: currentNamespaceId,
          startId: targetNode.data("id"),
        });

        const filteredPaths = calculateExpandPath(targetNode, data);
        setPathList(filteredPaths);
        setExpandActionDisabled(!filteredPaths.length);

        setContextMenuVisible(true);
      });
    },
    [
      // nodeExpandVisible,
      // processMultipleSelect,
      // handleFetchEdgeInfo,
      // setCurrentNodesNum,
      // currentNamespaceId,
      // actions,
      // calculateExpandPath,
    ]
  );

  const handleImportNode = (elements, ele, startId) => {
    // 锁定节点
    ele?.lock();

    // 延迟解锁
    if (ele && core.current) {
      core.current.delay(1000, () => {
        ele?.unlock();
      });
    }
    // 添加元素
    const add = core.current?.add([...elements.nodes, ...elements.edges]);

    if (add?.size()) {
      // 选中当前节点
      if (currentNode && typeof currentNode.select === "function") {
        currentNode.select();
      }

      // 批量移除所有节点的 'ff' 类
      core.current?.batch(() => {
        core.current?.nodes().forEach((ele) => {
          ele.removeClass("ff");
        });
      });

      // 更新标签
      const newTags = [...elements.tagSet].map((tag, index) => ({
        tagName: tag,
        color: getColor(index),
      }));

      setTags(newTags);
      tampTags.current = [...newTags];

      // 重新布局
      reLayout(core.current, {
        stop() {
          if (!ele && add?.size() && startId) {
            const nodeSingular = core.current.$(`#${startId}`);
            processNodeCenter(nodeSingular);
          }
        },
      });

      if (ele) {
        message.success("节点拓展成功");
      }

      // 更新当前显示节点数量
      // setCurrentNodesNum(core.current);
    } else {
      message.warning("暂无可拓展数据");
    }
  };

  // 处理节点居中 - 实体操作
  const processNodeCenter = (node) => {
    core.current?.animate({ center: { eles: node }, duration: 1000 });
  };

  // 设置中心节点
  const handleNodeCenter = () => {
    setNodeExpandVisible(false);
    setPathQueryVisible(false);
    setNodeDetailVisible(false);
    setEdgeDetailVisible(false);
    setNodeCenterVisible(true);
  };

  // 中心节点设置完成回调
  const handleNodeCenterDone = () => {
    console.log("中心节点设置完成，可刷新图谱");
  };

  // 处理路径查询
  const processPathQuery = () => {
    setNodeCenterVisible(false);
    setNodeExpandVisible(false);
    setNodeDetailVisible(false);
    setEdgeDetailVisible(false);
    setPathQueryVisible(true);
  };

  // 节点拓展
  const nodeExpand = () => {
    setNodeCenterVisible(false);
    setPathQueryVisible(false);
    setNodeDetailVisible(false);
    setEdgeDetailVisible(false);
    setNodeExpandVisible(true);
  };

  // 隐藏边名称
  const handleLabelTextHidden = () => {
    const edges = core.current?.edges();
    // 批处理操作
    core.current?.batch(() => {
      edges?.map((ele) => {
        ele.addClass("edge-label-text-hidden");
      });
    });
  };

  // 显示边名称
  const handleLabelTextShow = () => {
    const edges = core.current?.edges();
    //批处理操作
    core.current?.batch(() => {
      edges?.map((ele) => {
        ele.removeClass("edge-label-text-hidden");
      });
    });
  };

  // 显示隐藏节点
  const handleShowHiddenNode = (core) => {
    setTags(tampTags.current);
    removedCollection.current.forEach((ele) => {
      const { id: nodeId } = ele.data();
      if (ele.isNode() && !core.$(`#${nodeId}`).size()) {
        ele.restore();
      }
    });
    removedCollection.current.forEach((ele) => {
      if (ele.isEdge()) {
        ele.restore();
      }
    });
    removedCollection.current.length = 0;
  };

  const handelType = (params, visible) => {
    switch (params) {
      case "showHiddenNode":
        // 显示隐藏节点
        handleShowHiddenNode(core.current);
        break;
      case "nodeExpand":
        // 节点拓展
        cancelSelectedNode(core.current); // 取消选中节点
        setSelectedNode([]); // 清空选中节点
        nodeExpand();
        break;
      case "nodeCenter":
        // 设置中心节点
        handleNodeCenter();
        break;
      case "pathQuery":
        // 路径查询
        setCurrentNode(null);
        processPathQuery();
        break;

      case "hiddenLabelText":
        // 隐藏边名称
        handleLabelTextHidden();
        break;
      case "showLabelText":
        // 显示边名称
        handleLabelTextShow();
        break;
      case "nodeSize":
        // 节点大小
        // handleNodeSize(visible);
        break;
      default:
        break;
    }
  };

  // 菜单事件
  // 处理节点隐藏事件
  const processNodeHidden = (ele) => {
    const eleTag = ele.data("tag")[0];
    const nodeSingular = ele.remove();
    // 处理图例数据 同本体的节点被隐藏完 图例数据同步删除
    const nodes = core.current?.nodes(":visible");
    if (!nodes?.size()) {
      setTags([]);
    }
    let flag = false;
    nodes?.forEach((node) => {
      const tag = node.data("tag")[0];
      if (tag === eleTag) {
        flag = false;
        // 退出迭代 cytoscape.js 迭代器具有退出条件
        return flag;
      }
      flag = true;
    });
    if (flag) {
      // const findIndex = tags.findIndex((item) => item.tagName === eleTag);
      // const newTags = tags.splice(findIndex, 1);
      const newTags = tags.filter((item) => item.tagName !== eleTag);
      setTags(newTags);
    }
    nodeSingular.forEach((ele1) => {
      removedCollection.current.push(ele1);
    });
  };

  // 处理节点拓展---实体操作
  const processNodeExpand = async (ele, edges = []) => {
    const { data: result } = await queryFullGraphApi({
      spaceId: currentNamespaceId,
      edges,
      startId: ele.id(),
    });
    if (result.vertexVOList.length) {
      const nodesAndEdges = standardGraphData(result);
      handleImportNode(nodesAndEdges, ele);
    } else {
      message.warning(`暂无可拓展数据`);
    }
  };

  // 路径扩展确认回调
  const handlePathExpand = (expandEdges) => {
    console.log(expandEdges, "expandEdges");
    processNodeExpand(currentNode, expandEdges);
  };

  const goOntologyManagement = () => {
    router.push(`/main/knowledge/graph?id=${currentNamespaceId}&menu=child2-2`);
    // props.changeMenuType("child2-2");
  };

  const goEntityManage = () => {
    router.push(`/main/knowledge/graph?id=${currentNamespaceId}&menu=child1-1`);
    // props.changeMenuType("child1-1");
  };

  return (
    <div className={styles["graph-container"]} style={{ flex: 1 }}>
      <div className={styles["graph-constent"]} ref={fullDom}>
        {[0, 1].includes(hasGraphData) ? (
          <div className={styles["graph"]}>
            <div className={styles["graph_card"]}>
              <div className={styles["graph-dialog-content-image"]}>
                <img
                  src="/knowledge/graph/empty.svg"
                  style={{ width: "240px", height: "150px" }}
                />
              </div>
              <div className={styles["tips"]}>
                暂无数据显示，请按照以下步骤构建图谱
              </div>
              <div className={styles["steps_conetnt"]}>
                <div
                  className={`${styles["circle"]} ${
                    hasGraphData === 0 ? styles["active"] : ""
                  }`}
                >
                  <div
                    className={`${styles["step"]} ${
                      hasGraphData === 0 ? styles["active_step"] : ""
                    }`}
                  >
                    1
                  </div>
                  <Button
                    type="link"
                    disabled={hasGraphData !== 0}
                    onClick={() => {
                      goOntologyManagement();
                    }}
                  >
                    {/* <span className={styles["special_font"]}></span> */}
                    构建知识结构
                  </Button>
                </div>
                <div className={styles["line"]}></div>
                <div
                  className={`${styles["circle"]} ${
                    hasGraphData === 1 ? styles["active"] : ""
                  }`}
                >
                  <div
                    className={`${styles["step"]} ${
                      hasGraphData === 1 ? styles["active_step"] : ""
                    }`}
                  >
                    2
                  </div>
                  {isCommonSpace ? (
                    <Button
                      type="link"
                      disabled={hasGraphData !== 1}
                      onClick={() => {
                        goEntityManage();
                      }}
                    >
                      填充知识
                    </Button>
                  ) : (
                    <Button type="link" disabled={hasGraphData !== 1}>
                      抽取知识
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles["graph"]} ref={graphDom}></div>
        )}
        {/* 顶部工具栏 */}
        <GraphUtil
          ref={coreComputedRef}
          fullDom={fullDom}
          graphDom={graphDom}
          onUpdateGraph={initGraph}
          onImportGraph={handleImportNode}
          changeType={handelType}
        />
        {/* 底部节点数量展示 */}
        <GraphTotal currentShowNodes={currentShowNodes} />
        {/* 节点详情 */}
        <GraphLegend tags={tags} />
        {/* 设置中心节点 */}
        <NodeCenterModal
          visible={nodeCenterVisible}
          onVisibleChange={setNodeCenterVisible}
          modalPosition={modalPosition}
          // onDone={() => {
          //   handleGraphStatus();
          // }}
        />
        {/* 查看节点详情 */}
        {nodeDetailVisible && (
          <NodeDetailModal
            visible={nodeDetailVisible}
            nodeDetailInfo={nodeDetailInfo}
            modalPosition={modalPosition}
          />
        )}
        {/* 查看边详情 */}
        {edgeDetailVisible && (
          <EdgeDetailModal
            visible={edgeDetailVisible}
            edgeDetailInfo={edgeDetailInfo}
            modalPosition={modalPosition}
          />
        )}
        {/* 右键点击菜单详情 */}
        {contextMenuVisible && (
          <ContextMenu
            visible={contextMenuVisible}
            actions={actions}
            position={position}
            onUpdateContextMenuVisible={setContextMenuVisible}
            pathList={pathList}
            onConfirmPathExpand={handlePathExpand}
          />
        )}
        {/* 节点拓展 */}
        {nodeExpandVisible && (
          <NodeExpandModal
            visible={nodeExpandVisible}
            selectedNode={selectedNode}
            onVisibleChange={setNodeExpandVisible}
            onImportGraph={handleImportNode}
            modalPosition={modalPosition}
            onSelectedNodeChange={setSelectedNode}
          />
        )}
        {/* 路径查询 pathQueryVisible */}
        {pathQueryVisible && (
          <PathQueryModal
            visible={pathQueryVisible}
            onVisibleChange={setPathQueryVisible}
            modalPosition={modalPosition}
            currentNode={currentNode}
            core={core.current}
            onUpdateGraph={initGraph}
          />
        )}
      </div>
    </div>
  );
});

export default KnowledgeGraph;
