"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./page.module.css";
import { Select, Input, Button, Table, ConfigProvider, Tooltip, Pagination, message } from "antd";
import { SearchOutlined, PlusOutlined } from "@ant-design/icons";
import AddDatasetDrawer from "./components/AddDatasetDrawer";
import FileDirectoryDrawer from "./components/FileDirectoryDrawer";
import DeleteModal from "../components/DeleteModal";
import {
  modelDatasetPage,
  modelDatasetDelete,
  modelDatasetUpdate,
  modelDownload,
} from "@/api/model";
import { ModelTypeMap } from "@/utils/constants";
import { checkPermission } from "@/utils/utils";
import { useStore } from "@/store/index";
import { getUuid } from "@/utils/utils";

const typeOptions = [
  { value: 0, label: "训练数据" },
  { value: 1, label: "微调数据" },
  { value: 2, label: "评测数据" },
];

const dataTypeMap = {
  0: { label: "训练数据", icon: "train" },
  1: { label: "微调数据", icon: "adjust" },
  2: { label: "评测数据", icon: "review" },
};

const modelTypeOptions = [
  { value: 1, label: "文本生成" },
  { value: 2, label: "多模态" },
  { value: 4, label: "视频生成" },
  { value: 5, label: "图片生成" },
  { value: 6, label: "向量模型" },
  { value: 7, label: "语音合成" },
  { value: 8, label: "语音识别" },
  { value: 9, label: "排序模型" },
];

export default function DataManagePage() {
  const [hoveredRowKey, setHoveredRowKey] = useState(null); // 鼠标 hover 行
  const [editingRowKey, setEditingRowKey] = useState(null); // 正在编辑行
  const [inputValue, setInputValue] = useState(""); // 临时存储编辑值
  const addDatasetDrawerRef = useRef(null); //新增数据集
  const fileDirectoryDrawerRef = useRef(null); //
  const deleteModalRef = useRef(null); //删除弹窗

  const [dataSource, setDataSource] = useState([]); //数据集列表
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState({
    current: 1,
    size: 10,
    name: "",
    type: null,
    classificationIdList: [],
  });
  const [total, setTotal] = useState(0);
  // const [disabledSelect, setDisabledSelect] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const messageUuid = useStore((state) => state.messageUuid);
  const socketData = useStore((state) => state.socketData);
  const { setMenuChangeId } = useStore((state) => state);
  const { showSecondSide } = useStore((state) => state); // 定义状态：是否为窄屏（宽度 < 1480）
  const [isNarrowScreen, setIsNarrowScreen] = useState(false);
  // 监听窗口宽度变化
  useEffect(() => {
    // 初始化判断
    const checkScreenWidth = () => {
      setIsNarrowScreen(window.innerWidth < 1420);
    };
    checkScreenWidth();

    // 监听窗口resize
    window.addEventListener("resize", checkScreenWidth);

    // 清除监听
    return () => window.removeEventListener("resize", checkScreenWidth);
  }, []);


  useEffect(() => {
    if (socketData.msgType === 303) {
      getModelDatasetList();
      // console.log("刷新了");
    }
  }, [messageUuid]);

  const columns = [
    {
      title: "数据集名称",
      dataIndex: "name",
      key: "name",
      width: "55%",
      ellipsis: true,
      render: (name, record) => {
        const isEditing = editingRowKey === record.id;
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              lineHeight: 1,
            }}
          >
            {isEditing ? (
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className={styles["edit-input"]}
                maxLength={50}
                onBlur={() => {
                  saveEditName(record);
                }}
                onPressEnter={() => {
                  saveEditName(record.id);
                }}
                autoFocus
              />
            ) : (
              <>
                <img
                  width={16}
                  src='/model/dataset.png'
                  onClick={() => {
                    fileDirectoryDrawerRef.current.open(record.id, name, record.path);
                  }}
                ></img>
                <span
                  className={styles["table-dataname"]}
                  onClick={() => {
                    fileDirectoryDrawerRef.current.open(record.id, name, record.path);
                  }}
                >
                  {name}
                </span>
                {hoveredRowKey === record.id && hasPermission && (
                  <img
                    width={16}
                    src='/model/data_edit.png'
                    style={{ cursor: "pointer", marginBottom: -2 }}
                    onClick={() => {
                      setEditingRowKey(record.id);
                      setInputValue(name);
                    }}
                  />
                )}
              </>
            )}
          </span>
        );
      },
    },
    {
      title: "数据集类型",
      dataIndex: "type",
      key: "type",
      ellipsis: true,
      width: 280,
      render: (type, record) => {
        return (
          <div className={styles["table-type-container"]}>
            <img
              className={styles["table-type-icon"]}
              src={`/model/datalist_${dataTypeMap[type].icon}.png`}
            ></img>
            <span>{`${dataTypeMap[type].label}${
              " - " + ModelTypeMap[record.classification]
            }`}</span>
          </div>
        );
      },
    },
    {
      title: "文件量",
      dataIndex: "analysisDesc",
      key: "analysisDesc",
      ellipsis: true,
      width: 200,
    },
    {
      title: "创建时间",
      key: "createTime",
      dataIndex: "createTime",
      width: 280,
      defaultSortOrder: "descend",
      sorter: (a, b) => new Date(a.createTime) - new Date(b.createTime),
    },
    {
      title: "操作",
      key: "option",
      dataIndex: "option",
      width: 90,
      align: "center",
      render: (_, record) => (
        <div className={styles["option-wrapper"]}>
          <Tooltip
            placement='top'
            title='下载'
            color='rgba(54, 64, 82, 0.90)'
            getPopupContainer={
              (triggerNode) => triggerNode.parentNode // 让 Tooltip 的弹出层渲染在当前单元格内，解决鼠标移入到提示词当前行变黑色
            }
          >
            <div
              className={`${styles["option-btn"]} ${styles["copy"]}`}
              onClick={() => downloadHandle(record)}
            ></div>
          </Tooltip>
          <Tooltip
            placement='top'
            title='删除'
            color='rgba(54, 64, 82, 0.90)'
            getPopupContainer={(triggerNode) => triggerNode.parentNode}
          >
            <div
              className={`${styles["option-btn"]} ${styles["delete"]}`}
              onClick={() => {
                if (!hasPermission) return message.warning("暂无删除权限");
                deleteHandle(record.id);
              }}
            ></div>
          </Tooltip>
        </div>
      ),
    },
  ];

  //下载数据集
  const downloadHandle = async (file) => {
    console.log(file, "file");
    await modelDownload(
      {
        zipPath: file.path.replace("/file", "/data1"),
      },
      file.name
    );
  };

  //删除数据集弹窗
  const deleteHandle = (id) => {
    deleteModalRef.current.open({
      title: "要删除数据集吗？",
      content: "删除后，将不可恢复!",
      keys: id,
      action: async (keys) => {
        await modelDatasetDelete(keys);
      },
      onSuccess: () => {
        getModelDatasetList();
      },
    });
  };
  //编辑数据集名称
  const saveEditName = async (record) => {
    setEditingRowKey(null);
    if (record.name === inputValue) return;
    const res = await modelDatasetUpdate({ id: record.id, name: inputValue });
    if (res.code === 1000) {
      message.success("编辑成功");
    }
    getModelDatasetList();
  };
  //切换模型---(后期改成多选，选微调和测评时 多选应置灰)
  const changeType = (value) => {
    console.log(value);

    // setDisabledSelect(value === 2 ? true : false);
    setSearchParams((prevParams) => ({
      ...prevParams,
      current: 1,
      type: value,
    }));
  };

  //切换模型类型
  const changeModelType = (value) => {
    setSearchParams((prevParams) => ({
      ...prevParams,
      current: 1,
      classificationIdList: value,
    }));
  };
  //搜索名称
  const searchNameHandle = (e) => {
    setSearchParams((prevParams) => ({
      ...prevParams,
      name: e.target.value,
      current: 1,
    }));
  };
  //分页
  const changePages = (page, pageSize) => {
    setSearchParams((prevParams) => ({
      ...prevParams,
      current: page,
      size: pageSize,
    }));
  };

  //获取列表
  const getModelDatasetList = async () => {
    setLoading(true);
    const res = await modelDatasetPage(searchParams);
    setDataSource(res.data.records);

    setTotal(res.data.total);

    setMenuChangeId(getUuid());
    setLoading(false);
  };

  useEffect(() => {
    getModelDatasetList();
    setHasPermission(checkPermission("/main/model/dataManage/operation"));
  }, [searchParams]);

  return (
    <div className={`${styles["data-manage-page"]} ${!showSecondSide ? styles["no-second-sidebar"] : ''}`}>
      <div className={styles["search-container"]}>
        <div className={styles["page-title"]}>数据集</div>
        <div className={styles["search-right"]}>
          <Select
            className='model_type_select'
            placeholder='选择数据集类型'
            style={{ width: 200, height: 36, borderRadius: 8, marginRight: 8 }}
            onChange={changeType}
            options={typeOptions}
            value={searchParams.type}
            allowClear={true}
          />
          <Select
            className={`${"model_type_select"} ${styles["model_type_select_multiple"]}`}
            placeholder='全部'
            style={{ width: 200, height: 36, borderRadius: 8, marginRight: 8 }}
            onChange={changeModelType}
            mode='multiple'
            maxTagCount='responsive'
            maxTagTextLength={10}
            options={modelTypeOptions}
            // disabled={disabledSelect}
            value={searchParams.classificationIdList}
          />
          <Input
            value={searchParams.name}
            onChange={searchNameHandle}
            onPressEnter={searchNameHandle}
            onBlur={searchNameHandle}
            placeholder='搜索数据集名称,不超过50个字'
            style={{
              width: isNarrowScreen ? 240 : 360,
              height: 36,
              backgroundColor: "rgba(255,255,255,0.6)",
              border: "1px solid #DDDFE4",
            }}
            suffix={<SearchOutlined style={{ color: "rgba(0,0,0,.45)" }} />}
            maxLength={50}
          ></Input>
          <div className={styles["right-btn"]}>
            <Button
              type='primary'
              icon={<PlusOutlined />}
              style={{ height: 36, borderRadius: 12, width: 162 }}
              disabled={!hasPermission}
              onClick={() => addDatasetDrawerRef?.current.open()}
            >
              新增数据集
            </Button>
          </div>
        </div>
      </div>
      <div className={styles["data-manage-content"]}>
        <ConfigProvider
          theme={{
            components: {
              Table: {
                headerColor: "#666E82",
                headerSplitColor: "opacity",
                cellFontSize: 14,
                colorText: "#364052",
                rowHoverBg: "transparent",
                borderColor: " #DBE2EA",
              },
            },
            token: {
              colorBgContainer: "transparent",
            },
          }}
        >
          <div className={styles["data-manage-table-wrapper"]}>
            <Table
              className={styles["data-manage-table"]}
              dataSource={dataSource}
              columns={columns}
              pagination={false}
              size='small'
              loading={loading}
              rowKey={(record) => record.id}
              onRow={(record) => ({
                onMouseEnter: () => setHoveredRowKey(record.id),
                onMouseLeave: () => setHoveredRowKey(null),
              })}
              locale={{
                emptyText: (
                  <div className={styles["empty-state"]}>
                    <img
                      src='/model/dataset_empty.png'
                      alt='暂无数据集'
                      style={{ width: 220, height: 220, margin: "80px 0 20px" }}
                    />
                    <div style={{ color: "#666E82", fontSize: 16 }}>暂无数据集</div>
                  </div>
                ),
              }}
            />
          </div>
        </ConfigProvider>
        <div className={styles["footer-container"]}>
          <span>共{total}条记录</span>
          <Pagination
            className={styles["custom-pagination"]}
            showQuickJumper
            showSizeChanger
            total={total}
            onChange={changePages}
            current={searchParams.current}
            pageSize={searchParams.size}
          />
        </div>
      </div>
      <AddDatasetDrawer
        ref={addDatasetDrawerRef}
        onDrawerClose={getModelDatasetList}
      ></AddDatasetDrawer>
      <FileDirectoryDrawer ref={fileDirectoryDrawerRef}></FileDirectoryDrawer>
      <DeleteModal ref={deleteModalRef}></DeleteModal>
    </div>
  );
}
