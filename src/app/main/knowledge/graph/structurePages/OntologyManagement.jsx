"use client";

import React, {
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
  useMemo,
} from "react";
import styles from "./page.module.css";
import {
  Col,
  Row,
  Input,
  Empty,
  Popover,
  Button,
  Checkbox,
  Space,
  Table,
  Tag,
  message,
  Spin,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  DownOutlined,
  AppstoreAddOutlined,
  TagOutlined,
  EllipsisOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import { useStore } from "@/store/index";
import AddEditAttribute from "../components/AddEditAttribute";
import SurvivalTime from "../components/SurvivalTime";
import Tips from "../components/Tips";
import { getURLFileName } from "@/utils/fileValidation";
import {
  getAllTagEdgesApi,
  getTagEdgeInfosApi,
  dropTagEdgePropertyApi,
  dropAllTagEdgePropertyApi,
} from "@/api/graph";
import DeleteModal from "../components/DeleteModal"; //删除弹框
import FilePreview from "@/app/components/knowledge/PreviewPC";
import dayjs from "dayjs";
import { checkPermission } from "@/utils/utils";
import CustomTableStyle from "@/utils/graph/scrollStyle";

const OntologyManagement = forwardRef((props, ontologyRef) => {
  const [btnPermission, setBtnPermission] = useState(false);
  const { isCommonSpace, currentNamespaceId, currentNamespaceObj } = useStore(
    (state) => state
  );
  const [isShow, setIsShow] = useState(false); // 权限按钮展示
  const [tagName, setTagName] = useState(""); // 搜索框输入内容
  const [subLoading, setSubLoading] = useState(false); // 关系列表加载状态
  const [originSubData, setOriginSubData] = useState([]); // 原始本体列表数据
  const [substanceList, setSubstanceList] = useState([]);

  // 本体列表
  const [currentSub, setCurrentSub] = useState(null); // 当前选中本体
  const [propertyName, setPropertyName] = useState(""); // 搜索框输入属性名称
  const [currentRow, setCurrentRow] = useState(null); // 当前行数据
  const [editLoading, setEditLoading] = useState(false); // 新增编辑弹框加载状态
  const addEditAttributeRef = useRef(null); // 新增编辑属性弹框
  const [delSubObj, setDelSubObj] = useState(null); // 删除本体数据

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
  // const [isSurvival, setIsSurvival] = useState(false);

  // 查询条件
  const [where, setWhere] = useState({
    type: 0,
    propertyName: "",
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
      width: 60,
      render: (text, record, index) => {
        return (pageConfig.current - 1) * pageConfig.pageSize + 1 + index;
      },
    },
    {
      title: "属性名称",
      dataIndex: "propertyName",
      key: "propertyName",
      ellipsis: true,
      align: "center",
    },
    {
      title: "所属本体",
      dataIndex: "tagName",
      key: "tagName",
      ellipsis: true,
      align: "center",
    },
    {
      title: (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            position: "relative",
          }}
        >
          数据类型
          <Popover
            placement="right"
            content={<Tips />}
            trigger={["hover", "click"]}
            arrow={true}
            offset={[0, 10]}
            style={{ zIndex: 1000 }}
          >
            <QuestionCircleOutlined
              style={{
                marginLeft: 4,
                cursor: "pointer",
                fontSize: 14,
                color: "#a5a7a8ff",
                position: "relative",
              }}
            />
          </Popover>
        </div>
      ),
      dataIndex: "propertyType",
      key: "propertyType",
      align: "center",
    },
    {
      title: "附加设置",
      dataIndex: "extra",
      key: "extra",
      align: "center",
      render: (text, record) => {
        if (/^\d+$/.test(text)) return text;
        const find = extraOptions.find((item) => item.value === text);
        return find ? find.label : "--";
      },
    },
    {
      title: "是否必填",
      dataIndex: "tagRequired",
      key: "tagRequired",
      align: "center",
      render: (text) => {
        return text === 0 ? "必填" : "非必填";
      },
    },
    {
      title: "属性默认值",
      dataIndex: "defaultValueAsString",
      key: "defaultValueAsString",
      ellipsis: true,
      align: "center",
      width: 160,
      render: (text, record) => {
        if (!text || [null, "", "null", "undefined"].includes(String(text))) {
          return formatText(text);
        }

        const str = String(text).trim();

        if (str.startsWith("http://") || str.startsWith("http")) {
          return <FilePreview record={record} />;
          // (
          //   <Button
          //     type="link"
          //     onClick={() => handlePreview(record)}
          //     title={getURLFileName(str)}
          //     style={{ padding: 0 }}
          //   >
          //     {getURLFileName(str)}
          //   </Button>
          // );
        }

        if (
          ["TIME", "DATE", "DATETIME", "TIMESTAMP"].includes(
            record.propertyType
          )
        ) {
          const dayjsDate = dayjs(str);
          if (dayjsDate.isValid()) {
            if (record.propertyType === "DATE") {
              return dayjsDate.format("YYYY-MM-DD");
            } else if (record.propertyType === "TIME") {
              return dayjsDate.format("HH:mm:ss");
            } else {
              return dayjsDate.format("YYYY-MM-DD HH:mm:ss");
            }
          }
        }

        return formatText(text);
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
              onClick={() => openAddEditAttribute("substance", "edit", record)}
              disabled={
                !btnPermission || currentSub.ttlCol == record.propertyName
              }
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

  useImperativeHandle(ontologyRef, () => ({
    getSubstanceList,
  }));

  useEffect(() => {
    setBtnPermission(checkPermission("/main/knowledge/operation"));
    setIsShow(getIsShow());
    getSubstanceList();
    return () => {
      setDelSubObj(null);
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
  const debouncedPropertyName = useDebounce(where.propertyName, 500);

  // 获取本体列表
  const getSubstanceList = async () => {
    setSubLoading(true);
    const getData = {
      spaceId: currentNamespaceId,
      type: 0,
      tagName: tagName,
    };
    await getAllTagEdgesApi(getData)
      .then((res) => {
        setOriginSubData(res.data);
        setSubstanceList(res.data);
        setCheckDisabled(res.data.length === 0);

        if (
          (res.data.length && !currentSub) ||
          (delSubObj && currentSub?.tagEdgeId === delSubObj?.tagEdgeId)
        ) {
          setCurrentSub(res.data[0]);
        }
        if (currentSub) {
          // 找到本体列表中当前本体
          const findSub = res.data.find(
            (item) => item.tagEdgeId === currentSub.tagEdgeId
          );
          if (findSub) {
            setCurrentSub(findSub);
          }
        }
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        setSubLoading(false);
      });
  };

  // 删除本体
  const handleDeleteSubEvent = (item) => {
    setDelSubObj(item);
    props.handleDeleteSub(
      "substance",
      item,
      "是否确认删除本体？",
      "删除本体，相关属性将一并删除，建议谨慎操作"
    );
  };

  // 选择当前本体
  const handleSelectSub = (item) => {
    setCurrentSub(item);
    restSelected();
  };

  // 本体列表实时查询
  useEffect(() => {
    if (currentNamespaceId) {
      getSubstanceList();
    }
  }, [debouncedTagName, currentNamespaceId]);

  // 获取属性列表
  const getAttributeList = (config = {}) => {
    setTableLoading(true);
    const getData = {
      ...currentSub,
      ...where,
      current: pageConfig.current,
      size: pageConfig.pageSize,
      ...config,
    };
    getTagEdgeInfosApi(getData)
      .then((res) => {
        const total = res.data.total || 0;
        setPageConfig((prev) => ({ ...prev, total }));
        setDataSource(res.data.records);
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

  useEffect(() => {
    if (fullRemove && dataSource.length > 0) {
      // 当 fullRemove 为 true 且数据源已更新（非空），执行手动全选
      manualFullSelect();
    }
  }, [dataSource, fullRemove]);

  // 属性列表实时查询
  useEffect(() => {
    if (currentSub) {
      setPageConfig((prev) => ({
        ...prev,
        current: 1,
      }));
      getAttributeList({ current: 1 });
    }
  }, [debouncedPropertyName, currentSub]);

  // 新增/编辑属性
  const openAddEditAttribute = (mainType, flag, record) => {
    if (flag === "add") {
      setCurrentRow(null);
      addEditAttributeRef.current.showModal(mainType, record, "add");
    } else {
      setCurrentRow(record);
      addEditAttributeRef.current.showModal(mainType, record, "edit");
    }
  };

  // 删除
  const handleSelectRemove = (record) => {
    if (record) {
      // setIsSurvival(record.propertyName == currentSub.ttlCol);
      setDeleteRecord(record);
      setDelType(1);
    } else {
      // if (fullRemove && where.propertyName !== "") {
      //   currentSub.ttlCol && setIsSurvival(true);
      // } else {
      //   const selected = selectedTemp.values();
      //   const form = Array.from(selected);
      //   const isSurvival = form.some(
      //     (item) => item.propertyName === currentSub.ttlCol
      //   );
      //   setIsSurvival(isSurvival);
      // }
      setDelType(2);
    }
    setDeleteModalShow(true);
    setDeleteTitle("是否确认删除所选属性？");
    setDeleteContent("删除属性，后续将不可添加重名属性，建议谨慎操作");
  };

  // 删除确认
  const delConfirmEvent = () => {
    setDeleteLoading(true);
    if (delType === 1) {
      confirmDeleteSubProperty();
    } else {
      if (fullRemove) {
        dropAllTagEdgePropertyApi({
          ...currentSub,
          space: currentNamespaceId,
          propertyName: where.propertyName,
        })
          .then(() => {
            getAttributeList({ current: 1 });
            restSelected();
            message.success("删除成功");
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
    dropTagEdgePropertyApi({
      ...currentSub,
      space: currentNamespaceId,
      type: 0,
      propertyVOS: data
        ? data
        : [
            {
              propertyName: deleteRecord.propertyName,
              propertyId: deleteRecord.propertyId,
            },
          ],
    })
      .then(() => {
        message.success("删除成功");
        getAttributeList({ current: 1 });
        restSelected();
      })
      .finally(() => {
        restSelected();
      });
  };

  const restSelected = () => {
    setWhere({
      type: 0,
      propertyName: "",
    });
    setDeleteLoading(false);
    setDeleteModalShow(false);
    setCheckDisabled(false);
    setFullRemove(false);
    setCheckIndeterminate(false);
    setAlreadySelect("全选0条");
    setSelectedRowKeys([]);
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
    const currentPageIds = dataSource.map((item) => item.propertyId); // 当前页所有ID

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
          if (!newMap.has(item.propertyId)) {
            newMap.set(item.propertyId, {
              propertyId: item.propertyId,
              propertyName: item.propertyName,
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
        (item) => !selectedRowKeys.includes(item.propertyId)
      );
      if (unselectedIds.length === 0) return;

      const newSelectedIds = [
        ...selectedRowKeys,
        ...unselectedIds.map((item) => item.propertyId),
      ];
      setSelectedRowKeys(newSelectedIds);

      setSelectedTemp((prev) => {
        const newMap = new Map(prev);
        unselectedIds.forEach((item) => {
          newMap.set(item.propertyId, {
            propertyId: item.propertyId,
            propertyName: item.propertyName,
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
    const { propertyId } = record;
    if (!selected) {
      setFullRemove(false);
    }
    if (selected) {
      setSelectedRowKeys((prev) =>
        prev.includes(propertyId) ? prev : [...prev, propertyId]
      );
      setSelectedTemp((prev) => {
        const newMap = new Map(prev);
        newMap.set(propertyId, {
          propertyId,
          propertyName: record.propertyName,
        });
        return newMap;
      });
    } else {
      setSelectedRowKeys((prev) => prev.filter((id) => id !== propertyId));
      setSelectedTemp((prev) => {
        const newMap = new Map(prev);
        newMap.delete(propertyId);
        return newMap;
      });
    }
  };

  // 当前页全选
  const onSelectAll = (selected, selectionRows, changeRows) => {
    setFullRemove(false);
    if (selected) {
      const newRowIds = changeRows.map((item) => item.propertyId);
      const uniqueIds = newRowIds.filter((id) => !selectedRowKeys.includes(id));
      setSelectedRowKeys((prev) => [...prev, ...uniqueIds]);
      setSelectedTemp((prevTemp) => {
        const newMap = new Map(prevTemp);
        changeRows.forEach((item) => {
          if (!newMap.has(item.propertyId)) {
            newMap.set(item.propertyId, {
              propertyId: item.propertyId,
              propertyName: item.propertyName,
            });
          }
        });
        return newMap;
      });
    } else {
      const changeRowIds = changeRows.map((item) => item.propertyId);
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
    getAttributeList({
      current: pagination.current,
      size: pagination.pageSize,
    });
  };

  // 存活时间
  const survivalTimeRef = useRef(null);

  // 存活时间
  const openSurvivalModel = () => {
    survivalTimeRef.current.showModal("substance");
  };

  // 存活时间确认
  const survivalTimeConfirm = () => {
    getSubstanceList();
    getAttributeList();
  };

  return (
    <>
      <CustomTableStyle />
      <div className="substance-container" style={{ height: "100%" }}>
        <Row style={{ height: "100%" }}>
          <Col span={4} className={styles["substance-aside"]}>
            <div className={styles["title-wrapper"]}>
              <span className={styles["main-title"]}>本体列表</span>
              {isShow && btnPermission && (
                <div
                  className={styles["sub-add-button"]}
                  onClick={() => props.showMainBodyModel("substance")}
                ></div>
              )}
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
                      key={item.tagEdgeId}
                      className={`${styles["sub-item"]} ${
                        item.tagEdgeId === currentSub?.tagEdgeId
                          ? styles["list-active"]
                          : ""
                      }`}
                      onClick={() => {
                        if (item.tagEdgeId !== currentSub?.tagEdgeId) {
                          handleSelectSub(item);
                        }
                      }}
                    >
                      <TagOutlined className={styles["sub-icon"]} />
                      <span className={styles["sub-text"]} title={item.tagName}>
                        {item.tagName}
                      </span>
                      <span>
                        <Popover
                          placement="bottom"
                          content={
                            <Button
                              size="small"
                              disabled={!btnPermission}
                              onClick={() => handleDeleteSubEvent(item)}
                              type="text"
                              size="large"
                            >
                              <img src="/knowledge/graph/delete.svg" alt="" />
                              <span>删除</span>
                            </Button>
                          }
                        >
                          <EllipsisOutlined />
                        </Popover>
                      </span>
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
              <span style={{ margin: 0 }}>属性定义</span>
            </div>
            <div className={styles["main-action"]}>
              <div className={styles["action-search"]}>
                <Input
                  style={{ borderRadius: "6px" }}
                  className={styles["search"]}
                  placeholder="输入名称关键字筛选"
                  maxLength={50}
                  value={where.propertyName}
                  onChange={(e) =>
                    setWhere({ ...where, propertyName: e.target.value })
                  }
                  onPressEnter={() => getAttributeList()}
                  suffix={
                    <SearchOutlined
                      style={{ cursor: "pointer" }}
                      onClick={() => getAttributeList()}
                    />
                  }
                />
                {/* <Button
                type="primary"
                style={{ marginLeft: "10px" }}
                disabled={!currentSub}
                onClick={() => getAttributeList()}
              >
                查询
              </Button> */}
              </div>
              {isShow && (
                <div className={styles["action-button"]}>
                  <Button
                    type="primary"
                    style={{ marginLeft: "10px" }}
                    disabled={!currentSub || !btnPermission}
                    onClick={() => openAddEditAttribute("substance", "add")}
                  >
                    <PlusOutlined />
                    新增属性
                  </Button>
                  <Button
                    type="primary"
                    style={{ marginLeft: "10px" }}
                    ghost
                    disabled={!currentSub || !btnPermission}
                    onClick={openSurvivalModel}
                  >
                    存活时间管理
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
                rowKey="propertyId"
              />
            </div>
          </Col>
        </Row>
        {/* 新增编辑属性弹框  */}
        <AddEditAttribute
          ref={addEditAttributeRef}
          extraOptions={extraOptions}
          currentSub={currentSub}
          currentNamespaceId={currentNamespaceId}
          searchEvent={getAttributeList}
        />
        {/* 存活时间管理 */}
        <SurvivalTime
          ref={survivalTimeRef}
          data={currentSub}
          searchEvent={survivalTimeConfirm}
        />
        {/* 删除弹框  */}
        <DeleteModal
          visible={deleteModalShow}
          loading={deleteLoading}
          title={deleteTitle}
          content={deleteContent}
          onCancel={() => setDeleteModalShow(false)}
          onOk={delConfirmEvent}
          // isSurvival={isSurvival}
        />
      </div>
    </>
  );
});
export default OntologyManagement;
