import {
  forwardRef,
  useState,
  useImperativeHandle,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { Drawer, message, Button, Table } from "antd";
import {
  SyncOutlined,
  LoadingOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  Loading3QuartersOutlined,
} from "@ant-design/icons";
import styles from "../page.module.css";
import { useRouter } from "next/navigation";
import {
  documentListApi,
  extractDocumentApi,
  deleteDocumentApi,
} from "@/api/knowledgeExtraction";
import DeleteModal from "./DeleteModal";
import CustomTableStyle from "@/utils/graph/scrollStyle";
import ExtractConfig from "./ExtractConfig";

const EXTRACT_STATUS = {
  PARSING: 0,
  PARSE_RESOLVED: 1,
  PARSE_ERROR: 2,
  EXTRACTING: 3,
  EXTRACT_RESOLVED: 4,
};

const getFileIcon = (fileName) => {
  if (fileName.endsWith(".pdf")) return "/knowledge/extract/pdf.svg";
  if (fileName.endsWith(".doc") || fileName.endsWith(".docx"))
    return "/knowledge/extract/word.svg";
  return "/knowledge/extract/pdf.svg";
};

const DocumentListDrawer = forwardRef((props, ref) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState({});
  const [documentList, setDocumentList] = useState([]);
  const [flushedLoading, setFlushedLoading] = useState(false);
  const [isDisable, setIsDisable] = useState(false);
  const [dataSource, setDataSource] = useState([]); // 表格数据
  //分页数据
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
    showTotal: (total) => `共 ${total} 项数据`,
    defaultPageSize: 20,
    showQuickJumper: true,
    showSizeChanger: true,
    pageSizeOptions: ["10", "20", "30", "40", "50"],
  });
  // 删除
  const [deleteModalType, setDeleteModalType] = useState("delete");
  const [deleteDocument, setDeleteDocument] = useState({});
  const [deleteModalShow, setDeleteModalShow] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteTitle, setDeleteTitle] = useState("");
  const [deleteContent, setDeleteContent] = useState("");
  // 抽取配置
  const extractConfigRef = useRef(null);
  const [extractConfigShow, setExtractConfigShow] = useState(false);
  const [documentId, setDocumentId] = useState("");

  useImperativeHandle(ref, () => ({
    open: (task) => {
      setOpen(true);
      setCurrentTask(task || {});
      setDocumentList([]);
      if (task && task.jobId) {
        handleFetchDocList(task);
      }
    },
  }));

  const columns = [
    {
      dataIndex: "num",
      key: "num",
      title: "序号",
      align: "center",
      width: 60,
      render(text, record, index) {
        return `${(pagination.current - 1) * pagination.pageSize + 1 + index}`;
      },
    },
    {
      dataIndex: "documentName",
      key: "documentName",
      title: "文档名称",
      // align: "center",
      ellipsis: true,
      render: (text, record, index) => (
        <div className={styles["document-text"]}>
          <img
            style={{ width: "18px" }}
            src={getFileIcon(record.documentName)}
            alt={record.documentName}
          />
          <span title={record.documentName}>{record.documentName}</span>
        </div>
      ),
    },
    {
      dataIndex: "documentStatus",
      key: "documentStatus",
      title: "文档状态",
      // align: 'center',
      // width: 150,
      render: (text, record, index) => (
        <div className={styles["action_container"]}>
          {record.status ? (
            <div className={styles["doc-status-container"]}>
              <img
                style={{ width: "18px" }}
                src="/knowledge/extract/queue.svg"
              />
              <span className={styles["doc-status"]}>待抽取</span>
              <span style={{ fontSize: "12px", color: "#4070fd" }}>
                （排队{record.lineUpNumber}）
              </span>
            </div>
          ) : (
            <div>{renderStatus(record.documentStatus, record)}</div>
          )}
        </div>
      ),
    },
    {
      dataIndex: "action",
      key: "action",
      align: "center",
      title: "操作",
      width: 230,
      render: (text, record, index) => (
        <div className={styles["action_container"]}>
          {currentTask.type === 0 ? (
            <div>
              {/* <Button
                type="link"
                size="small"
                disabled={[
                  EXTRACT_STATUS.EXTRACTING,
                  EXTRACT_STATUS.PARSE_ERROR,
                  EXTRACT_STATUS.PARSING,
                ].includes(record.documentStatus)}
                onClick={() => handleExtractConfig(record)}
              >
                抽取配置
              </Button> */}
              <Button
                type="link"
                size="small"
                disabled={
                  [3, 2, 0].includes(record.documentStatus) || isDisable
                }
                onClick={() => handleExtract(record)}
              >
                抽取
              </Button>
              <Button
                type="link"
                size="small"
                disabled={[3, 2, 1, 0].includes(record.documentStatus)}
                onClick={() => handleJust(record)}
              >
                检验
              </Button>
            </div>
          ) : (
            <Button
              type="link"
              size="small"
              disabled={[0, 2].includes(record.documentStatus)}
              onClick={() => handleConfirmGraph(record)}
            >
              入图
            </Button>
          )}
          <Button type="link" size="small" onClick={() => handleDelete(record)}>
            删除
          </Button>
        </div>
      ),
    },
  ];

  const handleClose = () => {
    setOpen(false);
  };

  const pageChange = ({ current, pageSize }) => {
    const newPageConfig = { ...pagination, current, pageSize };
    setPagination(newPageConfig);
    handleFetchDocList(currentTask, newPageConfig);
  };

  const handleFetchDocList = useCallback(
    async (task, customPagination) => {
      setFlushedLoading(true);

      const { current, pageSize } = customPagination || pagination;
      const targetTask = task || currentTask;

      if (!targetTask || !targetTask.jobId) {
        console.warn("缺少必要的 jobId 参数，task 或 currentTask 无效");
        setFlushedLoading(false);
        return;
      }

      await documentListApi({
        jobId: targetTask.jobId,
        current,
        pageSize,
      })
        .then(({ data }) => {
          setDataSource(data.records);
          setPagination({
            ...pagination,
            current: data.current,
            pageSize: data.size,
            total: data.total,
          });
        })
        .finally(() => {
          setFlushedLoading(false);
        });
    },
    [currentTask, pagination]
  );

  // useEffect(() => {
  //   if (currentTask && currentTask.jobId) {
  //     handleFetchDocList();
  //   }
  // }, []);

  // 抽取配置
  const handleExtractConfig = (record) => {
    // setExtractConfigShow(true);
    extractConfigRef.current.showModal(record.documentId);
  };

  // 抽取
  const handleExtract = (record) => {
    console.log(record, "record");

    setDocumentId(record.documentId);
    if (record.documentStatus === 4) {
      setDeleteModalType("extract");
      setDeleteTitle("二次抽取提示");
      setDeleteContent("二次抽取会将上一次数据覆盖，是否确认重新抽取？");
      setDeleteModalShow(true);
    } else {
      handleSecondConfirm(record.documentId);
    }
  };

  // 二次抽取
  const handleSecondConfirm = async (id) => {
    setDeleteLoading(true);
    const reqId = Number(id || documentId);
    await extractDocumentApi({
      documentId: reqId,
    })
      .then(() => {
        handleFetchDocList();
        message.success("操作成功");
      })
      .finally(() => {
        setDeleteLoading(false);
        setDeleteModalShow(false);
      });
  };

  // 检验
  const handleJust = (record) => {
    router.push(
      `/main/knowledge/extract?documentId=${record.documentId}&spaceId=${currentTask.spaceId}&spaceName=${currentTask.spaceName}&documentName=${record.documentName}`
    );
  };

  // 入图
  const handleConfirmGraph = (record) => {};

  // 删除
  const handleDelete = (record) => {
    setDeleteDocument(record);
    setDeleteModalType("delete");
    setDeleteModalShow(true);
    setDeleteTitle("是否确认删除？");
    setDeleteContent("删除文档，从文档抽取的数据将一并删除");
  };

  // 删除确认
  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    const params = {
      documentId: Number(deleteDocument.documentId),
    };
    await deleteDocumentApi(params);
    setDeleteLoading(false);
    setDeleteModalShow(false);
    handleFetchDocList();
    props.searchEvent();
  };

  const renderStatus = (status, record) => {
    switch (status) {
      case 0:
        if (record.parseLineUpNumber) {
          return (
            <div className={styles["doc-status-container"]}>
              <LoadingOutlined style={{ color: "#4070fd" }} />
              <span>待解析</span>
              <span>（排队{record.parseLineUpNumber}）</span>
            </div>
          );
        } else {
          return (
            <div className={styles["doc-status-container"]}>
              <LoadingOutlined style={{ color: "#4070fd" }} />
              <span>解析中</span>
            </div>
          );
        }
      case 1:
        return (
          <div className={styles["doc-status-container"]}>
            <CheckCircleFilled style={{ color: "#34c7b0" }} />
            <span>解析成功</span>
          </div>
        );
      case 2:
        return (
          <div className={styles["doc-status-container"]}>
            <CloseCircleFilled style={{ color: "#e54d65" }} />
            <span style={{ color: "#e54d65" }}>解析失败</span>
          </div>
        );
      case 3:
        return (
          <div className={styles["doc-status-container"]}>
            <Loading3QuartersOutlined spin style={{ color: "#4070fd" }} />
            <span style={{ color: "#9095a3" }}>
              抽取中（{record.analysisNumber}/{record.documentTotal}）
            </span>
          </div>
        );
      case 4:
        return (
          <div className={styles["doc-status-container"]}>
            <CheckCircleFilled style={{ color: "#34c7b0" }} />
            <span>抽取成功</span>
          </div>
        );
    }
  };

  return (
    <>
      <CustomTableStyle />
      <Drawer
        open={open}
        onClose={handleClose}
        closable={false}
        width={800}
        autoFocus={false}
        zIndex={1000}
        styles={{
          content: {
            borderRadius: "24px 0px 0px 24px",
            padding: "24px 32px",
            display: "flex",
            flexDirection: "column",
            backgroundImage: 'url("/model/dataset_bg.png")',
            backgroundRepeat: "no-repeat",
            backgroundColor: "#fff",
            backgroundPosition: "top center",
            backgroundSize: "100% auto",
          },
          body: {
            padding: 0,
            overflow: "hidden",
            flex: 1,
            display: "flex",
            flexDirection: "column",
          },
          footer: {
            padding: "22px 0 0",
          },
        }}
      >
        <div className={styles["drawer-header"]} style={{}}>
          <span className={styles["drawer-title"]}>文档列表</span>
          <img
            src="/model/close_icon.svg"
            onClick={handleClose}
            style={{ cursor: "pointer" }}
          />
        </div>
        <div className={styles["drawer-content"]}>
          <div className={styles["util-container"]} v-if="!!dataSource.length">
            <Button
              className={styles["util-refresh-btn"]}
              loading={flushedLoading}
              onClick={() => handleFetchDocList()}
            >
              {!flushedLoading && <SyncOutlined />}刷新状态
            </Button>
          </div>
          <Table
            className={`${styles["table-container"]} custom-table`}
            size="small"
            loading={flushedLoading}
            columns={columns}
            dataSource={dataSource || []}
            scroll={{
              y: "calc(100vh - 250px)",
              scrollToFirstRowOnChange: true,
            }}
            rowKey="documentId"
            pagination={pagination}
            onChange={pageChange}
          />
        </div>
        {/* 抽取配置 */}
        <ExtractConfig
          ref={extractConfigRef}
          searchEvent={handleFetchDocList}
        />
        {/* 删除弹框  */}
        <DeleteModal
          visible={deleteModalShow}
          loading={deleteLoading}
          title={deleteTitle}
          content={deleteContent}
          onCancel={() => setDeleteModalShow(false)}
          onOk={() =>
            deleteModalType === "delete"
              ? handleDeleteConfirm()
              : handleSecondConfirm()
          }
        />
      </Drawer>
    </>
  );
});

export default DocumentListDrawer;
