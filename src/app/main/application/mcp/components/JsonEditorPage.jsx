// JsonEditor.jsx
'use client'
import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import { createJSONEditor } from 'vanilla-jsoneditor'
import 'vanilla-jsoneditor/themes/jse-theme-dark.css' // 你也可以用 jse-theme-light.css
import { message } from 'antd'

// forwardRef 的第一个参数应该是函数，原代码参数解构有误
const JsonEditorPage = forwardRef(({ content, onChange, onError }, ref) => {
  const editorRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    // 初始化编辑器
    // createJSONEditor 本身是构造函数，不需要 new
    editorRef.current = createJSONEditor({
      target: containerRef.current,
      props: {
        content: content || { json: {} },
        onChange: (updatedContent, previousContent, { contentErrors, patchResult }) => {
          if (contentErrors) {
            // 错误提示
            onError('参数格式不正确')
          } else {
            onError(null)
          }
          // 修正：updatedContent 可能已经是解析好的对象，直接取 json 属性
          onChange(updatedContent.text)
        },
        mode: 'text', // 支持 "tree", "text", "code", "form", "view"
        mainMenuBar: false,
        statusBar: false,
      },
    })

    // 卸载时销毁编辑器
    return () => {
      if (editorRef.current) {
        editorRef.current.destroy()
        editorRef.current = null
      }
    }
  }, [content]) // 添加依赖项 content，确保 content 变化时编辑器更新

  // 全屏切换 - 修改为在Drawer内部全屏
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const toggleFullscreen = () => {
    if (!containerRef.current) return

    // 查找最近的Drawer容器
    const drawerContainer =
      containerRef.current.closest('.ant-drawer-content-wrapper') ||
      containerRef.current.closest('.ant-drawer') ||
      containerRef.current.closest('[class*="drawer"]')

    if (!drawerContainer) {
      message.warning('只能在抽屉内使用全屏功能')
      return
    }

    if (!isFullscreen) {
      // 进入全屏模式
      const originalHeight = containerRef.current.style.height
      const originalMaxHeight = containerRef.current.style.maxHeight

      // 设置全屏样式
      containerRef.current.style.position = 'fixed'
      containerRef.current.style.top = '0'
      containerRef.current.style.left = '0'
      containerRef.current.style.width = '100%'
      containerRef.current.style.height = '100vh'
      containerRef.current.style.zIndex = '9999'
      containerRef.current.style.backgroundColor = '#fff'
      containerRef.current.style.padding = '20px'
      containerRef.current.style.boxSizing = 'border-box'

      // 保存原始样式以便恢复
      containerRef.current.dataset.originalHeight = originalHeight
      containerRef.current.dataset.originalMaxHeight = originalMaxHeight

      setIsFullscreen(true)
    } else {
      // 退出全屏模式
      containerRef.current.style.position = ''
      containerRef.current.style.top = ''
      containerRef.current.style.left = ''
      containerRef.current.style.width = ''
      containerRef.current.style.height = containerRef.current.dataset.originalHeight || '400px'
      containerRef.current.style.zIndex = ''
      containerRef.current.style.backgroundColor = ''
      containerRef.current.style.padding = ''
      containerRef.current.style.boxSizing = ''

      setIsFullscreen(false)
    }
  }

  // 向父组件暴露方法
  useImperativeHandle(ref, () => ({
    setContent: newContent => {
      if (editorRef.current && newContent) {
        editorRef.current.updateProps({
          content: { json: newContent },
        })
      }
    },
  }))

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1000 }}>
        <button
          onClick={toggleFullscreen}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            padding: '5px',
          }}
        >
          {isFullscreen ? '退出全屏' : '全屏'}
        </button>
      </div>
      <div
        ref={containerRef}
        style={{ height: '400px' }}
      />
    </div>
  )
})

export default JsonEditorPage

