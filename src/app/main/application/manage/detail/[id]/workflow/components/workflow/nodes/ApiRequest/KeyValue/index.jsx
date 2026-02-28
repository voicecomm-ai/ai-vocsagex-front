/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, forwardRef, useImperativeHandle, useEffect, useCallback } from "react";
import { Select } from "antd";
import styles from "./index.module.css";
import { useNodeData } from "../../../hooks";
import ContentInput from "../ContentInput/index";
import { useStore } from "@/store/index";
import VariableCascader from "../../../../variableCascader";

/**
 * KeyValue 组件 - 用于 API 请求中的键值对编辑
 * 支持 Headers、Params、Body 等不同类型的键值对数据编辑
 * 
 * @param {Object} props - 组件属性
 * @param {Function} props.handleFullscreenEvent - 全屏事件处理函数
 * @param {Object} props.nodeData - 节点数据
 * @param {string} props.bodyType - Body 类型（form-data 或 x-www-form-urlencoded）
 * @param {Array} props.list - 键值对列表数据
 * @param {Function} props.updateDataBytype - 更新数据的回调函数
 * @param {boolean} props.isSupportFile - 是否支持文件类型
 * @param {string} props.renderType - 渲染类型（headers/params/body）
 * @param {Object} props.data - 数据对象
 * @param {number} props.index - 索引
 * @param {Array} props.variables - 变量列表
 * @param {string} props.pannerNodeId - 面板节点 ID
 * @param {boolean} props.isFullscreen - 是否全屏
 */
const KeyValue = forwardRef(
  (
    {
      handleFullscreenEvent,
      nodeData,
      bodyType,
      key,
      list,
      isHeader,
      updateDataBytype,
      isSupportFile,
      renderType,
      data,
      index,
      variables = [],
      pannerNodeId,
      isFullscreen,
    },
    ref
  ) => {
    // 获取上游变量数据
    const { getUpstreamVariables } = useNodeData();
    // 获取只读状态
    const { readOnly } = useStore((state) => state);
    
    // 文件类型变量数据
    const [variableFileData, setVariableFileData] = useState([]);
    // 表格数据
    const [tableData, setTableData] = useState([]);
    
    // 暴露给父组件的方法（当前为空对象）
    useImperativeHandle(ref, () => ({}));
    
    // Form-data 类型选项
    const formDataTypes = [
      {
        label: "text",
        value: "text",
      },
      {
        label: "file",
        value: "file",
      },
    ];

    // 变量选择器的样式
    const variableStyle = {
      background: "rgba(242,244,246,0.5)",
    };

    /**
     * 更新表格数据模板
     * 根据不同的渲染类型（headers/params/body）和 body 类型更新对应的数据
     * 
     * @param {Object} obj - 更新对象
     * @param {number} obj.tableIndex - 表格行索引
     * @param {string} obj.rowKey - 行键（key/value/file）
     * @param {any} obj.value - 更新的值
     * @param {Array} obj.file - 文件选择器值（可选）
     */
    const handleUpdateTemplate = (obj) => {
      let newTableList = [];
      
      switch (renderType) {
        case "headers":
        case "params":
          // Headers 和 Params 类型：直接更新对应行的键或值
          newTableList = tableData.map((item, idx) => {
            if (idx === obj.tableIndex) {
              return { ...item, [obj.rowKey]: obj.value };
            }
            return item;
          });
          updateDataBytype(newTableList, renderType);
          break;
          
        case "body":
          // Body 类型：根据不同的 body 类型处理
          switch (bodyType) {
            case "form-data":
              // Form-data 类型：支持文件类型，需要特殊处理
              newTableList = tableData.map((item, idx) => {
                if (idx === obj.tableIndex) {
                  const updatedItem = { ...item };
                  // 如果是文件类型，更新文件选择器
                  if (item.type === "file" && obj.file) {
                    updatedItem.file = obj.file;
                  }
                  // 更新键或值
                  if (obj.rowKey === "key") {
                    updatedItem.key = obj.value;
                  } else {
                    updatedItem.value = obj.value;
                  }
                  return updatedItem;
                }
                return item;
              });
              break;
              
            case "x-www-form-urlencoded":
              // x-www-form-urlencoded 类型：只更新键值对
              newTableList = tableData.map((item, idx) => {
                if (idx === obj.tableIndex) {
                  return {
                    ...item,
                    [obj.rowKey]: obj.value,
                  };
                }
                return item;
              });
              break;
              
            default:
              break;
          }
          updateDataBytype(newTableList, renderType, bodyType);
          break;

        default:
          break;
      }
    };

    /**
     * 将模板字符串转换为数组
     * 用于解析变量选择器的值，支持字符串格式（{{#xxx.yyy#}}）和数组格式
     * 
     * @param {string|Array} templateStr - 模板字符串或数组
     * @returns {Array|string} 返回解析后的数组或空字符串
     */
    function convertToArr(templateStr) {
      if (!templateStr) {
        return "";
      }
      
      // 如果已经是数组，直接返回
      if (Array.isArray(templateStr)) {
        return templateStr;
      }
      
      // 解析字符串格式：{{#xxx.yyy#}} -> ["xxx", "yyy"]
      try {
        const arr1 = templateStr.split("#")[1];
        if (arr1) {
          return arr1.split(".");
        }
      } catch (error) {
        // 解析失败返回空字符串
      }
      
      return "";
    }

    /**
     * 文件变量选择变化处理
     * 当用户选择文件类型变量时，更新对应的值
     * 
     * @param {Object} obj - 变量选择对象
     * @param {Array} obj.value_selector - 值选择器数组
     * @param {number} index - 表格行索引
     */
    const onChangeFileVarible = (obj, index) => {
      const objValue = obj ? obj.value_selector.join(".") : "";
      const objData = {
        tableIndex: index,
        value: objValue === "" ? objValue : `{{#${objValue}#}} `,
        file: obj ? obj.value_selector : [],
        rowKey: "file",
      };
      handleUpdateTemplate(objData);
    };

    /**
     * 处理并渲染文件变量
     * 从上游变量中筛选出文件类型（file 和 array[file]）的变量
     */
    const handleRenderFileVariable = useCallback(() => {
      const upstreamVariables = getUpstreamVariables(pannerNodeId);
      const varTypes = ["file", "array[file]"];
      const filterArr = [];
      
      upstreamVariables.forEach((first) => {
        if (first?.children?.length) {
          // 筛选出文件类型的子变量
          const children = first.children.filter((item) => 
            varTypes.includes(item.variable_type)
          );
          // 清除子变量的 children，避免级联选择过深
          children.forEach((child) => (child.children = null));
          first.children = children.length ? children : null;
        }
        // 只保留有文件类型子变量的父节点
        if (first.children) {
          filterArr.push(first);
        }
      });
      
      setVariableFileData(filterArr);
    }, [getUpstreamVariables, pannerNodeId]);

    /**
     * 初始化：渲染文件变量
     * 从上游节点获取文件类型的变量，用于文件选择器
     */
    useEffect(() => {
      handleRenderFileVariable();
    }, [handleRenderFileVariable]);

    /**
     * 监听 list 变化，更新表格数据
     */
    useEffect(() => {
      setTableData(list);
    }, [list]);

    /**
     * 点击"值"单元格时新增一行
     * 当点击最后一行时，自动添加新行
     * 
     * @param {Event} e - 点击事件
     * @param {number} index - 当前行索引
     */
    const handleValueCellClick = (e, index) => {
      if (readOnly) return;
      
      // 只有点击最后一行时才新增
      if (index === tableData.length - 1) {
        let newRow;
        
        // 根据不同的渲染类型和 body 类型创建新行
        if (
          renderType !== "body" ||
          (renderType === "body" && bodyType === "x-www-form-urlencoded")
        ) {
          // Headers/Params 或 x-www-form-urlencoded：只有 key 和 value
          newRow = {
            key: "",
            value: "",
          };
        } else if (renderType === "body" && bodyType === "form-data") {
          // Form-data：包含 key、type 和 value
          newRow = {
            key: "",
            type: "text",
            value: "",
          };
        }
        
        const newTableList = [...tableData, newRow];
        updateDataBytype(newTableList, renderType, bodyType);
      }
      
      e.stopPropagation();
    };

    /**
     * 删除行处理
     * 删除指定索引的行，但至少保留一行
     * 
     * @param {Event} e - 点击事件
     * @param {number} index - 要删除的行索引
     */
    const handleDeleteRow = (e, index) => {
      if (readOnly) return;
      
      // 如果只有一行，不允许删除
      if (tableData.length === 1) return;
      
      const newTableList = tableData.filter((row, i) => i !== index);
      updateDataBytype(newTableList, renderType, bodyType);
      e.stopPropagation();
    };

    /**
     * 切换 Form-data 类型（text/file）
     * 当用户切换类型时，重置值为空
     * 
     * @param {string} e - 新的类型值（text/file）
     * @param {number} index - 表格行索引
     */
    const handleChangeFormdataType = (e, index) => {
      const itemKey = tableData[index].key;
      const updatedTableData = [...tableData];
      updatedTableData[index] = {
        key: itemKey,
        type: e,
        value: "", // 切换类型时重置值
      };
      
      updateDataBytype(updatedTableData, renderType, bodyType);
    };
    // 根据 renderType 决定背景色
    const getCellBackground = () => {
      return renderType === "body" ? "rgba(242,244,246,0.5)" : "#fff";
    };

    return (
      <div className={styles.contentInput}>
        {/* 只有当表格数据存在且不为空时才渲染 */}
        {tableData && tableData.length !== 0 && (
          <div className={styles["key-value-table-wrapper"]}>
            <div className={styles["key-value-table"]}>
              {/* 表头 */}
              <div className={styles["table-header-wrap"]}>
                {/* 键列 */}
                <div
                  className={styles["table-header"]}
                  style={{ width: isSupportFile ? "200px" : "210px" }}
                >
                  键
                </div>
                {/* 类型列：仅在支持文件类型时显示 */}
                {isSupportFile && (
                  <div
                    style={{ width: "68px" }}
                    className={styles["table-header"]}
                  >
                    类型
                  </div>
                )}
                {/* 值列 */}
                <div
                  className={styles["table-header"]}
                  style={{ width: isSupportFile ? "200px" : "210px" }}
                >
                  值
                </div>
              </div>
              
              {/* 表体 */}
              <div className={styles["table-body"]}>
                {tableData.map((row, index) => {
                  return (
                    <div key={`${renderType}_${index}`} className={styles["table-row"]}>
                      {/* 键单元格 */}
                      <div
                        className={`${styles["table-cell"]} ${styles["key-cell"]}`}
                        style={{ width: isSupportFile ? "200px" : "210px" }}
                      >
                        <ContentInput
                          className={`${styles["cell-input"]} ${styles["value-input"]}`}
                          nodeData={data}
                          minHeight={36}
                          data={row?.key || ""}
                          bg={getCellBackground()}
                          tableIndex={index}
                          renderType={renderType}
                          bodyType={bodyType}
                          rowKey="key"
                          minWidth={200}
                          isHeader={false}
                          updateDataEvent={handleUpdateTemplate}
                          variables={variables}
                          pannerNodeId={pannerNodeId}
                          readOnly={readOnly}
                          isUpdate={true}
                        />
                      </div>
                      
                      {/* 类型单元格：仅在支持文件类型时显示 */}
                      {isSupportFile && (
                        <div
                          className={`${styles["table-cell"]} ${styles["key-cell"]}`}
                          style={{ width: "68px" }}
                        >
                          <Select
                            value={row.type}
                            style={{ height: '36px',background: '#F5F9FC',borderRadius: '8px' }}
                            variant='borderless'
                            className={styles["select_custom_type"]}
                            onChange={(e) => handleChangeFormdataType(e, index)}
                            disabled={readOnly}
                            options={formDataTypes}
                          />
                        </div>
                      )}
                      
                      {/* 值单元格：点击最后一行可新增 */}
                      <div
                        className={`${styles["table-cell"]} ${styles["value-cell"]}`}
                        style={{ width: isSupportFile ? "200px" : "235px" }}
                        onClick={(e) => handleValueCellClick(e, index)}
                      >
                        <div className="value-cell-content">
                          {isSupportFile ? (
                            // 支持文件类型：根据类型显示不同的输入组件
                            <>
                              {row.type === "text" ? (
                                // 文本类型：使用 ContentInput
                                <ContentInput
                                  className={`${styles["cell-input"]} ${styles["value-input"]}`}
                                  nodeData={data}
                                  data={row?.value || ""}
                                  isHeader={false}
                                  bg={getCellBackground()}
                                  minHeight={36}
                                  tableIndex={index}
                                  bodyType={bodyType}
                                  renderType={renderType}
                                  rowKey="value"
                                  minWidth={200}
                                  updateDataEvent={handleUpdateTemplate}
                                  variables={variables}
                                  pannerNodeId={pannerNodeId}
                                  readOnly={readOnly}
                                  isUpdate={true}
                                />
                              ) : (
                                // 文件类型：使用变量级联选择器
                                <VariableCascader
                                  disabled={readOnly}
                                  onChange={(value) => onChangeFileVarible(value, index)}
                                  value_selector={convertToArr(row?.value)}
                                  data={variableFileData}
                                  style={variableStyle}
                                />
                              )}
                            </>
                          ) : (
                            // 不支持文件类型：直接使用 ContentInput
                            <ContentInput
                              className={`${styles["cell-input"]} ${styles["value-input"]}`}
                              nodeData={data}
                              data={row?.value || ""}
                              isHeader={false}
                              tableIndex={index}
                              minHeight={36}
                              minWidth={200}
                              bg={getCellBackground()}
                              renderType={renderType}
                              bodyType={bodyType}
                              rowKey="value"
                              updateDataEvent={handleUpdateTemplate}
                              variables={variables}
                              pannerNodeId={pannerNodeId}
                              readOnly={readOnly}
                              isUpdate={true}
                            />
                          )}
                        </div>
                      </div>
                      
                      {/* 删除按钮：当有多行时显示，每行都有删除按钮 */}
                      {tableData.length > 1 && (
                        <div className="node_edit_icon">
                        <img
                          alt="删除行"
                          className={styles["delete-row-btn"]}
                          src="/workflow/common/delete.png"
                          onMouseEnter={(e) => (e.currentTarget.src = "/workflow/common/delete_hover.png")}
                          onMouseLeave={(e) => (e.currentTarget.src = "/workflow/common/delete.png")}
                          onClick={(e) => handleDeleteRow(e, index)}
                        />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

export default KeyValue;
