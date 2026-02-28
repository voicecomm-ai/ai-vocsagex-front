"use client";
import React, { useEffect, useState, useRef } from "react";
import styles from "../page.module.css";
import { useRouter, useParams } from "next/navigation";
import {
  Select,
  Input,
  Button,
  Table,
  ConfigProvider,
  Checkbox,
  Divider,
  Tooltip,
  message,
  Switch,
  Typography,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { getKnowledgeDetail, getDocumentList } from "@/api/knowledge";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import EnableModal from "./components/EnableModal";
import DisableModal from "./components/DisableModal";
import SearchTest from "./components/SearchTest";
import DocumentDetail from "./components/Detail";
import DocumentList from "./components/List";
import { throttle } from "lodash";
import Cookies from "js-cookie";
export default function DocumentPage() {
  const router = useRouter();
  const tabRef = useRef(null);
  const documentSearchRef = useRef(null);
  const selectAllRef = useRef(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]); // 存储选中的行key
  const [selectAll, setSelectAll] = useState(false);
  const [knowledgeId, setKnowledgeId] = useState(null); //知识库id
  const [knowledgeDetail, setKnowledgeDetail] = useState({}); //知识库详情
  const [documentList, setDocumentList] = useState([]); //文档列表
  const [tabType, setTabType] = useState("list"); //当前tab list 列表
  const { Paragraph, Text } = Typography;
  //  detail 文档详情
  const documentListRef = useRef(null);
  const abortRef = useRef(null);
  const [documentId, setDocumentId] = useState(null); //文档id
  const tabList = [
    { label: "文档", key: "0" },
    { label: "检索测试", key: "1" },
  ];

  const [tab, setTab] = useState(0);

  useEffect(() => {
    closeSse();
    // 获取单个参数
    let params = new URLSearchParams(window.location.search);
    let value = params.get("id");
    let type = params.get("type");
    getKnowledgeDetailEvent(value);
    setTabType(type);
    setKnowledgeId(value);
    documentChangeEvent(value);
    return () => {
      console.log("组件卸载，关闭 SSE");
      closeSse();
    };
  }, []);

  //返回知识库
  const handleBack = () => {
    closeSse();
    router.push("/main/knowledge");
  };
  //获取知识库详情
  const getKnowledgeDetailEvent = async (id) => {
    getKnowledgeDetail(id).then((res) => {
      setKnowledgeDetail(res.data);
    });
  };
  //监听文档变化
  const documentChangeEvent = (value) => {
    abortRef.current = new AbortController();
    let token = Cookies.get("userToken");
    fetchEventSource(
      "/voicesagex-console/knowledge-web/knowledge-base/" +
        value +
        "/documents/status/stream",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
          Accept: "text/event-stream",
        },
        signal: abortRef.current.signal, // ✅ 正确传入 signal
        retryInterval: 2000,
        maxRetries: 3,
        openWhenHidden: false,
        onopen() {},

        onmessage(data) {
          if (data.event == "process_status" && tabType === "list") {
            let processData = JSON.parse(data.data);
            throttledRefreshData(processData);
          }
        },

        onclose() {},

        onerror() {},
      }
    );
  };
  //修改为定时调用函数
  const throttledRefreshData = useRef(
    throttle(
      (data) => {
        documentListRef.current?.refreshData(data);
      },
      2000,
      { leading: true, trailing: true }
    )
  ).current;
  //测试实时刷新逻辑
  const testRefreshEvent = () => {
    const intervalId = setInterval(() => {
      let documentStatus = {
        749: {
          status: "IN_PROGRESS",
          wordCount: 17158,
        },
        786: {
          status: "SUCCESS",
          wordCount: 240,
        },
      };
      if (tabType === "list") {
        throttledRefreshData({ documentStatus: documentStatus });
      }
    }, 100);
  };
  //断开sse 连接
  const closeSse = () => {
    abortRef.current?.abort();
  };

  const onChangeTabType = (key) => {
    if (key == 1) {
      setTabType("search");
    } else {
      setTabType("list");
    }
    setTab(Number(key));
  };
  //展示类型切换
  const changeTypeEvent = (type, obj) => {
    if (obj) {
      //当存在文档详情
      setDocumentId(obj.id);
    }
    setTabType(type);
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
            src="/knowledge/document.png"
            alt="知识库"
          />

          <div className={styles["document_content_left_title_name"]}>
            <Paragraph ellipsis={{ rows: 2, tooltip: knowledgeDetail.name }}>
              {knowledgeDetail.name}
            </Paragraph>
          </div>
        </div>
        <div className={styles["agent_container_left_menu"]}>
          {tabList.map((item) => (
            <div
              key={item.key}
              onClick={() => onChangeTabType(item.key)}
              className={`${styles["left_menu_item"]} ${
                tab === parseInt(item.key)
                  ? styles["left_menu_item_active"]
                  : ""
              }`}
            >
              {parseInt(item.key) === 0 && (
                <>
                  <img src="/mcp/document.png" /> {item.label}
                </>
              )}
              {parseInt(item.key) === 1 && (
                <>
                  <img src="/mcp/menu_search.png" /> {item.label}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
       
      <div className={styles["document_content_main"]}>
        {" "}
        {tabType === "list" && (
          <DocumentList
            closeSse={closeSse}
            changeTypeEvent={changeTypeEvent}
            ref={documentListRef}
          ></DocumentList>
        )}{" "}
        {tabType === "detail" && (
          <DocumentDetail
            documentId={documentId}
            changeTypeEvent={changeTypeEvent}
            knowledgeDetail={knowledgeDetail}
          ></DocumentDetail>
        )}{" "}
        {tabType === "search" && (
          <SearchTest
            changeTypeEvent={changeTypeEvent}
            ref={documentSearchRef}
          ></SearchTest>
        )}{" "}
      </div>
    </div>
  );
}
