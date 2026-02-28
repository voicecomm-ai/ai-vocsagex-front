"use client";
import React, { useEffect, useState, useRef } from "react";
import styles from "./graph.module.css";
import { useRouter } from "next/navigation";
import { Select, Typography, Menu, message, Spin } from "antd";
import { getKnowledgeDetail } from "@/api/knowledge";
import { useStore } from "@/store/index";
// import { usePathname, useSearchParams } from "next/navigation";
import SearchParamsHandler from "./components/SearchParamsHandler";
import { checkPermission } from "@/utils/utils";

// 子页面
import KnowledgeGraph from "./knowledgeGraphPage/KnowledgeGraph";
import EntityManage from "./knowledgePages/EntityManage";
import RelationalData from "./knowledgePages/RelationalData";
import OntologyManagement from "./structurePages/OntologyManagement";
import RelationManagement from "./structurePages/RelationManagement";
import SemanticGraph from "./structurePages/SemanticGraph";
import KnowledgeFusion from "./KnowledgeFusion/KnowledgeFusion";
// 组件
import Ontology from "./components/Ontology";
import DeleteModal from "./components/DeleteModal"; //删除弹框
import TipModel from "@/app/components/common/Delete";
import { dropTagEdgeApi } from "@/api/graph";

// 图谱知识库菜单
const graphMenu = [
  {
    key: "parent0",
    label: "知识图谱",
  },
  {
    key: "parent1",
    label: "图谱知识管理",
    children: [
      {
        key: "child1-1",
        label: "实体管理",
      },
      {
        key: "child1-2",
        label: "关系数据",
      },
    ],
  },
  {
    key: "parent3",
    label: "知识融合",
  },
  {
    key: "parent2",
    label: "图谱结构管理",
    children: [
      {
        key: "child2-1",
        label: "图谱结构",
      },
      {
        key: "child2-2",
        label: "本体管理",
      },
      {
        key: "child2-3",
        label: "关系管理",
      },
    ],
  },
];

const getLevelKeys = (items1) => {
  const key = {};
  const func = (items2, level = 1) => {
    items2.forEach((item) => {
      if (item.key) {
        key[item.key] = level;
      }
      if (item.children) {
        func(item.children, level + 1);
      }
    });
  };
  func(items1);
  return key;
};

const levelKeys = getLevelKeys(graphMenu);

export default function GraphPage() {
  const router = useRouter();
  // const pathname = usePathname();
  const [searchParams, setSearchParams] = useState(null);
  const [isSearchParamsReady, setIsSearchParamsReady] = useState(false);
  const { currentNamespaceId, deleteSessionStorage } = useStore(
    (state) => state
  );
  const [canCreate, setCanCreate] = useState(false); //创建应用权限
  const [knowledgeId, setKnowledgeId] = useState(null); //知识库id
  const [knowledgeDetail, setKnowledgeDetail] = useState({}); //知识库详情
  const [menuType, setMenuType] = useState("parent0"); // 当前菜单类型
  const { Paragraph, Text } = Typography;

  // 本体管理部分
  const ontologyRef = useRef(null); // 本体弹窗
  const ontologyManagementRef = useRef(null); // 本体管理
  const relationManagementRef = useRef(null); // 关系管理
  const [delType, setDelType] = useState(""); // 删除类型
  const [deleteModalShow, setDeleteModalShow] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteTitle, setDeleteTitle] = useState("");
  const [deleteContent, setDeleteContent] = useState("");
  const [delObj, setDelObj] = useState({});

  const [stateOpenKeys, setStateOpenKeys] = useState(["parent0"]);

  const tipModelRef = useRef(null); // 提示弹窗

  useEffect(() => {
    setCanCreate(checkPermission("/main/knowledge/operation"));
  }, []);

  useEffect(() => {
    // let params = new URLSearchParams(window.location.search);
    // let value = params.get("id");
    // if (value) {
    //   getKnowledgeDetailEvent(value);
    //   setKnowledgeId(value);
    // }
    const id = searchParams?.get("id");
    const menuType = searchParams?.get("menu");

    if (id) {
      getKnowledgeDetailEvent(id);
      setKnowledgeId(id);
    }

    if (menuType) {
      setMenuType(menuType);
      if (menuType === "parent0") {
        setStateOpenKeys(["parent0"]);
      } else if (menuType.startsWith("child1-")) {
        setStateOpenKeys(["parent0", "parent1"]);
      } else if (menuType.startsWith("child2-")) {
        setStateOpenKeys(["parent0", "parent2"]);
      } else if (menuType === "parent3") {
        const monitorUrl = `/main/knowledge/graph?id=${id}&menu=${menuType}`;
        sessionStorage.setItem("monitorUrl", monitorUrl);
        setStateOpenKeys(["parent0", "parent3"]);
      }
    }

    setIsSearchParamsReady(true);

    return () => {
      console.log("组件卸载");
      sessionStorage.removeItem("monitorUrl");
    };
  }, [searchParams]);

  // useEffect(() => {
  //   if (menuType) {
  //     setMenuType(menuType);
  //     if (menuType === "parent0") {
  //       setStateOpenKeys(["parent0"]);
  //     } else if (menuType.startsWith("child1-")) {
  //       setStateOpenKeys(["parent0", "parent1"]);
  //     } else if (menuType.startsWith("child2-")) {
  //       setStateOpenKeys(["parent0", "parent2"]);
  //     }
  //   }
  //   return () => {
  //     console.log("组件卸载");
  //   };
  // }, [menuType]);

  //返回知识库
  const handleBack = () => {
    const url = sessionStorage.getItem("monitorUrl");
    const fusionData = sessionStorage.getItem("fusionData");
    if (url && fusionData) {
      tipModelRef.current.showModal(
        null,
        "提示",
        "退出当前页面比对数据将清空，是否确认退出？"
      );
      return;
    }

    router.push("/main/knowledge");
    deleteSessionStorage();
  };
  //获取知识库详情
  const getKnowledgeDetailEvent = async (id) => {
    getKnowledgeDetail(id).then((res) => {
      setKnowledgeDetail(res.data);
    });
  };

  const onChangeMenuType = (key) => {
    const url = sessionStorage.getItem("monitorUrl");
    const fusionData = sessionStorage.getItem("fusionData");
    if (url && fusionData) {
      tipModelRef.current.showModal(
        { key: key },
        "提示",
        "退出当前页面比对数据将清空，是否确认退出？"
      );
      return;
    }
    router.push(`/main/knowledge/graph?id=${currentNamespaceId}&menu=${key}`);
    // router.push(`/main/knowledge/graph?id=${currentNamespaceId}`);
    // setMenuType(key);
  };

  const tipCallBack = (data) => {
    if (data) {
      router.push(
        `/main/knowledge/graph?id=${currentNamespaceId}&menu=${data.key}`
      );
    } else {
      router.push("/main/knowledge");
      deleteSessionStorage();
    }
    tipModelRef.current.hideModal();
  };

  // 自动收起未打开的菜单项
  // const onOpenChange = (openKeys) => {
  //   // 找出当前新打开的菜单项
  //   const currentOpenKey = openKeys.find(
  //     (key) => stateOpenKeys.indexOf(key) === -1
  //   );
  //   if (currentOpenKey !== undefined) {
  //     // 如果找到了新展开的菜单项
  //     // 查找同层级已展开的菜单项索引
  //     const repeatIndex = openKeys
  //       .filter((key) => key !== currentOpenKey)
  //       .findIndex((key) => levelKeys[key] === levelKeys[currentOpenKey]);
  //     // 更新展开状态
  //     setStateOpenKeys(
  //       openKeys
  //         .filter((_, index) => index !== repeatIndex) // 过滤掉同层级的旧菜单项
  //         .filter((key) => levelKeys[key] <= levelKeys[currentOpenKey]) // 只保留层级小于等于当前项的菜单项
  //     );
  //   } else {
  //     setStateOpenKeys(openKeys);
  //   }
  // };

  // 不收起未打开菜单项
  const onOpenChange = (openKeys) => {
    setStateOpenKeys(openKeys);
  };

  // 显示添加本体弹窗
  const showMainBodyModel = (type) => {
    ontologyRef.current.showModal(type);
  };
  // 获取本体列表
  const getOntologyList = (type) => {
    if (type === "substance") {
      ontologyManagementRef.current.getSubstanceList();
    } else {
      relationManagementRef.current.getRelationshipList();
    }
  };
  // 删除本体
  const handleDeleteSub = (type, item, title, content) => {
    setDelType(type);
    setDelObj(item);
    setDeleteModalShow(true);
    setDeleteTitle(title);
    setDeleteContent(content);
  };
  //本体删除确认事件
  const delConfirmEvent = () => {
    setDeleteLoading(true);
    if (delType === "substance") {
      delSubEvent();
    } else {
      delEdgeEvent();
    }
  };

  // 删除本体
  const delSubEvent = () => {
    const delData = {
      ...delObj,
      space: currentNamespaceId,
      type: 0,
    };
    dropTagEdgeApi(delData)
      .then((res) => {
        ontologyManagementRef.current.getSubstanceList();
        message.success("删除成功");
        successEvent();
      })
      .catch(() => {
        successEvent();
      })
      .finally(() => {
        successEvent();
      });
  };

  // 删除关系
  const delEdgeEvent = () => {
    const delData = {
      ...delObj,
      space: currentNamespaceId,
      type: 1,
    };
    dropTagEdgeApi(delData)
      .then((res) => {
        relationManagementRef.current.getRelationshipList();
        message.success("删除成功");
        successEvent();
      })
      .catch(() => {
        successEvent();
      })
      .finally(() => {
        successEvent();
      });
  };

  const successEvent = () => {
    setTimeout(() => {
      setDelType("");
      setDelObj({});
      setDeleteModalShow(false);
      setDeleteLoading(false);
      setDeleteTitle("");
      setDeleteContent("");
    }, 200);
  };

  return (
    <div className={styles["document_content"]}>
      <div className={styles["document_content_left"]}>
        <div
          className={styles["document_content_left_back"]}
          onClick={handleBack}
        >
          <img
            className={styles["document_content_left_back_icon"]}
            src="/knowledge/back.png"
            alt="返回"
          />
          <div className={styles["document_content_left_back_title"]}>返回</div>
        </div>

        <div className={styles["document_content_left_title"]}>
          <img
            className={styles["document_content_left_title_img"]}
            src="/knowledge/map.png"
            alt="知识库"
          />

          <div className={styles["document_content_left_title_name"]}>
            <Paragraph ellipsis={{ rows: 2, tooltip: knowledgeDetail.name }}>
              {knowledgeDetail.name}
            </Paragraph>
          </div>
        </div>
        {isSearchParamsReady ? (
          <div className={styles["agent_container_left_menu"]}>
            <Menu
              mode="inline"
              defaultSelectedKeys={["parent0"]}
              defaultOpenKeys={["parent0"]}
              selectedKeys={[menuType]}
              items={graphMenu}
              openKeys={stateOpenKeys}
              onOpenChange={onOpenChange}
              onClick={({ key }) => onChangeMenuType(key)}
            />
          </div>
        ) : (
          <div
            className={styles["content_main"]}
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "400px",
            }}
          >
            <Spin size="large" />
          </div>
        )}
      </div>
      {isSearchParamsReady ? (
        <div className={styles["content_main"]}>
          {menuType === "parent0" && (
            <KnowledgeGraph changeMenuType={onChangeMenuType}></KnowledgeGraph>
          )}{" "}
          {menuType === "child1-1" && <EntityManage></EntityManage>}{" "}
          {menuType === "child1-2" && <RelationalData></RelationalData>}{" "}
          {menuType === "child2-1" && <SemanticGraph></SemanticGraph>}{" "}
          {menuType === "child2-2" && (
            <OntologyManagement
              ref={ontologyManagementRef}
              showMainBodyModel={showMainBodyModel}
              handleDeleteSub={handleDeleteSub}
            ></OntologyManagement>
          )}{" "}
          {menuType === "child2-3" && (
            <RelationManagement
              ref={relationManagementRef}
              showMainBodyModel={showMainBodyModel}
              handleDeleteSub={handleDeleteSub}
            ></RelationManagement>
          )}{" "}
          {menuType === "parent3" && (
            <KnowledgeFusion canCreate={canCreate}></KnowledgeFusion>
          )}{" "}
        </div>
      ) : (
        <div
          className={styles["content_main"]}
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "400px",
          }}
        >
          <Spin size="large" />
        </div>
      )}
      {/* 添加本体弹窗 */}
      <Ontology ref={ontologyRef} getOntologyList={getOntologyList}></Ontology>
      {/* 删除弹框  */}
      <DeleteModal
        visible={deleteModalShow}
        loading={deleteLoading}
        title={deleteTitle}
        content={deleteContent}
        onCancel={() => setDeleteModalShow(false)}
        onOk={delConfirmEvent}
        isSurvival={false}
      />
      <TipModel zIndex={10000} ref={tipModelRef} deleteCallBack={tipCallBack} />
      <React.Suspense fallback={null}>
        <SearchParamsHandler
          onParamsChange={(params) => setSearchParams(params)}
        />
      </React.Suspense>
    </div>
  );
}
