'use client'

import React from "react";
import Editor , { loader,useMonaco } from '@monaco-editor/react'
import { basePath } from '@/utils/var'
import styles from './workflow.module.css'
loader.config({ paths: { vs: `${basePath}/vs` } }) 

const JsonViewer = ({ data }) => {
  const monaco = useMonaco();

  // 自定义主题（可根据需要改颜色）
  React.useEffect(() => {
    if (monaco) {
      monaco.editor.defineTheme("customTheme", {
        base: "vs", // 也可以用 "vs-dark"
        inherit: true,
        rules: [
          { token: "string.key.json", foreground: "1a73e8" }, // key 蓝色
          { token: "string.value.json", foreground: "666E82" }, // value 灰色
        ],
        colors: {
       
          "editor.background": "#00000000", // transparent
          "editorGutter.background": "#00000000",
          "editorLineNumber.foreground": "#aaa",
          "editorCursor.foreground": "#666",
        },
      });
    }
  }, [monaco]);
  return (
<div className={styles.json_viewer}>
      <Editor
       style={{height: "100%"}}
        language="python"
        theme="customTheme" // 使用自定义主题
        value={JSON.stringify(data, null, 2)}
        options={{
          readOnly: true,            // ✅ 只读模式
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: "on",
          lineNumbers: "off",
          folding: true,
          renderLineHighlight: "none",
          cursorBlinking: "solid",
          scrollbar: {
          
            horizontal: "hidden", // 可选，隐藏水平滚动条
          },
          overviewRulerLanes: 0,      // ✅ 隐藏右侧概览标尺
          overviewRulerBorder: false, // 去掉边框
        }}
      />
      </div>
  );
};

export default JsonViewer;
