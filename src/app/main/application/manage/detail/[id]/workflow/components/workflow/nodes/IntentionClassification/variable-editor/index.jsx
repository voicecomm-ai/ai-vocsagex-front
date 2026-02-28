"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import VariablePopup from "./components/VariablePopup";
import styles from "./variable-editor.module.css";
import HighlightNode from "./extensions/HighlightNode";
import { Placeholder } from "@tiptap/extensions";

const VariableEditor = forwardRef((props, ref) => {
  const {
    value = "",
    onChange,
    placeholder = "请输入附加说明,比如:丰富的分类依据,增强分类能力,引用“{”、“/”插入变量；",
    variables = [],
    showWordCount = true,
    onWordCountChange,
    onCharCountChange,
    style = {},
    className = "",
    readOnly = false,
    maxLength,
    autoFocus = false,
    status = "default", // 'default' | 'error' | 'warning' | 'success'
    onFocus,
    onBlur,
    onVariableSelect,
    isContext = false, //是否已经配置上下文
    showContext = false, //是否展示上下文
    pannerNodeId = null,
  } = props;

  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState(null); //变量菜单位置
  const [editorWidth, setEditorWidth] = useState(360); //编辑器宽度
  const isPastingRef = useRef(false);

  useImperativeHandle(ref, () => ({
    renderToTiptapJSON,
    setValueEvent,
  }));

  //
  //设置值事件
const setValueEvent = (text) => {
  const renderText = renderToTiptapJSON(text);
  editor.commands.setContent(renderText, false); // false 表示保留 undo stack
};

  //渲染为Tiptap JSON
const renderToTiptapJSON = (text) => {
  if (!text)
    return {
      type: "doc",
      content: [],
    };

  const highlightRegex = /\{\{#[^}]+#\}\}/g;

  // 按换行切段
  const paragraphs = text.split("\n").map((line) => {
    const nodes = [];
    let lastIndex = 0;
    let match;

    while ((match = highlightRegex.exec(line)) !== null) {
      const index = match.index;

      if (index > lastIndex) {
        nodes.push({
          type: "text",
          text: line.slice(lastIndex, index),
        });
      }

      nodes.push({
        type: "HighlightNode",
        attrs: { content: match[0] },
      });

      lastIndex = index + match[0].length;
    }

    if (lastIndex < line.length) {
      nodes.push({
        type: "text",
        text: line.slice(lastIndex),
      });
    }

    return {
      type: "paragraph",
      content: nodes.length > 0 ? nodes : [],
    };
  });

  return {
    type: "doc",
    content: paragraphs,
  };
};

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      HighlightNode.configure({
        variables: variables, // 👈 这里传进去
        pannerNodeId: pannerNodeId,
      }),
      Placeholder.configure({
        placeholder: placeholder, // 你的占位符文本
        emptyEditorClass: styles.placeholder,
      }),
    ],
    content: renderToTiptapJSON(value),
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: styles.editorInput,
      },
      handleDOMEvents: {
        focus: (view, event) => {
          if (onFocus) {
            onFocus(event);
          }
        },
        blur: (view, event) => {
          // setIsVisible(false)
          if (onBlur) {
            onBlur(event);
          }
        },
      },
    },
    autofocus: autoFocus,
    onUpdate: ({ editor }) => {
      // 避免初始化时就触发 onChange
      if (isInitRef.current) {
        isInitRef.current = false;
        return;
      }
      
      handleChange(editor);
      handleTextChange(editor);

    },
  });
  const isInitRef = useRef(true);

useEffect(() => {
  if (!editor) return;

  // 避免死循环：只在外部传入的 value 和编辑器内容不同的时候才更新
  const currentText = extractTextFromTiptapJSON(editor.getJSON());

  if (isInitRef.current) {
    setValueEvent(value);
    isInitRef.current = false;
  } else if (currentText !== value) {
    // 只有当外部 value 改变时才更新内容
    setValueEvent(value);
  }
}, [value, editor]);

  useEffect(() => {
    if (editor) {
      setEditorWidth(editor.view.dom.clientWidth);
    }
  }, [editor]);
  useEffect(() => {
    updateWordCount(value);
  }, [value]);

  //处理文本change  字数统计
  const handleTextChange = (editor) => {
    let text = extractTextFromTiptapJSON(editor.getJSON());
    console.log(text,'');
    
    updateWordCount(text);
    if (onChange) {
      //如果onChange存在，则调用onChange
      onChange(text);
    }
  };
  //提取文本
  const extractTextFromTiptapJSON = (node) => {
    if (!node) return "";

    // 如果是纯文本节点
    if (node.type === "text") {
      return node.text || "";
    }
    // 如果是自定义节点 HighlightNode，提取其 content
    if (node.type === "HighlightNode") {
      return (node.attrs && node.attrs.content) || "";
    }
    // 段落节点 -> 换行
  if (node.type === "paragraph") {
    const text = (node.content || [])
      .map(extractTextFromTiptapJSON)
      .join("");
    return text + "\n"; // 🔑 段落末尾补一个换行
  }

    // 如果是容器节点，递归处理其内容
    if (Array.isArray(node.content)) {
      return node.content.map(extractTextFromTiptapJSON).join("");
    }
    // 其他情况返回空字符串
    return "";
  };

  //处理编辑器输入change 事件
  const handleChange = useCallback((editor) => {
    const state = editor.state;
    const { $from } = state.selection;
    const before = state.doc.textBetween($from.pos - 1, $from.pos, "\0", "\0");
    if (before === "/" || before === "{") {
      let { from } = editor.state.selection;
      let pos = editor.view.coordsAtPos(from);

      // 获取编辑器 DOM 的位置（相对于窗口）
      let editorEl = editor.view.dom;
      let editorRect = editorEl.getBoundingClientRect();
      let editorWidth = editorRect.width; //获取编辑器宽度

      // 计算相对于编辑器容器的坐标
      let left = pos.left - editorRect.left;
      if (left > editorWidth / 5) {
        //如果光标在编辑器宽度1/4之后，则将变量菜单显示在编辑器宽度1/4处
        left = editorWidth / 5;
      }
      let top = pos.top - editorRect.top;
      setCoords({ x: left, y: top + 24 }); // 下移一点，避免遮住光标
      setIsVisible(true); //显示变量菜单
    } else {
      setIsVisible(false); //隐藏变量菜单
    }
  }, []);

  // 字数统计函数
  const updateWordCount = useCallback(
    (text) => {
      const charCount = text.length;
      if (onCharCountChange) {
        onCharCountChange(charCount);
      }
      if (onWordCountChange) {
        onWordCountChange(charCount);
      }
    },
    [onCharCountChange, onWordCountChange]
  );

  // 处理变量选择
  const handleVariableSelect = useCallback(
    (variable) => {
      if (!variable || !editor) return;
      let value_selector = variable.value_selector || [];
      if (variable.variable_type == "context") {
        value_selector = ["context"];
      }
      const format = `{{#${value_selector.join(".")}#}}`;
      // 获取当前选择位置
      const { from, to } = editor.state.selection;
      // 计算需要删除的字符数（触发字符）
      let deleteCount = 1; // 默认删除一个字符（/ 或 {）

      // 删除触发字符并插入变量
      editor
        .chain()
        .deleteRange({ from: from - deleteCount, to: from })
        .insertContent({
          type: "HighlightNode", //节点名称
          attrs: { content: format }, // 节点属性
        })
        .run();
      setIsVisible(false);

      if (onVariableSelect) {
        onVariableSelect(variable);
      }
    },
    [editor]
  );

  //编辑器样式
  const containerClassName = [
    styles.container,
    readOnly && styles.readOnly,
    status !== "default" && styles[status],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClassName} style={style}>
      <EditorContent editor={editor} />

      {/* 变量弹框 */}
      {isVisible && coords && (
        <VariablePopup
          editorWidth={editorWidth}
          visible={isVisible}
          position={coords}
          variables={variables}
          onSelect={handleVariableSelect}
          onClose={() => setIsVisible(false)}
        />
      )}
    </div>
  );
});

export default VariableEditor;
