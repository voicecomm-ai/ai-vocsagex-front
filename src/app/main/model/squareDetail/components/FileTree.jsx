import { useState } from "react";
import styles from "../page.module.css"; //
import { modelDownload } from "@/api/model";

const FileTree = ({ data, path, showUpload }) => {
  const handleDownload = async (node, fullPath) => {
    console.log(node, "node");

    let params = {
      zipPath: path.replace("/file", "/data1"),
      entryPath: null,
    };
    if (node.type === "folder") {
      params.entryPath = node.name + "/";
    } else {
      params.entryPath = node.name;
    }
    const downloadParams = {
      zipPath: path.replace("/file", "/data1"),
      entryPath:
        node.type === "folder"
          ? fullPath.replace(/^[^\/]+\//, "") + "/"
          : fullPath.replace(/^[^\/]+\//, ""),
    };
    const filename = node.type === "folder" ? node.name + ".zip" : node.name; //文件夹需要加上zip后缀防止下载空白文件
    try {
      await modelDownload(downloadParams, filename);
    } catch (error) {
      console.debug(error);
    }
  };
  return (
    <div>
      <TreeNode
        node={data}
        onDownload={handleDownload}
        showUpload={showUpload}
      />
    </div>
  );
};

const TreeNode = ({ node, onDownload, parentPath = "", showUpload }) => {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = Array.isArray(node.children) && node.children.length > 0;
  // 当前节点完整路径（不含当前是 zip）
  const fullPath = parentPath ? `${parentPath}/${node.name}` : node.name;
  return (
    <div>
      <div className={styles["file-node"]}>
        <div
          className={styles["file-title"]}
          onClick={() => setExpanded(!expanded)}
        >
          {node.type === "folder" || node.type === "zip" ? (
            <img
              src="/model/folder.png"
              width={16}
              className={styles["file-icon"]}
            ></img>
          ) : (
            <img
              src="/model/file_md.png"
              width={16}
              className={styles["file-icon"]}
            ></img>
          )}
          <span className={styles["file-name"]}>{node.name}</span>
        </div>
        {/* 文件大小及下载 */}
        {node.size && node.type !== "folder" && (
          <span className={styles["file-size"]}>{node.size}</span>
        )}
        {node.name !== fullPath && showUpload === "true" && (
          <img
            src="/model/file_upload.png"
            alt=""
            className={styles["download-icon"]}
            width={16}
            onClick={() => onDownload(node, fullPath)}
          />
        )}
      </div>

      {hasChildren && expanded && (
        <div className={styles["children-wrapper"]}>
          {node.children.map((child, index) => (
            <TreeNode
              key={child.name + index}
              node={child}
              onDownload={onDownload}
              parentPath={fullPath}
              showUpload={showUpload}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FileTree;
