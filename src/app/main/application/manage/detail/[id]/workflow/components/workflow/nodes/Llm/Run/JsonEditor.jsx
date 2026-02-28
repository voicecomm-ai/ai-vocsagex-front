import React, { useEffect, useRef, useImperativeHandle, forwardRef,useState  } from 'react';
import { createJSONEditor } from 'vanilla-jsoneditor';
import 'vanilla-jsoneditor/themes/jse-theme-dark.css';
import styles from './run.module.css'
import { message } from 'antd';
const JsonEditor = forwardRef(({backgroundColor='#FAFCFD', content,title,handleFullscreen,isFullscreen,onChange,onError}, ref) => {
  const editorRef = useRef(null);
  const containerRef = useRef(null);
  const [jsonContent, setJsonContent] = useState(content);


  useEffect(() => {
    if(!containerRef.current) return;
    if(editorRef.current){
      editorRef.current.destroy();
      editorRef.current = null;
    }
    createJsonEditor();
  }, []);

  const createJsonEditor = () => {
    editorRef.current = createJSONEditor({
      target: containerRef.current,
      props: {
        content: { json: content?content:{} },
        mode: 'text',
        mainMenuBar: false,
        statusBar: false,

        onChange: (updatedContent, previousContent, { contentErrors, patchResult }) => {
          if (contentErrors) {
            // 错误提示
            onError(true)
          } else {
            onError(false)
          }
          let json = updatedContent.text?JSON.parse(updatedContent.text):{}
       
          // 修正：updatedContent 可能已经是解析好的对象，直接取 json 属性
          onChange(json)
        },
      },
    });

  };
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
    let jsonText= editorRef.current.get();
    let json=jsonText.json?jsonText.json:JSON.parse(jsonText.text);
    const jsonStr = JSON.stringify(json);
    navigator.clipboard.writeText(jsonStr).then(() => {
      message.success('复制成功');
    });
  };

  // 全屏切换
  const toggleFullscreen = () => {    
    let jsonText= editorRef.current.get();
    let json=jsonText.json?jsonText.json:JSON.parse(jsonText.text);
    console.log(json,'json');
   handleFullscreen(json,title);
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
    <div className={styles['json_editor_page']}>
      <div className={styles['json_editor_page_header']} >
      <div className={styles['json_editor_page_header_title']}>
        {title}
      </div>
        <div className={styles['json_editor_page_header_right']}>
        <img  src='/workflow/json_copy.png' onClick={handleCopy} /> 
        <img  src='/workflow/json_full.png' onClick={toggleFullscreen} /> 
      </div>
      </div>
      <div style={{backgroundColor: '#FAFCFD'}}  className={isFullscreen ? styles['json_editor_page_json_fullscreen'] :styles['json_editor_page_json']} ref={containerRef}/>
    </div>
  );
});

export default JsonEditor;
