/* eslint-disable @next/next/no-img-element */
import Editor, { loader } from '@monaco-editor/react'
import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
} from 'react'
import { Modal, Select, message } from 'antd'
import styles from './codeEditor.module.css'
import { basePath } from '@/utils/var'
import { useStore } from '@/store/index'
import Optimization from './Optimization'

loader.config({ paths: { vs: `${basePath}/vs` } })

const CodeEditor = forwardRef(
  (
    {
      content,
      title,
      handleFullscreen,
      updateCodeContent,
      language,
      value,
      updateCodeLanguage,
      onChange,
      isFullscreen,
    },
    ref
  ) => {
    const editorRef = useRef(null)
    const modalRef = useRef(null)

    const { readOnly } = useStore(state => state)

    const CODE_EDITOR_LINE_HEIGHT = 18
    const minHeight = 200

    const [type, setType] = useState(null)
    const [editContent, setEditContent] = useState('')
    const [visible, setVisible] = useState(false)
    const [editorContentHeight, setEditorContentHeight] = useState(364)

    useEffect(() => {
      setEditContent(content)
    }, [content])

    useEffect(() => {
      setType(language)
    }, [language])

    const resizeEditorToContent = () => {
      if (editorRef.current) {
        let contentHeight = editorRef.current.getContentHeight()
        if (contentHeight < 166) {
          contentHeight = editorContentHeight / 2 + CODE_EDITOR_LINE_HEIGHT
        }
        setEditorContentHeight(contentHeight)
      }
    }

    const handleEditorChange = value => {
      setEditContent(value || '')
      onChange(value || '')
      setTimeout(resizeEditorToContent, 10)
    }

    const handleChangeType = e => {
      setType(e)
      setEditContent('')
      updateCodeLanguage({
        code_language: e,
        codeContent: '',
      })
    }

    const handleEditorDidMount = (editor, monaco) => {
      editorRef.current = editor

      monaco.editor.defineTheme('myCustomTheme', {
        base: 'vs',
        inherit: false,
        rules: [],
        colors: {
          'editor.background': '#FAFCFD',
          'editorGutter.background': '#FAFCFD',
          'editorScroll.background': '#FAFCFD',
          'editorLineNumber.foreground': '#8A8A8A',
          'editorLineNumber.activeForeground': '#000000',
          'editor.lineHighlightBackground': '#FAFCFD',
        },
      })

      monaco.editor.setTheme('myCustomTheme')

      resizeEditorToContent()
    }

    const handleOptimize = () => {
      if (!readOnly) setVisible(true)
    }

    const handleCopy = () => {
      if (readOnly || !editorRef.current) return
      navigator.clipboard.writeText(editContent).then(() => {
        message.success('复制成功')
      })
    }

    const toggleFullscreen = () => {
      handleFullscreen(editContent, title)
    }

    const handleClose = () => {
      setVisible(false)
    }

    return (
      <div className={styles.json_editor_page}>
        {/* header */}
        <div className={styles.json_editor_page_header}>
          <div className={styles.json_editor_page_header_title}>
            <Select
              placeholder="语言"
              variant="borderless"
              value={type}
              onChange={handleChangeType}
              style={{ flex: 1 }}
              options={[
                { value: 'python3', label: 'python3' },
                { value: 'javascript', label: 'javascript' },
              ]}
            />
          </div>

          <div className={styles.json_editor_page_header_right}>
            <img
              src="/workflow/ai_help.png"
              alt=""
              onClick={handleOptimize}
              className={readOnly ? styles.readOnly_ban : ''}
            />
            <img
              src="/workflow/json_copy.png"
              alt=""
              onClick={handleCopy}
              className={readOnly ? styles.readOnly_ban : ''}
            />
            <img
              src={
                isFullscreen
                  ? '/workflow/json_full_close.png'
                  : '/workflow/json_full.png'
              }
              alt=""
              onClick={toggleFullscreen}
            />
          </div>
        </div>

        {/* editor */}
        <div
          className={
            isFullscreen
              ? styles.json_editor_page_json_fullscreen
              : styles.json_editor_page_json
          }
          style={{
            minHeight: CODE_EDITOR_LINE_HEIGHT,
            background: '#FAFCFD',
            borderRadius: '0 0 8px 8px',
          }}
        >
          <Editor
            className="custom-editor"
            language={type === 'python3' ? 'python' : type}
            value={editContent}
            theme="myCustomTheme"   // ✅ 关键点
            onChange={handleEditorChange}
            options={{
              readOnly,
              domReadOnly: readOnly,
              minimap: { enabled: false },
              lineNumbersMinChars: 1,
              wordWrap: 'on',
              quickSuggestions: false,
              unicodeHighlight: {
                ambiguousCharacters: false,
              },
            }}
            onMount={handleEditorDidMount}
          />
        </div>

        {/* modal */}
        <Modal
          open={visible}
          onCancel={handleClose}
          ref={modalRef}
          className="app-custom-modal"
          width={440}
          closable={false}
          centered
          destroyOnHidden
          footer={null}
          styles={{
            content: {
              backgroundImage: 'url("/workflow/code_prmot.png")',
              borderRadius: 16,
              padding: 0,
              backgroundRepeat: 'no-repeat',
              backgroundSize: '100% auto',
            },
            header: {
              background: 'transparent',
            },
          }}
        >
          <Optimization
            language={type}
            visible={visible}
            replaceEvent={handleEditorChange}
            closeOptimizationEvent={handleClose}
          />
        </Modal>
      </div>
    )
  }
)

export default CodeEditor
