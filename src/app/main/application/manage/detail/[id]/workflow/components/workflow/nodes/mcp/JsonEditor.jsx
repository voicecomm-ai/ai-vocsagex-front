import React, {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useState,
} from "react";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import styles from "./mcp.module.css";

const JsonEditor = forwardRef(
  (
    { content, onChange, onError, showLineNumbers = false, readOnly = false },
    ref
  ) => {
    const editorRef = useRef(null);
    const containerRef = useRef(null);

    // 初始化时自动把对象转成字符串
    const [value, setValue] = useState(() =>
      typeof content === "string" ? content : JSON.stringify(content, null, 2)
    );

    const handleChange = (val) => {
      setValue(val);
      onChange?.(val);
    };

    // 暴露给父组件的设置内容方法
    useImperativeHandle(ref, () => ({
      setContent: (newContent) => {
        const stringValue =
          typeof newContent === "string"
            ? newContent
            : JSON.stringify(newContent, null, 2);
        setValue(stringValue);
      },
    }));

    return (
      <CodeMirror
        className={styles["json_editor"]}
        value={value}
        height="100%"
        extensions={[json()]}
        onChange={handleChange}
        readOnly={readOnly}
        basicSetup={{
          lineNumbers: showLineNumbers,
          foldGutter: showLineNumbers,
          highlightActiveLine: showLineNumbers,
        }}
      />
    );
  }
);

export default JsonEditor;
