"use client";
import React, { useEffect, useState, useRef, useMemo } from "react";
import styles from "./extract.module.css";
import { useRouter } from "next/navigation";
import {
  Switch,
  Button,
  Table,
  Pagination,
  Collapse,
  Empty,
  message,
  Modal,
  Typography,
} from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlusOutlined,
  CaretRightOutlined,
} from "@ant-design/icons";
import SearchParamsHandler from "../graph/components/SearchParamsHandler";
import CustomTableStyle from "@/utils/graph/scrollStyle";
import {
  verificationTotalApi,
  getTagInfoApi,
  verificationListApi,
  GetOriginalInformation,
  docJustApi,
  batchDeleteJustApi,
  knowledgeEntryMapApi,
  getEdgeTypePropertyApi,
  dropStatusApi,
} from "@/api/knowledgeExtraction";
import CheckAddOrEdit from "./components/CheckAddOrEdit";
import ExtractTable from "@/app/components/knowledge/ExtractTable";
import { hasTableXML } from "@/utils/graph/extractConfig";
import DeleteModal from "../components/DeleteModal";

// 模拟常量
const VERIFICATION_STATUS = {
  0: "--",
  1: "已校验",
  2: "已入图",
};

const getFileIcon = (fileName) => {
  if (fileName.endsWith(".pdf")) return "/knowledge/extract/pdf.svg";
  if (fileName.endsWith(".doc") || fileName.endsWith(".docx"))
    return "/knowledge/extract/word.svg";
  return "/knowledge/extract/pdf.svg";
};

export default function ExtractPage() {
  const router = useRouter();
  const [searchParams, setSearchParams] = useState(null);
  const [isSearchParamsReady, setIsSearchParamsReady] = useState(false);
  const [documentId, setDocumentId] = useState(null);
  const [spaceId, setSpaceId] = useState(null);
  const [spaceName, setSpaceName] = useState(null);
  const [documentName, setDocumentName] = useState(null);
  const [documentDetail, setDocumentDetail] = useState("");

  // ===== 新增 React 组件内部状态 =====
  const [singleShow, setSingleShow] = useState(true);
  const chunkDom = useRef(null);
  const [isFold, setIsFold] = useState(false);
  const [isShowFooter, setIsShowFooter] = useState(false);
  const [chunkId, setChunkId] = useState("");
  // 分页状态
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    showTotal: (total) => `共 ${total} 项数据`,
    defaultPageSize: 10,
    showQuickJumper: true,
    showSizeChanger: true,
    pageSizeOptions: ["10", "20", "30", "40", "50"],
  });
  // 多选行key
  const [selectRowKey, setSelectRowKey] = useState([]);
  // 校验统计
  const [verificationTotal, setVerificationTotal] = useState({
    total: 0,
    verification: 0,
    loadedMap: 0,
  });
  // 弹窗显隐
  const checkAddOrEditRef = useRef(null);
  // 表格数据
  const [dataSource, setDataSource] = useState([]);
  // 加载状态
  const [isLoading, setIsLoading] = useState(false);
  // 当前选中校验数据
  const [currentCheck, setCurrentCheck] = useState(null);
  // 侧边栏折叠面板激活key
  const [activeKey, setActiveKey] = useState(["2"]);
  // 文档文本信息
  const [docText, setDocText] = useState(null);
  // 当前高亮id
  const [currentHighlightId, setCurrentHighlightId] = useState([]);
  // 原文
  const [originText, setOriginText] = useState("");
  // 当前选中行id
  const [currentId, setCurrentId] = useState("");
  // 文档状态
  const [docStatus, setDocStatus] = useState(1);
  const [canPre, setCanPre] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [subjectOrObject, setSubjectOrObject] = useState(null);

  // 删除
  const [modalType, setModalType] = useState("delete");
  const [deleteTask, setDeleteTask] = useState({});
  const [deleteModalShow, setDeleteModalShow] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteTitle, setDeleteTitle] = useState("");
  const [deleteContent, setDeleteContent] = useState("");

  // ===== 表头配置 =====
  const columns = [
    {
      dataIndex: "sort",
      key: "sort",
      title: "序号",
      align: "center",
      width: 60,
      fixed: "left",
      render: (text, record, index) => {
        const serialNumber =
          (pagination.current - 1) * pagination.pageSize + 1 + index;
        const isHighlight =
          currentHighlightId.includes(record.verificationId * 1) && isFold;

        return (
          <span className={isHighlight ? styles["text_light"] : ""}>
            {serialNumber}
          </span>
        );
      },
    },
    {
      dataIndex: "subjectTag",
      key: "subjectTag",
      title: "主体类型",
      align: "center",
      fixed: "left",
      render: (text, record) => {
        return text ? text : "--";
      },
    },
    {
      dataIndex: "subjectName",
      key: "subjectName",
      title: "主体名称",
      align: "center",
      ellipsis: true,
      render: (text, record) => {
        return text ? text : "--";
      },
    },
    {
      dataIndex: "edgeProperty",
      key: "edgeProperty",
      title: "关系/属性",
      align: "center",
      render: (text, record) => {
        return text ? text : "--";
      },
    },
    {
      dataIndex: "objectNameValue",
      key: "objectNameValue",
      title: "客体名称/属性值",
      ellipsis: true,
      align: "center",
      render: (text, record) => {
        return text ? text : "--";
      },
    },
    {
      dataIndex: "objectTag",
      key: "objectTag",
      title: "客体类型",
      align: "center",
      render: (text, record) => {
        return text ? text : "--";
      },
    },
    {
      align: "center",
      dataIndex: "schema",
      key: "schema",
      title: "schema",
      width: 120,
      filters: [
        { text: "--", value: 2 },
        { text: "符合", value: 1 },
        { text: "不符合", value: 0 },
      ],
      filterMultiple: false,
      onFilter: (value, record) => {
        return record.schema === value;
      },
      render: (text) => {
        switch (text) {
          case 2:
            return "--";
          case 1:
            return "符合";
          case 0:
            return "不符合";
          default:
            return "--";
        }
      },
    },
    {
      dataIndex: "status",
      key: "status",
      align: "center",
      title: "状态",
      width: 120,
      filters: [
        { text: "--", value: 0 },
        { text: "已校验", value: 1 },
        { text: "已入图", value: 2 },
      ],
      filterMultiple: false,
      onFilter: (value, record) => {
        return record.status === value;
      },
      render: (text, record) => {
        if (record.status === 0) {
          return <span>{VERIFICATION_STATUS[record.status]}</span>;
        }
        if (record.status === 1) {
          return (
            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <img
                src="/knowledge/extract/extrtact_checked.svg"
                style={{ width: "18px" }}
              />
              {VERIFICATION_STATUS[record.status]}
            </span>
          );
        }
        if (record.status === 2) {
          return (
            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <img
                src="/knowledge/extract/in_graph.svg"
                style={{ width: "18px" }}
              />
              {VERIFICATION_STATUS[record.status]}
            </span>
          );
        }
        return "--";
      },
    },
    {
      dataIndex: "action",
      key: "action",
      title: "操作",
      align: "center",
      fixed: "right",
      width: 210,
      render: (_, record) => {
        // 已入图，全部禁用
        // 不符合 禁用校验
        // 符合， 已经校验则禁用校验
        const isJustDisabled =
          record.status === 2 ||
          record.schema === 0 ||
          (record.schema === 1 && record.status === 1);
        const isEditDeleteDisabled = record.status === 2;

        return (
          <div
            style={{ display: "flex", gap: "8px", padding: "16px" }}
            onClick={(e) => e.stopPropagation()} // 阻止事件冒泡
          >
            <Button
              type="link"
              disabled={isJustDisabled}
              onClick={() => handelDocJust(record)}
            >
              校验
            </Button>
            <Button
              type="link"
              disabled={isEditDeleteDisabled}
              onClick={() => handelOpenCheck(record)}
            >
              编辑
            </Button>
            <Button
              type="link"
              disabled={isEditDeleteDisabled}
              onClick={() => handelDelete(record)}
            >
              删除
            </Button>
          </div>
        );
      },
    },
  ];

  // ===== 侧边栏折叠面板配置 =====
  const collapseItems = useMemo(() => {
    const { aboveInfo, originalInfo, belowInfo } = docText || {};

    const aboveContent = aboveInfo?.chunkContent ?? "";
    const originalContent = originalInfo?.chunkContent ?? "";
    const belowContent = belowInfo?.chunkContent ?? "";

    return [
      {
        key: "1",
        label: "上文",
        collapsible: aboveContent ? undefined : "disabled",
        children: hasTableXML(aboveContent) ? (
          <ExtractTable tableXmlText={aboveContent} />
        ) : (
          <div
            dangerouslySetInnerHTML={{
              __html: aboveContent,
            }}
          />
        ),
      },
      {
        key: "2",
        label: "原文",
        collapsible: originalContent ? undefined : "disabled",
        children: hasTableXML(originalContent) ? (
          <ExtractTable tableXmlText={originalContent} />
        ) : (
          <div
            dangerouslySetInnerHTML={{
              __html: originalContent,
            }}
          />
        ),
      },
      {
        key: "3",
        label: "下文",
        collapsible: belowContent ? undefined : "disabled",
        children: hasTableXML(belowContent) ? (
          <ExtractTable tableXmlText={belowContent} />
        ) : (
          <div
            dangerouslySetInnerHTML={{
              __html: belowContent,
            }}
          />
        ),
      },
    ];
  }, [docText]);

  // ===== 模拟接口请求 =====
  // 获取校验统计
  const handleFetchTotal = async () => {
    await verificationTotalApi({
      documentId: Number(documentId),
    }).then(({ data }) => {
      setVerificationTotal(data);
    });
  };

  const handleFetchProperty = async (subjectType) => {
    const { data } = await getEdgeTypePropertyApi({
      spaceId: Number(spaceId),
      subjectType,
    });
    return data;
  };

  // 获取表格数据
  const handeFetchTaskList = async (newPagination, tagList) => {
    setIsLoading(true);
    const { current, pageSize } = newPagination || pagination;

    try {
      const { data: resData } = await verificationListApi({
        documentId: Number(documentId),
        current,
        pageSize,
        type: !singleShow,
      });

      if (resData?.records) {
        const fetchCache = new Map(); // 定义缓存对象，解决重复请求
        const getFetchPropertyWithCache = async (subjectTag) => {
          // 如果缓存里有这个tag的结果，直接返回缓存，不发请求
          if (fetchCache.has(subjectTag)) {
            return fetchCache.get(subjectTag);
          }
          // 缓存里没有，创建请求Promise，立刻存入缓存
          const promise = handleFetchProperty(subjectTag);
          fetchCache.set(subjectTag, promise);
          // 等待请求完成，返回结果
          const result = await promise;
          console.log(result, "resultresultresult");
          return result;
        };

        const newData = await Promise.all(
          resData.records.map(async (item) => {
            // schema 0 不符合 1 符合 2 空
            const { type, subjectTag, objectTag, edgeProperty, status } = item;
            let schema = 0;

            if (status === 2) {
              schema = 2;
            } else if (!subjectTag) {
              schema = 0;
            } else if (subjectTag && objectTag) {
              // 既有subjectTag又有objectTag：先判断是否都在subjectOrObject中
              const isBothInList = Array.isArray(tagList)
                ? tagList.includes(subjectTag) && tagList.includes(objectTag)
                : false;
              schema = isBothInList ? 1 : 0;

              // 若初步符合，再校验关系是否存在
              if (schema) {
                const fetchResult = await getFetchPropertyWithCache(subjectTag);
                // 安全访问：防止 fetchResult/edges 是 null/undefined
                const hasEdge = Array.isArray(fetchResult?.edges)
                  ? fetchResult.edges.some((edge) => edge === edgeProperty)
                  : false;
                schema = hasEdge ? 1 : 0;
              }
            } else if (type === 1 && !objectTag && subjectTag) {
              // type=1、有subjectTag但无objectTag：校验propertyInfos
              const fetchResult = await getFetchPropertyWithCache(subjectTag);
              // 从propertyInfos中查找propertyName匹配的项
              const hasProperty = Array.isArray(fetchResult?.propertyInfos)
                ? fetchResult.propertyInfos.some(
                    (info) => info.propertyName === edgeProperty
                  )
                : false;
              schema = hasProperty ? 1 : 0;
            } else {
              schema = 0;
            }
            return { ...item, schema };
          })
        );

        setDataSource(newData);
        setPagination({
          ...pagination,
          current: resData.current,
          pageSize: resData.size,
          total: resData.total,
        });

        // 过滤 schema=0 且 status=1 的数据
        const needDropIds = newData
          .filter((item) => item.schema === 0 && item.status === 1)
          .map((item) => item.verificationId)
          .filter(Boolean); // 过滤空值，避免传无效

        if (needDropIds.length) {
          await dropStatusApi({ verificationIds: needDropIds });
          handeFetchTaskList(newPagination, tagList).then(handleFetchTotal);
        }
      }
    } catch (error) {
      console.error("获取任务列表失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 获取主体/客体类型
  const handleFetchSubjectOrObject = async () => {
    const { data } = await getTagInfoApi({ spaceId });
    setSubjectOrObject(data); // 保留setState，其他地方如果有用到这个state也不受影响
    return data;
  };

  // ===== 事件处理函数 =====
  // 返回知识抽取
  const handleBack = () => {
    router.push("/main/knowledge?tab=2");
  };

  // 开关切换事件
  const switchChange = () => {
    setSingleShow((prev) => !prev);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  // 分页改变事件
  const pageChange = (current, pageSize) => {
    if (current !== pagination.current) {
      setSelectRowKey([]);
    }
    const newPagination = {
      ...pagination,
      current,
      pageSize: pageSize || pagination.pageSize,
    };
    setPagination(newPagination);
    // handleFetchSubjectOrObject().then(handeFetchTaskList(newPagination));
  };

  // 控制侧边栏展开/折叠
  const controlSide = () => {
    setIsFold(!isFold);
    setDocText(null);
    setCurrentCheck(null);
    setDocStatus(1);
    setCanPre(false);
    setCanNext(false);
    setCurrentHighlightId([]);
    setCurrentId("");

    if (!isFold) {
      setIsShowFooter(!isShowFooter);
      return;
    }

    setTimeout(() => {
      setIsShowFooter(!isShowFooter);
    }, 300);
  };

  // 清空选中行
  const clearSelected = () => {
    setSelectRowKey([]);
  };

  // 批量/单个校验
  const handelDocJust = (record) => {
    let data = [];
    if (!Array.isArray(record)) {
      data = [{ verificationId: record.verificationId }];
    } else {
      data = dataSource
        .filter((item) => record.includes(item.verificationId))
        .filter((item) => item.schema === 1)
        .map((item) => ({ verificationId: item.verificationId }));
    }
    doDonJust(data);
  };

  // 执行校验
  const doDonJust = async (record) => {
    return await docJustApi({
      verificationKnowledges: record,
      spaceId: Number(spaceId),
    }).then(() => {
      message.success("知识校验成功");
      const newDataSource = [...dataSource];
      newDataSource.forEach((item) => {
        const target = record.find(
          (r) => r.verificationId === item.verificationId
        );
        if (target) {
          item.status = 1;
        }
      });
      setDataSource(newDataSource);
      clearSelected();
      handleFetchTotal();
    });
  };

  // 删除事件
  const handelDelete = (record) => {
    setDeleteTask(record);
    setModalType("delete");
    setDeleteModalShow(true);
    setDeleteTitle("是否确认删除？");
    setDeleteContent("删除后该数据将从抽取列表中清空且不可恢复");
  };

  // 删除确认
  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    let data = [];
    if (!Array.isArray(deleteTask)) {
      data = [deleteTask.verificationId];
    } else {
      data = dataSource
        .filter(
          (item) =>
            deleteTask.includes(item.verificationId) && item.status !== 2
        )
        .map((item) => item.verificationId);
    }
    await batchDeleteJustApi({ verificationId: data })
      .then(() => {
        setDeleteLoading(false);
        setDeleteModalShow(false);
        handleFetchSubjectOrObject().then((tagList) => {
          handeFetchTaskList(pagination, tagList);
        });
        message.success("删除成功");
        handleFetchTotal();
        clearSelected();
      })
      .finally(() => {
        setDeleteLoading(false);
        setDeleteModalShow(false);
      });
  };

  // 打开新增/编辑弹窗
  const handelOpenCheck = (record) => {
    setCurrentCheck(record);
    checkAddOrEditRef.current.showModal(record, record ? "edit" : "add");
  };

  // 入图操作
  const handleInsertGraph = () => {
    if (!verificationTotal.verification) {
      message.warning("当前暂无可入图数据");
      return;
    }
    setDeleteTask(null);
    setModalType("inGraph");
    setDeleteModalShow(true);
    setDeleteTitle("提示");
    setDeleteContent(
      `产生已校验数据 ${verificationTotal.verification} 条，是否确认入图至图谱知识库【${spaceName}】？`
    );
  };

  // 确认入图
  const handleInGraphConfirm = async () => {
    setDeleteLoading(true);
    await knowledgeEntryMapApi({
      spaceId: Number(spaceId),
      documentId: Number(documentId),
    })
      .then(() => {
        setDeleteLoading(false);
        setDeleteModalShow(false);
        message.success("入图成功");
        handleBack();
      })
      .finally(() => {
        setDeleteLoading(false);
        setDeleteModalShow(false);
      });
  };

  // 刷新schema
  const reLoadSchema = () => {
    handleFetchSubjectOrObject()
      .then((tagList) => {
        handeFetchTaskList(pagination, tagList);
      })
      .then(() => {
        message.success("schema刷新成功");
      });
  };

  // 给文本中的关键词添加高亮标签
  const heightLightText = (text, keyWord) => {
    if (!keyWord) return text;
    const escapedKey = keyWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return text.replace(
      new RegExp(escapedKey, "g"),
      `<span style="color: #FFFFFF;background: linear-gradient(109deg, #4070FD 0%, #757BEB 99%);border-radius: 3px;">${keyWord}</span>`
    );
  };

  // 格式化文本函数
  const formatText = (data, keyWord) => {
    const sortedKeywords = keyWord
      .sort((a, b) => b.length - a.length)
      .filter(Boolean);

    const temp = sortedKeywords.reduce((pre, cur, currentIndex) => {
      if (currentIndex !== 0 && Array.isArray(pre)) {
        return pre.map((item) => heightLightText(item, cur));
      }
      return pre?.split(cur).filter(Boolean) || [];
    }, data);

    const firstKeyword = sortedKeywords[0] || "";
    const highlightTag = `<span style="color: #FFFFFF;background: linear-gradient(109deg, #4070FD 0%, #757BEB 99%);border-radius: 3px;">${firstKeyword}</span>`;

    return temp.join(highlightTag);
  };

  // 获取原文信息
  const FetchDocText = async (record) => {
    try {
      const { data: originalData } = await GetOriginalInformation({
        verificationId: Number(record.verificationId),
      });

      const { originalInfo, aboveInfo, belowInfo, verificationIds } =
        originalData;
      const { subjectName, objectNameValue } = record;
      const keyWord = [subjectName ?? "", objectNameValue ?? ""];
      const hasKeyWord = subjectName || objectNameValue;

      setOriginText(originalInfo?.chunkContent || "");
      setCurrentHighlightId(verificationIds || []);
      setActiveKey(["2"]);
      if (originalInfo) {
        setChunkId(originalInfo.chunkId);
      }

      // 处理原始内容
      const processedOriginalInfo = originalInfo
        ? {
            ...originalInfo,
            chunkContent: hasKeyWord
              ? formatText(originalInfo.chunkContent, keyWord)
              : originalInfo.chunkContent,
          }
        : null;

      // 处理上文
      const processedAboveInfo = aboveInfo
        ? {
            ...aboveInfo,
            chunkContent: hasKeyWord
              ? formatText(aboveInfo.chunkContent, keyWord)
              : aboveInfo.chunkContent,
          }
        : null;

      // 处理下文
      const processedBelowInfo = belowInfo
        ? {
            ...belowInfo,
            chunkContent: hasKeyWord
              ? formatText(belowInfo.chunkContent, keyWord)
              : belowInfo.chunkContent,
          }
        : null;

      const processedData = {
        ...originalData,
        originalInfo: processedOriginalInfo,
        aboveInfo: processedAboveInfo,
        belowInfo: processedBelowInfo,
      };

      setDocText(processedData);
    } catch (error) {
      console.error("获取文档文本失败：", error);
      setDocText(null);
    }
  };
  // 行样式类名
  const rowClassName = (record) => {
    return record.verificationId === currentId && isFold
      ? "height-light-row"
      : "";
  };

  // 弹窗关闭/完成回调
  const handleDone = (flag, formData) => {
    if (flag === "add") {
      // handeFetchTaskList();
      handleFetchSubjectOrObject().then((tagList) => {
        handeFetchTaskList(pagination, tagList);
      });
      if (isFold && currentId) {
        FetchDocText({ verificationId: currentId });
      }
    }
    if (flag === "edit" && currentCheck) {
      const newDataSource = [...dataSource];
      const findItem = newDataSource.find(
        (item) => item.verificationId === currentCheck.verificationId
      );
      if (findItem) {
        findItem.schema = 1;
        Object.assign(findItem, formData);
        if (formData.propertyType) {
          findItem.objectTag = "";
        }
        setDataSource(newDataSource);
      }
    }
  };

  // ===== 生命周期=====
  useEffect(() => {
    const docId = searchParams?.get("documentId");
    const spId = searchParams?.get("spaceId");
    const spName = searchParams?.get("spaceName");
    const docName = searchParams?.get("documentName");

    if (docId) {
      setDocumentId(docId);
    }
    if (spId) setSpaceId(spId);
    if (spName) setSpaceName(spName);
    if (docName) setDocumentName(docName);

    setIsSearchParamsReady(true);
  }, [searchParams]);

  useEffect(() => {
    if (spaceId && documentId) {
      handleFetchSubjectOrObject().then((tagList) => {
        handeFetchTaskList(pagination, tagList);
      });
    }
  }, [spaceId, documentId]);

  useEffect(() => {
    if (
      spaceId &&
      documentId &&
      Array.isArray(subjectOrObject) &&
      subjectOrObject.length
    ) {
      handeFetchTaskList(pagination, subjectOrObject);
    }
  }, [singleShow, pagination.current, pagination.pageSize]);

  useEffect(() => {
    documentId && handleFetchTotal();
  }, [documentId]);

  return (
    <>
      <CustomTableStyle />
      <div className={styles["document_main"]}>
        <div className={styles["left_back"]}>
          <div className={styles["back_btn"]} onClick={handleBack}>
            <img
              className={styles["left_back_icon"]}
              src="/knowledge/back.png"
              alt="返回"
            />
            <div className={styles["left_back_title"]}>返回</div>
          </div>
        </div>
        <div className={styles["document_content"]}>
          <div className={styles["extract-check-utils"]}>
            {documentName && (
              <span className={styles["document-title"]}>
                <img
                  style={{ width: "18px", marginRight: "8px" }}
                  src={getFileIcon(documentName)}
                  alt={documentName}
                />
                {documentName}
              </span>
            )}
            <div className={styles["utils-left"]}>
              <div>
                <span className={styles["single-show-text"]}>单实体显示</span>
                <Switch
                  checked={singleShow}
                  onChange={switchChange}
                  checkedChildren="开"
                  unCheckedChildren="关"
                />
              </div>
              <div className={styles["label_value_wrapper"]}>
                <span>共计：</span>
                <span className={styles["total-number"]}>
                  {verificationTotal.total}
                </span>
              </div>
              <div className={styles["label_value_wrapper"]}>
                <img
                  src="/knowledge/extract/extrtact_checked.svg"
                  style={{ width: "18px" }}
                />
                <span className={styles["left-label"]}>已校验：</span>
                <span className={styles["total-other"]}>
                  {verificationTotal.verification}
                </span>
              </div>
              <div>
                <img
                  src="/knowledge/extract/in_graph.svg"
                  style={{ width: "18px" }}
                />
                <span className={styles["left-label"]}> 已入图：</span>
                <span className={styles["total-other"]}>
                  {verificationTotal.loadedMap}
                </span>
              </div>
              <Button
                className={styles["filter_button"]}
                onClick={reLoadSchema}
              >
                刷新schema
              </Button>
              <Button
                type="primary"
                style={{ marginLeft: "20px" }}
                onClick={handleInsertGraph}
              >
                入 图
              </Button>
            </div>
          </div>

          {/* 校验主体 */}
          <div className={styles["extract-content"]}>
            {/* 侧边栏 */}
            <div
              className={`${styles["left-side"]} ${
                isFold ? styles["unfold"] : ""
              }`}
            >
              <div className={styles["left-side-header"]}>
                {isShowFooter && docText?.originalInfo && docStatus === 1 && (
                  <Button
                    style={{ color: "#4096ff", borderColor: "#4096ff" }}
                    size="small"
                    onClick={() => handelOpenCheck(null)}
                    icon={<PlusOutlined />}
                  >
                    新增
                  </Button>
                )}
                <span
                  className={styles["fold-control"]}
                  onClick={controlSide}
                  style={{ cursor: "pointer", fontSize: 16 }}
                >
                  {!isFold ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                </span>
              </div>

              {isShowFooter && (
                <div className={styles["left-side-content"]}>
                  <div ref={chunkDom}>
                    {docText?.originalInfo ||
                    docText?.aboveInfo ||
                    docText?.belowInfo ? (
                      <Collapse
                        activeKey={activeKey}
                        onChange={setActiveKey}
                        bordered={false}
                        className={styles["extract-chunk-collapse"]}
                        expandIcon={({ isActive }) => (
                          <CaretRightOutlined
                            style={{
                              color: isActive ? "#4070FD" : "#9095A3",
                              padding: "7px",
                              backgroundColor: isActive
                                ? "rgba(64, 112, 253, 0.08)"
                                : "#F9F9FD",
                              borderRadius: "4px",
                              transform: isActive ? "rotate(90deg)" : "none",
                            }}
                          />
                        )}
                        items={collapseItems}
                      />
                    ) : (
                      <Empty
                        style={{ minWidth: "330px" }}
                        description="暂无数据,点击右侧列表可查看原文"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 校验列表 */}
            <div className={styles["right-main"]}>
              <div className={styles["main-action"]}>
                <Button
                  size="small"
                  className={styles["just_btn"]}
                  disabled={!selectRowKey.length}
                  onClick={() => handelDocJust(selectRowKey)}
                >
                  批量校验
                </Button>
                <Button
                  size="small"
                  className={styles["btn"]}
                  disabled={!selectRowKey.length}
                  onClick={() => handelDelete(selectRowKey)}
                >
                  批量删除
                </Button>
              </div>
              <div>
                <Table
                  className={`custom-table ${styles["extract-list-table"]}`}
                  rowClassName={rowClassName}
                  loading={isLoading}
                  columns={columns}
                  dataSource={dataSource}
                  rowSelection={{
                    selectedRowKeys: selectRowKey,
                    onChange: setSelectRowKey,
                  }}
                  scroll={{
                    y: "calc(100vh - 360px)",
                    x: 1200,
                    scrollToFirstRowOnChange: true,
                  }}
                  rowKey="verificationId"
                  pagination={false}
                  onRow={(record) => ({
                    onClick: (event) => {
                      if (!event.target.closest(".ant-btn")) {
                        if (isFold) {
                          setCurrentCheck(record);
                          setCurrentId(record.verificationId);
                          FetchDocText(record);
                          setDocStatus(1);
                          setCanPre(false);
                          setCanNext(false);
                        }
                      } else {
                        console.log(event.target, "event.target");
                      }
                    },
                  })}
                />
                <Pagination
                  style={{
                    marginTop: "10px",
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                  current={pagination.current}
                  pageSize={pagination.pageSize}
                  total={pagination.total}
                  showTotal={pagination.showTotal}
                  showQuickJumper={pagination.showQuickJumper}
                  showSizeChanger={pagination.showSizeChanger}
                  pageSizeOptions={pagination.pageSizeOptions}
                  onChange={pageChange}
                  onShowSizeChange={(current, pageSize) =>
                    pageChange(current, pageSize)
                  }
                />
              </div>
            </div>
          </div>

          {/* 新增/编辑弹窗 */}
          <CheckAddOrEdit
            ref={checkAddOrEditRef}
            chunkId={chunkId}
            spaceId={spaceId}
            documentId={documentId}
            originText={originText}
            onDone={handleDone}
          />
          {/* 删除弹框  */}
          <DeleteModal
            visible={deleteModalShow}
            loading={deleteLoading}
            title={deleteTitle}
            content={deleteContent}
            onCancel={() => setDeleteModalShow(false)}
            onOk={() =>
              modalType === "delete"
                ? handleDeleteConfirm()
                : handleInGraphConfirm()
            }
          />
        </div>

        <React.Suspense fallback={null}>
          <SearchParamsHandler
            onParamsChange={(params) => setSearchParams(params)}
          />
        </React.Suspense>
      </div>
    </>
  );
}
