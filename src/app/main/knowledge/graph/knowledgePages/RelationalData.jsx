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
  Space,
  Table,
  Tag,
  message,
  Spin,
  Select,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  TagOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { useStore } from "@/store/index";
import AddEditRelation from "../components/AddEditRelation";
import ImportModel from "../components/ImportModel";
import {
  getAllEdgesApi,
  checkDataUpApi,
  deleteRelationsApi,
  deleteAllRelationsApi,
  getRelationsApi,
  screenTagApi,
} from "@/api/graph";
import DeleteModal from "../components/DeleteModal"; //删除弹框
import { checkPermission } from "@/utils/utils";
import { downloadFileRequest } from "@/utils/download";
import dayjs from "dayjs";
import CustomTableStyle from "@/utils/graph/scrollStyle";

const RelationalData = forwardRef((props, entityManageRef) => {
  const [btnPermission, setBtnPermission] = useState(false);
  const { isCommonSpace, currentNamespaceId, currentNamespaceObj } = useStore(
    (state) => state
  );
  const [isShow, setIsShow] = useState(false); // 权限按钮展示
  const [edgeName, setEdgeName] = useState(""); // 搜索框输入内容
  const [subLoading, setSubLoading] = useState(false); // 关系列表加载状态
  const [originSubData, setOriginSubData] = useState([]); // 原始本体列表数据
  const [substanceList, setSubstanceList] = useState([]);
  const [isFinish, setIsFinish] = useState(false);

  // 本体列表
  const [currentSub, setCurrentSub] = useState(null); // 当前选中本体
  const [subjectName, setSubjectName] = useState(""); // 搜索框输入实体名称
  const [currentRow, setCurrentRow] = useState(null); // 当前行数据
  const [editLoading, setEditLoading] = useState(false); // 新增编辑弹框加载状态
  const addEditRelationRef = useRef(null); // 新增编辑实体弹框
  const importModelRef = useRef(null); // 导入模型弹框
  const intervalRef = useRef(null); // 定时任务控制
  const intervalCountRef = useRef(0);

  // table
  const [tableLoading, setTableLoading] = useState(false);
  const [checkDisabled, setCheckDisabled] = useState(false);
  const [fullRemove, setFullRemove] = useState(false); // 全部删除
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedRow, setSelectedRow] = useState([]);
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

  const [subjectTagOptions, setSubjectTagOptions] = useState([]);
  const [objectTagOptions, setObjectTagOptions] = useState([]);

  // 查询条件
  const [where, setWhere] = useState({
    subjectTagName: undefined,
    objectTagName: undefined,
    subjectName: "",
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
      title: "主体类型",
      dataIndex: "subjectTagName",
      key: "subjectTagName",
      ellipsis: true,
      align: "center",
      render: (text, record) => {
        return record.subjectTagName ? record.subjectTagName : "--";
      },
    },
    {
      title: "主体名称",
      dataIndex: "subjectName",
      key: "subjectName",
      ellipsis: true,
      align: "center",
    },
    {
      title: "关系名称",
      dataIndex: "edgeName",
      key: "edgeName",
      ellipsis: true,
      align: "center",
    },
    {
      title: "客体名称",
      dataIndex: "objectName",
      key: "objectName",
      ellipsis: true,
      align: "center",
    },
    {
      title: "客体类型",
      dataIndex: "objectTagName",
      key: "objectTagName",
      ellipsis: true,
      align: "center",
      render: (text, record) => {
        return record.objectTagName ? record.objectTagName : "--";
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
              onClick={() => openAddEditRelation("relation", "edit", record)}
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
  const debouncedEdgeName = useDebounce(edgeName, 500);
  const debouncedWhere = useDebounce(where, 500);

  // 获取关系列表
  const getSubstanceList = async () => {
    setSubLoading(true);
    const getData = {
      spaceId: currentNamespaceId,
      edgeName: edgeName,
    };
    await getAllEdgesApi(getData)
      .then((res) => {
        const { data } = res;
        const edgeInfosVOList = data.edgeInfosVOList || [];

        setOriginSubData(edgeInfosVOList);
        setSubstanceList(edgeInfosVOList);
        setCheckDisabled(edgeInfosVOList.length === 0);

        if (edgeInfosVOList.length) {
          const targetSub = currentSub
            ? edgeInfosVOList.find(
                (item) => item.edgeId === currentSub.edgeId
              ) || edgeInfosVOList[0]
            : edgeInfosVOList[0];
          setCurrentSub(targetSub); // 确保currentSub有值
        }
      })
      .catch((err) => console.log(err))
      .finally(() => {
        setSubLoading(false);
        setIsFinish(false);
      });
  };

  // 获取关系列表
  const getSubstanceList1 = async () => {
    const getData = {
      spaceId: currentNamespaceId,
      edgeName: edgeName,
    };
    setIsFinish(false);
    await getAllEdgesApi(getData)
      .then((res) => {
        const { data } = res;
        const edgeInfosVOList = data.edgeInfosVOList || [];

        setSubstanceList((prev) => {
          if (!prev.length) return edgeInfosVOList;
          // 只替换tagNumber，不改变数组结构和选中状态
          return prev.map((oldItem) => {
            const newItem = edgeInfosVOList.find(
              (newI) => newI.edgeId === oldItem.edgeId
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

    // 组件卸载时清理定时器
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [debouncedEdgeName, currentNamespaceId]);

  // 选择当前本体
  const handleSelectSub = (item) => {
    setCurrentSub(item);
    restSelected();
  };

  // 根据关系列表获取关系数据
  const handleFetchRelationList = (config = {}) => {
    setTableLoading(true);
    const getData = {
      ...where,
      current: pageConfig.current,
      pageSize: pageConfig.pageSize,
      spaceId: currentNamespaceId,
      edgeId: currentSub.edgeId,
      edgeName: currentSub.edgeName,
      objectName: "",
      ...config,
    };
    getRelationsApi(getData)
      .then((res) => {
        const total = res.data.total || 0;
        const current = res.data.current + 1;
        setPageConfig((prev) => ({ ...prev, current, total }));
        setDataSource(res.data.records ? res.data.records : []);
        setCheckDisabled(total === 0);
        // if (fullRemove) {
        //   setAlreadySelect(`全选${total}条`);
        // } else {
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

  // 获取主客体类型数据
  const handleFetchTypeData = () => {
    const params = {
      spaceId: currentNamespaceId,
      edgeName: currentSub.edgeName,
      isSubject: true,
    };
    screenTagApi(params).then((res) => {
      setSubjectTagOptions(
        res.data.map((item) => ({
          label: item,
          value: item,
        }))
      );
    });
    screenTagApi({
      ...params,
      isSubject: false,
    }).then((res) => {
      setObjectTagOptions(
        res.data.map((item) => ({
          label: item,
          value: item,
        }))
      );
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
      handleFetchRelationList({ current: 0 });
      if (!isFinish) startInterval();
      handleFetchTypeData();
    }
  }, [currentSub]);

  useEffect(() => {
    if (currentSub) {
      setPageConfig((prev) => ({ ...prev, current: 1 }));
      handleFetchRelationList({ current: 0 });
    }
  }, [debouncedWhere]);

  // 新增/编辑实体
  const openAddEditRelation = async (mainType, flag, record) => {
    if (flag === "add") {
      // 检查数据空间是否满足
      const b = await checkDataUpApi({ spaceId: currentNamespaceId });
      if (!b) {
        message.warning("数据已达到上限");
        return;
      }
      setCurrentRow(null);
      addEditRelationRef.current.initData(
        flag,
        originSubData,
        currentNamespaceId,
        currentSub
      );
    } else {
      setCurrentRow(record);
      addEditRelationRef.current.initData(
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
    setDeleteContent(
      "删除连接数据，实体连接和关系属性将一并删除，建议谨慎操作"
    );
  };

  // 删除确认
  const delConfirmEvent = () => {
    setDeleteLoading(true);
    if (delType === 1) {
      confirmDeleteSubProperty();
    } else {
      if (fullRemove) {
        deleteAllRelationsApi({
          // ...currentSub,
          spaceId: currentNamespaceId,
          edgeId: currentSub.edgeId,
          edgeName: currentSub.edgeName,
          ...where,
        })
          .then(() => {
            // handleFetchRelationList({ current: 0 });
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
        restSelected();
      }
    }
  };

  const confirmDeleteSubProperty = (data) => {
    let params = {
      // ...currentSub,
      spaceId: currentNamespaceId,
      edgeName: currentSub.edgeName,
      ralationVOS: [],
    };
    if (!params.edgeName) {
      params.edgeName = deleteRecord.edgeName;
    }

    if (deleteRecord) {
      params.ralationVOS = [
        {
          relationId: deleteRecord.relationId ? deleteRecord.relationId : null,
          sourceId: deleteRecord.subjectId ? deleteRecord.subjectId : null,
          objectId: deleteRecord.objectId ? deleteRecord.objectId : null,
          edgeName: deleteRecord.edgeName ? deleteRecord.edgeName : null,
          rank: deleteRecord.rank ? deleteRecord.rank : null,
        },
      ];
    } else {
      params.ralationVOS = data
        .map((x) => {
          const matchedItem = selectedRow.find((item) => item.rank == x.rank);
          return matchedItem
            ? {
                relationId: matchedItem.relationId || null,
                sourceId: matchedItem.subjectId || null,
                objectId: matchedItem.objectId || null,
                edgeName: matchedItem.edgeName || null,
                rank: matchedItem.rank || null,
              }
            : null;
        })
        .filter((item) => item !== null);
    }

    deleteRelationsApi(params)
      .then(() => {
        // handleFetchRelationList({ current: 0 });
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
      subjectTagName: null,
      objectTagName: null,
      subjectName: "",
    });
    setCheckDisabled(false);
    setFullRemove(false);
    setDeleteLoading(false);
    setDeleteModalShow(false);
    setCheckIndeterminate(false);
    setAlreadySelect("全选0条");
    setSelectedRowKeys([]);
    setSelectedTemp(new Map());
    // setDataSource([]);
    setDeleteContent("");
    setDelType(null);
    setDeleteRecord(null);
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
    const currentPageIds = dataSource.map((item) => item.rank); // 当前页所有ID

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
          if (!newMap.has(item.rank)) {
            newMap.set(item.rank, {
              rank: item.rank,
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
        (item) => !selectedRowKeys.includes(item.rank)
      );
      if (unselectedIds.length === 0) return;

      const newSelectedIds = [
        ...selectedRowKeys,
        ...unselectedIds.map((item) => item.rank),
      ];
      setSelectedRowKeys(newSelectedIds);

      setSelectedTemp((prev) => {
        const newMap = new Map(prev);
        unselectedIds.forEach((item) => {
          newMap.set(item.rank, {
            rank: item.rank,
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
    const { rank } = record;
    if (!selected) {
      setFullRemove(false);
    }
    if (selected) {
      setSelectedRowKeys((prev) =>
        prev.includes(rank) ? prev : [...prev, rank]
      );
      setSelectedTemp((prev) => {
        const newMap = new Map(prev);
        newMap.set(rank, {
          rank: record.rank,
        });
        return newMap;
      });
      setSelectedRow((prev) => (prev.rank === rank ? prev : [...prev, record]));
    } else {
      setSelectedRowKeys((prev) => prev.filter((id) => id !== rank));
      setSelectedTemp((prev) => {
        const newMap = new Map(prev);
        newMap.delete(rank);
        return newMap;
      });
      setSelectedRow((prev) => prev.filter((item) => item.rank !== rank));
    }
  };

  // 当前页全选
  const onSelectAll = (selected, selectionRows, changeRows) => {
    setFullRemove(false);
    if (selected) {
      const newRowIds = changeRows.map((item) => item.rank);
      const uniqueIds = newRowIds.filter((id) => !selectedRowKeys.includes(id));
      setSelectedRowKeys((prev) => [...prev, ...uniqueIds]);
      setSelectedTemp((prevTemp) => {
        const newMap = new Map(prevTemp);
        changeRows.forEach((item) => {
          if (!newMap.has(item.rank)) {
            newMap.set(item.rank, {
              rank: item.rank,
            });
          }
        });
        return newMap;
      });

      setSelectedRow((prev) => {
        const newRows = [];
        selectionRows.forEach((item) => {
          if (item?.rank) {
            newRows.push(item);
          }
        });
        return [...prev, ...newRows];
      });
    } else {
      const changeRowIds = changeRows.map((item) => item.rank);
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
      setSelectedRow((prev) =>
        prev.filter((item) => !changeRowIds.includes(item.rank))
      );
    }
  };

  // 表格分页切换
  const handleTableChange = (pagination, filters, sorter) => {
    setPageConfig((prev) => ({
      ...prev,
      current: pagination.current,
      pageSize: pagination.pageSize,
    }));
    handleFetchRelationList({
      current: pagination.current - 1,
      pageSize: pagination.pageSize,
    });
  };

  // 导出
  const handleExport = async () => {
    if (fullRemove) {
      const params = {
        ...where,
        spaceId: currentNamespaceId,
        tagEdgeId: currentSub.edgeId,
        tagEdgeName: currentSub.edgeName,
        type: 1, //  0 实体 1 关系
      };
      try {
        await downloadFileRequest(
          "/voicesagex-console/knowledge-web/excelManage/excelData",
          {
            ...params,
          },
          `关系数据—${dayjs(new Date()).format("YYYYMMDDHHmmss")}.xlsx`
        );
      } catch (error) {
        console.error("导出失败:", error);
      }
    } else {
      let params = {
        ...where,
        spaceId: currentNamespaceId,
        entityRelationExportList: [],
        tagEdgeName: currentSub.edgeName,
        type: 1, //  0 实体 1 关系
      };
      const selected = Array.from(selectedTemp.values());
      params.entityRelationExportList = selected
        .map((x) => {
          const matchedItem = selectedRow.find((item) => item.rank == x.rank);
          return matchedItem
            ? {
                entityId: matchedItem.tagEdgeId || null,
                edgeName: matchedItem.edgeName || null,
                subjectId: matchedItem.subjectId || null,
                rank: matchedItem.rank || null,
                objectId: matchedItem.objectId || null,
              }
            : null;
        })
        .filter((item) => item !== null);

      try {
        await downloadFileRequest(
          "/voicesagex-console/knowledge-web/excelManage/excelDataPart",
          {
            ...params,
          },
          `关系数据—${dayjs(new Date()).format("YYYYMMDDHHmmss")}.xlsx`
        );
      } catch (error) {
        console.error("导出失败:", error);
      }
    }
  };

  // 下载模板
  const downloadTemplateEvent = async (edgesId) => {
    let params = {
      spaceId: currentNamespaceId,
      templateList: [],
    };
    if (edgesId && edgesId.length > 0) {
      let arr = originSubData.filter((item) => edgesId.includes(item.edgeId));
      params.templateList = arr.map((item) => {
        return {
          edgeId: item.edgeId,
          edgeName: item.edgeName,
        };
      });
    }
    await downloadFileRequest(
      "/voicesagex-console/knowledge-web/excelManage/relateionTemplate",
      {
        ...params,
      },
      "关系批量导入模板.xlsx"
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
    importModelRef.current.showModal("relation", originSubData);
  };

  return (
    <>
      <CustomTableStyle />
      <div className="substance-container" style={{ height: "100%" }}>
        <Row style={{ height: "100%" }}>
          <Col span={4} className={styles["substance-aside"]}>
            <div className={styles["title-wrapper"]}>
              <span className={styles["main-title"]}>关系列表</span>
            </div>
            <div className={styles["search-wrapper"]}>
              <Input
                style={{ borderRadius: "6px" }}
                placeholder="输入关键字筛选"
                maxLength={50}
                value={edgeName}
                onChange={(e) => setEdgeName(e.target.value)}
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
                      key={item.edgeId}
                      className={`${styles["sub-item"]} ${
                        item.edgeId === currentSub?.edgeId
                          ? styles["list-active"]
                          : ""
                      }`}
                      onClick={() => {
                        if (item.edgeId !== currentSub?.edgeId) {
                          handleSelectSub(item);
                        }
                      }}
                    >
                      <TagOutlined className={styles["sub-icon"]} />
                      <span
                        className={styles["sub-text"]}
                        title={item.edgeName}
                      >
                        {item.edgeName}
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
              <span style={{ margin: 0 }}>关系数据</span>
            </div>
            <div className={styles["main-action"]}>
              <Space className={styles["action-search"]}>
                <Select
                  className={styles["select-search"]}
                  style={{ width: 170 }}
                  value={where.subjectTagName}
                  onChange={(value) =>
                    setWhere((prev) => ({
                      ...prev,
                      subjectTagName: value,
                    }))
                  }
                  options={subjectTagOptions}
                  placeholder="请选择主体类型"
                  allowClear
                />
                <Select
                  className={styles["select-search"]}
                  style={{ width: 170 }}
                  value={where.objectTagName}
                  onChange={(value) =>
                    setWhere((prev) => ({
                      ...prev,
                      objectTagName: value,
                    }))
                  }
                  options={objectTagOptions}
                  placeholder="请选择客体类型"
                  allowClear
                />
                <Input
                  style={{ borderRadius: "6px" }}
                  className={styles["search"]}
                  placeholder="输入主体/客体关键字"
                  maxLength={50}
                  allowClear
                  value={where.subjectName}
                  onChange={(e) =>
                    setWhere({ ...where, subjectName: e.target.value })
                  }
                  onPressEnter={() => handleFetchRelationList({ current: 0 })}
                  suffix={
                    <SearchOutlined
                      style={{ cursor: "pointer" }}
                      onClick={() => handleFetchRelationList({ current: 0 })}
                    />
                  }
                />
              </Space>
              {isShow && (
                <div className={styles["action-button"]}>
                  <Button
                    type="primary"
                    style={{ marginLeft: "10px" }}
                    disabled={!currentSub || !btnPermission}
                    onClick={() => openAddEditRelation("relation", "add")}
                  >
                    <PlusOutlined />
                    新增关系连接
                  </Button>
                  <Button
                    type="primary"
                    style={{ marginLeft: "10px" }}
                    ghost
                    disabled={!currentSub || !btnPermission}
                    onClick={openImportModel}
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
                rowKey="rank"
              />
            </div>
          </Col>
        </Row>
        {/* 新增编辑实体弹框  */}
        <AddEditRelation
          ref={addEditRelationRef}
          searchEvent={getSubstanceList}
        />
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
export default RelationalData;
