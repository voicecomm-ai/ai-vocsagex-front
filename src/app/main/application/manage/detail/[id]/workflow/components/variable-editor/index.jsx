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
import CodeBlock from "@tiptap/extension-code-block"; // 引入代码块扩展
import PasteListener from "./extensions/PasteListener";

const VariableEditor = forwardRef((props, ref) => {
  const {
    value = "",
    onChange,
    placeholder = '请输入内容，使用"/"或"{"插入变量',
    variables = [],
    onWordCountChange,
    onCharCountChange,
    style = {},
    className = "",
    readOnly = false,
    autoFocus = false,
    status = "default", // 'default' | 'error' | 'warning' | 'success'
    onFocus,
    onBlur,
    onVariableSelect,
    isContext = false, //是否已经配置上下文
    showContext = false, //是否展示上下文
    filterData = [], //需要展示的变量类型数组
    allowMiddleSelect = true, //是否允许选择中间变量
  } = props;

  const [isVisible, setIsVisible] = useState(false);
  const [referenceElement, setReferenceElement] = useState(null); //参考元素（光标位置）
  const [editorWidth, setEditorWidth] = useState(360); //编辑器宽度
  const [showAbove, setShowAbove] = useState(false); //是否显示在光标上方
  const isPastingRef = useRef(false);
  const [isFocus, setIsFocus] = useState(false);

  useImperativeHandle(ref, () => ({
    renderToTiptapJSON,
    setValueEvent,
  }));

  useEffect(() => {
    if (editor) {
      setValueEvent(value);
      // console.log(value, "value");
    }
  }, [value]);
  //设置值事件
  const setValueEvent = (text) => {
    let renderText = renderToTiptapJSON(text);
    editor.commands.setContent(renderText);
  };
  //处理粘贴事件，转换内容格式
  const handlePaste = (pasteText, event, that) => {
    isPastingRef.current = true;
  };
  //渲染为Tiptap JSON
  const renderToTiptapJSON = (text) => {
    if (!text)
      return {
        type: "doc",
        content: [],
      };

    const highlightRegex = /\{\{#[^}]+#\}\}/g;
    const paragraphs = text.split("\n");
    const docContent = [];

    for (const paragraphText of paragraphs) {
      const nodes = [];
      let lastIndex = 0;
      let match;

      while ((match = highlightRegex.exec(paragraphText)) !== null) {
        const index = match.index;

        const plainText = paragraphText.slice(lastIndex, index);
        if (plainText) {
          nodes.push({
            type: "text",
            text: plainText,
          });
        }

        nodes.push({
          type: "HighlightNode",
          attrs: {
            content: match[0],
          },
        });

        lastIndex = index + match[0].length;
      }

      const remainingText = paragraphText.slice(lastIndex);
      if (remainingText) {
        nodes.push({
          type: "text",
          text: remainingText,
        });
      }

      // ✅ 如果节点为空，则插入一个空段落（不插入空 text 节点）
      docContent.push({
        type: "paragraph",
        content: nodes.length > 0 ? nodes : [{ type: "text", text: " " }],
      });
    }

    return {
      type: "doc",
      content: docContent,
    };
  };

  // 辅助函数：美化 JSON 格式（添加缩进）
  const formatJSON = (text) => {
    const obj = JSON.parse(text.trim());
    return JSON.stringify(obj, null, 2); // 缩进 2 个空格，保留标准格式
  };

  // 辅助函数：判断文本是否为 JSON
  const isJSON = (text) => {
    try {
      JSON.parse(text.trim());
      return true;
    } catch (e) {
      return false;
    }
  };

  /**
 * 判断文本是否为 JSON 或任意语言代码
 * 返回：
 *  - 'json' → 严格 JSON 对象或数组
 *  - 'code' → 任意语言代码
 *  - false → 普通文本
 */
  const detectJsonOrCode = (text) => {
    if (!text) return false;
  
    const trimmed = text.trim();
  
    // --------- JSON 判断 ---------
    if (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"))
    ) {
      try {
        const parsed = JSON.parse(trimmed);
        if (typeof parsed === "object" && parsed !== null) return "json";
      } catch {
        // 解析失败，继续判断为代码或普通文本
      }
    }
  
    // --------- 代码判断 ---------
    const lines = trimmed.split("\n");
  
    // 多行 + 至少包含一个代码特征符号 → code
    const codeChars = /[{}();=<>[\]$@]/;
    const codeKeywords = /\b(class|function|def|import|package|var|let|const|if|else|for|while|switch|return|try|catch|interface|enum|struct|public|private|protected|static)\b/i;
    const commentPattern = /^\s*(\/\/|\/\*|#|<!--)/;
  
    let containsCodeChar = codeChars.test(trimmed);
    let containsKeyword = codeKeywords.test(trimmed);
    let containsComment = lines.some(line => commentPattern.test(line));
  
    if ((lines.length >= 3 && containsCodeChar) || containsKeyword || containsComment) {
      return "code";
    }
  
    // --------- 普通文本 ---------
    return false;
  };
  

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ typography: false }),
      CodeBlock, // 只保留核心扩展
      HighlightNode.configure({
        variables: variables,
      }),
      PasteListener({ onPaste: handlePaste }),
      Placeholder.configure({
        placeholder: placeholder,
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
          if (onFocus) onFocus(event);
        },
        blur: (view, event) => {
          if (onBlur) onBlur(event);
        },
        paste: (view, event) => {
          const clipboardData = event.clipboardData;
          if (!clipboardData) return false;
        
          const text = clipboardData.getData("text/plain");
          const html = clipboardData.getData("text/html");
        
          const type = detectJsonOrCode(text);
        
          if (type === "json") {
            event.preventDefault();
            editor.chain().focus().deleteSelection().setCodeBlock().insertContent(renderToTiptapJSON(text)).run();
            return true;
          }
        
          if (type === "code") {
            event.preventDefault();
            editor.chain().focus().deleteSelection().setCodeBlock().insertContent(renderToTiptapJSON(text)).run();
            return true;
          }
        
          if (html) {
            // 富文本 → 保持原样
            return false;
          }
        
          // 普通文本
          event.preventDefault();
          const { state, dispatch } = view;
          dispatch(state.tr.deleteSelection().insertText(text));
          return true;
        },
        
        
      },
    },
    immediatelyRender: false,
    autofocus: autoFocus,
    onFocus: (e) => {
      if (!isFocus) {
        setIsFocus(true);
        handleChange(editor);
      }
    },
    onBlur: ({ editor, event }) => {
      setIsFocus(false);
    },
    onUpdate: ({ editor }) => {
      const isInCodeBlock = editor.isActive("codeBlock");
      handleChange(editor);
      handleTextChange(editor);
      if (isPastingRef.current) {
        isPastingRef.current = false;
        handlePastFinish(editor);
      }
    },
  });
  const handlePastFinish = (editor) => {
    let text = extractTextFromTiptapDocument(editor.getJSON());
    isPastingRef.current = false;
    setValueEvent(text);
  };
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
    let text = extractTextFromTiptapDocument(editor.getJSON());
    updateWordCount(text);
    if (onChange) {
      //如果onChange存在，则调用onChange
      onChange(text);
    }
  };
  // 不在这里加换行，纯粹提取节点文本
  const extractTextFromTiptapJSON = (node) => {
    if (!node) return "";

    if (node.type === "text") {
      return node.text || "";
    }

    if (node.type === "HighlightNode") {
      return (node.attrs && node.attrs.content) || "";
    }

    if (node.type === "hardBreak") {
      return "\n";
    }

    if (Array.isArray(node.content)) {
      return node.content.map(extractTextFromTiptapJSON).join("");
    }

    return "";
  };

  // 新增：处理整篇文档，段落之间添加换行符
  const extractTextFromTiptapDocument = (doc) => {
    if (!doc || !Array.isArray(doc.content)) return "";
    return doc.content
      .map((node) => {
        if (node.type === "paragraph") {
          return extractTextFromTiptapJSON(node);
        }
        return extractTextFromTiptapJSON(node);
      })
      .filter(Boolean)
      .join("\n");
  };

  //处理编辑器输入change 事件
  const handleChange = useCallback((editor) => {
    const state = editor.state;
    const { $from } = state.selection;
    const before = state.doc.textBetween($from.pos - 1, $from.pos, "\0", "\0");
    if (before === "/" || before === "{") {
      let { from } = editor.state.selection;
      let pos = editor.view.coordsAtPos(from);

      // 创建一个虚拟的参考元素来表示光标位置
      const virtualElement = {
        getBoundingClientRect() {
          return {
            width: 0,
            height: 0,
            top: pos.top,
            right: pos.left,
            bottom: pos.bottom,
            left: pos.left,
            x: pos.left,
            y: pos.top,
          };
        },
      };

      setReferenceElement(virtualElement);
      setIsVisible(true); //显示变量菜单
    } else {
      setIsVisible(false); //隐藏变量菜单
      setReferenceElement(null);
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
      {isVisible && referenceElement && (
        <VariablePopup
          editorWidth={editorWidth}
          visible={isVisible}
          referenceElement={referenceElement}
          variables={variables}
          isContext={isContext}
          showContext={showContext}
          showAbove={showAbove}
          filterData={filterData}
          onSelect={handleVariableSelect}
          allowMiddleSelect={allowMiddleSelect}
          onClose={() => {
            setIsVisible(false);
            setReferenceElement(null);
          }}
        />
      )}
    </div>
  );
});

export default VariableEditor;
