"use client";
import React, { forwardRef } from "react";
import { Table } from "antd";

const columns = [
  {
    title: "数据类型",
    dataIndex: "type",
    key: "type",
    width: 120,
  },
  {
    title: "释义",
    dataIndex: "paraphrase",
    key: "paraphrase",
    width: 220,
  },
  {
    title: "范围",
    dataIndex: "range",
    key: "range",
    width: 280,
  },
];

const dataSource = [
  {
    key: "1",
    type: "INT64",
    paraphrase: "64位整数",
    range: "-9,223,372,036,854,775,808 ~ 9,223,372,036,854,775,807",
  },
  {
    key: "2",
    type: "INT32",
    paraphrase: "32位整数",
    range: "-2,147,483,648 ~ 2,147,483,647",
  },
  {
    key: "3",
    type: "INT16",
    paraphrase: "16位整数",
    range: "-32,768 ~ 32,767",
  },
  {
    key: "4",
    type: "INT8",
    paraphrase: "8位整数",
    range: "-128 ~ 127",
  },
  {
    key: "6",
    type: "DOUBLE",
    paraphrase: "双精度浮点",
    range: "1.7E +/- 308",
  },
  {
    key: "7",
    type: "BOOL",
    paraphrase: "布尔数据，可选择true或false",
    range: "--",
  },
  {
    key: "8",
    type: "STRING",
    paraphrase: "变长字符串",
    range: "--",
  },
  {
    key: "9",
    type: "FIXED_STRING(<N>)",
    paraphrase: "定长字符串N为长度，不可存储超过固定长度字符",
    range: "--",
  },
  {
    key: "10",
    type: "DATE",
    paraphrase: "日期格式，为YYYY-MM-DD",
    range: "--",
  },
  {
    key: "11",
    type: "TIME",
    paraphrase: "时间包含hour、minute、second，固定格式hh:mm:ss",
    range: "--",
  },
  {
    key: "12",
    type: "DATETIME",
    paraphrase: "固定格式YYYY-MM-DD hh:mm:ss",
    range: "--",
  },
  {
    key: "13",
    type: "TIMESTAMP",
    paraphrase: "固定格式YYYY-MM-DD hh:mm:ss",
    range: "--",
  },
];

const Tips = forwardRef((props, ref) => {
  return (
    <div style={{ width: "700px", padding: "12px" }}>
      <Table
        size="small"
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        rowKey="key"
      />
    </div>
  );
});

Tips.displayName = "Tips";

export default Tips;
