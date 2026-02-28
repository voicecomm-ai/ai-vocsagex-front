/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react'
import { createJSONEditor } from 'vanilla-jsoneditor'

import 'vanilla-jsoneditor/themes/jse-theme-dark.css'
import styles from '../../test/test.module.css'

import { message, Modal, Select } from 'antd'
import Optimization from './Optimization' //提示词优化组件
const JsonEditorPage = forwardRef(
  ({ content, title, handleFullscreen, updateCodeContent, updateCodeLanguage, isFullscreen }, ref) => {
    const editorRef = useRef(null)

    const containerRef = useRef(null)
    const modalRef = useRef(null)

    const [type, setType] = useState('python3')
    const [newContent, setNewContent] = useState('')
    const [agentInfo, setAgentInfo] = useState({})
    const [selectedModel, setSelectedModel] = useState(null) // 存储当前选中的模型
    const [visible, setVisible] = useState(false)

    useEffect(() => {
      if (!containerRef.current) return
      editorRef.current = createJSONEditor({
        target: containerRef.current,
        props: {
          content: { json: content ? content : {} },
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
          mode: 'text',
          mainMenuBar: false,
          statusBar: false,
        },
      })
      setAgentInfo({ ...agentInfo, language: type })
      return () => {
        if (editorRef.current) {
          editorRef.current.destroy()
          editorRef.current = null
        }
      }
    }, [content])

    // 复制JSON内容到剪贴板
    const handleCopy = () => {
      if (!editorRef.current) return
      const jsonStr = JSON.stringify(content)
      navigator.clipboard.writeText(jsonStr).then(() => {
        message.success('复制成功')
      })
    }

    //关闭提示词优化弹框
    const closeOptimizationEvent = () => {
      // setPopupVisibleOptimization(false)
    }

    //更新智能体数据
    const updateAgentInfoEvent = updateData => {
      let data = { ...updateData }
      console.log(data)
    }
    //替换事件
    const replaceEvent = value => {
      // contentInputRef.current.setValue(value)
      props.updateCodeContent(value)
      editorRef.current.updateProps({
        content: { json: value },
      })
    }

    //打开提示词优化弹框
    const createPromptEvent = () => {
      if (!agentInfo.modelId) {
        return message.warning('请配置模型!')
      }
      // setPopupVisibleOptimization(true)
    }

    // 全屏切换
    const toggleFullscreen = () => {
      handleFullscreen(content, title)
    }

    useImperativeHandle(ref, () => ({
      setContent: newContents => {
        if (editorRef.current && newContents) {
          editorRef.current.updateProps({
            content: { json: newContents },
          })
          // setNewContent(newContents)
          updateCodeContent(newContents)
          setAgentInfo({ ...agentInfo, instruction: newContent })
        }
      },
    }))

    const handleChangeType = e => {
      // console.log(e)
      setType(e)
      setAgentInfo({ ...agentInfo, language: e })
      updateCodeLanguage(e)
    }

    const handleOptimize = () => {
      setVisible(true)
    }
    const handleClose = () => {
      setVisible(false)
    }

    return (
      <div className={styles['json_editor_page']}>
        <div className={styles['json_editor_page_header']}>
          <div className={styles['json_editor_page_header_title']}>
            <Select
              placeholder=''
              variant='borderless'
              value={type}
              onChange={e => handleChangeType(e)}
              style={{ flex: 1 }}
              options={[
                { value: 'python3', label: 'python3' },
                { value: 'javascript', label: 'javascript' },
              ]}
            />
          </div>
          <div className={styles['json_editor_page_header_right']}>
            <img
              src='/workflow/ai_help.png'
              alt=''
              onClick={handleOptimize}
            />
            <img
              src='/workflow/json_copy.png'
              onClick={handleCopy}
              alt=''
            />
            <img
              src='/workflow/json_full.png'
              alt=''
              onClick={toggleFullscreen}
            />
          </div>
        </div>
        <div
          className={isFullscreen ? styles['json_editor_page_json_fullscreen'] : styles['json_editor_page_json']}
          ref={containerRef}
        />
        <Modal
          open={visible}
          onCancel={handleClose}
          ref={modalRef}
          className='app-custom-modal'
          width={440}
          closable={false}
          centered={true}
          height={440}
          title=''
          footer={null}
          styles={{
            content: {
              backgroundImage: 'url("/workflow/code_prmot.png")',
              borderRadius: 16,
              padding: '0px',
              backgroundColor: '#fff',
              backgroundPosition: 'top center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '100% auto',
            },
            header: {
              background: 'transparent',
            },
          }}
        >
          <div>
            <Optimization
              agentInfo={agentInfo}
              replaceEvent={replaceEvent}
              closeOptimizationEvent={handleClose}
              updateAgentInfoEvent={updateAgentInfoEvent}
            ></Optimization>
          </div>
        </Modal>
      </div>
    )
  }
)

export default JsonEditorPage

