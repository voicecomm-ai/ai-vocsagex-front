"use client";

import React, {
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
  useMemo,
} from "react";
import styles from "../structurePages/page.module.css";
import {
  Col,
  Row,
  Input,
  Empty,
  Button,
  Checkbox,
  Table,
  message,
  Spin,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  TagOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { useStore } from "@/store/index";
import AddEditEntity from "../components/AddEditEntity";
import ImportModel from "../components/ImportModel";
import {
  getAllTagsApi,
  getEntitiesApi,
  checkDataUpApi,
  deleteEntitiesApi,
  deleteAllEntiesApi,
  entityTemplateApi,
} from "@/api/graph";
import DeleteModal from "../components/DeleteModal"; //删除弹框
import { checkPermission } from "@/utils/utils";
import { downloadFileRequest } from "@/utils/download";
import dayjs from "dayjs";
import CustomTableStyle from "@/utils/graph/scrollStyle";

const EntityManage = forwardRef((props, entityManageRef) => {
  const [btnPermission, setBtnPermission] = useState(false);
  const { isCommonSpace, currentNamespaceId, currentNamespaceObj } = useStore(
    (state) => state
  );
  const [isShow, setIsShow] = useState(false); // 权限按钮展示
  const [tagName, setTagName] = useState(""); // 搜索框输入内容
  const [subLoading, setSubLoading] = useState(false); // 关系列表加载状态
  const [originSubData, setOriginSubData] = useState([]); // 原始本体列表数据
  const [substanceList, setSubstanceList] = useState([]);
  const [isFinish, setIsFinish] = useState(false);

  // 本体列表
  const [currentSub, setCurrentSub] = useState(null); // 当前选中本体
  const [entityName, setEntityName] = useState(""); // 搜索框输入实体名称
  const [currentRow, setCurrentRow] = useState(null); // 当前行数据
  const [editLoading, setEditLoading] = useState(false); // 新增编辑弹框加载状态
  const addEditEntityRef = useRef(null); // 新增编辑实体弹框
  const importModelRef = useRef(null); // 导入模型弹框
  const intervalRef = useRef(null); // 定时任务控制
  const intervalCountRef = useRef(0);

  // table
  const [tableLoading, setTableLoading] = useState(false);
  const [checkDisabled, setCheckDisabled] = useState(false);
  const [fullRemove, setFullRemove] = useState(false); // 全部删除
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [alreadySelect, setAlreadySelect] = useState("全选0条");
  const [checkIndeterminate, setCheckIndeterminate] = useState(false); // 半选状态
  const [deleting, setDeleting] = useState(false); // 删除状态
  const [dataSource, setDataSource] = useState([]);
  const [selectedTemp, setSelectedTemp] = useState(new Map());

  // 删除
  const [deleteModalShow, setDeleteModalShow] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteTitle, setDeleteTitle] = useState("");
  const [deleteContent, setDeleteContent] = useState("");
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [delType, setDelType] = useState(null);

  // 查询条件
  const [where, setWhere] = useState({
    entityName: "",
  });
  // 分页配置
  const [pageConfig, setPageConfig] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    showTotal: (total) => `共 ${total} 项数据`,
    defaultPageSize: 10,
    showQuickJumper: true,
    showSizeChanger: true,
    pageSizeOptions: ["10", "20", "30", "40", "50"],
  });
  const pageDisabled = useMemo(() => !currentSub, [currentSub]);

  const extraOptions = [
    { label: "文本", value: "text", key: "text" },
    { label: "图片", value: "image", key: "image" },
    { label: "音频", value: "audio", key: "audio" },
    { label: "视频", value: "video", key: "video" },
    { label: "其他文件", value: "otherFile", key: "otherFile" },
  ];

  const columns = [
    {
      title: "序号",
      dataIndex: "no",
      key: "no",
      align: "center",
      fixed: "left",
      width: 100,
      render: (text, record, index) => {
        return (pageConfig.current - 1) * pageConfig.pageSize + 1 + index;
      },
    },
    {
      title: "实体名称",
      dataIndex: "entityName",
      key: "entityName",
      ellipsis: true,
      align: "center",
      render: (text, record) => {
        return record.entityName ? record.entityName : "--";
      },
    },
    {
      title: "所属本体",
      dataIndex: "tagName",
      key: "tagName",
      ellipsis: true,
      align: "center",
    },
    {
      title: "VID",
      dataIndex: "entityId",
      key: "entityId",
      align: "center",
      render: (text, record) => {
        return record.entityId ? record.entityId.toString().slice(-10) : "--";
      },
    },
    {
      title: "操作",
      dataIndex: "action",
      key: "action",
      align: "center",
      width: 120,
      render: (text, record) => {
        return (
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              type="link"
              onClick={() => openAddEditEntity("entity", "edit", record)}
              disabled={!btnPermission}
              style={{ padding: 0 }}
            >
              编辑
            </Button>
            <Button
              type="link"
              onClick={() => handleSelectRemove(record)}
              disabled={deleting || !btnPermission}
              style={{ padding: 0 }}
            >
              删除
            </Button>
          </div>
        );
      },
    },
  ];

  const formatText = (text) => {
    return [null, "", "null"].includes(text) ? "--" : text;
  };

  useImperativeHandle(entityManageRef, () => ({
    getSubstanceList,
  }));

  useEffect(() => {
    setBtnPermission(checkPermission("/main/knowledge/operation"));
    setIsShow(getIsShow());
    return () => {
      setCurrentSub(null);
    };
  }, []);

  const getIsShow = () => {
    if (!isCommonSpace) {
      return false;
    }
    return !currentNamespaceObj.graphType;
  };

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

  // 防抖搜索词
  const debouncedTagName = useDebounce(tagName, 500);
  const debouncedEntityName = useDebounce(where.entityName, 500);

  // 获取本体列表
  const getSubstanceList = async () => {
    setSubLoading(true);
    const getData = {
      spaceId: currentNamespaceId,
      tagName: tagName,
    };
    await getAllTagsApi(getData)
      .then((res) => {
        const { data } = res;
        const tagInfosList = data.tagInfosList || [];

        setOriginSubData(tagInfosList);
        setSubstanceList(tagInfosList);
        setCheckDisabled(tagInfosList.length === 0);

        if (tagInfosList.length) {
          const targetSub = currentSub
            ? tagInfosList.find((item) => item.tagId === currentSub.tagId) ||
              tagInfosList[0]
            : tagInfosList[0];
          setCurrentSub(targetSub); // 确保currentSub有值
        }
      })
      .catch((err) => console.log(err))
      .finally(() => {
        setSubLoading(false);
        setIsFinish(false);
      });
  };

  // 获取本体列表
  const getSubstanceList1 = async () => {
    const getData = {
      spaceId: currentNamespaceId,
      tagName: tagName,
    };
    setIsFinish(false);
    await getAllTagsApi(getData)
      .then((res) => {
        const { data } = res;
        const tagInfosList = data.tagInfosList || [];

        setSubstanceList((prev) => {
          if (!prev.length) return tagInfosList;
          // 只替换tagNumber，不改变数组结构和选中状态
          return prev.map((oldItem) => {
            const newItem = tagInfosList.find(
              (newI) => newI.tagId === oldItem.tagId
            );
            return newItem
              ? { ...oldItem, tagNumber: newItem.tagNumber }
              : oldItem;
          });
        });

        // 接口返回identity，停止定时器（更新完成）
        if (data?.identity) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setIsFinish(true);
        }
      })
      .catch((err) => console.log(err));
  };

  // 启动定时器函数
  const startInterval = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalCountRef.current = 0;

    intervalRef.current = setInterval(() => {
      if (isFinish) return;
      // 定时器最多跑10次，避免无限循环
      if (intervalCountRef.current >= 50) {
        pauseInterval();
        setIsFinish(true);
        return;
      }
      getSubstanceList1(); // 仅更新tagNumber
      intervalCountRef.current += 1;
    }, 1000);
  };

  // 暂停定时器函数
  const pauseInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    intervalCountRef.current = 0;
  };

  // 重启定时器函数
  const restartInterval = () => {
    setIsFinish(false);
    intervalCountRef.current = 0;
    startInterval();
  };

  useEffect(() => {
    if (!isFinish) {
      startInterval();
    }
  }, [isFinish]);

  useEffect(() => {
    if (currentNamespaceId) {
      setIsFinish(false); // 重置定时器状态
      pauseInterval(); // 暂停旧定时器
      getSubstanceList();
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [debouncedTagName, currentNamespaceId]);

  // 选择当前本体
  const handleSelectSub = (item) => {
    setCurrentSub(item);
    restSelected();
  };

  // 根据本体列表获取实体列表
  const handleFetchEntityList = (config = {}) => {
    setTableLoading(true);
    const getData = {
      ...where,
      current: pageConfig.current,
      pageSize: pageConfig.pageSize,
      spaceId: currentNamespaceId,
      tagId: currentSub.tagId,
      tagName: currentSub.tagName,
      ...config,
    };
    getEntitiesApi(getData)
      .then((res) => {
        const total = res.data.total || 0;
        const current = res.data.current + 1;
        setPageConfig((prev) => ({ ...prev, current, total }));
        setDataSource(res.data.records);
        setCheckDisabled(total === 0);
        // if (fullRemove) {
        //   setAlreadySelect(`全选${total}条`);
        // } else {
        //   console.log(selectedRowKeys.length, "selectedRowKeys.length");

        //   const selectedCount = selectedRowKeys.length;
        //   setAlreadySelect(
        //     selectedCount === 0 ? "全选0条" : `已选${selectedCount}条`
        //   );
        // }
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        setTableLoading(false);
      });
  };

  useEffect(() => {
    if (fullRemove && dataSource.length > 0) {
      manualFullSelect();
    }
  }, [dataSource, fullRemove]);

  // 实体列表实时查询
  useEffect(() => {
    if (currentSub) {
      setPageConfig((prev) => ({ ...prev, current: 1 }));
      handleFetchEntityList({ current: 0 });
      if (!isFinish) startInterval();
    }
  }, [currentSub]);

  useEffect(() => {
    if (currentSub) {
      setPageConfig((prev) => ({ ...prev, current: 1 }));
      handleFetchEntityList({ current: 0 });
    }
  }, [debouncedEntityName]);

  // 新增/编辑实体
  const openAddEditEntity = async (mainType, flag, record) => {
    if (flag === "add") {
      // 检查数据空间是否满足
      const b = await checkDataUpApi({ spaceId: currentNamespaceId });
      if (!b) {
        message.warning("数据已达到上限");
        return;
      }
      setCurrentRow(null);
      addEditEntityRef.current.initData(
        flag,
        originSubData,
        currentNamespaceId,
        currentSub
      );
    } else {
      setCurrentRow(record);
      addEditEntityRef.current.initData(
        flag,
        originSubData,
        currentNamespaceId,
        currentSub,
        record
      );
    }
  };

  // 删除
  const handleSelectRemove = (record) => {
    if (record) {
      setDeleteRecord(record);
      setDelType(1);
    } else {
      setDelType(2);
    }
    setDeleteModalShow(true);
    setDeleteTitle("是否确认删除？");
    setDeleteContent("删除实体，实体对应关系和属性将一并删除，建议谨慎操作");
  };

  // 删除确认
  const delConfirmEvent = () => {
    setDeleteLoading(true);
    if (delType === 1) {
      confirmDeleteSubProperty();
    } else {
      if (fullRemove) {
        deleteAllEntiesApi({
          // ...currentSub,
          spaceId: currentNamespaceId,
          tagId: currentSub.tagId,
          tagName: currentSub.tagName,
          entityName: where.entityName,
        })
          .then(() => {
            restSelected();
            message.success("删除成功");
            getSubstanceList();
          })
          .finally(() => {
            restSelected();
          });
      } else {
        const selected = selectedTemp.values();
        const form = Array.from(selected);
        confirmDeleteSubProperty(form);
      }
    }
  };

  const confirmDeleteSubProperty = (data) => {
    deleteEntitiesApi({
      // ...currentSub,
      spaceId: currentNamespaceId,
      entityIds: data
        ? data.map((item) => item.entityId)
        : [deleteRecord.entityId],
    })
      .then(() => {
        restSelected();
        message.success("删除成功");
        getSubstanceList();
      })
      .finally(() => {
        restSelected();
      });
  };

  const restSelected = () => {
    setWhere({
      entityName: "",
    });
    setDeleteLoading(false);
    setDeleteModalShow(false);
    setCheckDisabled(false);
    setFullRemove(false);
    setCheckIndeterminate(false);
    setAlreadySelect("全选0条");
    setSelectedRowKeys([]);
    setDeleteContent("");
    setDeleteRecord(null);
    setDelType(null);
    setSelectedTemp(new Map());
    // setDataSource([]);
    setPageConfig({
      current: 1,
      pageSize: 10,
      total: 0,
      showTotal: (total) => `共 ${total} 项数据`,
      defaultPageSize: 10,
      showQuickJumper: true,
      showSizeChanger: true,
      pageSizeOptions: ["10", "20", "30", "40", "50"],
    });
  };

  useEffect(() => {
    const total = pageConfig.total;
    const selectedCount = selectedRowKeys.length;
    const currentPageTotal = dataSource.length;

    setCheckIndeterminate(
      selectedCount > 0 && selectedCount < currentPageTotal
    );

    if (total === 0 || selectedCount === 0) {
      setAlreadySelect("全选0条");
    } else if (fullRemove || selectedCount === total) {
      setFullRemove(true);
      setAlreadySelect(`全选${total}条`);
    } else {
      setCheckIndeterminate(true);
      setAlreadySelect(`已选${selectedCount}条`);
    }
  }, [selectedRowKeys.length, fullRemove, pageConfig.total, dataSource.length]);

  // 全选
  const fullChange = (e) => {
    const isCheck = e.target.checked; // 当前复选框的选中状态（true=要全选，false=要取消全选）
    const total = pageConfig.total;
    const currentPageIds = dataSource.map((item) => item.entityId); // 当前页所有ID

    if (isCheck) {
      setFullRemove(true);
      setCheckIndeterminate(false);

      const newSelectedIds = [
        ...selectedRowKeys,
        ...currentPageIds.filter((id) => !selectedRowKeys.includes(id)),
      ];
      setSelectedRowKeys(newSelectedIds);

      setSelectedTemp((prev) => {
        const newMap = new Map(prev);
        dataSource.forEach((item) => {
          if (!newMap.has(item.entityId)) {
            newMap.set(item.entityId, {
              entityId: item.entityId,
              entityName: item.entityName,
            });
          }
        });
        return newMap;
      });

      setAlreadySelect(`全选${total}条`);
    } else {
      // 👉 取消全选逻辑：清空所有选中项
      setFullRemove(false);
      setCheckIndeterminate(false);
      setSelectedRowKeys([]); // 清空选中ID
      setSelectedTemp(new Map()); // 清空选中数据（若有）
      setAlreadySelect("全选0条");
    }
  };

  // 手动全选当页数据
  const manualFullSelect = () => {
    // 求取差集
    if (fullRemove && dataSource.length > 0) {
      const unselectedIds = dataSource.filter(
        (item) => !selectedRowKeys.includes(item.entityId)
      );
      if (unselectedIds.length === 0) return;

      const newSelectedIds = [
        ...selectedRowKeys,
        ...unselectedIds.map((item) => item.entityId),
      ];
      setSelectedRowKeys(newSelectedIds);

      setSelectedTemp((prev) => {
        const newMap = new Map(prev);
        unselectedIds.forEach((item) => {
          newMap.set(item.entityId, {
            entityId: item.entityId,
            entityName: item.entityName,
          });
        });
        return newMap;
      });

      setAlreadySelect(`全选${pageConfig.total}条`);
    }
  };

  const onSelectChange = (selectedRowKey) => {
    console.log(selectedRowKey, "selectedRowKey");
  };

  // 单选
  const onSelect = (record, selected, selectedRows) => {
    const { entityId } = record;
    if (!selected) {
      setFullRemove(false);
    }
    if (selected) {
      setSelectedRowKeys((prev) =>
        prev.includes(entityId) ? prev : [...prev, entityId]
      );
      setSelectedTemp((prev) => {
        const newMap = new Map(prev);
        newMap.set(entityId, {
          entityId,
          entityName: record.entityName,
        });
        return newMap;
      });
    } else {
      setSelectedRowKeys((prev) => prev.filter((id) => id !== entityId));
      setSelectedTemp((prev) => {
        const newMap = new Map(prev);
        newMap.delete(entityId);
        return newMap;
      });
    }
  };

  // 当前页全选
  const onSelectAll = (selected, selectionRows, changeRows) => {
    setFullRemove(false);
    if (selected) {
      const newRowIds = changeRows.map((item) => item.entityId);
      const uniqueIds = newRowIds.filter((id) => !selectedRowKeys.includes(id));
      setSelectedRowKeys((prev) => [...prev, ...uniqueIds]);
      setSelectedTemp((prevTemp) => {
        const newMap = new Map(prevTemp);
        changeRows.forEach((item) => {
          if (!newMap.has(item.entityId)) {
            newMap.set(item.entityId, {
              entityId: item.entityId,
              entityName: item.entityName,
            });
          }
        });
        return newMap;
      });
    } else {
      const changeRowIds = changeRows.map((item) => item.entityId);
      const delIndices = [];
      selectedRowKeys.forEach((id, index) => {
        if (changeRowIds.includes(id)) {
          delIndices.push(index);
        }
      });

      const updatedRowKeys = selectedRowKeys.filter(
        (_, index) => !delIndices.includes(index)
      );
      setSelectedRowKeys(updatedRowKeys);

      setSelectedTemp((prevTemp) => {
        const newMap = new Map(prevTemp);
        changeRowIds.forEach((id) => newMap.delete(id));
        return newMap;
      });
    }
  };

  // 表格分页切换
  const handleTableChange = (pagination, filters, sorter) => {
    setPageConfig((prev) => ({
      ...prev,
      current: pagination.current,
      pageSize: pagination.pageSize,
    }));
    handleFetchEntityList({
      current: pagination.current - 1,
      pageSize: pagination.pageSize,
    });
  };

  // 导出
  const handleExport = async () => {
    if (fullRemove) {
      const params = {
        spaceId: currentNamespaceId,
        tagEdgeId: currentSub.tagId,
        tagEdgeName: currentSub.tagName,
        type: 0, //  0 实体 1 关系
        entityName: where.entityName,
      };

      try {
        await downloadFileRequest(
          "/voicesagex-console/knowledge-web/excelManage/excelData",
          params,
          `实体数据—${dayjs(new Date()).format("YYYYMMDDHHmmss")}.xlsx`
        );
      } catch (error) {
        console.error("导出失败:", error);
      }
    } else {
      let params = {
        spaceId: currentNamespaceId,
        entityRelationExportList: [],
        tagEdgeName: currentSub.tagName,
        type: 0, //  0 实体 1 关系
      };
      params.entityRelationExportList = selectedRowKeys.map((v) => {
        return Object.assign({}, { entityId: v });
      });
      try {
        await downloadFileRequest(
          "/voicesagex-console/knowledge-web/excelManage/excelDataPart",
          {
            ...params,
          },
          `实体数据—${dayjs(new Date()).format("YYYYMMDDHHmmss")}.xlsx`
        );
      } catch (error) {
        console.error("导出失败:", error);
      }
    }
  };

  // 下载模板
  const downloadTemplateEvent = async (tagIds) => {
    let params = {
      spaceId: currentNamespaceId,
      templateList: [],
    };
    if (tagIds && tagIds.length > 0) {
      let arr = originSubData.filter((item) => tagIds.includes(item.tagId));
      params.templateList = arr.map((item) => {
        return {
          tagId: item.tagId,
          tagName: item.tagName,
        };
      });
    }
    await downloadFileRequest(
      "/voicesagex-console/knowledge-web/excelManage/entityTemplate",
      {
        ...params,
      },
      "实体批量导入模板.xlsx"
    );
  };

  // 导入
  const openImportModel = async () => {
    // 检查数据空间是否满足
    const b = await checkDataUpApi({ spaceId: currentNamespaceId });
    if (!b) {
      message.warning("数据已达到上限");
      return;
    }
    importModelRef.current.showModal("entity", originSubData);
  };

  return (
    <>
      <CustomTableStyle />
      <div className="substance-container" style={{ height: "100%" }}>
        <Row style={{ height: "100%" }}>
          <Col span={4} className={styles["substance-aside"]}>
            <div className={styles["title-wrapper"]}>
              <span className={styles["main-title"]}>本体列表</span>
            </div>
            <div className={styles["search-wrapper"]}>
              <Input
                style={{ borderRadius: "6px" }}
                placeholder="输入关键字筛选"
                maxLength={50}
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                onPressEnter={() => getSubstanceList()}
                suffix={
                  <SearchOutlined
                    style={{ cursor: "pointer" }}
                    onClick={() => getSubstanceList()}
                  />
                }
              />
            </div>
            {substanceList.length > 0 ? (
              <Spin className={styles["list-wrapper"]} spinning={subLoading}>
                <ul className={styles["sub-list"]}>
                  {substanceList.map((item) => (
                    <li
                      key={item.tagId}
                      className={`${styles["sub-item"]} ${
                        item.tagId === currentSub?.tagId
                          ? styles["list-active"]
                          : ""
                      }`}
                      onClick={() => {
                        if (item.tagId !== currentSub?.tagId) {
                          handleSelectSub(item);
                        }
                      }}
                    >
                      <TagOutlined className={styles["sub-icon"]} />
                      <span className={styles["sub-text"]} title={item.tagName}>
                        {item.tagName}
                      </span>
                      <span>({isFinish ? item.tagNumber : "-"})</span>
                    </li>
                  ))}
                </ul>
              </Spin>
            ) : (
              <Empty />
            )}
          </Col>
          <Col span={20} className={styles["substance-main"]}>
            <div className={styles["main-title"]}>
              <span style={{ margin: 0 }}>实体列表</span>
            </div>
            <div className={styles["main-action"]}>
              <div className={styles["action-search"]}>
                <Input
                  style={{ borderRadius: "6px" }}
                  className={styles["search"]}
                  placeholder="输入关键字筛选"
                  maxLength={50}
                  value={where.entityName}
                  onChange={(e) =>
                    setWhere({ ...where, entityName: e.target.value })
                  }
                  onPressEnter={() => handleFetchEntityList({ current: 0 })}
                  suffix={
                    <SearchOutlined
                      style={{ cursor: "pointer" }}
                      onClick={() => handleFetchEntityList({ current: 0 })}
                    />
                  }
                />
              </div>
              {isShow && (
                <div className={styles["action-button"]}>
                  <Button
                    type="primary"
                    style={{ marginLeft: "10px" }}
                    disabled={!currentSub || !btnPermission}
                    onClick={() => openAddEditEntity("entity", "add")}
                  >
                    <PlusOutlined />
                    新增实体
                  </Button>
                  <Button
                    type="primary"
                    style={{ marginLeft: "10px" }}
                    ghost
                    disabled={!currentSub || !btnPermission}
                    onClick={() => openImportModel()}
                  >
                    <DownloadOutlined />
                    批量导入
                  </Button>
                </div>
              )}
            </div>
            {isShow && (
              <div className={styles["main-select"]}>
                <div className={styles["selected"]}>
                  <Checkbox
                    checked={fullRemove}
                    disabled={checkDisabled}
                    indeterminate={checkIndeterminate}
                    onChange={fullChange}
                  >
                    {alreadySelect}
                  </Checkbox>
                  <Button
                    disabled={!selectedRowKeys.length || !btnPermission}
                    size="small"
                    style={
                      selectedRowKeys.length && btnPermission
                        ? {
                            border: "1px solid #91d4caff",
                            color: "#91d4caff",
                          }
                        : {}
                    }
                    className={styles["remove-all_button"]}
                    onClick={() => handleExport()}
                  >
                    导出
                  </Button>
                  <Button
                    disabled={!selectedRowKeys.length || !btnPermission}
                    size="small"
                    className={styles["remove-all_button"]}
                    onClick={() => handleSelectRemove(null)}
                    danger
                  >
                    删除
                  </Button>
                </div>
              </div>
            )}
            <div className={styles["table-container"]}>
              <Table
                className="custom-table"
                loading={tableLoading}
                columns={columns}
                dataSource={dataSource}
                rowSelection={{
                  selectedRowKeys,
                  onChange: onSelectChange,
                  onSelect,
                  onSelectAll,
                }}
                scroll={{
                  y: `calc(100vh - 320px)`,
                  x: 1000,
                  scrollToFirstRowOnChange: true,
                }}
                onChange={handleTableChange}
                pagination={{
                  current: pageConfig.current,
                  pageSize: pageConfig.pageSize,
                  total: pageConfig.total,
                  showTotal: pageConfig.showTotal,
                  showQuickJumper: pageConfig.showQuickJumper,
                  showSizeChanger: pageConfig.showSizeChanger,
                  pageSizeOptions: pageConfig.pageSizeOptions,
                  disabled: pageDisabled,
                }}
                rowKey="entityId"
              />
            </div>
          </Col>
        </Row>
        {/* 新增编辑实体弹框  */}
        <AddEditEntity ref={addEditEntityRef} searchEvent={getSubstanceList} />
        {/* 导入弹框 */}
        <ImportModel
          ref={importModelRef}
          downloadTemplateEvent={downloadTemplateEvent}
          searchEvent={getSubstanceList}
        />
        {/* 删除弹框  */}
        <DeleteModal
          visible={deleteModalShow}
          loading={deleteLoading}
          title={deleteTitle}
          content={deleteContent}
          onCancel={() => setDeleteModalShow(false)}
          onOk={delConfirmEvent}
        />
      </div>
    </>
  );
});
export default EntityManage;
