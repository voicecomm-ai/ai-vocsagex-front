/* eslint-disable @next/next/no-img-element */
"use client";

// React相关导入
import React, { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

// Ant Design组件导入
import {
  Layout,
  Badge,
  ConfigProvider,
  notification,
  Button,
  message,
  Segmented,
  Drawer,
  Popover,
  Tooltip,
} from "antd";

// 样式和组件导入
import styles from "./layout.module.css";
import AvatarDropdown from "../components/layout/AvatarDropdown";
import SecondNavigation from "./components/SecondNavigation";
import DeleteModel from "@/app/components/common/Delete";

// API接口导入
import { getCurUserInfo, getMenuListWithUri } from "@/api/login";
import {
  getAllMessageList,
  getAllUnReadMessageList,
  clearOneMessage,
  clearAllMessage,
} from "@/api/messageCenter";

//应用模块弹窗
import CreateModal from "../components/CreateModal";
import CreateAppModal from "../components/CreateModal/CreateAppModal";

// 状态管理和WebSocket导入
import { useStore } from "@/store/index";
import { useWebSocket } from "@/hooks/useWebSocket";
//消息中心
import MessageCenterModal from "../components/message/messageCenterModal";
//创建应用选择框
import CreateAppPopup from "./components/CreateAppPopup";
/**
 * 主布局组件
 * 负责整个应用的主要布局结构，包括侧边栏菜单、消息中心、WebSocket连接等
 * @param {Object} props - 组件属性
 * @param {React.ReactNode} props.children - 子组件内容
 * @param {Object} props.params - 路由参数
 */
export default function MainLayout({ children, params }) {
  // ==================== 路由和导航相关 ====================
  const router = useRouter();
  const pathname = usePathname(); // 获取当前路径
  const { reconnect } = useWebSocket();
  const deleteModelRef = useRef(null); // 监听路由及融合数据变化提示
  const [modalType, setModalType] = useState(null); // 菜单类型

  // ==================== 菜单状态管理 ====================
  const [otherItemArr, setOtherItems] = useState([]); // 我的菜单项
  const [exploreMenu, setExploreMenu] = useState([]); // 探索菜单项
  const [sysItemArr, setSysItems] = useState([]); // 系统管理菜单项
  const [siderMenuArr, setSiderMenuArr] = useState([]); // 左侧菜单数组
  const [siderMenuSelectedKeys, setSiderMenuSelectedKeys] = useState([]); // 左侧菜单选中的key
  const [siderMenuItemSelected, setSiderMenuItemSelected] = useState(false); // 左侧菜单项是否被选中

  // ==================== 页面状态管理 ====================
  const [isSystemManage, setIsSystemManage] = useState(false); // 是否是系统管理页面
  const [isSide, setIsSide] = useState(false); // 是否显示侧边栏
  const [sideMenuClose, setSideMenuClose] = useState(false); // 侧边栏是否收起

  // ==================== 消息中心状态管理 ====================
  const [unReadMessageNum, setUnReadMessageNum] = useState(0); // 未读消息数量
  const [menuChildren, setMenuChildren] = useState([]); // 菜单子菜单
  const [parentMenu, setParentMenu] = useState(null); // 父菜单
  const [allMenuList, setAllMenuList] = useState([]); // 全部菜单列表
  // 消息按钮元素，用于获取位置信息
  const buttonRef = useRef(null);
  const { setSocketData, setUser, messageUuid, socketData } = useStore((state) => state);

  // ==================== 全局状态管理 ====================

  const navigationRef = useRef(null); // 导航组件ref
  // ==================== 布局组件解构 ====================
  const { Header, Content, Sider } = Layout;
  // ==================== 创建应用相关 ====================
  const createModalRef = useRef(null); //创建模态框
  const createAppModalRef = useRef(null); //创建应用模态框
  const messageRef = useRef(null); //创建消息中心模态框
  const [username, setUsername] = useState("");
  const [modelDetailPage, setModelDetailPage] = useState(false); //是否为模型详情页面

  // 控制应用选择弹窗显隐
  const [showPopup, setShowPopup] = useState(false);
  // 绑定按钮/弹窗 ref（用于判断点击区域）

  // 修改创建应用ui

  // ==================== 常量定义 ====================
  /**
   * 菜单标识对应的中文名称映射
   */
  const getmenuNameBysign = {
    knowledge: "资源库",
    application: "应用管理",
    model: "模型管理",
  };

  /**
   * 发现菜单配置
   */
  const findMenu = [
    {
      menuName: "发现",
      key: "/main/find",
      uri: "/main/find",
      children: null,
      sign: "find",
    },
  ];

  /**
   * 消息状态对应的图标映射
   * 0: 成功, 1: 失败
   */
  const messageStatusMap = {
    0: "/menu/success.png",
    1: "/menu/fail.png",
  };

  /**
   * 侧边栏底部菜单配置
   */
  const sideMenuBottom = [
    {
      menuName: "消息中心",
      key: "/main/messageCenter",
      uri: "/main/messageCenter",
      children: null,
      sign: "message",
    },
  ];

  // ==================== 菜单相关函数 ====================
  /**
   * 获取菜单信息事件
   * @param {boolean} isBack - 是否为返回操作
   */
  const getMenuInfoEvent = (isBack) => {
    getMenuListWithUri().then((res) => {
      let allMenus = findMenu.concat(res.data.menuList); //全部菜单列表
      setAllMenuList(allMenus);
      // 处理菜单信息
      handleMenuInfo(allMenus, isBack);

      // 将菜单列表和权限信息存储到sessionStorage
      sessionStorage.setItem("allMenuList", JSON.stringify(allMenus));
      sessionStorage.setItem("menuList", JSON.stringify(res.data.menuList));
      sessionStorage.setItem("permission", JSON.stringify(res.data.uriList));
    });
  };

  // ==================== WebSocket监听和消息处理 ====================
  /**
   * 监听WebSocket数据变化
   * 处理消息通知和页面跳转
   */
  useEffect(() => {
    if (messageUuid) {
      // 仅处理以下业务消息类型：301 模型训练, 302 预训练下载, 303 解析, 304 模型添加, 305/307 部署, 306 模型, 308 算法评测, 309 预训练评测, 501 数据导入, 601 解析
      if (
        socketData &&
        (socketData.msgType === 301 ||
          socketData.msgType === 302 ||
          socketData.msgType === 303 ||
          socketData.msgType === 501 ||
          socketData.msgType === 304 ||
          socketData.msgType === 305 ||
          socketData.msgType === 306 ||
          socketData.msgType === 308 ||
          socketData.msgType === 307 ||
          socketData.msgType === 309 ||
          socketData.msgType === 601)
      ) {
        handleMessage(socketData);
        // getList(activeMessageTabKey);
        //更新未读消息数量
        refreshUnReadList();
      }
    }
  }, [messageUuid]);

  /**
   * 根据消息类型跳转到对应业务页面（如模型训练、解析、部署等）
   * @param {number} msgType - 消息类型（301 模型训练, 303 解析, 304 模型添加 等）
   * @param {number} type - 结果类型，0 成功 / 1 失败，部分 msgType 下用于区分跳转目标
   */
  const showFailEvent = (msgType, type) => {
    console.log(msgType, type, "msgType, type");

    switch (msgType) {
      case 301:
        router.push("/main/model/myModel");
        break;
      case 303:
        router.push("/main/model/dataManage");
        break;
      case 304:
        router.push("/main/model/preTrainingModel");
        break;
      case 305:
        if (!type) {
          //成功
          router.push("/main/model/preTrainingModel");
        } else {
          //失败
          router.push("/main/model/myModel");
        }
        break;
      case 306:
        router.push("/main/model/modelFineTuning");
        break;
      case 308:
        router.push("/main/model/algorithmEvaluation");
        break;
      case 309:
        router.push("/main/model/preEvaluation");
        break;
      case 307:
        if (!type) {
          //成功
          router.push("/main/model/preTrainingModel");
        } else {
          //失败
          router.push("/main/model/modelFineTuning");
        }
        break;
      case 601:
        router.push("/main/dataGovernance/dataset");
        break;
    }
  };

  /**
   * 关闭通知
   * @param {string} key - 通知的唯一标识
   */
  const closeNotification = (key) => {
    notification.destroy(key);
    // 关闭弹框之后删除socket数据
    setSocketData({});
  };

  /**
   * 预训练模型下载处理
   * @param {Event} e - 事件对象
   * @param {Object} data - 下载数据
   * @param {string} from - 来源标识，默认为"card"
   */
  const downloadHandle = (e, data, from = "card") => {
    if (!data.downloadPath) {
      return message.warning("下载路径不存在");
    }

    // 创建下载链接
    const link = document.createElement("a");
    link.href = process.env.NEXT_PUBLIC_API_BASE + data.downloadPath;
    link.download = ""; // 浏览器按URL推断文件名
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 处理消息项已读
    handleMessageItem(data);

    // 如果来自列表，切换到全部标签页并刷新

    e.stopPropagation();
  };

  /**
   * 处理 WebSocket 推送的消息通知：解析类型/状态、生成标题、弹出 Antd notification 并挂载操作按钮
   * @param {Object} data - 消息数据，含 msg, type(0成功/1失败), createTime, attachment(JSON), msgType
   */
  const handleMessage = (data) => {
    console.log(data, "SOCKET DATA");
    const { msg, type, createTime, attachment, msgType } = data;
    const reason = attachment ? JSON.parse(attachment)?.reason : "";
    const key = `notification-key-${Date.now()}`;

    /** 消息类型 -> 展示文案前缀 */
    const msgTypeMap = {
      301: "模型",
      302: "生成",
      303: "解析",
      501: "数据导入",
      304: "-模型添加",
      305: "部署",
      306: "模型",
      308: "算法模型",
      307: "部署",
      309: "预训练模型",
      601: "解析",
    };
    /** 训练状态 -> 展示文案 */
    const trainStatusMap = {
      0: "训练中",
      1: "排队中",
      2: "训练成功",
    };
    /** 评测状态 -> 展示文案 */
    const evalStatusMap = {
      0: "评测中",
      1: "排队中",
      2: "评测成功",
      3: "评测失败",
    };
    let title = "";
    const attachmentObj = JSON.parse(attachment);
    if (msgType === 301 || msgType === 306) {
      if (type === 1) {
        title = `${msgTypeMap[msgType]}训练失败`;
      } else {
        title = `${msgTypeMap[msgType]}${trainStatusMap[attachmentObj.trainStatus]}`;
      }
    } else if (msgType === 308 || msgType === 309) {
      title = `${evalStatusMap[attachmentObj.trainStatus]}`;
    } else {
      title = `${msgTypeMap[msgType]}${!type ? "成功" : "失败"}`;
    }

    notification.open({
      key,
      className: styles["custom-notification"],
      style: {
        "--bg-image": !type
          ? "url('/layout/notice_success.png')"
          : "url('/layout/notice_fail.png')",
      },
      closeIcon: false,
      description: (
        <div className={styles["notification-content"]}>
          <img
            src={`/layout/notice_${!type ? "success" : "fail"}_icon.png`}
            width={42}
            height={42}
            alt='通知图标'
          />
          <div className={styles["notification-body"]}>
            <div className={styles["notification-header"]}>
              <div className={styles["notification-title-wrap"]}>
                {msgType !== 501 && (
                  <span className={styles["notification-title"]} title={msg}>
                    {msg}
                  </span>
                )}
                <div className={styles["notification-status"]}>{title}</div>
              </div>
              <img
                src='/model/close_icon.svg'
                className={styles["notification-close-icon"]}
                onClick={() => closeNotification(key)}
                alt='关闭'
              />
            </div>
            {reason && <div className={styles["notification-reason"]}>{reason}</div>}
            {msgType === 501 && (
              <div
                className={styles["notification-title"]}
                style={{ textDecoration: "none" }}
                title={msg}
              >
                {msg}
              </div>
            )}
            <div className={styles["notification-time"]}>{createTime}</div>

            {/* 根据消息类型显示不同的操作按钮 */}
            {msgType !== 302 && msgType !== 501 && (
              <Button
                className={styles["notification-button"]}
                onClick={() => {
                  showFailEvent(msgType, type);
                  closeNotification(key);
                }}
              >
                查看
                <img src='/layout/arrow_right.png' alt='查看' width={14} height={14} />
              </Button>
            )}
            {msgType === 302 && type === 0 && (
              <Button
                className={styles["notification-button"]}
                onClick={(e) => {
                  downloadHandle(e, data);
                  closeNotification(key);
                }}
              >
                下载
              </Button>
            )}
            {msgType === 501 && type === 1 && (
              <Button
                className={styles["notification-button"]}
                onClick={(e) => {
                  downloadHandle(e, data);
                  closeNotification(key);
                }}
              >
                下载失败数据
              </Button>
            )}
          </div>
        </div>
      ),
      duration: 30,
    });
  };

  // ==================== 初始化和路由监听 ====================
  /**
   * 组件挂载时：清空上次的 socket 消息缓存并执行 init（菜单、用户、未读消息数）
   */
  useEffect(() => {
    setSocketData("");
    init(false);
  }, []);

  /**
   * 监听浏览器前进/后退：地址栏变化后重新 init，以便菜单与 pathname 一致
   */
  useEffect(() => {
    const handlePopState = () => {
      init(true);
    };

    window.addEventListener("popstate", handlePopState);

    // 组件卸载时移除监听器
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  /**
   * 监听路由变化：更新模型详情页标识、侧栏显隐、子路由与菜单选中态
   */
  /** 需要留间距的模型相关详情页路径（用于 pathname 监听内判断 modelDetailPage） */
  const modelDetailPaths = [
    "algorithmModel",
    "myModel",
    "algorithmEvaluation",
    "preTrainingModel",
    "modelFineTuning",
    "preEvaluation",
  ];
  useEffect(() => {
    // 详情页间距
    const isDetailPage =
      pathname.endsWith("/detail") && // 路由以/detail结尾
      modelDetailPaths.some((module) => pathname.includes(`/model/${module}/`)); // 包含指定模块
    setModelDetailPage(isDetailPage);
    if (pathname === "/main/model/squareDetail") {
      setModelDetailPage(true);
    }
    // 处理左侧菜单栏显示
    handleShowSide();
    handleChildRouter(pathname);
  }, [pathname]);

  /**
   * 根据当前 URL 处理子路由：从 allMenuList 中查找匹配菜单并更新选中态与二级菜单
   * @param {string} url - 当前路径（如 pathname）
   */
  const handleChildRouter = (url) => {
    let menuInfo = sessionStorage.getItem("allMenuList");
    if (menuInfo) {
      menuInfo = JSON.parse(menuInfo);
      let findObj = findParent(menuInfo, url, 1);
      if (findObj) {
        handleMenuRender(findObj, url);
      } else {
        setSiderMenuSelectedKeys([pathname]);
        handleModelDetail(url, false);
      }
    }
  };

  /**
   * 初始化函数
   * @param {boolean} isBack - 是否为返回操作
   */
  const init = (isBack) => {
    // 判断是否为系统管理页面
    if (pathname.includes("/system")) {
      setIsSystemManage(true);
    }

    // 处理左侧菜单栏显示
    handleShowSide();
    refreshUnReadList();
    // 获取菜单信息和用户信息
    getMenuInfoEvent(isBack);
    getUserInfoEvent();
  };

  /**
   * 处理左侧菜单展示逻辑
   * 某些页面需要隐藏侧边栏
   */
  const handleShowSide = () => {
    // 需要隐藏侧边栏的路径匹配规则
    // console.log(pathname, "pathname");
    const matchPath = [
      "/main/application/manage/detail",
      "/main/dataGovernance/process/stream/detail",
    ];
    const shouldHideSide = matchPath.some((path) => pathname.includes(path));
    setIsSide(!shouldHideSide);
  };

  /**
   * 处理菜单信息
   * @param {Array} menuInfo - 菜单信息数组
   * @param {boolean} isBack - 是否为返回操作
   */
  const handleMenuInfo = (menuInfo, isBack) => {
    let otherItems = []; // 我的菜单项
    let sysItems = []; // 系统管理菜单项
    let exploreMenu = []; // 探索菜单项

    // 菜单分类标识
    const mineMenuSigns = ["modelManage", "resource", "applicationManage", "dataGovernance"];
    const exploreSigns = ["mcpSquare", "modelSquare"];

    // 遍历菜单信息，将菜单信息分类
    menuInfo.forEach((item) => {
      if (item.sign === "accountManage") {
        // 系统管理菜单
        sysItems.push(item);
      } else {
        // 其他菜单分类
        if (mineMenuSigns.includes(item.sign)) {
          otherItems.push(item);
        } else if (exploreSigns.includes(item.sign)) {
          exploreMenu.push(item);
        }
      }
    });

    // 设置各类菜单状态
    setOtherItems(otherItems);
    setExploreMenu(exploreMenu);
    setSysItems(sysItems);

    // 根据当前路径处理菜单显示
    if (pathname === "/main") {
      // 初次进入系统，显示默认菜单
      handleFirstMenu(menuInfo);
    } else {
      // 非首次进入系统，根据当前路径查找对应菜单
      const currentPath = isBack ? window.location.pathname : pathname;
      const findObj = findParent(menuInfo, currentPath, 1);
      if (findObj) {
        handleMenuRender(findObj, currentPath);
      } else {
        handleFirstMenu(currentPath);
      }
    }
  };

  /** 模型广场详情、训练详情等特殊路径，首次进入时需按详情页逻辑处理菜单 */
  const otherPaths = ["/main/model/squareDetail", "/main/model/trainDetail"];

  /**
   * 首次进入系统或路径无匹配菜单时的默认菜单处理：优先匹配 otherPaths，否则跳转发现页
   * @param {Array|string} currentPath - 当前菜单列表（pathname===/main 时）或当前路径字符串
   */
  const handleFirstMenu = (currentPath) => {
    let path = otherPaths.find((item) => currentPath.includes(item));
    if (path) {
      handleModelDetail(path, true);
    } else {
      jumpToPage(findMenu[0]);
    }
  };

  /**
   * 模型详情页特殊处理：训练详情时选中「模型管理」并拉取其二级菜单
   * @param {string} currentPath - 当前路径
   * @param {boolean} isPush - 是否由 push 进入（预留，当前逻辑未使用）
   */
  const handleModelDetail = (currentPath, isPush) => {
    let path = otherPaths.find((item) => currentPath.includes(item));
    if (path == "/main/model/trainDetail") {
      setSiderMenuSelectedKeys(["/main/model/manage"]);
      let menuInfo = sessionStorage.getItem("allMenuList")
        ? JSON.parse(sessionStorage.getItem("allMenuList"))
        : [];
      findSecondMenu(menuInfo, "/main/model/manage");
    }
  };

  /**
   * 根据当前路径在菜单树中查找二级菜单节点，并更新 parentMenu / menuChildren
   * @param {Array} menuInfo - 完整菜单树（如 allMenuList）
   * @param {string} currentPath - 当前路径（精确匹配 type=2）
   */
  const findSecondMenu = (menuInfo, currentPath) => {
    let findObj = findParent(menuInfo, currentPath, 2);
    if (findObj) {
      setParentMenu(findObj);
      setMenuChildren(findObj.children);
    }
  };

  /**
   * 在树形数据中查找目标URI的最大父级节点
   * @param {Array} arr - 树形数据数组
   * @param {string} targetUri - 目标URI
   * @param {number} type - 查找类型：1-包含匹配，2-精确匹配
   * @returns {Object|null} 找到的父级节点或null
   */
  const findParent = (arr, targetUri, type) => {
    if (!Array.isArray(arr) || arr.length === 0) {
      return null;
    }

    // 递归遍历树形数据，找到目标URI所在节点的最外层父节点
    const traverse = (nodes, parent = null) => {
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        // 根据类型进行匹配
        if (targetUri && targetUri.includes(node.uri) && type === 1) {
          return parent || node;
        }
        if (targetUri === node.uri && type === 2) {
          return parent || node;
        }

        // 如果当前节点有子节点，递归查找
        if (node.children && node.children.length > 0) {
          const result = traverse(node.children, parent || node);
          if (result) {
            return result;
          }
        }
      }
      return null;
    };

    return traverse(arr);
  };

  /**
   * 跳转到指定页面
   * @param {Object} item - 菜单项对象
   */
  const jumpToPage = (item) => {
    handleMenuRender(item);
  };

  /**
   * 处理菜单渲染以及跳转选中事件：更新二级菜单状态、选中 key，并 push 到目标路由（保留 query）
   * @param {Object} item - 菜单项对象
   * @param {string} [currentPath] - 当前路径，无则用 item 或其首个子菜单 uri
   */
  const handleMenuRender = (item, currentPath) => {
    const queryString = window.location.search;
    let path = item.children && item.children.length ? item.children[0].uri : item.uri;

    if (item.children && item.children.length > 0) {
      setMenuChildren(item.children);
      setParentMenu(item);
    } else {
      handleClearMenuChildren();
    }

    let params = queryString ? new URLSearchParams(queryString).toString() : null;
    let setPath = currentPath ? currentPath : path;
    let routerPath = setPath;

    if (currentPath) {
      if (params) {
        routerPath = currentPath + "?" + params;
      }
      let currentItem = findParent(item.children, setPath, 2);
      if (!currentItem) {
        let offerItem = findParent(item.children, setPath, 1);
        setPath = offerItem?.uri;
      }
    }
    setSiderMenuSelectedKeys([item.uri]);
    router.push(routerPath);
  };

  /**
   * 获取用户信息事件
   */
  const getUserInfoEvent = () => {
    getCurUserInfo().then((res) => {
      setUser(res.data);
      setUsername(res.data.username);
      reconnect(); // 重新连接WebSocket
      sessionStorage.setItem("userInfo", JSON.stringify(res.data));
    });
  };
  // ==================== 菜单点击事件处理 ====================

  /**
   * 退出确认弹窗点击「确认」后的回调：按 modalType 执行路由跳转并更新菜单选中态
   * @param {Object} data - 要跳转的菜单项（含 key/uri/children 等）
   */
  const deleteCallBack = (data) => {
    switch (modalType) {
      case "specific":
        router.push(data.key);
        handleClearMenuChildren();
        setSiderMenuSelectedKeys([data.key]);
        break;
      case "non-specific":
        let children = data.children;
        if (children && children.length > 0) {
          //有子菜单
          handleMenuRender(data, "");
        } else {
          //没有子菜单
          handleClearMenuChildren();
          router.push(data.uri);
          setSiderMenuSelectedKeys([data.uri]);
        }
        break;
      case "level-2":
        navigationRef.current.setActiveKey(data.uri);
        router.push(data.uri);
        break;
      default:
        break;
    }
    deleteModelRef.current.hideModal();
  };

  /**
   * 二级菜单点击时若存在比对数据则先弹出确认框，确认后再跳转（避免数据丢失）
   * @param {Object} data - 目标菜单项（用于确认后 deleteCallBack）
   */
  const openTipModel = (data) => {
    setModalType("level-2");
    deleteModelRef.current.showModal(data, "提示", "退出当前页面比对数据将清空，是否确认退出？");
  };

  /**
   * 左侧一级菜单点击（发现、消息中心等无子菜单项）：消息中心打开弹窗，其余检查比对数据后跳转
   * @param {Object} e - 菜单项事件对象，e.key 为路由 path
   */
  const menuClickEvent = (e) => {
    setModalType("specific");

    if (e.key === "/main/messageCenter") {
      messageRef.current.showModal();
    } else {
      const url = sessionStorage.getItem("monitorUrl");
      const fusionData = sessionStorage.getItem("fusionData");
      if (url && fusionData) {
        let title = "提示";
        let tip = "退出当前页面比对数据将清空，是否确认退出？";
        deleteModelRef.current.showModal(e, title, tip);
        return;
      }

      router.push(e.key);
      handleClearMenuChildren();
    }
    setSiderMenuSelectedKeys([e.key]);
  };

  useEffect(() => {
    // 可选：根据 siderMenuSelectedKeys 做副作用（当前仅占位）
  }, [siderMenuSelectedKeys]);

  // ==================== 消息中心相关函数 ====================

  /**
   * 关闭消息中心弹窗后，根据当前 pathname 重新同步菜单选中态与二级菜单
   */
  const onClickMessageClose = () => {
    handleChildRouter(pathname);
  };

  /**
   * 刷新未读消息数量并同步到 sessionStorage
   */
  const refreshUnReadList = async () => {
    getAllUnReadMessageList().then((res) => {
      sessionStorage.setItem("unReadMessageNum", res.data.total);
      setUnReadMessageNum(res.data.total);
    });
  };
  /**
   * 将单条消息标为已读（调用 clearOneMessage）
   * @param {Object} item - 消息项，需包含 id
   */
  const handleMessageItem = (item) => {
    clearOneMessage(item.id).then((res) => {});
  };

  /**
   * 切换侧边栏展开/收起状态
   */
  const handleChangeMenuOpen = () => {
    setSideMenuClose(!sideMenuClose);
  };

  /**
   * 「我的」/「探索」/ 系统管理等非特定一级菜单点击：有比对数据先确认，再根据是否有子菜单跳转
   * @param {Object} obj - 菜单项（含 uri、children）
   */
  const handleNonSpecificMenuClick = (obj) => {
    setModalType("non-specific");
    const url = sessionStorage.getItem("monitorUrl");
    const fusionData = sessionStorage.getItem("fusionData");
    if (url && fusionData) {
      deleteModelRef.current.showModal(obj, "提示", "退出当前页面比对数据将清空，是否确认退出？");
      return;
    }

    let children = obj.children;
    if (children && children.length > 0) {
      //有子菜单
      handleMenuRender(obj, "");
    } else {
      //没有子菜单
      handleClearMenuChildren();
      router.push(obj.uri);
      setSiderMenuSelectedKeys([obj.uri]);
    }
  };

  /**
   * 清空二级菜单状态（无子菜单或跳转到无二级菜单的一级时调用）
   */
  const handleClearMenuChildren = () => {
    setMenuChildren([]);
    setParentMenu(null);
  };

  /**
   * 当前页是否为「无圆角」布局（应用/流程详情、工作流等全屏内容区）
   * @returns {boolean} true 表示内容区圆角为 0
   */
  const getIsShowRadius = () => {
    const pages = [
      "model/detail",
      "workflow",
      "/main/application/manage/detail",
      "/main/dataGovernance/process/stream/detail",
    ];
    return pages.some((item) => pathname.includes(item));
  };
  /**
   * 判断当前路径是否需要去除布局背景
   * @returns {boolean} 是否不显示布局背景
   */
  const isNoLayoutBg = () => {
    return false;
  };
  /**
   * 是否为发现页或发现详情页（用于内容区样式 main_layout_content_find）
   * @returns {boolean}
   */
  const isFindPage = () => {
    return pathname.includes("/main/find") || pathname.includes("/main/find/detail");
  };

  /**
   * 当前路径是否需要主内容区预留 padding（列表页、模型详情等）
   * @returns {boolean}
   */
  const isPaddingPage = () => {
    const paddingArr = [
      "/main/find",
      "/main/application/manage",
      "/main/model/algorithmModel",
      "/main/model/myModel",
      "/main/model/preTrainingModel",
      "/main/model/modelFineTuning",
      "/main/model/algorithmEvaluation",
      "/main/model/preEvaluation",
      "/main/model/dataManage",
      "/main/knowledge",
      "/main/application/mcp/manage",
      "/main/model/square",
      "/main/application/mcp/square",
      "/main/system/user",
      "/main/system/department",
      "/main/system/role",
      "/main/application/manage/unreleased",
      "/main/application/manage/released",
      "/main/dataGovernance/dataset",
      "/main/dataGovernance/process/stream",
      "/main/dataGovernance/process/task",
      "/main/application/manage/integrated",
    ];
    return paddingArr.includes(pathname) || modelDetailPage;
  };

  /**
   * 是否展示二级导航栏：有 parentMenu 且当前不在「隐藏二级菜单」的详情页
   * @returns {boolean}
   */
  const isShowSecondMenu = () => {
    const hideSecondMenuPaths = [
      "/main/model/squareDetail",
      "/main/application/manage/detail",
      "/main/dataGovernance/process/stream/detail",
    ];
    if (menuChildren.length > 0 && parentMenu) {
      return !hideSecondMenuPaths.some((item) => pathname.startsWith(item));
    }
    return false;
  };

  // ==================== 创建应用相关逻辑 ====================
  /**
   * 创建应用流程中关闭创建类型选择弹窗时，打开创建应用模态框
   * @param {string} type - 创建类型
   */
  const handleModalClose = (type) => {
    createAppModalRef.current.showModal(type);
  };

  /**
   * 侧边栏「应用」Popover 内点击某一创建类型：打开对应创建模态框并关闭 Popover
   * @param {string} type - 创建类型
   */
  const handleItemClick = (type) => {
    createModalRef.current.showModal(type);
    setShowPopup(false);
  };

  // ==================== 渲染组件 ====================
  return (
    <div
      className={`${styles["main_layout"]} ${
        isPaddingPage() ? styles["main_layout_padding"] : ""
      } ${isNoLayoutBg() ? "" : styles["main_layout_bg"]}`}
    >
      {/* 左侧边栏：Logo、创建应用、发现、我的、探索、系统管理、消息中心、用户信息 */}
      {isSide && (
        <Layout
          className={styles["main_layout_container"]}
          style={{ width: sideMenuClose ? "72px" : "168px" }}
        >
          <div className={styles["layout_side_menu"]}>
            <div className={styles["layout_side_menu_top"]}>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <img
                  src={sideMenuClose ? "/layout/logo_close.png" : "/layout/logo.png "}
                  style={{ width: sideMenuClose ? "40px" : "136px" }}
                  alt=''
                  className={styles["main_layout_logo"]}
                />
              </div>
              <Popover
                open={showPopup}
                onOpenChange={setShowPopup}
                placement='rightTop'
                trigger='hover'
                zIndex={9999}
                arrow={false}
                overlayClassName={styles.createAppPopover}
                content={<CreateAppPopup onItemClick={handleItemClick} />}
              >
                <div
                  className={styles["layout_side_createApp"]}
                  style={{
                    width: sideMenuClose ? "40px" : "136px",
                    borderRadius: sideMenuClose ? "999px" : "12px",
                    height: sideMenuClose ? "32px" : "40px",
                  }}
                  onMouseEnter={() => setShowPopup(true)}
                >
                  <img
                    src='/layout/createApp.png '
                    alt='创建应用'
                    className={styles["main_layout_createApp_icon"]}
                  />
                  <div
                    className={` ${
                      !sideMenuClose ? `${styles["visible"]}` : `${styles["hidden-text"]}`
                    }`}
                  >
                    应用
                  </div>
                </div>
              </Popover>
              <Tooltip title={!sideMenuClose ? "" : "发现"} placement='right'>
                <div
                  onClick={() => menuClickEvent({ key: "/main/find" })}
                  className={`${styles["layout_side_menu_item"]} ${
                    siderMenuSelectedKeys.includes("/main/find")
                      ? `${styles["side_menu_item_selected"]}`
                      : ""
                  }`}
                  style={{ width: sideMenuClose ? "40px" : "136px" }}
                >
                  <img
                    src={
                      !siderMenuSelectedKeys.includes("/main/find")
                        ? "/layout/find_unselected.png"
                        : "/layout/find_selected.png"
                    }
                    alt=''
                    className={styles["main_layout_createApp_icon"]}
                  />
                  <div
                    className={` ${
                      !sideMenuClose ? `${styles["visible"]}` : `${styles["hidden-text"]}`
                    }`}
                  >
                    发现
                  </div>
                </div>
              </Tooltip>
              <div className={styles["layout_side_menu_router_wrap"]} style={{ marginTop: "24px" }}>
                <div className={styles["layout_side_menu_router_wrap_header"]}> 我的</div>
                {otherItemArr.map((item) => (
                  // eslint-disable-next-line react/jsx-key
                  <Tooltip title={!sideMenuClose ? "" : item.menuName} placement='right'>
                    <div
                      className={`${styles["layout_side_menu_item"]} ${
                        siderMenuSelectedKeys.includes(item.uri)
                          ? `${styles["side_menu_item_selected"]}`
                          : ""
                      }`}
                      onClick={() => handleNonSpecificMenuClick(item)}
                    >
                      <img
                        className={styles["layout_side_menu_img"]}
                        alt=''
                        src={
                          !siderMenuSelectedKeys.includes(item.uri)
                            ? "/layout/" + item.sign + "_unselected.png"
                            : "/layout/" + item.sign + "_selected.png"
                        }
                      />

                      <div
                        className={`${
                          !sideMenuClose ? `${styles["visible"]}` : `${styles["hidden-text"]}`
                        }`}
                      >
                        {item.menuName}
                      </div>
                    </div>
                  </Tooltip>
                ))}
              </div>
              <div className={styles["layout_side_menu_router_wrap"]}>
                <div className={styles["layout_side_menu_router_wrap_header"]}>探索</div>
                {exploreMenu.map((item) => (
                  <>
                    <Tooltip title={!sideMenuClose ? "" : item.menuName} placement='right'>
                      <div
                        className={`${styles["layout_side_menu_item"]} ${
                          siderMenuSelectedKeys.includes(item.uri)
                            ? `${styles["side_menu_item_selected"]}`
                            : ""
                        }`}
                        key={item.uri}
                        onClick={() => handleNonSpecificMenuClick(item)}
                      >
                        <img
                          className={styles["layout_side_menu_img"]}
                          alt=''
                          src={
                            !siderMenuSelectedKeys.includes(item.uri)
                              ? "/layout/" + item.sign + "_unselected.png"
                              : "/layout/" + item.sign + "_selected.png"
                          }
                        />
                        <div
                          className={`${
                            !sideMenuClose ? `${styles["visible"]}` : `${styles["hidden-text"]}`
                          }`}
                        >
                          {item.menuName}
                        </div>
                      </div>
                    </Tooltip>
                  </>
                ))}
              </div>
            </div>
            <div className={styles["layout_side_menu_bottom"]}>
              <div className={styles["bottom_wrap"]}>
                <div style={{ padding: "0 16px" }}>
                  {sysItemArr.map((item) => (
                    // eslint-disable-next-line react/jsx-key
                    <Tooltip title={!sideMenuClose ? "" : item.menuName} placement='right'>
                      <div
                        key={item.uri}
                        className={`${styles["layout_side_menu_item"]} ${
                          siderMenuSelectedKeys.includes(item.uri)
                            ? `${styles["side_menu_item_selected"]}`
                            : ""
                        }`}
                        onClick={() => handleNonSpecificMenuClick(item)}
                      >
                        <img
                          className={styles["layout_side_menu_img"]}
                          alt=''
                          src={
                            !siderMenuSelectedKeys.includes(item.uri)
                              ? "/layout/" + item.sign + "_unselected.png"
                              : "/layout/" + item.sign + "_selected.png"
                          }
                        />
                        <div
                          className={`${
                            !sideMenuClose ? `${styles["visible"]}` : `${styles["hidden-text"]}`
                          }`}
                        >
                          {item.menuName}
                        </div>
                      </div>
                    </Tooltip>
                  ))}
                  {sideMenuBottom.map((item) => (
                    // eslint-disable-next-line react/jsx-key
                    <Tooltip title={!sideMenuClose ? "" : item.menuName} placement='right'>
                      <div
                        key={item.uri}
                        className={`${styles["layout_side_menu_item"]} ${
                          siderMenuSelectedKeys.includes(item.uri)
                            ? `${styles["side_menu_item_selected"]}`
                            : ""
                        }`}
                        ref={item.sign === "message" ? buttonRef : null}
                        onClick={() => menuClickEvent({ key: item.uri })}
                      >
                        {item.sign === "message" ? (
                          <Badge size='small' count={unReadMessageNum} overflowCount={100}>
                            <img
                              className={styles["layout_side_menu_img"]}
                              alt=''
                              src={
                                !siderMenuSelectedKeys.includes(item.uri)
                                  ? "/layout/" + item.sign + "_unselected.png"
                                  : "/layout/" + item.sign + "_selected.png"
                              }
                            />
                          </Badge>
                        ) : (
                          <img
                            className={styles["layout_side_menu_img"]}
                            alt=''
                            src={
                              !siderMenuSelectedKeys.includes(item.uri)
                                ? "/layout/" + item.sign + "_unselected.png"
                                : "/layout/" + item.sign + "_selected.png"
                            }
                          />
                        )}

                        <div
                          className={`${
                            !sideMenuClose ? `${styles["visible"]}` : `${styles["hidden-text"]}`
                          }`}
                        >
                          {item.menuName}
                        </div>
                      </div>
                    </Tooltip>
                  ))}
                </div>
              </div>
              <div
                className={styles["layout_side_menu_item_user"]}
                style={{ marginBottom: 0, paddingLeft: "28px" }}
              >
                <AvatarDropdown>{!sideMenuClose && <span>{username}</span>}</AvatarDropdown>
              </div>
            </div>
          </div>
          {/* 侧边栏展开/收起按钮 */}
          <img
            onClick={handleChangeMenuOpen}
            className={styles["layout_side_menu_bottom_open_icon"]}
            alt=''
            src={!sideMenuClose ? "/layout/open.png" : "/layout/close.png"}
          />
        </Layout>
      )}
      {/* 主内容区：二级导航（按路由显隐）+ 子页面 children */}
      <Layout
        className={`${styles["main_layout_content"]} ${
          isFindPage() ? styles["main_layout_content_find"] : styles["main_layout_content_bgColor"]
        }`}
        style={{ borderRadius: getIsShowRadius() ? "0px" : "" }}
      >
        {isShowSecondMenu() && (
          <SecondNavigation
            menuChildren={menuChildren}
            parentMenu={parentMenu}
            ref={navigationRef}
            openTipModel={openTipModel}
          />
        )}
        <Content className={styles["main_layout_content_children"]}>{children}</Content>
      </Layout>
      {/* 创建应用流程：类型选择 Popover -> CreateModal -> CreateAppModal */}
      <CreateModal ref={createModalRef} onClose={handleModalClose} />
      <CreateAppModal ref={createAppModalRef} />
      <MessageCenterModal
        ref={messageRef}
        onClickMessageClose={onClickMessageClose}
        messageButtonRef={buttonRef}
      ></MessageCenterModal>
      {/* 退出确认弹窗：从比对数据页切菜单时提示是否清空数据 */}
      <DeleteModel
        zIndex={10000}
        ref={deleteModelRef}
        deleteCallBack={(data) => deleteCallBack(data)}
      />
    </div>
  );
}
