import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { createJSONEditor } from 'vanilla-jsoneditor';
import 'vanilla-jsoneditor/themes/jse-theme-dark.css';
import styles from './test.module.css'
import { message } from 'antd';
const JsonEditorPage = forwardRef(({ content,title,handleFullscreen,isFullscreen,noHeader,   style,    backgroundColor = '#FAFCFD',headerBgColor = '#FAFCFD;'}, ref) => {
  const editorRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    editorRef.current = createJSONEditor({
      target: containerRef.current,
      props: {
        content: { json: content?content:{} },
        mode: 'text',
        mainMenuBar: false,
        statusBar: false,
        readOnly: true,

      },
    });

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, [content]);
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
  // 复制JSON内容到剪贴板
  const handleCopy = () => {
    if (!editorRef.current) return;
    const jsonStr = JSON.stringify(content);
    navigator.clipboard.writeText(jsonStr).then(() => {
      message.success('复制成功');
    });
  };
  const wrapperStyle = {
    ...style,
    backgroundColor,
  };
  // 全屏切换
  const toggleFullscreen = () => {
   handleFullscreen(content,title);
  };

  useImperativeHandle(ref, () => ({
    setContent: (newContent) => {
      if (editorRef.current && newContent) {
        editorRef.current.updateProps({
          content: { json: newContent },
        });
      }
    },
  }));

  return (
    <div className={noHeader ? styles['json_editor_page_no_header'] : styles['json_editor_page']}>
      {!noHeader && (
      <div
        className={
          styles['json_editor_page_header'] +
          (isFullscreen ? ' ' + styles['json_editor_page_header_fullscreen'] : '')
        }
        style={{ backgroundColor: headerBgColor }}
      >
      <div className={styles['json_editor_page_header_title']}>
        {title}
      </div>
        <div className={styles['json_editor_page_header_right']}>
        <div className={styles['json_editor_page_header_right_item']}>  
          <img  src='/workflow/json_copy.png' onClick={handleCopy} /> 
        </div>
        <div className={styles['json_editor_page_header_right_item']}>
          {!isFullscreen && (
          <img  src='/workflow/common/full.png' onClick={toggleFullscreen} /> 
          )}
          {isFullscreen && (
          <img  src='/workflow/common/zoom.png' onClick={toggleFullscreen} /> 
          )}
        </div>
      </div>
      </div>
      )}
      <div style={{backgroundColor: backgroundColor}}  className={isFullscreen ? styles['json_editor_page_json_fullscreen'] :styles['json_editor_page_json']} ref={containerRef}/>
    </div>
  );
});

export default JsonEditorPage;
