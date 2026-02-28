import React, {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { createJSONEditor } from 'vanilla-jsoneditor';
import 'vanilla-jsoneditor/themes/jse-theme-dark.css';
import styles from './json.module.css';

const JsonEditor = forwardRef(
  (
    {
      readOnly,
      content,
      onChange,
      backgroundColor = '#F5F9FC',
      className,
      style,
      onError,
      fontSize = '14px',
    },
    ref
  ) => {
    const editorRef = useRef(null);
    const containerRef = useRef(null);

    /**
     * 初始化 JSONEditor（仅一次）
     */
    useEffect(() => {
      if (!containerRef.current) return;

      const editor = createJSONEditor({
        target: containerRef.current,
        props: {
          content: { json: content || {} },
          mode: 'text',
          mainMenuBar: false,
          statusBar: false,
          readOnly,
          onChange: (updatedContent, prev, { contentErrors }) => {
            onError?.(!!contentErrors);
            onChange?.(updatedContent.text || '');
          },
          onError: () => {
            onError?.(true);
          },
        },
      });

      editorRef.current = editor;

      return () => {
        editor.destroy();
        editorRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /**
     * 设置背景色（无 setTimeout）
     */
    useEffect(() => {
      if (!containerRef.current) return;

      const selectors = [
        '.jse-main',
        '.jse-contents',
        '.cm-editor',
        '.cm-scroller',
      ];

      const applyBg = () => {
        selectors.forEach((selector) => {
          containerRef.current
            .querySelectorAll(selector)
            .forEach((el) => {
              el.style.backgroundColor = backgroundColor;
              el.style.border = 'none';
              el.style.fontSize = fontSize;
            });
        });
      };

      // 立即执行一次（用于初始化）
      applyBg();

      // 监听 JSONEditor 内部 DOM 变化
      const observer = new MutationObserver(() => {
        applyBg();
      });

      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
      });

      return () => observer.disconnect();
    }, [backgroundColor]);

    /**
     * 暴露方法
     */
    useImperativeHandle(ref, () => ({
      setContent: (newContent) => {
        if (editorRef.current) {
          editorRef.current.updateProps({
            content: { json: newContent || {} },
          });
        }
      },
    }));

    const wrapperStyle = {
      ...style,
      backgroundColor,
    };

    return (
  
        <div
         style={wrapperStyle}
          className={styles['json_editor_page_json']}
          ref={containerRef}
        />
 
    );
  }
);

JsonEditor.displayName = 'JsonEditor';

export default JsonEditor;
