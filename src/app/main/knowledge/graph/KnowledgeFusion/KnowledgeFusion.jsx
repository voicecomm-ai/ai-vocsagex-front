"use client";
import React, {
  useState,
  forwardRef,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  Button,
  AutoComplete,
  Input,
  Spin,
  message,
  Modal,
  Tooltip,
} from "antd";
import styles from "./index.module.css";
import {
  SearchOutlined,
  CheckCircleOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { debounce, cloneDeep, pick, differenceBy, remove } from "lodash-es";
import { useStore } from "@/store/index";
import {
  sliceId,
  isUrl,
  getURLFileName,
  getFileType,
  getFileName,
} from "@/utils/fileValidation";
import {
  selectVertexInfoApi,
  singleVertexInfoApi,
} from "@/api/graphVisualization";
import { affirmFusionApi } from "@/api/knowledge";
import NoData from "../components/NoData";
import PreviewModal from "@/app/components/knowledge/PreviewModal";
import DeleteModal from "../../components/DeleteModal";
import PropertyEdit from "./components/PropertyEdit";
import EntityEdit from "./components/EntityEdit";
import { useRouter } from "next/navigation";

const KnowledgeFusion = forwardRef((props, ref) => {
  const { currentNamespaceId } = useStore((state) => state);
  const router = useRouter();
  const { canCreate } = props;

  // 基础状态
  const [displayValue, setDisplayValue] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [options, setOptions] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [lastFetchId, setLastFetchId] = useState(0);
  const [addLoading, setAddLoading] = useState(false);
  const [lastSelectedValue, setLastSelectedValue] = useState(null);

  // 核心数据状态
  const [standardData, setStandardData] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [fusionData, setFusionData] = useState(null);
  const [allProperty, setAllProperty] = useState([]);
  const [isEdit, setIsEdit] = useState(false);

  // 弹窗状态
  const [propertyVisible, setPropertyVisible] = useState(false);
  const propertyEditRef = useRef(null);
  const entityEditRef = useRef(null);
  const [entityEditVisible, setEntityEditVisible] = useState(false);

  // 预览弹窗
  const [previewVisible, setPreviewVisible] = useState(false);
  const [currentFile, setCurrentFile] = useState({
    url: "",
    name: "",
  });
  const fileType = getFileType(currentFile.url);

  // 表单状态
  const [attributeForm, setAttributeForm] = useState({
    tagName: "",
    propertyName: "",
    propertyType: "",
    propertyValue: "",
    finalValue: "",
    tagRequired: "",
    extra: "",
  });
  const [entityForm, setEntityForm] = useState({
    vertexName: "",
    vertexId: "",
    vertexTagName: [],
  });
  const [tableOptions, setTableOptions] = useState([]);

  // 融合
  const [modalType, setModalType] = useState("fusion");
  const [deleteTask, setDeleteTask] = useState({});
  const [deleteModalShow, setDeleteModalShow] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteTitle, setDeleteTitle] = useState("");
  const [deleteContent, setDeleteContent] = useState("");

  // 拦截浏览器刷新/关闭
  useEffect(() => {
    if (fusionData) {
      sessionStorage.setItem("fusionData", JSON.stringify(fusionData));
    }

    history.pushState(null, document.title, window.location.href);

    const handleBeforeUnload = (e) => {
      if (fusionData) {
        e.preventDefault();
        e.returnValue = "你有未保存的融合知识内容，确定要离开吗？";
        return e.returnValue;
      }
    };

    const handlePopState = () => {
      if (fusionData) {
        const isLeave = window.confirm(
          "你有未保存的融合知识内容，确定要返回上一页/前进吗？"
        );
        if (!isLeave) {
          // 阻止默认的前进/后退行为
          // history.pushState(null, document.title, window.location.href);
        } else {
          // 用户确认离开
          sessionStorage.removeItem("fusionData");
          // history.go(-1);
        }
      } else {
        sessionStorage.removeItem("fusionData");
      }
    };

    const handleUnload = () => {
      sessionStorage.removeItem("fusionData");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("unload", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("unload", handleUnload);
      sessionStorage.removeItem("fusionData");
    };
  }, [fusionData]);

  // 处理URL值格式化
  const processValue = useCallback((value, needUrl = false) => {
    let temp = value;
    if (temp?.startsWith("http") && temp && !needUrl) {
      temp = getURLFileName(temp);
    }
    return temp || "--";
  }, []);

  // 获取属性值
  const getValue = useCallback(
    (value, propertyName, tagName, needUrl = false) => {
      try {
        let temp = value.tagInfo?.[tagName]?.[propertyName] || "--";
        if (temp.startsWith("http") && !needUrl) {
          temp = getURLFileName(temp);
        }
        return temp;
      } catch (err) {
        return "--";
      }
    },
    []
  );

  // 渲染标签选项
  const vertexLabel = useCallback((name, tags, highlightText = "") => {
    const renderHighlightedName = () => {
      if (!highlightText) {
        return (
          <span className={styles["lable-name"]} title={name}>
            {name}
          </span>
        );
      }

      const escapedHighlightText = highlightText.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );
      const highlightRegex = new RegExp(`(${escapedHighlightText})`, "gi");
      const parts = name.split(highlightRegex).filter((part) => part);

      return (
        <span className={styles["lable-name"]} title={name}>
          {parts.map((part, index) => {
            if (part.toLowerCase() === highlightText.toLowerCase()) {
              return (
                <span key={`{lable-${index}}`} style={{ color: "#4070FD" }}>
                  {part}
                </span>
              );
            }
            return part;
          })}
        </span>
      );
    };

    const remark = tags.join(",");
    return (
      <div className={styles["lable-wrapper-test"]} alt={name}>
        {renderHighlightedName()}
        <span className={styles["lable-remark"]} title={remark}>
          {remark}
        </span>
      </div>
    );
  }, []);

  // 防抖搜索
  const debouncedFetch = useRef(
    debounce(async (value) => {
      const filteredValue = value.replace(
        /[^A-Za-z0-9\u4e00-\u9fa5--_""“”'‘()（），,、’【】\[\]\.\/\s]/g,
        ""
      );

      setLastFetchId((prev) => prev + 1);
      const fetchId = lastFetchId;
      setFetching(true);

      if (value) {
        try {
          const { data } = await selectVertexInfoApi({
            spaceId: currentNamespaceId,
            vertexName: value,
          });

          if (fetchId !== lastFetchId) return;

          const apiOptions = data.map((node) => {
            return {
              label: vertexLabel(
                node.vertexName,
                node.vertexTagName,
                filteredValue
              ),
              value: node.vertexId,
              originName: node.vertexName,
              vertexName: node.vertexName,
              vertexId: node.vertexId,
              vertexTagName: node.vertexTagName,
            };
          });
          setOptions(apiOptions);
        } catch (error) {
          console.error("搜索失败：", error);
          message.error("搜索出错，请重试");
        } finally {
          if (fetchId === lastFetchId) setFetching(false);
        }
      }
    }, 300)
  ).current;

  // 搜索处理
  const handleSearch = useCallback(
    (value) => {
      if (value) {
        setSearchValue(value);
        debouncedFetch(value);
      }
    },
    [debouncedFetch]
  );

  // 选择实体
  const handleSelect = useCallback((value, option) => {
    if (!value || !option) return;
    setLastSelectedValue(option);
    setDisplayValue(option.originName || option.vertexName || "");
    setSearchValue("");
  }, []);

  // 输入框变化
  const handleInputChange = useCallback(
    (e) => {
      const value = e.target.value;
      setDisplayValue(value);
      setSearchValue(value);
      if (value) {
        handleSearch(value);
      } else {
        setOptions([]);
      }
    },
    [handleSearch]
  );

  // 输入框聚焦
  const handleInputFocus = useCallback(() => {
    if (lastSelectedValue) {
      setDisplayValue("");
      setSearchValue("");
    }
  }, [lastSelectedValue]);

  // 输入框失焦
  const handleInputBlur = useCallback(() => {
    if (!displayValue && lastSelectedValue) {
      setDisplayValue(
        lastSelectedValue.originName || lastSelectedValue.vertexName || ""
      );
    }
  }, [displayValue, lastSelectedValue]);

  // 清理防抖
  useEffect(() => () => debouncedFetch.cancel(), [debouncedFetch]);

  // 计算融合标签
  const fusionTag = useMemo(() => {
    const tags = new Set();
    standardData?.vertexTagName?.forEach((tag) => tags.add(tag));
    tableData.forEach((item) =>
      item.vertexTagName?.forEach((tag) => tags.add(tag))
    );
    return Array.from(tags);
  }, [standardData, tableData]);

  // 处理实体编辑
  const handleEntityEdit = useCallback(() => {
    if (!fusionData) return;
    const entityFormTemp = {
      ...pick(fusionData, ["vertexName", "vertexId"]),
      vertexTagName: fusionTag,
    };
    setEntityForm(entityFormTemp);
    setEntityEditVisible(true);
    entityEditRef.current?.showModal();
  }, [fusionData, fusionTag]);

  // 处理实体编辑完成
  const handleEntityDone = useCallback((newValue) => {
    setFusionData((prev) => {
      if (!prev) return prev;
      return { ...prev, vertexName: newValue.vertexName };
    });
    setEntityEditVisible(false);
  }, []);

  // 处理属性编辑
  const handleEdit = useCallback(
    (tagName, propertyName, propertyType, tagRequired, extra) => {
      // 构建可选值列表
      const newTableOptions = tableData
        .filter((item) => item.tagInfo?.[tagName])
        .map((currentValue) => {
          const temp = currentValue.tagInfo[tagName][propertyName];
          return temp ? { propertyValue: temp } : null;
        })
        .filter(Boolean);

      // 添加标准词属性值
      const standardTagValue = standardData?.tagInfo?.[tagName]?.[propertyName];
      if (
        standardTagValue &&
        ![null, undefined, ""].includes(standardTagValue)
      ) {
        newTableOptions.unshift({ propertyValue: standardTagValue });
      }

      // 查找融合结果中的当前值
      const fusionTagItem = fusionData?.tagName?.find(
        (item) => item.tagName === tagName
      );
      const fusionPropItem = fusionTagItem?.vertexPropertiesVOS?.find(
        (item) => item.propertyName === propertyName
      );
      const currentValue = fusionPropItem?.propertyValue || "";

      const attributeFormTemp = {
        tagName,
        propertyName,
        propertyType,
        propertyValue:
          propertyType === "STRING" && isUrl(currentValue)
            ? getURLFileName(currentValue)
            : currentValue,
        finalValue: currentValue,
        tagRequired,
        extra,
      };
      propertyEditRef.current?.showModal();

      // 去重
      const uniqueTableOptions = Array.from(
        new Map(
          newTableOptions.map((item) => [item.propertyValue, item])
        ).values()
      );

      setTableOptions(uniqueTableOptions);
      setAttributeForm({
        tagName,
        propertyName,
        propertyType,
        propertyValue:
          propertyType === "STRING" && isUrl(currentValue)
            ? getURLFileName(currentValue)
            : currentValue,
        finalValue: currentValue,
        tagRequired,
        extra,
      });
      setPropertyVisible(true);
    },
    [tableData, standardData, fusionData]
  );

  // 处理属性编辑完成
  const handlePropertyDone = (formData) => {
    const { tagName, propertyName, finalValue } = formData;
    setFusionData((prev) => {
      if (!prev) return prev;
      const newFusionData = cloneDeep(prev);
      const tagIndex = newFusionData.tagName.findIndex(
        (item) => item.tagName === tagName
      );
      if (tagIndex !== -1) {
        const propIndex = newFusionData.tagName[
          tagIndex
        ].vertexPropertiesVOS.findIndex(
          (item) => item.propertyName === propertyName
        );
        if (propIndex !== -1) {
          newFusionData.tagName[tagIndex].vertexPropertiesVOS[
            propIndex
          ].propertyValue = finalValue;
        }
      }
      return newFusionData;
    });
    setIsEdit(true);
    setPropertyVisible(false);
  };

  // 通用补全函数：fusionData 空属性用 tableData 非空值补全（tagName + propertyName 双匹配）
  const fillFusionEmptyProps = (fusionData, tableData) => {
    if (!fusionData || !fusionData.tagName || !tableData.length)
      return fusionData;

    // 收集 tableData 中所有「tagName + propertyName」的非空值（双层 Map）
    const tableTagPropertyMap = new Map();
    tableData.forEach((tableNode) => {
      tableNode?.tagName?.forEach((tableTag) => {
        const { tagName: tableTagName, vertexPropertiesVOS: tableProps } =
          tableTag;
        if (!tableTagPropertyMap.has(tableTagName)) {
          tableTagPropertyMap.set(tableTagName, new Map());
        }
        const propertyMap = tableTagPropertyMap.get(tableTagName);

        tableProps?.forEach((prop) => {
          const { propertyName, propertyValue } = prop;
          if (
            propertyValue !== undefined &&
            propertyValue !== null &&
            propertyValue !== ""
          ) {
            propertyMap.set(propertyName, propertyValue); // 同一标签+属性取最后一个非空值（最新添加的数据生效）
          }
        });
      });
    });

    // 补全 fusionData 的空属性
    const filledFusion = cloneDeep(fusionData);
    filledFusion.tagName = filledFusion.tagName.map((fusionTag) => {
      const { tagName: fusionTagName, vertexPropertiesVOS: fusionProps } =
        fusionTag;
      const tablePropertyMap =
        tableTagPropertyMap.get(fusionTagName) || new Map();

      const filledProps = (fusionProps || []).map((fusionProp) => {
        const { propertyName, propertyValue: fusionValue } = fusionProp;
        // 标准词为空时，用 tableData 的非空值补全
        if (
          fusionValue === undefined ||
          fusionValue === null ||
          fusionValue === ""
        ) {
          const tableValueY = tablePropertyMap.get(propertyName);
          return { ...fusionProp, propertyValue: tableValueY ?? fusionValue };
        }
        return fusionProp;
      });

      // 同步更新 tagInfo（保持数据一致性）
      const updatedTagInfo = { ...fusionTag.tagInfo };
      filledProps.forEach((prop) => {
        updatedTagInfo[prop.propertyName] = prop.propertyValue;
      });

      // 同步顶层 tagInfo
      filledFusion.tagInfo[fusionTagName] = updatedTagInfo;

      return {
        ...fusionTag,
        vertexPropertiesVOS: filledProps,
        tagInfo: updatedTagInfo,
      };
    });

    return filledFusion;
  };

  // 设置默认属性值
  const setDefaultValue = useCallback(
    (newTableData) => {
      if (!standardData || !fusionData) return;

      const filledFusion = fillFusionEmptyProps(
        fusionData,
        newTableData || tableData
      );
      setFusionData(filledFusion);
    },
    [standardData, fusionData, tableData]
  );

  // 处理设为标准
  const handleStandard = useCallback(
    (item, index, flag) => {
      // 切换标准词时，重置选中项的 tagName 为原始数据
      const clonedItem = cloneDeep(item);
      if (clonedItem?.originTagInfo) {
        clonedItem.tagName = cloneDeep(clonedItem.originTagInfo);
      }

      // 更新标准数据、融合数据
      const processedNode = processNode(clonedItem);

      let newTableDataTemp = [...tableData];
      if (!flag) {
        // 移除当前选中项
        newTableDataTemp.splice(index, 1);
        // 重置标准数据的 tagName 为原始配置
        const currentStandardData = cloneDeep(standardData);
        if (currentStandardData?.originTagInfo) {
          currentStandardData.tagName = cloneDeep(
            currentStandardData.originTagInfo
          );
        }
        // 将处理后的标准数据插入到表格第一列
        newTableDataTemp.unshift(processNode(currentStandardData));
      }

      const fusedData = fillFusionEmptyProps(
        cloneDeep(processedNode),
        newTableDataTemp
      );

      // ========== 更新状态 ==========
      setTableData(newTableDataTemp);
      setStandardData(processedNode);
      setFusionData(fusedData);

      // 初始化全量属性为标准数据的 tagName
      const allPropertyTemp = [
        ...processedNode.tagName,
        ...(flag ? newTableDataTemp[index]?.tagName || [] : []),
      ];

      setAllProperty(allPropertyTemp);

      // 合并其他实体的属性
      const currentTableData = [...newTableDataTemp];

      currentTableData.forEach((tableItem) => {
        // 筛选出当前标准数据没有的属性
        const tagInfos = cloneDeep(
          differenceBy(tableItem.tagName || [], allPropertyTemp, "tagName")
        );

        // 清除属性默认值
        // tagInfos.forEach((tag) => {
        //   tag.vertexPropertiesVOS?.forEach((property) => {
        //     property.propertyValue = "";
        //   });
        // });

        setAllProperty((prev) => [...prev, ...tagInfos]);

        // 更新融合数据的 tagName
        setFusionData((prev) => {
          if (!prev) return prev;
          const newFusion = cloneDeep(prev);
          newFusion.tagName.push(...cloneDeep(tagInfos));
          return newFusion;
        });

        // 更新标准数据的 tagName
        setStandardData((prev) => {
          if (!prev) return prev;
          const newStandard = cloneDeep(prev);
          newStandard.tagName.push(...cloneDeep(tagInfos));
          return newStandard;
        });
      });

      // setDefaultValue();
    },
    [tableData, standardData, allProperty, setDefaultValue]
  );

  // 处理删除实体
  const handleDelete = useCallback(
    (index) => {
      const newTableData = [...tableData];
      const deletedItem = newTableData.splice(index, 1)[0];
      setTableData(newTableData);

      // 计算剩余所有标签
      const remainingTags = new Set();
      standardData?.vertexTagName?.forEach((tag) => remainingTags.add(tag));
      newTableData.forEach((item) =>
        item.vertexTagName?.forEach((tag) => remainingTags.add(tag))
      );

      // 处理被删除实体的标签
      deletedItem.vertexTagName?.forEach((tagName) => {
        // 更新融合结果中的属性值
        const fusionTagItem = fusionData?.tagName?.find(
          (item) => item.tagName === tagName
        );
        const standardTagItem = standardData?.tagName?.find(
          (item) => item.tagName === tagName
        );

        if (fusionTagItem && standardTagItem) {
          fusionTagItem.vertexPropertiesVOS.forEach((property) => {
            if (property.propertyValue) {
              // 优先使用标准词的值
              const standardProp = standardTagItem.vertexPropertiesVOS.find(
                (p) => p.propertyName === property.propertyName
              );
              if (standardProp?.propertyValue) {
                property.propertyValue = standardProp.propertyValue;
              } else {
                // 从其他待融合实体中找值
                const foundItem = newTableData.find(
                  (item) => item.tagInfo?.[tagName]?.[property.propertyName]
                );
                property.propertyValue = foundItem
                  ? foundItem.tagInfo[tagName][property.propertyName]
                  : "";
              }
            }
          });
        }

        // 如果标签不再被使用，移除该标签
        if (!remainingTags.has(tagName)) {
          setAllProperty((prev) =>
            prev.filter((item) => item.tagName !== tagName)
          );
          setFusionData((prev) => {
            if (!prev) return prev;
            const newFusion = cloneDeep(prev);
            newFusion.tagName = newFusion.tagName.filter(
              (item) => item.tagName !== tagName
            );
            return newFusion;
          });
          setStandardData((prev) => {
            if (!prev) return prev;
            const newStandard = cloneDeep(prev);
            newStandard.tagName = newStandard.tagName.filter(
              (item) => item.tagName !== tagName
            );
            return newStandard;
          });
        }
      });

      setFusionData((prev) => cloneDeep(prev));
    },
    [tableData, standardData, fusionData]
  );

  // 忽略标准词
  const handleDeleteStand = useCallback(() => {
    if (tableData.length > 0) {
      // 取第一个待融合实体作为新的标准词
      const newStandardItem = tableData.shift();
      const newTableData = [...tableData];
      const processedNode = processNode(newStandardItem);

      setStandardData(processedNode);
      setFusionData(cloneDeep(processedNode));
      setTableData(newTableData);
      setAllProperty([...processedNode.originTagInfo]);

      // 合并其他实体的属性
      newTableData.forEach((item) => {
        const tagInfos = differenceBy(
          item.tagName || [],
          allProperty,
          "tagName"
        ).map((tag) => cloneDeep(tag));

        if (tagInfos.length > 0) {
          setAllProperty((prev) => [...prev, ...tagInfos]);
          setFusionData((prev) => {
            if (!prev) return prev;
            const newFusion = cloneDeep(prev);
            tagInfos.forEach((tag) => {
              tag.vertexPropertiesVOS.forEach(
                (pro) => (pro.propertyValue = "")
              );
              newFusion.tagName.push(tag);
            });
            return newFusion;
          });
          setStandardData((prev) => {
            if (!prev) return prev;
            const newStandard = cloneDeep(prev);
            newStandard.tagName.push(...cloneDeep(tagInfos));
            return newStandard;
          });
        }
      });

      // setDefaultValue();
    } else {
      // 没有待融合实体，清空所有状态
      setStandardData(null);
      setFusionData(null);
      setTableData([]);
      setAllProperty([]);
      setIsEdit(false);
    }
  }, [tableData, allProperty, setDefaultValue]);

  // 处理添加实体
  const handleAdd = useCallback(async () => {
    if (!lastSelectedValue?.vertexId) return;

    const vertexId = lastSelectedValue.vertexId;

    // 校验
    if (tableData.length > 18) {
      message.warning("仅能添加20个实体");
      return;
    }
    if (
      standardData?.vertexId === vertexId ||
      tableData.some((item) => item.vertexId === vertexId)
    ) {
      message.warning("不能添加相同的实体");
      return;
    }

    setAddLoading(true);
    try {
      const { data: nodeInfo } = await singleVertexInfoApi({
        spaceId: Number(currentNamespaceId),
        vertexId,
      });
      if (!nodeInfo.vertexId) {
        message.warning("该实体不存在");
        return;
      }

      // 处理节点数据
      const processedNode = processNode(nodeInfo);

      if (!standardData) {
        // 首次添加：设为标准词
        setStandardData(processedNode);
        setFusionData(cloneDeep(processedNode));
        setAllProperty([...(processedNode.originTagInfo || [])]);
      } else {
        // 后续添加：先加入待融合列表
        const newTableData = [...tableData, processedNode];
        setTableData(newTableData);

        // 先合并新添加实体的差异属性
        const newNodeTagInfos = differenceBy(
          processedNode.tagName || [],
          allProperty,
          "tagName"
        ).map((tag) => cloneDeep(tag));

        // 再合并所有已有实体（包括之前的）的差异属性
        const existingNodesTagInfos = [];
        newTableData.forEach((tableItem) => {
          const diffTags = differenceBy(
            tableItem.tagName || [],
            [...allProperty, ...newNodeTagInfos],
            "tagName"
          ).map((tag) => cloneDeep(tag));
          existingNodesTagInfos.push(...diffTags);
        });

        // 合并所有差异属性
        const allDiffTagInfos = [...newNodeTagInfos, ...existingNodesTagInfos];

        if (allDiffTagInfos.length > 0) {
          // 清除属性默认值
          // allDiffTagInfos.forEach((tag) => {
          //   tag.vertexPropertiesVOS?.forEach((property) => {
          //     property.propertyValue = "";
          //   });
          // });

          // 更新全量属性
          setAllProperty((prev) => [...prev, ...allDiffTagInfos]);

          // 更新融合数据的属性
          setFusionData((prev) => {
            if (!prev) return prev;
            const newFusion = cloneDeep(prev);
            newFusion.tagName.push(...allDiffTagInfos);
            const filledFusion = fillFusionEmptyProps(newFusion, newTableData);
            return filledFusion;
          });

          // 更新标准数据的属性
          setStandardData((prev) => {
            if (!prev) return prev;
            const newStandard = cloneDeep(prev);
            newStandard.tagName.push(...allDiffTagInfos);
            return newStandard;
          });
        }

        // 设置默认值
        // if (!isEdit) {
        //   setDefaultValue(newTableData);
        // }
      }
    } catch (error) {
      console.error("添加实体失败：", error);
      message.error("添加实体失败，请重试");
    } finally {
      setAddLoading(false);
    }
  }, [
    lastSelectedValue,
    tableData,
    standardData,
    allProperty,
    isEdit,
    setDefaultValue,
  ]);

  // 处理融合提交
  const handleFusion = () => {
    setModalType("fusion");
    setDeleteModalShow(true);
    setDeleteTitle("融合确认");
    setDeleteContent(
      "融合实体，所有实体信息将统一更新为融合结果的信息，请仔细确认融合结果"
    );
  };

  // 提交融合数据
  const handleSubmitFusionData = useCallback(async () => {
    if (!fusionData || !standardData) return;

    setDeleteLoading(true);
    try {
      const submitForm = {
        spaceId: Number(currentNamespaceId),
        vertexIds: tableData.map((item) => item.vertexId),
        fusionResultVO: {
          vertexId: fusionData.vertexId,
          vertexName: fusionData.vertexName,
          tagNameInfo: fusionData.tagName,
        },
      };

      const { data } = await affirmFusionApi(submitForm);
      if (data) {
        message.success("融合成功");
        // 重置状态
        setStandardData(null);
        setFusionData(null);
        setTableData([]);
        setAllProperty([]);
        setLastSelectedValue(null);
        setDisplayValue("");
        setSearchValue("");
        setOptions([]);
        setIsEdit(false);
      }
    } catch (error) {
      console.error("融合失败：", error);
      // message.error("融合失败，请重试");
    } finally {
      setDeleteLoading(false);
      setDeleteModalShow(false);
    }
  }, [fusionData, standardData, tableData, currentNamespaceId]);

  const handleRemoveConfirm = () => {};

  // 预览文件
  const handlePreview = useCallback((rawValue, value, extra) => {
    const name = isUrl(value) ? getFileName(value) : value;
    setCurrentFile({
      url: rawValue,
      name: name,
    });

    if (extra === "otherFile") {
      window.open(rawValue, "_blank");
    } else {
      setPreviewVisible(true);
    }
  }, []);

  // 处理节点数据格式化
  const processNode = useCallback((node) => {
    const processed = cloneDeep(node);
    processed.vertexTagName = node.tagName?.map((item) => item.tagName) || [];
    processed.originTagInfo = cloneDeep(node.tagName || []);
    processed.tagInfo = (node.tagName || []).reduce((pre, currentValue) => {
      pre[currentValue.tagName] = currentValue.vertexPropertiesVOS.reduce(
        (p, c) => {
          p[c.propertyName] = c.propertyValue;
          return p;
        },
        {}
      );
      return pre;
    }, {});
    return processed;
  }, []);

  // 构建表格列
  const buildTableColumns = useMemo(() => {
    if (!standardData || !fusionData) return [[], []];

    const mainColumns = [
      {
        title: tableData.length + 1,
        // colSpan: tableData.length + 3,
        render: () => null,
        rowSpan: 2,
        key: "entityCount",
        className: styles["entity-count-th"],
      },
      // 标准词列
      {
        title: (
          <div className={styles["standardWord"]} data-title="标准词">
            <div
              className={`${styles["sub-entity"]} ${styles["sub-entity-title"]}`}
            >
              <span
                className={styles["vertex-vertexName"]}
                title={standardData.vertexName}
              >
                {standardData.vertexName}
              </span>
            </div>
            <div
              className={`${styles["sub-entity"]} ${styles["sub-entity-id"]}`}
            >
              ({sliceId(standardData.vertexId)})
            </div>
            <div
              className={`${styles["sub-entity"]} ${styles["sub-entity-tag"]}`}
            >
              <img
                style={{ width: "20px" }}
                src="/knowledge/graph/entity_sub.svg"
                alt=""
              />
              <span
                title={standardData.vertexTagName?.join("/")}
                className={styles["vertex-tagName"]}
                style={{ marginLeft: "5px" }}
              >
                {standardData.vertexTagName?.join("/")}
              </span>
            </div>
          </div>
        ),
        dataIndex: "standard",
        key: "standard",
        render: () => null,
        className: styles["entity-column"],
      },
      // 待融合数据列
      ...tableData.map((item, index) => ({
        title: (
          <div>
            <div
              className={`${styles["sub-entity"]} ${styles["sub-entity-title"]}`}
            >
              <span
                className={styles["vertex-vertexName"]}
                title={item.vertexName}
              >
                {item.vertexName}
              </span>
            </div>
            <div
              className={`${styles["sub-entity"]} ${styles["sub-entity-id"]}`}
            >
              ({sliceId(item.vertexId)})
            </div>
            <div
              className={`${styles["sub-entity"]} ${styles["sub-entity-tag"]}`}
            >
              <img
                style={{ width: "20px" }}
                src="/knowledge/graph/entity_sub.svg"
                alt=""
              />
              <span
                title={item.vertexTagName?.join("/")}
                className={styles["vertex-tagName"]}
                style={{ marginLeft: "5px" }}
              >
                {item.vertexTagName?.join("/")}
              </span>
            </div>
          </div>
        ),
        dataIndex: `data-${index}`,
        key: `data-${index}`,
        render: () => null,
        className: styles["entity-column"],
      })),
      // 融合结果列
      {
        title: (
          <div className={styles["standardWord"]} data-title="融合结果">
            <div className={styles["tag-edit-wrapper"]}>
              {canCreate && (
                <EditOutlined
                  style={{ color: "#4070fd" }}
                  onClick={handleEntityEdit}
                />
              )}
            </div>
            <div
              className={`${styles["sub-entity"]} ${styles["sub-entity-title"]}`}
            >
              <span
                className={styles["vertex-vertexName"]}
                title={fusionData.vertexName}
              >
                {fusionData.vertexName}
              </span>
            </div>
            <div
              className={`${styles["sub-entity"]} ${styles["sub-entity-id"]}`}
            >
              ({sliceId(fusionData.vertexId)})
            </div>
            <div
              className={`${styles["sub-entity"]} ${styles["sub-entity-tag"]}`}
            >
              <img
                style={{ width: "20px" }}
                src="/knowledge/graph/entity_sub.svg"
                alt=""
              />
              <span
                title={fusionTag.join("/")}
                className={styles["vertex-tagName"]}
                style={{ marginLeft: "5px" }}
              >
                {fusionTag.join("/")}
              </span>
            </div>
          </div>
        ),
        dataIndex: "fusion",
        key: "fusion",
        render: () => null,
        className: styles["entity-column"],
      },
    ];

    // 操作行
    const actionColumns = [
      {
        title: "",
        render: () => null,
        key: "empty-action",
      },
      {
        title: (
          <Button type="link" danger onClick={handleDeleteStand}>
            忽略
          </Button>
        ),
        key: "standard-action",
        render: () => null,
      },
      ...tableData.map((item, index) => ({
        title: (
          <div className={styles["action-buttons"]}>
            <Button type="link" onClick={() => handleStandard(item, index)}>
              设为标准
            </Button>
            <Button type="link" danger onClick={() => handleDelete(index)}>
              忽略
            </Button>
          </div>
        ),
        key: `action-${index}`,
        render: () => null,
      })),
      {
        title: "",
        key: "fusion-action",
        render: () => null,
      },
    ];

    return [mainColumns, actionColumns];
  }, [
    standardData,
    fusionData,
    tableData,
    fusionTag,
    handleEntityEdit,
    handleDeleteStand,
    handleStandard,
    handleDelete,
  ]);

  // 构建表格数据
  const buildTableData = useMemo(() => {
    if (!allProperty.length || !standardData || !fusionData) return [];

    const uniqueAllProperty = Array.from(
      new Map(allProperty.map((item) => [item.tagName, item])).values()
    );

    const tableDataRows = [];

    uniqueAllProperty.forEach((tag, tagIndex) => {
      // 标签行
      tableDataRows.push({
        key: `tag-${tagIndex}`,
        isTagRow: true,
        tagName: tag.tagName,
      });

      // 属性行
      tag.vertexPropertiesVOS.forEach((prop, propIndex) => {
        const row = {
          key: `prop-${tagIndex}-${propIndex}`,
          propertyName: prop.propertyName,
          tagName: tag.tagName,
          propertyType: prop.propertyType,
          tagRequired: prop.tagRequired,
          extra: prop.extra,
          // 标准词属性值
          standardValue:
            standardData.tagInfo?.[tag.tagName]?.[prop.propertyName] || "",
          standardValueRaw:
            standardData.tagInfo?.[tag.tagName]?.[prop.propertyName] || "",
        };

        // 待融合数据属性值
        tableData.forEach((item, index) => {
          row[`dataValue-${index}`] = getValue(
            item,
            prop.propertyName,
            tag.tagName
          );
          row[`dataValue-${index}Raw`] = getValue(
            item,
            prop.propertyName,
            tag.tagName,
            true
          );
        });

        // 融合结果属性值
        const fusionTagItem = fusionData.tagName?.find(
          (t) => t.tagName === tag.tagName
        );
        const fusionPropItem = fusionTagItem?.vertexPropertiesVOS.find(
          (p) => p.propertyName === prop.propertyName
        );
        row.fusionValue = fusionPropItem?.propertyValue || "";
        row.fusionValueRaw = fusionPropItem?.propertyValue || "";

        tableDataRows.push(row);
      });
    });

    return tableDataRows;
  }, [allProperty, standardData, fusionData, tableData, getValue]);

  // 渲染单元格内容
  const renderCell = useCallback(
    (record, valueKey, isFusion = false, tagName, propertyName, extra) => {
      const value = record[valueKey];
      const rawValue = record[`${valueKey}Raw`] || value;

      if (isUrl(rawValue)) {
        return (
          <span
            className={styles["text-link"]}
            onClick={() => handlePreview(rawValue, value, extra)}
            title={rawValue}
          >
            {processValue(value)}
          </span>
        );
      }

      return (
        <span className={styles["content-text"]} title={value}>
          {processValue(value)}
        </span>
      );
    },
    [processValue, handlePreview]
  );

  // 渲染表格内容
  const renderTableBody = useCallback(() => {
    const [mainColumns] = buildTableColumns;
    const tableDataRows = buildTableData;

    return tableDataRows.map((record) => {
      if (record.isTagRow) {
        // 标签行
        return (
          <tr key={`tag-${record.tagName}`} className={styles["text-tag"]}>
            <td colSpan={mainColumns.length}>
              <span
                style={{ position: "sticky", left: 0, paddingLeft: "16px" }}
              >
                {record.tagName}
              </span>
            </td>
          </tr>
        );
      }

      const uniqueKey = `prop-${record.tagName}-${record.propertyName}`;

      // 属性行单元格
      const cells = [
        // 属性名称列
        <td key={`${uniqueKey}-name`} className={styles["property-name-cell"]}>
          {record.propertyName}
        </td>,
        // 标准词列
        <td key={`${uniqueKey}-standard`} className={styles["value-cell"]}>
          {renderCell(
            record,
            "standardValue",
            false,
            record.tagName,
            record.propertyName,
            record.extra
          )}
        </td>,
        // 待融合数据列
        ...tableData.map((_, index) => (
          <td
            key={`${uniqueKey}-data-${index}`}
            className={styles["value-cell"]}
          >
            {renderCell(
              record,
              `dataValue-${index}`,
              false,
              record.tagName,
              record.propertyName,
              record.extra
            )}
          </td>
        )),
        // 融合结果列
        <td key={`${uniqueKey}-fusion`} className={styles["value-cell"]}>
          <div className={styles["fusion-result"]}>
            {renderCell(
              record,
              "fusionValue",
              true,
              record.tagName,
              record.propertyName,
              record.extra
            )}
            {canCreate && (
              <EditOutlined
                style={{ color: "#4070fd" }}
                className={styles["edit-icon"]}
                onClick={() =>
                  handleEdit(
                    record.tagName,
                    record.propertyName,
                    record.propertyType,
                    record.tagRequired,
                    record.extra
                  )
                }
              />
            )}
          </div>
        </td>,
      ];

      return <tr key={record.key}>{cells}</tr>;
    });
  }, [buildTableColumns, buildTableData, tableData, renderCell, handleEdit]);

  // 渲染内容区域
  const renderContent = useCallback(() => {
    if (!standardData) {
      return (
        <NoData
          content="暂无融合实体数据，添加实体后可进行融合"
          color="#ffffff"
        />
      );
    }

    const [mainColumns, actionColumns] = buildTableColumns;

    return (
      <div className={styles["fusion-table"]}>
        <table>
          <thead>
            <tr>
              {mainColumns.map((col) => (
                <th
                  key={col.key}
                  colSpan={col.colSpan}
                  rowSpan={col.rowSpan}
                  className={col.className}
                >
                  {col.key === "entityCount" ? (
                    <span>
                      共<span style={{ color: "#4070fd" }}>{col.title}</span>
                      个实体
                    </span>
                  ) : (
                    <span>{col.title}</span>
                  )}
                </th>
              ))}
            </tr>
            <tr>
              {actionColumns.map((col) => (
                <th
                  key={col.key}
                  colSpan={col.colSpan}
                  hidden={col.key === "empty-action"}
                >
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{renderTableBody()}</tbody>
        </table>
      </div>
    );
  }, [standardData, buildTableColumns, renderTableBody]);

  return (
    <div className={styles["fusion-container"]} style={{ flex: 1 }}>
      <div className={styles["container"]} style={{ position: "relative" }}>
        {/* 搜索区域 */}
        <div className={styles["search-container"]}>
          <div className={styles["search-left"]}>
            <div className={styles["select-wrapper"]}>
              <AutoComplete
                value={displayValue}
                options={options}
                onSearch={handleSearch}
                onSelect={handleSelect}
                allowClear
                style={{ minWidth: "300px" }}
                filterOption={false}
                getPopupContainer={(trigger) => trigger.parentNode}
                onClear={() => {
                  setLastSelectedValue(null);
                  setDisplayValue("");
                  setSearchValue("");
                  setOptions([]);
                }}
                notFoundContent={fetching ? <Spin size="small" /> : null}
              >
                <Input
                  prefix={<SearchOutlined style={{ color: "#999" }} />}
                  value={displayValue}
                  className={styles["custom-input"]}
                  placeholder={
                    lastSelectedValue
                      ? lastSelectedValue.originName || "实体名称"
                      : "实体名称"
                  }
                  onChange={handleInputChange}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />
              </AutoComplete>
            </div>
            <Button
              type="primary"
              loading={addLoading}
              disabled={!lastSelectedValue}
              onClick={handleAdd}
            >
              添加
            </Button>
          </div>
          <div className={styles["search-right"]}>
            {canCreate && (
              <Button
                type="primary"
                loading={deleteLoading}
                disabled={!tableData.length}
                onClick={handleFusion}
              >
                <CheckCircleOutlined />
                确认融合
              </Button>
            )}
          </div>
        </div>

        {/* 表格内容区域 */}
        <div className={styles["content"]}>{renderContent()}</div>
      </div>

      {/* 属性编辑弹窗 */}
      <PropertyEdit
        ref={propertyEditRef}
        spaceId={currentNamespaceId}
        tableOptions={tableOptions}
        attributeForm={attributeForm}
        handlePropertyDone={handlePropertyDone}
      />

      {/* 实体编辑弹窗 */}
      <EntityEdit
        ref={entityEditRef}
        spaceId={currentNamespaceId}
        entityForm={entityForm}
        handleEntityDone={handleEntityDone}
      />

      {/* 融合弹框  */}
      <DeleteModal
        visible={deleteModalShow}
        loading={deleteLoading}
        title={deleteTitle}
        content={deleteContent}
        onCancel={() => setDeleteModalShow(false)}
        onOk={() =>
          modalType === "fusion"
            ? handleSubmitFusionData()
            : handleRemoveConfirm()
        }
      />

      {/* 预览弹窗 */}
      <PreviewModal
        visible={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        fileData={currentFile}
        fileType={fileType}
      />
    </div>
  );
});

export default KnowledgeFusion;
