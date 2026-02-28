import { useState, useEffect, useRef, useMemo } from "react";
import styles from "../page.module.css";
import { Badge, Descriptions } from "antd";
import { convertNumberToChinese } from "@/utils/graph/extractConfig";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";

const ExtractPreview = ({ index, extractData }) => {
  const desItems = useMemo(() => {
    return [
      {
        key: "1",
        label: "主体类型",
        children: (
          <span title={extractData.subjectTag}>{extractData.subjectTag}</span>
        ),
        span: 1,
      },
      {
        key: "2",
        label: "主体名称",
        children: (
          <span title={extractData.subjectName}>{extractData.subjectName}</span>
        ),
        span: 1,
      },
      {
        key: "3",
        label: "关系/属性",
        children: (
          <span title={extractData.edgeProperty}>
            {extractData.edgeProperty}
          </span>
        ),
        span: 1,
      },
      {
        key: "4",
        label: "客体类型",
        children: (
          <span title={extractData.objectTag}>{extractData.objectTag}</span>
        ),
        span: 1,
      },
      {
        key: "5",
        label: "客体名称",
        children: (
          <span title={extractData.objectNameValue}>
            {extractData.objectNameValue}
          </span>
        ),
        span: 1,
      },
    ];
  }, [extractData]);

  return (
    <div className={styles["extract-preview-item"]}>
      <div className={styles["extract-header"]}>
        第{convertNumberToChinese(index + 1)}组
      </div>
      <div className={styles["extract-preview-item-content"]}>
        <Descriptions
          column={1}
          size="middle"
          style={{
            height: "100%",
            flex: 2,
            label: { fontWeight: "bold", color: "#1890ff", fontSize: "14px" },
            content: {
              padding: "12px 16px",
              maxWidth: "209px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            },
          }}
          bordered
          items={desItems}
        />
        <div className={styles["chunk-content"]}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkBreaks]}
            rehypePlugins={[rehypeRaw]}
            components={{
              h1: (props) => (
                <h1
                  style={{
                    fontSize: "24px",
                    fontWeight: "bold",
                    margin: "16px 0",
                  }}
                  {...props}
                />
              ),
              p: (props) => (
                <p style={{ lineHeight: "1.8", margin: "8px 0" }} {...props} />
              ),
              a: (props) => (
                <a
                  href={props.href}
                  target="_blank"
                  style={{ color: "#1890ff", textDecoration: "none" }}
                  {...props}
                />
              ),
              table: (props) => (
                <table
                  style={{
                    width: "100%",
                    border: "1px solid #d9d9d9",
                    borderCollapse: "collapse",
                    margin: "16px 0",
                    borderSpacing: "0",
                  }}
                  {...props}
                />
              ),
              th: (props) => (
                <th
                  style={{
                    border: "1px solid #d9d9d9",
                    padding: "8px 12px",
                    backgroundColor: "#f5f5f5",
                    fontWeight: "bold",
                    textAlign: "left",
                    color: "#333",
                    ...(props.colSpan === undefined &&
                      props.children && {
                        borderLeft:
                          props.index === 0 ? "none" : "1px solid #d9d9d9",
                      }),
                  }}
                  {...props}
                />
              ),
              td: (props) => (
                <td
                  style={{
                    border: "1px solid #d9d9d9",
                    padding: "8px 12px",
                    color: "#666",
                    lineHeight: "1.6",
                    ...(props.colSpan === undefined &&
                      props.children && {
                        borderLeft:
                          props.index === 0 ? "none" : "1px solid #d9d9d9",
                      }),
                  }}
                  {...props}
                />
              ),
            }}
          >
            {extractData.chunkContent}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default ExtractPreview;
