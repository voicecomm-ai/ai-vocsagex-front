"use client";
import { useState, useEffect, useRef } from "react";
import {
  Button,
  Input,
  Tag,
  Modal,
  Form,
  Avatar,
  Popover,
  message,
  Space,
  Dropdown,
  Typography,
  Empty,
  Table,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  DownOutlined,
  AppstoreAddOutlined,
} from "@ant-design/icons";
import styles from "./page.module.css";
import AppCard from "./components/AppCard.jsx";
import { useRouter } from "next/navigation";
// import TagGroup from "./components/TagGroup";
import { checkPermission } from "@/utils/utils";
import AddOrEdit from "./components/AddOrEdit"; //新增编辑弹框
import AddOrEditGraph from "./components/AddOrEditGraph"; //新增编辑图谱知识库弹框
import DeleteModal from "./components/DeleteModal"; //删除弹框
import DeleteFailModal from "./components/DeleteFailModal"; //删除失败弹框
import {
  getKnowledgeBaseTagList,
  getKnowledgeBaseList,
  deleteKnowledgeBase,
} from "@/api/knowledge";
import TagModel from "./components/Tag"; //标签弹框
import Update from "./components/Update.jsx";
import List from "rc-virtual-list";
import { useStore } from "@/store/index";
import { getUuid } from "@/utils/utils";
import { usePageRequest } from "@/hooks/usePageRequest";
import {
  extractionJobListApi,
  deleteExtractionJobApi,
} from "@/api/knowledgeExtraction";
import ExtractAddOrEdit from "./components/ExtractAddOrEdit"; //知识抽取新增编辑弹框
import UploadDrawer from "./components/UploadDrawer.jsx"; // 上传文档
import DocumentListDrawer from "./components/DocumentListDrawer.jsx"; // 文档列表
import CustomMultiSelect from "./components/CustomMultiSelect";
import CustomTableStyle from "@/utils/graph/scrollStyle";
// import { operatorData } from "@/utils/operatorData";
// import PanelContent from "./operatorPanel/panel";

export default function KnowledgePage() {
  // const panelContentRef = useRef(null);
  const { setMenuChangeId } = useStore((state) => state);
  const { showSecondSide } = useStore((state) => state);
  const { TextArea } = Input;
  const { Paragraph, Text } = Typography;
  const addOrEditRef = useRef(null);
  const addOrEditGraphRef = useRef(null); // 图谱知识库弹框
  const deleteRef = useRef(null); //删除弹框
  const tagModelRef = useRef(null); //标签弹框
  const router = useRouter();
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedType, setSelectedType] = useState([]);
  const [appList, setAppList] = useState([]); //应用列表
  const [tagList, setTagList] = useState([]); //标签列表
  const [form] = Form.useForm();
  // const [tabValue, setTabValue] = useState("1"); //1 传统Rag 2  Graph Rag
  const [tabValue, setTabValue] = useState(1); //1 知识库 2  知识抽取
  const [cardOption, setCardOption] = useState([]); //卡片操作权限
  const [canCreate, setCanCreate] = useState(false); //创建应用权限
  const [deleteModalShow, setDeleteModalShow] = useState(false);
  const [deleteObj, setDeleteObj] = useState(null);
  const [deleteType, setDeleteType] = useState(null); // 1 知识库 2 知识抽取
  const updateRef = useRef(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteTitle, setDeleteTitle] = useState("");
  const [deleteContent, setDeleteContent] = useState("");
  // 删除失败
  const [delErrorShow, setDelErrorShow] = useState(false);
  const [delErrorContent, setDelErrorContent] = useState("");

  // 定义状态：是否为窄屏（宽度 < 1480）
  const [isNarrowScreen, setIsNarrowScreen] = useState(false);
  // 监听窗口宽度变化
  useEffect(() => {
    // 初始化判断
    const checkScreenWidth = () => {
      setIsNarrowScreen(window.innerWidth < 1504);
    };
    checkScreenWidth();

    // 监听窗口resize
    window.addEventListener("resize", checkScreenWidth);

    // 清除监听
    return () => window.removeEventListener("resize", checkScreenWidth);
  }, []);

  useEffect(() => {
    setCardOption([
      {
        label: "编辑信息",
        isDisabled: !checkPermission("/main/knowledge/operation"),
      },
      {
        label: "删除",
        isDisabled: !checkPermission("/main/knowledge/operation"),
      },
    ]);
    setCanCreate(checkPermission("/main/knowledge/operation"));
  }, []);
  //下拉菜单列表
  const menuItems = [
    { label: "创建空知识库", key: 1 },
    { label: "创建文档知识库", key: 2 },
    { label: "创建图谱知识库", key: 3 },
  ];
  const handleTagChange = (tag, checked) => {
    const next =
      tag.length == 0
        ? []
        : checked
        ? [
            ...selectedTags.filter(
              (t) => t.name !== "全部标签" && t.id !== tag.id,
            ),
            tag,
          ]
        : selectedTags.filter((t) => t.id !== tag.id);
    // 若未有选中的标签，默认选中全部标签
    setSelectedTags(next);
    fetchKnowledgeList(next);
  };
  useEffect(() => {
    fetchKnowledgeList();
  }, [searchKeyword]);

  useEffect(() => {
    fetKnowledgeTagList();
    // 避免刷新页面后，菜单栏选中状态丢失
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get("tab");
    if (tab) {
      setTabValue(Number(tab));
    } else {
      setTabValue(1);
    }
  }, []);
  //获取知识库所有标签列表
  const fetKnowledgeTagList = async (name) => {
    let data = {
      name: "",
    };
    getKnowledgeBaseTagList(data).then((res) => {
      let data = res.data;

      setTagList(data);

      if (!selectedTags.length) {
        setSelectedTags([]);
      } else {
        setSelectedTags(selectedTags);
      }
    });
  };

  //接收标签选择变化
  const handleSelectedTags = (selectedIds) => {
    setSelectedTags(selectedIds);
    fetchKnowledgeList(selectedIds);
  };

  // 获取知识库列表
  const fetchKnowledgeList = async (tagIds) => {
    let data = {
      name: searchKeyword,
      tagIds: tagIds,
    };
    getKnowledgeBaseList(data).then((res) => {
      setAppList(res.data);
    });
  };

  //获取知识库列表
  // const fetchKnowledgeList = async (tagData) => {
  //   let arr = tagData ? tagData : selectedTags;
  //   let tagIds = []; //标签id
  //   if (arr.some((tag) => tag.name === "全部标签")) {
  //     // 当前选中包含全部标签，tagIds 为空
  //     tagIds = [];
  //   } else {
  //     // 当前选中不包含全部标签，循环获取标签 id
  //     tagIds = arr.map((tag) => tag.id);
  //   }
  //   let data = {
  //     name: searchKeyword,
  //     tagIds: tagIds,
  //   };
  //   getKnowledgeBaseList(data).then((res) => {
  //     setAppList(res.data);
  //   });
  // };
  useEffect(() => {
    console.log("2");
  }, [appList]);
  //管理标签弹窗
  const [tagModalVisible, setTagModalVisible] = useState(false);
  const openTagModal = () => {
    tagModelRef.current.showModal();
  }; //删除标签

  // 外部定义一个锁对象（组件外部或 useRef）
  const deletingTagIds = new Set();

  const deleteTagHandle = async (tag) => {
    const tagId = tag.id;

    // 已经删除中的标签，忽略点击
    if (deletingTagIds.has(tagId)) {
      console.warn(`Tag ${tagId} 正在删除中，忽略重复点击`);
      return;
    }

    deletingTagIds.add(tagId); // 上锁

    const unlock = () => deletingTagIds.delete(tagId); // 解锁方法

    try {
      const checkRes = await deleteCheckApplicationTag(tagId);

      const doDelete = async () => {
        await deleteApplicationTag(tagId); // 核心删除请求
        fetKnowledgeTagList();
        fetchApplications();
      };

      if (!checkRes.data) {
        Modal.confirm({
          title: `删除标签"${tag.name}"`,
          content: "该标签正在被使用，是否删除？",
          okText: "确定",
          cancelText: "取消",
          onOk: async () => {
            try {
              await doDelete();
            } finally {
              unlock();
            }
          },
          onCancel: unlock,
          afterClose: unlock,
        });
      } else {
        await doDelete();
        unlock();
      }
    } catch (err) {
      console.error("删除失败", err);
      unlock();
    }
  };

  //下拉菜单点击事件
  const handleDropClick = (key) => {
    if (!canCreate) {
      return false;
    }
    if (key == 1) {
      //创建空白知识库
      addOrEditRef.current.showModal("", "add");
    } else if (key == 2) {
      //创建知识库 跳转到创建界面
      router.push(`/main/knowledge/create`);
    } else if (key == 3) {
      // 创建图谱知识库
      addOrEditGraphRef.current.showModal("", "add");
    }
  };
  //知识库删除事件
  const deleteAppHandle = (record) => {
    setDeleteTitle("要删除知识库吗？");
    setDeleteContent(
      "删除知识库是不可逆的。用户将无法再访问您的知识库，所有的提示配置和日志将被被永久删除?",
    );
    setDeleteModalShow(true);
    setDeleteObj(record);
    setDeleteType(1);
    setDeleteLoading(false);
  };
  //删除确认事件
  const delKnowlegeEvent = () => {
    setDeleteLoading(true);
    if (deleteType === 1) {
      // 知识库删除
      deleteKnowledgeBase(deleteObj.id)
        .then((res) => {
          // if (res.msg == "操作成功") {
          //   message.success("删除成功");
          //   fetchKnowledgeList();
          //   setMenuChangeId(getUuid());
          // } else {
          //   setDelErrorShow(true);
          //   const message = res.msg
          //     .split(/\s*,\s*/)
          //     .filter(Boolean)
          //     .map((item) => `【${item}】`)
          //     .join("");
          //   setDelErrorContent(
          //     `当前图谱知识库关联了抽取任务${message}故不可删除，如需删除，请您删除关联的抽取任务`,
          //   );
          // }
          if (!res.data) {
            message.success("删除成功");
            fetchKnowledgeList();
            setMenuChangeId(getUuid());
          } else {
            setDelErrorShow(true);
            const message = res.data
              .split(/\s*,\s*/)
              .filter(Boolean)
              .map((item) => `【${item}】`)
              .join("");
            setDelErrorContent(
              `当前图谱知识库关联了抽取任务${message}故不可删除，如需删除，请您删除关联的抽取任务`,
            );
          }
        })
        .catch((err) => {
          setDeleteLoading(false);
        })
        .finally(() => {
          setDeleteModalShow(false);
          setDeleteLoading(false);
        });
    } else if (deleteType === 2) {
      // 知识抽取删除
      deleteExtractionJobApi({ jobId: deleteObj.jobId })
        .then((res) => {
          message.success("删除成功");
          fetchData();
        })
        .catch((err) => {
          setDeleteLoading(false);
        })
        .finally(() => {
          setDeleteModalShow(false);
          setDeleteLoading(false);
        });
    }
  };
  //编辑知识库信息
  const handleEditAppInfo = (appInfo) => {
    if (appInfo.isEmpty) {
      //编辑空知识库
      addOrEditRef.current.showModal(appInfo, "edit");
    } else {
      //编辑非空知识库
      updateRef.current.showModal(appInfo, "knowledge");
    }
  };
  //搜索事件
  const searchEvent = () => {
    fetchKnowledgeList();
    setMenuChangeId(getUuid());
  };
  // 定义 popover 内容
  const popoverContent = (
    <div className={styles["popover_content"]}>
      <div
        className={styles["popover_content_item"]}
        onClick={() => handleDropClick(2)}
      >
        <div className={styles["popover_content_item_top"]}>
          <img src="/knowledge/new.png" />
          创建文档知识库
        </div>
        <div className={styles["popover_content_item_bottom"]}>
          需要准备好文档数据,数据处理完成才算知识库创建完成.
        </div>
      </div>
      {/* <div
        className={styles["popover_content_item"]}
        onClick={() => handleDropClick(1)}
      >
        <div className={styles["popover_content_item_top"]}>
          <img src="/knowledge/empty.png" />
          创建一个空知识库
        </div>
        <div className={styles["popover_content_item_bottom"]}>
          空知识库中无文档,可随时上传文档至该知识库.
        </div>
      </div> */}
      <div
        className={styles["popover_content_item"]}
        onClick={() => handleDropClick(3)}
      >
        <div className={styles["popover_content_item_top"]}>
          <img src="/knowledge/empty.png" />
          创建图谱知识库
        </div>
      </div>
    </div>
  );

  /* -------------------------------抽取--------------------------------- */
  const extractColumns = [
    {
      dataIndex: "sort",
      key: "sort",
      title: "序号",
      align: "center",
      width: 60,
      render(text, record, index) {
        return `${
          (extPagination.current - 1) * extPagination.size + 1 + index
        }`;
      },
    },
    {
      dataIndex: "jobName",
      key: "jobName",
      align: "center",
      title: "任务名称",
    },
    {
      dataIndex: "spaceName",
      key: "spaceName",
      align: "center",
      title: "入图知识库",
      ellipsis: true,
      render(text, record, index) {
        return (
          <div className={styles["flex-vertical-center"]}>
            <img src="/knowledge/map.png" alt="" />
            <span className={styles["create-tag_content"]} title={text}>
              {text}
            </span>
          </div>
        );
      },
    },
    {
      dataIndex: "includeDocument",
      key: "includeDocument",
      align: "center",
      title: "包含文档",
      render(text, record, index) {
        return (
          <div
            className={styles["include_document_container"]}
            onClick={() => documentListOpen(record)}
          >
            <img src="/knowledge/extract/extract_document.svg" alt="" />
            <span>{text}</span>
          </div>
        );
      },
    },
    {
      dataIndex: "createTime",
      key: "createTime",
      align: "center",
      title: "最后操作时间",
    },
    {
      dataIndex: "createUser",
      key: "createUser",
      align: "center",
      title: "操作人",
    },
    {
      dataIndex: "action",
      key: "action",
      align: "center",
      title: "操作",
      width: 240,
      render: (text, record, index) => (
        <div className={styles["action_container"]}>
          <Button
            type="link"
            size="small"
            disabled={!canCreate}
            onClick={() => handleFile(record)}
          >
            上传文档
          </Button>
          <Button
            type="link"
            size="small"
            disabled={!canCreate}
            onClick={() => handleOpenExtract(record, "edit")}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            disabled={!canCreate || deleteLoading}
            onClick={() => handleDeleteJob(record)}
          >
            删除
          </Button>
        </div>
      ),
    },
  ];

  const [where, setWhere] = useState({
    jobName: "",
  });
  const [currentTask, setCurrentTask] = useState(null);
  const {
    extLoading,
    extData,
    extPagination,
    extSearch,
    onPageChange,
    fetchData,
  } = usePageRequest(extractionJobListApi, { searchParams: where });
  const extAddOrEditRef = useRef(null); // 新增编辑弹框
  const uploadDrawerRef = useRef(null); // 上传文档抽屉
  const documentListRef = useRef(null); // 文档列表抽屉

  // 防抖自定义Hook
  const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);

    return debouncedValue;
  };
  // 防抖搜索
  const debouncedJobName = useDebounce(where.jobName, 500);

  useEffect(() => {
    if (tabValue === 2) {
      fetchData();
    }
  }, [tabValue, debouncedJobName]);

  // 新增编辑抽取
  const handleOpenExtract = (params, type) => {
    setCurrentTask(params);
    extAddOrEditRef.current.showModal(params, type);
  };

  // 上传文档
  const handleFile = (record) => {
    setCurrentTask(record);
    uploadDrawerRef.current.open(record);
  };

  // 文档列表
  const documentListOpen = (record) => {
    setCurrentTask(record);
    documentListRef.current.open(record);
  };

  // 知识抽取删除
  const handleDeleteJob = (record) => {
    // await deleteExtractionJobApi(record.jobId);
    setDeleteTitle("是否确认删除？");
    setDeleteContent(
      "删除当前抽取任务，当前任务下的所有文档和抽取数据将一并删除",
    );
    setDeleteObj(record);
    setDeleteType(2);
    setDeleteModalShow(true);
    setDeleteLoading(false);
  };

  return (
    <>
      <CustomTableStyle />{" "}
      <div
        className={`${styles["knowledge_container"]} ${
          !showSecondSide ? styles["no-second-sidebar"] : ""
        }`}
        // id="workflow_page"
      >
        {/* <div style={{ display: "flex", gap: "8px" }}>
          {operatorData &&
            operatorData.map((item) => {
              return (
                <Button
                  key={item.id}
                  type="primary"
                  onClick={() => {
                    panelContentRef.current.showModal(item);
                    console.log(item, "item");
                  }}
                >
                  {item.name}
                </Button>
              );
            })}
        </div> */}
        <div className={styles["page-title"]}>
          {/* <span>知识库</span> */}
          <div className={styles["knowledge_container_tab"]}>
            <div
              className={`${styles["knowledge_container_tab_item"]} ${
                tabValue === 1 ? styles["selected_tab_item"] : ""
              }`}
              onClick={() => {
                router.push(`?tab=1`);
                setTabValue(1);
              }}
            >
              <img
                className={styles["tab-icon"]}
                src={
                  tabValue === 1
                    ? "/knowledge/knowledge_selected.png"
                    : "/knowledge/knowledge_unselected.png"
                }
              />
              知识库
            </div>
            <div
              className={`${styles["knowledge_container_tab_item"]} ${
                tabValue === 2 ? styles["selected_tab_item"] : ""
              }`}
              onClick={() => {
                router.push(`?tab=2`);
                setTabValue(2);
              }}
            >
              <img
                className={styles["tab-icon"]}
                src={
                  tabValue === 2
                    ? "/knowledge/extract_selected.png"
                    : "/knowledge/extract_unselected.png"
                }
              />
              抽取
            </div>
            {tabValue === 1 && (
              <div className={styles["title-right"]}>
                <CustomMultiSelect
                  canCreate={canCreate}
                  tagList={tagList}
                  onOpenTagModal={openTagModal}
                  onSelectedChange={handleSelectedTags}
                  onRefresh={fetKnowledgeTagList}
                  isNarrowScreen={isNarrowScreen}
                ></CustomMultiSelect>

                <div className={styles["input_content"]}>
                  <Input
                    style={{
                      width: isNarrowScreen ? 260 : 360,
                      marginRight: 8,
                      borderRadius: 8,
                      backgroundColor: "rgba(255,255,255,0.6)",
                      borderColor: "#DDDFE4",
                      height: 36,
                    }}
                    placeholder="搜索知识库名称,不超过50个字"
                    maxLength={50}
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    onPressEnter={() => searchEvent()}
                    suffix={
                      <SearchOutlined
                        style={{ cursor: "pointer" }}
                        onClick={() => searchEvent()}
                      />
                    }
                  />
                </div>

                {canCreate ? (
                  <Popover
                    className={styles["popover_content"]}
                    placement="bottomLeft"
                    arrow={false}
                    disabled={!canCreate}
                    content={popoverContent}
                  >
                    <Button
                      type="primary"
                      style={{ width: "160px", borderRadius: 12, height: 36 }}
                      icon={<DownOutlined />}
                      iconPosition={"end"}
                    >
                      创建知识库
                    </Button>
                  </Popover>
                ) : (
                  <Button
                    disabled
                    type="primary"
                    style={{
                      width: "160px",
                      borderRadius: 12,
                      borderColor: "#DDDFE4",
                    }}
                    icon={<DownOutlined />}
                    iconPosition={"end"}
                  >
                    创建知识库
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
        {/* tab选项卡 */}
        {/* <div className={styles["knowledge_container_tab"]}>
        <div
          className={`${styles["knowledge_container_tab_item"]} ${tabValue === "1" ? styles["selected_tab_item"] : ""
            }`}
        >
        RAG
        </div>
        <div
          className={`${styles["knowledge_container_tab_item"]} ${tabValue === "2" ? styles["selected_tab_item"] : ""
            }`}
        >
          Graph RAG
        </div>
      </div> */}

        {tabValue === 1 && (
          <div className={styles["knowledge_content"]}>
            {/* <TagGroup
            list={tagList}
            selectedTags={selectedTags}
            onChange={handleTagChange}
            keyField="id"
            labelField="name"
          >
            {canCreate && (
              <Button
                style={{
                  background: "#F2F3F5",
                  borderRadius: 8,
                  padding: 10,
                  borderColor: "#DDDFE4",
                }}
                icon={<AppstoreAddOutlined />}
                onClick={() => openTagModal()}
              />
            )}
          </TagGroup> */}

            {appList.length > 0 && (
              <div className={styles["app-list"]}>
                {appList.map((appItem) => (
                  <AppCard
                    key={appItem.id}
                    app={appItem}
                    allTagList={tagList}
                    onEditAppInfo={handleEditAppInfo}
                    openTagModal={openTagModal}
                    updateAppList={searchEvent}
                    updatetagList={fetKnowledgeTagList}
                    deleteAppHandle={deleteAppHandle}
                    cardOptions={cardOption}
                    tagManageModal={tagModalVisible}
                    permission={canCreate}
                  />
                ))}
              </div>
            )}
            {appList.length == 0 && (
              <div className={styles["app-list_empty"]}>
                <Empty
                  image={"/knowledge/knowledge_empty.png"}
                  styles={{ image: { height: 220, width: 220 } }}
                  description={
                    <span style={{ color: "#666E82", fontWeight: 500 }}>
                      暂无知识库
                    </span>
                  }
                />
              </div>
            )}
          </div>
        )}

        {tabValue === 2 && (
          <div className={styles["extract_content"]}>
            <div className={styles["extract-list-utils-wrapper"]}>
              <div className={styles["extract-list-utils-search"]}>
                <Input
                  value={where.jobName}
                  placeholder="请输入任务名称"
                  style={{ width: "240px", borderRadius: 4 }}
                  onChange={(e) =>
                    setWhere({ ...where, jobName: e.target.value })
                  }
                  onPressEnter={() => extSearch()}
                  suffix={
                    <SearchOutlined
                      style={{ cursor: "pointer" }}
                      onClick={() => extSearch()}
                    />
                  }
                />
                {/* <Button
                type="primary"
                style={{ width: "64px", borderRadius: 4 }}
                onClick={() => extSearch()}
              >
                查询
              </Button> */}
              </div>
              {canCreate && (
                <div className={styles["extract-list-utils-right"]}>
                  <Button
                    type="primary"
                    style={{ width: "110px", borderRadius: 4 }}
                    onClick={() => handleOpenExtract(null, "add")}
                  >
                    <PlusOutlined />
                    新增抽取
                  </Button>
                </div>
              )}
            </div>
            <div className={styles["extract-list-table-wrapper"]}>
              <Table
                className="custom-table"
                loading={extLoading}
                columns={extractColumns}
                dataSource={extData || []}
                scroll={{
                  y: "calc(100vh - 370px)",
                  scrollToFirstRowOnChange: true,
                }}
                rowKey="jobId"
                pagination={extPagination}
                onChange={onPageChange}
              />
            </div>
          </div>
        )}

        {/* 标签弹框 */}
        <TagModel
          ref={tagModelRef}
          canCreate={canCreate}
          fetKnowledgeTagList={fetKnowledgeTagList}
          fetchKnowledgeList={fetchKnowledgeList}
        ></TagModel>
        {/* 新增修改弹框 */}
        <AddOrEdit ref={addOrEditRef} searchEvent={searchEvent}></AddOrEdit>
        {/* 新增修改图谱知识库弹框 */}
        <AddOrEditGraph
          ref={addOrEditGraphRef}
          searchEvent={searchEvent}
        ></AddOrEditGraph>
        {/* 删除弹框  */}
        <DeleteModal
          visible={deleteModalShow}
          loading={deleteLoading}
          title={deleteTitle}
          content={deleteContent}
          onCancel={() => setDeleteModalShow(false)}
          onOk={delKnowlegeEvent}
        />
        {/* 知识库删除失败 */}
        <DeleteFailModal
          visible={delErrorShow}
          title="无法删除"
          content={delErrorContent}
          onCancel={() => setDelErrorShow(false)}
          onOk={() => setDelErrorShow(false)}
        />
        {/* 知识库编辑弹框 */}
        <Update ref={updateRef} searchEvent={searchEvent}></Update>

        {/* 新增编辑抽取任务弹框 */}
        <ExtractAddOrEdit ref={extAddOrEditRef} searchEvent={fetchData} />
        {/* 上传文档抽屉 */}
        <UploadDrawer ref={uploadDrawerRef} searchEvent={fetchData} />
        {/* 抽取文档列表 */}
        <DocumentListDrawer ref={documentListRef} searchEvent={fetchData} />

        {/* 算子配置抽屉 */}
        {/* <PanelContent ref={panelContentRef} /> */}
      </div>
    </>
  );
}
