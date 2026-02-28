import cytoscape from "cytoscape";
import d3Force from "cytoscape-d3-force";
import { memoize } from "lodash-es";
import { COLOR } from "../constants";

cytoscape.use(d3Force);
const num = COLOR.length;
let currentInstance = null;
let layoutInstance = null;

export const layout = {
  name: "d3-force",
  animate: true,
  ungrabifyWhileSimulating: false, // so you can't drag nodes during layout
  fixedAfterDragging: true, // fixed node after dragging
  fit: false, // on every layout reposition of nodes, fit the viewport
  /**d3-force API**/
  linkId: function id(d) {
    return d.id;
  },
  linkDistance: 300,
  manyBodyStrength: -500,
  alpha: 0.9,
  alphaDecay: 1 - Math.pow(0.001, 1 / 300),
  alphaMin: 0.1,
  // alphaTarget: 0,
  velocityDecay: 0.7,
  collideRadius: 10,
  collideStrength: 2.0, // 设置力强度范围
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
  infinite: true, // overrides all other options for a forces-all-the-time mode
};

export const options = {
  style: [
    {
      selector: "core",
      // @ts-ignore
      style: {
        "active-bg-size": 0,
      },
    },
    // the stylesheet for the graph
    {
      selector: "node",
      style: {
        "background-color": memoize((data) => {
          const index = data.data("index") % num;
          return COLOR[index];
          // const color = data.data("color");
          // return color;
          // const r = Math.floor(Math.random() * 256);
          // const g = Math.floor(Math.random() * 256);
          // const b = Math.floor(Math.random() * 256);
          // const rgb = 'rgb(' + r + ',' + g + ',' + b + ')';
          // return rgb;
        }),
        height: 30,
        label: "data(id)",
        width: 30,
        "font-size": 13,
        "font-weight": 600,
        "text-valign": "bottom",
        "overlay-opacity": 0,
        "text-margin-y": 5,
      },
    },
    {
      selector: "edge",
      style: {
        width: 1,
        "font-size": 12,
        "line-color": "#B8B9CE",
        "target-arrow-color": "#9095A3",
        "target-arrow-shape": "triangle-backcurve",
        "target-endpoint": "outside-to-node-or-label",
        "curve-style": "bezier",
        label: "data(value)",
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
        cursor: "pointer",
      },
    },
    {
      selector: ".edge-hover",
      css: {
        "line-style": "dashed",
        "line-color": "#4070FD",
        "line-dash-pattern": [3, 2],
        color: "#4070FD",
        "target-arrow-color": "#4070FD",
      },
    },
  ],
  wheelSensitivity: 0.5,
  userZoomingEnabled: true,
  boxSelectionEnabled: false,
  zoomingEnabled: true,
  minZoom: 0.2,
  // zoom: 1,
  maxZoom: 5,
};

export const useCytoscape = (elements, container, config = {}) => {
  // 销毁旧实例
  if (currentInstance) {
    destroyCytoscapeInstance();
  }

  currentInstance = cytoscape({ ...options, elements, container, ...config });

  bindEvents(currentInstance);

  return currentInstance;
};

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

export function bindEvents(core) {
  core.on("mouseover", "node", (evt) => {
    evt.target.toggleClass(["node-hover"]);
    const nodeSingular = evt.target.outgoers();
    // 关联关系外的元素
    const nodeSingular1 = nodeSingular.absoluteComplement();
    nodeSingular1.forEach((ele) => {
      if (ele.isEdge()) {
        // 添加样式
        ele.toggleClass("ff");
      }
      if (ele.isNode()) {
        // 添加样式
        if (evt.target.same(ele)) {
          return;
        }
        ele.toggleClass("ff");
      }
    });
  });
  core.on("mouseout", "node", (evt) => {
    const nodeSingular = evt.target.outgoers();
    if (nodeSingular.anySame(evt.target)) {
      evt.target.toggleClass(["node-hover"]);
    } else {
      evt.target.toggleClass(["ff", "node-hover"]);
    }

    // 关联关系外的元素
    const nodeSingular1 = nodeSingular.absoluteComplement();
    nodeSingular1.forEach((ele) => {
      if (ele.isEdge()) {
        // 添加样式
        ele.toggleClass("ff");
      }
      if (ele.isNode()) {
        // 添加样式
        // if (evt.target.same(ele)) {
        //   return;
        // }
        ele.toggleClass("ff");
      }
    });
    // evt.target.toggleClass('node-hover');
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
  //鼠标样式
  core.on("mouseover", "*", (e) => {
    // @ts-ignore
    e.cy.container().style.cursor = "pointer";
  });
  core.on("mouseout", "*", (e) => {
    // @ts-ignore
    e.cy.container().style.cursor = "default";
  });
}
