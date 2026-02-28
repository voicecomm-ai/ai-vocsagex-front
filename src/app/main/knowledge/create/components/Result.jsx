"use client";
import React, {
  useState,
  forwardRef,
  useEffect,
  useImperativeHandle,
} from "react";
import styles from "../create.module.css";
import { Button, Input, Typography } from "antd";
import { useRouter, useParams } from "next/navigation";

const CreateResult = forwardRef((props, ref) => {
  const router = useRouter();
  const [documentList, setDocumentList] = useState([]);
  const [conf, setConf] = useState(null);
  const { Paragraph, Text } = Typography;
  const knowledgeType = {
    FULL_TEXT: "全文检索",
    HYBRID: "混合检索",
    VECTOR: "向量检索",
  };
  const imgUrls = {
    txt: "/knowledge/txt.png",
    markdown: "/knowledge/other.png",
    mdx: "/knowledge/other.png",
    pdf: "/knowledge/pdf.png",
    html: "/knowledge/other.png",
    xlsx: "/knowledge/xlsx.png",
    docx: "/knowledge/docx.png",
    csv: "/knowledge/csv.png",
    md: "/knowledge/other.png",
    htm: "/knowledge/other.png",
  };
  useEffect(() => {
    setConf(props.saveData);
    setDocumentList(props.documentList);
  }, [props]);

  //跳转到文档列表界面
  const goDocumentEvent = () => {
    router.push(`/main/knowledge/document?id=${props.saveData.id}&type=list`);
  };
  const getFileNameWithExt = (name, maxLength) => {
    const lastDotIndex = name.lastIndexOf(".");
    if (lastDotIndex === -1) {
      return name.length <= maxLength ? name : name.slice(0, maxLength);
    }
    const ext = name.slice(lastDotIndex);
    const nameWithoutExt = name.slice(0, lastDotIndex);
    if (nameWithoutExt.length <= maxLength) return name;
    return nameWithoutExt.slice(0, maxLength) + ext;
  };

  return (
    <div className={styles["result_content"]}>
      <div className={styles["result_content_container"]}>
        <div className={styles["result_content_header"]}>
          <img src="/knowledge/created.png" />
          <div className={styles["result_content_header_title"]}>
            {" "}
            知识库已创建！
          </div>
          <div className={styles["result_content_header_tip"]}>
            我们自动为该知识库起了个名称，您可以前往编辑处修改!
          </div>
        </div>
        <div className={styles["result_content_main"]}>
          <div className={styles["result_content_main_name"]}>
            <div className={styles["result_content_main_label"]}>
              知识库名称：
            </div>
            <Input
              showCount
              maxLength={50}
              disabled
              value={conf ? (conf.name ? conf.name.slice(0, 50) : "") : ""}
              className={styles["result_content_main_input"]}
            />
          </div>

          <div className={styles["result_content_handle"]}>嵌入处理中...</div>
          <div className={styles["result_content_document"]}>
            {documentList.map((item) => (
              <div className={styles["result_content_document_item"]}>
                <img
                  className={styles["result_content_document_item_img"]}
                  src={
                    imgUrls[item.name.slice(item.name.lastIndexOf(".") + 1)] ||
                    "/knowledge/other.png"
                  }
                />
                <div className={styles["result_content_document_item_title"]}>
                  <Text
                    style={{ maxWidth: 1040 }}
                    ellipsis={{ tooltip: getFileNameWithExt(item.name, 100) }}
                  >
                    {getFileNameWithExt(item.name, 100)}
                  </Text>
                </div>
              </div>
            ))}
          </div>
          <div className={styles["result_content_border"]}></div>

          {conf && (
            <div className={styles["result_content_conf"]}>
              <div className={styles["result_content_conf_item"]}>
                <div className={styles["result_content_conf_item_label"]}>
                  分段模式
                </div>
                <div className={styles["result_content_conf_item_content"]}>
                  {conf.chunkingStrategy === "COMMON"
                    ? conf.baseConf.enable
                      ? "普通-QA分段"
                      : "普通分段"
                    : "高级分段"}
                </div>
              </div>
              <div className={styles["result_content_conf_item"]}>
                <div className={styles["result_content_conf_item_label"]}>
                  最大分段长度
                </div>
                <div className={styles["result_content_conf_item_content"]}>
                  {conf.chunkingStrategy === "COMMON"
                    ? conf.baseConf.chunkSize
                    : conf.chunkingStrategy === "PARENT_CHILD"
                    ? conf.parentConf.fulltext
                      ? `父  1024;  子  ${conf.previewParams.childChunkSetting.chunkSize}`
                      : `父  ${conf.parentConf.chunkSize};  子  ${conf.previewParams.childChunkSetting.chunkSize}`
                    : ""}
                </div>
              </div>
              <div className={styles["result_content_conf_item"]}>
                <div className={styles["result_content_conf_item_label"]}>
                  文本预处理规则
                </div>
                <div className={styles["result_content_conf_item_content"]}>
                  {(() => {
                    const rules = [];
                    if (conf.baseConf.filterBlank) {
                      rules.push("替换掉连续的空格、换行符和制表符");
                    }
                    if (conf.baseConf.removeUrl) {
                      rules.push("删除所有 URL 和电子邮件地址");
                    }
                    if (rules.length === 0) {
                      return "-";
                    }
                    return rules.join(",");
                  })()}
                </div>
              </div>
              <div className={styles["result_content_conf_item"]}>
                <div className={styles["result_content_conf_item_label"]}>
                  检索设置
                </div>
                <div className={styles["result_content_conf_item_content"]}>
                  {knowledgeType[conf.searchStrategy]}
                </div>
              </div>
            </div>
          )}
          <div className={styles["result_content_footer"]}>
            <Button
              onClick={goDocumentEvent}
              className={styles["result_content_footer_btn"]}
              type="primary"
            >
              前往文档
              <img src="/knowledge/go.png" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});
export default CreateResult;
