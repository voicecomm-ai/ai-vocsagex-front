"use client";

import React, { useState, useImperativeHandle, forwardRef, useEffect } from "react";
import styles from "./index.module.css";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "@/store/index";
import { getSubMenuListByParentId } from "@/api/user";
const SecondNavigation = forwardRef((props, ref) => {
  const [activeKey, setActiveKey] = useState(null);
  const router = useRouter();
  const [showSide, setShowSide] = useState(true); //是否显示侧边栏
  const [menuChildren, setMenuChildren] = useState([]);
  // 模型菜单单独管理显示
  const [algorithmMenus, setAlgorithmMenus] = useState([]); //算法模型
  const [preTrainedMenus, setPreTrainedMenus] = useState([]); //预训练模型
  const [isModelDetail, setIsModelDetail] = useState(false); //当前页面是否为模型详情页

  const pathname = usePathname();
  const { menuChangeId, showSecondSide, setShowSecondSide } = useStore((state) => state);
  useImperativeHandle(ref, () => ({
    setActiveKey,
  }));

  //处理折叠事件
  const handleCollapse = () => {
    if (isModelDetail) return;
    setShowSide(!showSide);
    setShowSecondSide(!showSecondSide);
  };

  useEffect(() => {
    setShowSide(true);
    getMenuList();
  }, [menuChangeId]);

  //根据菜单id获取菜单列表
  const getMenuList = () => {
    getSubMenuListByParentId(props.parentMenu.id).then((res) => {
      let menuChildren = res.data;
      setMenuChildren(menuChildren);
      //处理模型菜单
      if (props.parentMenu.sign === "modelManage") {
        getModelClassifyMenu();
      }
      if (menuChildren.length > 0) {
        //如果菜单列表不为空，则设置菜单列表
      }
    });
  };

  const algorithmSigns = ["algorithmModel", "modelMyModel", "algorithmEvaluation"];
  const preTraineSigns = ["preTrainingModel", "modelFineTuning", "preEvaluation"];
  //模型菜单分类管理
  const getModelClassifyMenu = () => {
    // 定义需要匹配的 sign 规则
    let algorithmItems = []; //算法
    let preTraineItems = []; //预训练
    console.log(props.menuChildren, "props.menuChildren");

    props.menuChildren.forEach((modelMenu) => {
      if (algorithmSigns.includes(modelMenu.sign)) {
        algorithmItems = [modelMenu, ...modelMenu.children];
      } else {
        preTraineItems = [modelMenu, ...modelMenu.children];
      }
    });

    setAlgorithmMenus(algorithmItems);
    setPreTrainedMenus(preTraineItems);
  };

  //菜单点击事件
  const handleMenuClick = (item) => {
    console.log(item.uri, "item.uri");

    const url = sessionStorage.getItem("monitorUrl");
    const fusionData = sessionStorage.getItem("fusionData");
    if (url && fusionData) {
      props.openTipModel(item);
      return;
    }

    setActiveKey(item.uri);
    router.push(item.uri);
  };

  useEffect(() => {
    const currentUrl = getCurrentUrl();

    setActiveKey(currentUrl?.uri);
    handleModelDetail(pathname);
    getMenuList();
  }, [pathname]);

  //处理模型详情页面
  const handleModelDetail = (currentPath) => {
    const reg =
      /^\/main\/model\/(algorithmModel|myModel|algorithmEvaluation|preTrainingModel|modelFineTuning|preEvaluation)\/\d+\/detail$/;
    setIsModelDetail(reg.test(currentPath));
  };
  //获取当前url 并在 props.menuChildren 中找到对应的uri
  const getCurrentUrl = () => {
  let url = pathname;
  
  // 核心新增：递归遍历所有菜单（一级+所有子级），返回匹配的菜单项
  const findMenuRecursively = (menus) => {
    for (const item of menus) {
      // 1. 优先完全匹配（精准匹配二级菜单URI，如 /main/dataGovernance/process/stream）
      if (item.uri === url) {
        return item;
      }
      // 2. 递归查找子菜单（如果有子项，继续遍历）
      if (item.children?.length) {
        const childMatch = findMenuRecursively(item.children);
        if (childMatch) {
          return childMatch;
        }
      }
      // 3. 降级匹配（仅完全匹配/递归都没找到时，用includes匹配父级）
      if (url.includes(item.uri)) {
        return item;
      }
    }
    return null;
  };

  // 第一步：递归查找所有菜单（优先匹配完整URI）
  let currentUrl = findMenuRecursively(props.menuChildren || []);

  // 单独处理模型层级菜单（保留原有逻辑，不影响新菜单）
  if (
    props.menuChildren.length > 1 &&
    !currentUrl &&
    props.menuChildren[0].sign === "algorithmModel"
  ) {
    let allModelMenu = [];
    props.menuChildren.forEach((item) => {
      const { children, ...parent } = item;
      allModelMenu.push(parent);
      if (children?.length) {
        allModelMenu.push(...children);
      }
    });
    // 对模型菜单也用递归匹配（保持逻辑一致）
    currentUrl = findMenuRecursively(allModelMenu);
  }


  // 消息中心跳转数据集强制激活二级菜单（保留原有逻辑）
  if (url === "/main/model/dataManage" && !currentUrl) {
    return {
      menuName: "数据集",
      sign: "modelDataManage",
      icon: "dataManage",
      uri: "/main/model/dataManage",
    };
  } else {
    return currentUrl;
  }
};

  //查找当前菜单对应的数量
  const getCurrentMenuCount = (data, id) => {
    let num = 0;
    data.forEach((item) => {
      if (item.menu.id === id) {
        num = item.num;
      }
    });
    return "（" + num + "）";
  };

  return (
    <div
      className={`${styles.second_navigation} ${
        pathname.includes("main/system") && !showSide ? styles.second_navigation_bg : ""
      }`}
    >
      {!showSide && (
        <div className={styles.second_navigation_collapse} onClick={handleCollapse}>
          <img src='/layout/expand.png' alt='collapse' />
        </div>
      )}
      {showSide && (
        <div className={styles.second_navigation_content}>
          <div className={styles.second_navigation_content_header}>
            <div className={styles.second_navigation_content_header_left}>
              {props.parentMenu && props.parentMenu.menuName}
            </div>
            <div className={styles.second_navigation_content_header_right}>
              <img
                src={`/layout/${isModelDetail ? "unCollapsed" : "collapsed"}.png`}
                alt='close'
                onClick={handleCollapse}
                style={{ cursor: isModelDetail ? "not-allowed" : "pointer" }}
              />
            </div>
          </div>
          {props.parentMenu.sign !== "modelManage" &&
            props.parentMenu.sign !== "dataGovernance" && (
              <div className={styles.second_navigation_content_list}>
                {props.menuChildren &&
                  props.menuChildren.map((item) => (
                    <div
                      onClick={() => handleMenuClick(item)}
                      className={`${styles.second_navigation_content_list_item} ${
                        activeKey === item.uri
                          ? styles.second_navigation_content_list_item_active
                          : ""
                      }`}
                      key={item.id}
                      style={{
                        backgroundColor:
                          activeKey === item.uri ? "rgba(55,114,254,0.06)" : "transparent",
                      }}
                    >
                      <img
                        className={styles["second_navigation_content_list_item_icon"]}
                        alt=''
                        src={
                          activeKey === item.uri
                            ? "/layout/icon/" + item.sign + "_selected.png"
                            : "/layout/icon/" + item.sign + "_unselected.png"
                        }
                      />

                      <div className={styles.second_navigation_content_list_item_name}>
                        {item.menuName}
                        {menuChildren.length > 0 && getCurrentMenuCount(menuChildren, item.id)}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          {/* 模型管理下级菜单 */}
          {props.parentMenu.sign === "modelManage" && (
            <>
              {[
               
                { title: "预训练模型", list: preTrainedMenus },
              ].map(({ title, list }) => (
                <div key={title} className={styles.second_navigation_content_list}>
                  <p className={styles.second_navigation_model_title}>{title}</p>
                  {list?.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleMenuClick(item)}
                      className={`${styles.second_navigation_content_list_item} ${
                        activeKey === item.uri
                          ? styles.second_navigation_content_list_item_active
                          : ""
                      }`}
                      style={{
                        backgroundColor:
                          activeKey === item.uri ? "rgba(55,114,254,0.06)" : "transparent",
                      }}
                    >
                      <img
                        className={styles.second_navigation_content_list_item_icon}
                        alt=''
                        src={`/layout/icon/${item.sign}_${
                          activeKey === item.uri ? "selected" : "unselected"
                        }.png`}
                      />
                      <div className={styles.second_navigation_content_list_item_name}>
                        {item.menuName}
                        {menuChildren.length > 0 && getCurrentMenuCount(menuChildren, item.id)}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}
          {/* 数据治理 */}
          {props.parentMenu.sign === "dataGovernance" && (
            <>
              {(props.menuChildren || []).map((parentMenu) => {
                const renderItems = parentMenu.children?.length
                  ? parentMenu.children
                  : [parentMenu];

                return (
                  <div key={parentMenu.id} className={styles.second_navigation_content_list}>
                    {parentMenu.children?.length > 0 && (
                      <p className={styles.second_navigation_model_title}>{parentMenu.menuName}</p>
                    )}
                    {renderItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleMenuClick(item)}
                        className={`${styles.second_navigation_content_list_item} ${
                          activeKey === item.uri
                            ? styles.second_navigation_content_list_item_active
                            : ""
                        }`}
                        style={{
                          backgroundColor:
                            activeKey === item.uri ? "rgba(55,114,254,0.06)" : "transparent",
                        }}
                      >
                        <img
                          className={styles.second_navigation_content_list_item_icon}
                          alt=''
                          src={`/layout/icon/${item.sign}_${
                            activeKey === item.uri ? "selected" : "unselected"
                          }.png`}
                        />
                        <div className={styles.second_navigation_content_list_item_name}>
                          {item.menuName}
                          {menuChildren.length > 0 && getCurrentMenuCount(menuChildren, item.id)}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
});
export default SecondNavigation;
