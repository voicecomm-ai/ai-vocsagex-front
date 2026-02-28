import cytoscape from "cytoscape";
import d3Force from "cytoscape-d3-force";
import { COLOR } from "../constants";
import { createLabelDetail, removeLabelDetail } from "@/utils/graph/createTag";

// 注册布局插件
cytoscape.use(d3Force);

// 全局存储当前实例和布局
let currentInstance = null;
let layoutInstance = null;

// 基础配置
const baseOptions = {
  style: [
    {
      selector: "core",
      style: { "active-bg-size": 0 },
    },
    {
      selector: "node",
      style: {
        width: (node) => (node.data("customSize") ? node.data("size") : 30),
        height: (node) => (node.data("customSize") ? node.data("size") : 30),
        label: "data(name)",
        "background-color": "data(color)",
        color: "#121E3A",
        "font-size": 10,
        "font-weight": 600,
        "text-valign": "bottom",
        "text-margin-y": 5,
        "overlay-opacity": 0,
        "text-wrap": "ellipsis",
        "text-max-width": 100,
        events: "yes",
        "text-events": "yes",
        "min-zoomed-font-size": 10,
      },
    },
    {
      selector: "edge",
      style: {
        width: 1,
        "font-size": 9,
        "line-color": "#B8B9CE",
        "target-arrow-color": "#B8B9CE",
        "target-arrow-shape": "triangle-backcurve",
        "curve-style": "bezier",
        label: "data(edgeName)",
        color: "#9095A3",
        "text-background-color": "#F9FAFD",
        // @ts-ignore
        "text-background-padding": 3,
        // @ts-ignore
        "text-background-shape": "round-rectangle",
        "text-background-opacity": 1.0,
        "target-distance-from-node": 5,
        "control-point-weight": 0.5,
        "loop-direction": "180deg",
        "loop-sweep": "270deg",
        "control-point-step-size": 100,
        // @ts-ignore
        events: "yes",
        "text-events": "yes",
        "min-zoomed-font-size": 10,
        "text-rotation": "autorotate",
      },
    },
    {
      selector: "node:selected",
      style: {
        // @ts-ignore
        "outline-width": 3,
        "outline-style": "solid",
        "outline-color": "#C6D5FF",
        "outline-offset": 2,
      },
    },
    {
      selector: "edge:selected",
      style: {
        width: 2,
        "line-style": "dashed",
        "line-color": "#4070FD",
        "line-dash-pattern": [3, 2],
        color: "#4070FD",
        "target-arrow-color": "#4070FD",
      },
    },
    {
      selector: ".ff",
      css: {
        opacity: 0.1,
      },
    },
    {
      selector: ".node-hover",
      css: {
        // @ts-ignore
        "outline-width": 3,
        "outline-style": "solid",
        "outline-color": "#C6D5FF",
        "outline-offset": 2,
      },
    },
    {
      selector: ".edge-hover",
      css: {
        width: 2,
        "line-style": "dashed",
        "line-color": "#4070FD",
        "line-dash-pattern": [3, 2],
        color: "#4070FD",
        "target-arrow-color": "#4070FD",
      },
    },
    {
      selector: ".edge-label-text-hidden",
      css: {
        "text-opacity": 0,
      },
    },
  ],
  wheelSensitivity: 1,
  userZoomingEnabled: true,
  userPanningEnabled: true,
  boxSelectionEnabled: false,
  zoomingEnabled: true,
  minZoom: 0.2,
  zoom: 1.5,
  maxZoom: 5,
  fit: false,
};

// 创建或更新图谱实例
export function createCytoscapeInstance(elements, container, config = {}) {
  // 销毁旧实例
  if (currentInstance) {
    destroyCytoscapeInstance();
  }

  // 合并配置
  const options = {
    ...baseOptions,
    elements,
    container,
    ...config,
  };

  // 创建新实例
  currentInstance = cytoscape(options);

  // 绑定事件
  bindEvents(currentInstance);

  return currentInstance;
}

// 销毁实例
export function destroyCytoscapeInstance() {
  if (currentInstance) {
    currentInstance.destroy();
    currentInstance = null;
  }
  if (layoutInstance) {
    layoutInstance.stop();
    layoutInstance = null;
  }
}

// 重新布局
export function reLayout(core, layout = {}) {
  try {
    // 检查图谱中是否存在节点
    if (!core || core.nodes().length === 0) {
      return;
    }

    if (layoutInstance) {
      layoutInstance.stop();
    }

    layoutInstance = core.layout({ ...forceLayout, ...layout });
    layoutInstance.run();

    core.zoom({
      level: 1.5,
      renderedPosition: { x: core.width() / 2, y: core.height() / 2 },
    });
  } catch (error) {
    console.error("Layout Error:", error);
  }
}

// 绑定事件
function bindEvents(core) {
  // 节点悬停事件
  core.on("mouseover", "node", (evt) => {
    evt.target.addClass("node-hover");
    createLabelDetail(evt.target, evt);
    // 非关联元素置灰
    const nodeSingular = evt.target.closedNeighborhood().absoluteComplement();
    nodeSingular.forEach((ele) => {
      ele.addClass("ff");
    });
  });
  core.on("mouseout", "node", (evt) => {
    evt.target.removeClass("node-hover");
    removeLabelDetail();
    const nodeSingular = evt.target.closedNeighborhood().absoluteComplement();
    nodeSingular.forEach((ele) => {
      ele.removeClass("ff");
    });
  });
  core.on("mouseover", "edge", (event) => {
    const { target } = event;
    if (target.isEdge()) {
      target.toggleClass(["edge-hover"]);
    }
  });
  core.on("mouseout", "edge", (event) => {
    const { target } = event;
    if (target.isEdge()) {
      target.toggleClass(["edge-hover"]);
    }
  });
  core.on("mouseover", "*", (e) => {
    e.cy.container().style.cursor = "pointer";
  });
  core.on("mouseout", "*", (e) => {
    e.cy.container().style.cursor = "default";
  });
}

// 布局配置
export const forceLayout = {
  name: "d3-force",
  animate: true,
  ungrabifyWhileSimulating: false, // so you can't drag nodes during layout
  fixedAfterDragging: false, // fixed node after dragging
  fit: false, // on every layout reposition of nodes, fit the viewport
  /**d3-force API**/
  linkId: function id(d) {
    return d.id;
  },
  linkDistance: 100,
  manyBodyStrength: -500,
  alpha: 1.0,
  alphaDecay: 1 - Math.pow(0.001, 1 / 300),
  alphaMin: 0.1,
  // alphaTarget: 0,
  velocityDecay: 0.7,
  collideRadius: 10,
  collideStrength: 10.0, // 设置力强度范围
  // xStrength: 0.1, // sets the strength accessor to the specified number or function
  // xX: 0, // sets the x-coordinate accessor to the specified number or function
  // yStrength: 0.1, // sets the strength accessor to the specified number or function
  // yY: 0, // sets t
  // radialStrength: 0.1, // sets the strength accessor to the specified number or function
  // radialRadius: [1000], // sets the circle radius to the specified number or function
  // radialX: 0, // sets the x-coordinate of the circle center to the specified number
  // radialY: 0, // s
  // xX: 0,
  // yY: 0,
  // positioning options
  randomize: false, // use random node positions at beginning of layout
  // infinite layout options
  infinite: false, // overrides all other options for a forces-all-the-time mode
};

const concentric = {
  name: "circle",
  fit: false, // whether to fit the viewport to the graph
  padding: 30, // the padding on fit
  boundingBox: undefined, // constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
  avoidOverlap: true, // prevents node overlap, may overflow boundingBox and radius if not enough space
  nodeDimensionsIncludeLabels: false, // Excludes the label when calculating node bounding boxes for the layout algorithm
  spacingFactor: undefined, // Applies a multiplicative factor (>0) to expand or compress the overall area that the nodes take up
  radius: 150, // the radius of the circle
  startAngle: (3 / 2) * Math.PI, // where nodes start in radians
  sweep: undefined, // how many radians should be between the first and last node (defaults to full circle)
  clockwise: true, // whether the layout should go clockwise (true) or counterclockwise/anticlockwise (false)
  sort: undefined, // a sorting function to order the nodes; e.g. function(a, b){ return a.data('weight') - b.data('weight') }
  animate: true, // whether to transition the node positions
  animationDuration: 500, // duration of animation in ms if enabled
  animationEasing: undefined, // easing of animation if enabled
  animateFilter: function () {
    return true;
  }, // a function that determines whether the node should be animated.  All nodes animated by default on animate enabled.  Non-animated nodes are positiond immediately when the layout starts
  // @ts-ignore
  transform: function (node, position) {
    return position;
  }, // transform a given node position. Useful for changing flow direction in discrete layouts
};

// 同心圆布局
const circleLayout = {
  name: "concentric",
  fit: false, // whether to fit the viewport to the graph
  padding: 30, // the padding on fit
  startAngle: (3 / 2) * Math.PI, // where nodes start in radians
  sweep: undefined, // how many radians should be between the first and last node (defaults to full circle)
  clockwise: true, // whether the layout should go clockwise (true) or counterclockwise/anticlockwise (false)
  equidistant: false, // whether levels have an equal radial distance betwen them, may cause bounding box overflow
  minNodeSpacing: 15, // min spacing between outside of nodes (used for radius adjustment)
  boundingBox: undefined, // constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
  avoidOverlap: true, // prevents node overlap, may overflow boundingBox if not enough space
  nodeDimensionsIncludeLabels: false, // Excludes the label when calculating node bounding boxes for the layout algorithm
  height: undefined, // height of layout area (overrides container height)
  width: undefined, // width of layout area (overrides container width)
  spacingFactor: undefined, // Applies a multiplicative factor (>0) to expand or compress the overall area that the nodes take up
  concentric: function (node) {
    // returns numeric value for each node, placing higher nodes in levels towards the centre
    // @ts-ignore
    return node.degree();
  },
  levelWidth: function (nodes) {
    // the variation of concentric values in each level
    // @ts-ignore
    return nodes.maxDegree() / 4;
  },
  animate: true, // whether to transition the node positions
  animationDuration: 500, // duration of animation in ms if enabled
  animationEasing: undefined, // easing of animation if enabled
  // @ts-ignore
  animateFilter: function (node, i) {
    return true;
  }, // a function that determines whether the node should be animated.  All nodes animated by default on animate enabled.  Non-animated nodes are positioned immediately when the layout starts
  // @ts-ignore
  transform: function (node, position) {
    return position;
  }, // transform a given node position. Useful for changing flow direction in discrete layouts
};

// 树形结构布局
const treeLayout = {
  name: "breadthfirst",
  fit: false, // whether to fit the viewport to the graph
  directed: false, // whether the tree is directed downwards (or edges can point in any direction if false)
  padding: 30, // padding on fit
  circle: false, // put depths in concentric circles if true, put depths top down if false
  grid: false, // whether to create an even grid into which the DAG is placed (circle:false only)
  spacingFactor: 0.6, // positive spacing factor, larger => more space between nodes (N.B. n/a if causes overlap)
  boundingBox: undefined, // constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
  avoidOverlap: true, // prevents node overlap, may overflow boundingBox if not enough space
  nodeDimensionsIncludeLabels: true, // Excludes the label when calculating node bounding boxes for the layout algorithm
  roots: undefined, // the roots of the trees
  depthSort: undefined, // a sorting function to order nodes at equal depth. e.g. function(a, b){ return a.data('weight') - b.data('weight') }
  animate: true, // whether to transition the node positions
  animationDuration: 500, // duration of animation in ms if enabled
  animationEasing: undefined, // easing of animation if enabled,
  animateFilter: function () {
    return true;
  }, // a function that determines whether the node should be animated.  All nodes animated by default on animate enabled.  Non-animated nodes are positioned immediately when the layout starts
  // @ts-ignore
  transform: function (node, position) {
    return position;
  }, // transform a given node position. Useful for changing flow direction in discrete layouts
};

export const layoutConfig = {
  forceLayout,
  circleLayout: circleLayout,
  treeLayout,
};

// 工具函数
export const setNodeCenter = (core, elements) => {
  core.animate({ center: { eles: elements }, duration: 500, zoom: 1.5 });
};

export const cancelSelectedNode = (core) => {
  core.nodes().unselect();
};

// 获取当前实例
export function getCurrentInstance() {
  return currentInstance;
}
