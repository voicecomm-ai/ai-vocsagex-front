"use client";
import {
  forwardRef,
  useState,
  useImperativeHandle,
  useRef,
  useEffect,
} from "react";
import {
  Drawer,
  ConfigProvider,
  Input,
  Pagination,
  Table,
  Tooltip,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import styles from "../page.module.css";
import { modelDatasetFilePage, modelDownload } from "@/api/model";

const fileMap = {
  png: "png",
  wav: "voice",
  xls: "excel",
  json: "json",
  pdf: "pdf",
};

const FileDirectoryDrawer = forwardRef((props, ref) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(""); //文件名
  const [loading, setLoading] = useState(false); //表格加载
  const [dataSource, setDataSource] = useState([]); //文件列表
  const [zipPath, setZipPath] = useState(""); //存储zipPath用于请求下载
  const [searchParams, setSearchParams] = useState({
    datasetId: null,
    name: "",
    current: 1,
    size: 10,
  });
  const [total, setTotal] = useState(0);

  useImperativeHandle(ref, () => ({
    open: (id, name, path) => {
      setOpen(true);
      setZipPath(path);
      setTitle(name);
      setSearchParams({
        datasetId: id,
        name: "",
        current: 1,
        size: 10,
      });
    },
    onClose: () => setOpen(false),
  }));

  useEffect(() => {
    getFileList();
  }, [searchParams]);

  //获取文件列表
  const getFileList = async () => {
    if (!searchParams.datasetId) return;
    setLoading(true);
    const res = await modelDatasetFilePage(searchParams);
    setDataSource(res.data.records);
    setTotal(res.data.total);
    setLoading(false);
  };

  const handleClose = () => {
    setOpen(false);
  };
  const changePage = (page, pageSize) => {
    setSearchParams((prevParams) => ({
      ...prevParams,
      current: page,
      size: pageSize,
    }));
  };

  //根据文件后缀处理图标
  const processFileIcon = (name) => {
    if (!name) return "other";
    const lastDotIndex = name.lastIndexOf(".");
    const suffix = name.substring(lastDotIndex + 1).toLowerCase();
    const hasIcon = ["xls", "wav", "pdf", "png", "json"]; //没有的图标都用other
    if (!hasIcon.includes(suffix)) return "other";
    return fileMap[suffix];
  };

  //下载文件
  const downloadHandle = async (file) => {
    await modelDownload(
      {
        zipPath: zipPath.replace("/file", "/data1"),
        entryPath: file.path,
      },
      file.name
    );
  };

  const columns = [
    {
      title: "文件名称",
      dataIndex: "name",
      key: "name",
      ellipsis: false, // 不用 antd 自带的单行省略，自己控制两行
      render: (name) => (
        // <Tooltip title={name} color="rgba(54, 64, 82, 0.90)">
          <div className={styles["table-type-container"]}>
            <img
              src={`/model/file_${processFileIcon(name)}.png`}
              alt=""
              width={16}
              style={{ marginRight: 6, flexShrink: 0 }}
            />
            <span className={styles["two-line-ellipsis"]} title={name}>{name}</span>
          </div>
        // </Tooltip>
      ),
    },
    {
      title: "大小",
      dataIndex: "size",
      key: "size",
      width: 80,
      align: "center",
      render: (size) => (
        <div style={{ color: "#666E82", fontSize: "12px" }}>{size}</div>
      ),
    },
    {
      title: "操作",
      key: "operation",
      dataIndex: "operation",
      width: 40,
      align: "right",
      render: (_, record) => (
        <img
          src="/model/data_upload.png"
          alt="下载"
          width={16}
          style={{ cursor: "pointer" }}
          onClick={() => downloadHandle(record)}
        />
      ),
    },
  ];
  const MAX_ROWS = 15;
  const rowHeight = 48;
  // 动态计算 scroll.y 的值
  const scrollY =
    dataSource.length > MAX_ROWS ? MAX_ROWS * rowHeight : undefined;
  return (
    <Drawer
      open={open}
      onClose={() => setOpen(false)}
      closable={false}
      width={720}
      styles={{
        content: {
          borderRadius: "24px 0px 0px 24px",
          padding: "24px 32px ",
          display: "flex",
          flexDirection: "column",
          backgroundImage: 'url("/model/file_direct_bg.png")',
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
          padding: "22px 0",
        },
      }}
      footer={null}
    >
      <div className={styles["drawer-wrapper"]}>
        <div className={styles["drawer-header"]}>
          <span className={styles["drawer-title"]} style={{ fontSize: "20px" }}>
            <img
              width={24}
              src="/model/dataset.png"
              className={styles["directory-title-icon"]}
            ></img>
            <Tooltip title={title} color="rgba(54, 64, 82, 0.90)">
              <span className={styles["drawer-title-text"]}>{title}</span>
            </Tooltip>
          </span>
          <img
            src="/model/close_icon.svg"
            onClick={handleClose}
            style={{ cursor: "pointer" }}
          />
        </div>
        <div className={styles["file-drawer-content"]}>
          <Input
            style={{
              height: 36,
              backgroundColor: "rgba(255,255,255,0.6)",
              border: "1px solid #DDDFE4",
            }}
            value={searchParams.name}
            onChange={(e) => {
              setSearchParams((prevParams) => ({
                ...prevParams,
                name: e.target.value,
              }));
            }}
            placeholder="搜索文件名称，不超过50个字"
            suffix={<SearchOutlined style={{ color: "rgba(0,0,0,.45)" }} />}
          ></Input>
          <div className={styles["table-wrapper"]}>
            <ConfigProvider
              theme={{
                components: {
                  Table: {
                    headerColor: "#666E82",
                    headerSplitColor: "opacity",
                    cellFontSize: 14,
                    colorText: "#364052",
                rowHoverBg: "transparent",
                  },
                },
                token: {
                  colorBgContainer: "transparent",
                },
              }}
            >
              <Table
                className={styles["directory-table"]}
                dataSource={dataSource}
                columns={columns}
                pagination={false}
                size="small"
                loading={loading}
                rowKey={(record) => record.id}
                locale={{
                  emptyText: (
                    <div className={styles["empty-state"]}>
                      <img
                        src="/model/nodata.png"
                        alt="暂无数据集"
                        style={{
                          width: 220,
                          height: 220,
                          margin: "80px 0 20px",
                        }}
                      />
                      <div style={{ color: "#666E82", fontSize: 16 }}>
                        暂无数据
                      </div>
                    </div>
                  ),
                }}
              />
            </ConfigProvider>
          </div>
        </div>
        <div className={styles["footer-container"]}>
          <span>共{total}条记录</span>
          <Pagination
            className={styles["directory-pagination"]}
            size="small"
            showQuickJumper
            showSizeChanger
            total={total}
            current={searchParams.current}
            pageSize={searchParams.size}
            onChange={changePage}
            pageSizeOptions={["10", "15", "20", "50"]}
          />
        </div>
      </div>
    </Drawer>
  );
});
export default FileDirectoryDrawer;
