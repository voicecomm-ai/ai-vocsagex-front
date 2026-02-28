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
    minWidth,
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

  // useEffect(() => {
  //   if (editor) {
  //     setValueEvent(value);
  //   }
  // }, [value]);
  //
  //设置值事件
  const setValueEvent = (text) => {
    let renderText = renderToTiptapJSON(text);

    editor.commands.setContent(renderText);
    // editor.commands.focus();
  };
  //渲染为Tiptap JSON
  const renderToTiptapJSON = (text) => {
    if (!text)
      return {
        type: "doc",
        content: [],
      };

    const highlightRegex = /\{\{#[^}]+#\}\}/g;
    const nodes = [];
    let lastIndex = 0;

    // 用正则匹配所有 HighlightNode 的位置
    let match;
    while ((match = highlightRegex.exec(text)) !== null) {
      const index = match.index;

      // 添加匹配前的普通文本节点（如果有）
      if (index > lastIndex) {
        nodes.push({
          type: "text",
          text: text.slice(lastIndex, index),
        });
      }

      // 添加 HighlightNode 节点
      nodes.push({
        type: "HighlightNode",
        attrs: {
          content: match[0],
        },
      });

      lastIndex = index + match[0].length;
    }

    // 添加剩余的普通文本（如果有）
    if (lastIndex < text.length) {
      nodes.push({
        type: "text",
        text: text.slice(lastIndex),
      });
    }

    // 返回完整的 TipTap doc JSON
    return {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: nodes,
        },
      ],
    };
  };
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        pasteRules: false,
        typography: { link: false },
        heading: false,
        codeBlock: false,
        blockquote: false,
      }),
      HighlightNode.configure({
        variables: variables,
        pannerNodeId: pannerNodeId,
      }),
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
          if (onFocus) onFocus(event); // 正确：仅用 view 和 event 参数
        },
        blur: (view, event) => {
          if (onBlur) onBlur(event); // 正确：仅用 view 和 event 参数
        },
        // 修复1：paste 事件参数改为正确的 (view, event)
        paste: (view, event) => {
          event.preventDefault(); // 阻止默认粘贴行为
          // 1. 获取纯文本内容
          const text = event.clipboardData.getData("text/plain");
          // 2. 通过 ProseMirror 的 view 实例操作内容（无需依赖 editor）
          const { state, dispatch } = view; // 从 view 中获取 state 和 dispatch
          // 3. 先删除选中内容，再插入纯文本（避免覆盖问题）
          const transaction = state.tr
            .deleteSelection() // 清除当前选中的内容
            .insertText(text); // 插入纯文本（底层方法，无格式干扰）
          // 4. 执行事务，更新编辑器内容
          dispatch(transaction);
          // 5. 返回 true 标记事件已处理，避免后续重复触发
          return true;
        },
      },
    },
    autofocus: autoFocus,
    onUpdate: ({ editor }) => {
      if (isInitRef.current) {
        isInitRef.current = false;
        return;
      }
      handleChange(editor);
      handleTextChange(editor);
    },
  });
  const isInitRef = useRef(true);
  const handlePastFinish = (editor) => {
    let text = extractTextFromTiptapJSON(editor.getJSON());
    isPastingRef.current = false;
    setValueEvent(text);
  };

  useEffect(() => {
    // if (!editor) return;
    // const currentText = editor.getText(); // 获取当前编辑器里的纯文本
    // if (isInitRef.current || currentText !== value) {
    //   setValueEvent(value);
    //   isInitRef.current = false; // ✅ 只在初始化或者外部 value 确实不同才更新
    // }
    if (!editor) return;
    const currentJSON = editor.getJSON();
    const targetJSON = renderToTiptapJSON(value);

    // 只在初始化，或者外部传入的 JSON 和当前内容不同的时候才更新
    if (isInitRef.current || JSON.stringify(currentJSON) !== JSON.stringify(targetJSON)) {
      setValueEvent(value);

      isInitRef.current = false;
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
    // console.log(editor.getJSON(),'editor.getJSON()');

    let text = extractTextFromTiptapJSON(editor.getJSON());
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
      // console.log(editorWidth,'editorWidth');

      // 计算相对于编辑器容器的坐标
      let left = pos.left - editorRect.left;
      if (left > editorWidth / 5) {
        //如果光标在编辑器宽度1/4之后，则将变量菜单显示在编辑器宽度1/4处
        left = editorWidth / 5;
      }
      let top = pos.top - editorRect.top;
      // console.log(top,left,'cccc');

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
