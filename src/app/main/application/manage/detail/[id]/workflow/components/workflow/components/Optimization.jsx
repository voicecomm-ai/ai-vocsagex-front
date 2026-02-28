/* eslint-disable @next/next/no-img-element */
import React, { useState, forwardRef, useRef, useEffect } from 'react'
import styles from '../../../../agent/page.module.css'
import { Input, Button, message, Modal, Select } from 'antd'
import codeStyles from '../nodes/CodeExtractor/runCode.module.css'
import { getUuidByAgent } from '@/api/agent'
import { CopyOutlined, ReloadOutlined } from '@ant-design/icons'
import { Sender } from '@ant-design/x'
import { useRouter, useParams } from 'next/navigation'
import Cookies from 'js-cookie'
import { Editor, EditorState, ContentState } from 'draft-js'
import 'draft-js/dist/Draft.css'
import { stateFromHTML } from 'draft-js-import-html'
import { stateToHTML } from 'draft-js-export-html'
import ReplacePrompt from './ReplacePrompt'
import { getUuid } from '@/utils/utils'
import { checkPermission } from '@/utils/utils'
import {
  getAgentDetail,
  getAgentVariableList,
  deleteAgentVariable,
  updateAgentInfo,
  getAgentModelList,
  batchCreateAgentVariable,
  getAgentKnowledgeList,
  deleteKnowledgeFromAgent,
} from '@/api/agent'
import { fetchEventSource } from '@microsoft/fetch-event-source'
let eventSource = null
const Optimization = forwardRef((props, ref) => {
  const [tip, setTip] = useState('')
  const { id } = useParams()
  const [modelId, setModelId] = useState(0)
  // 控制下拉框是否展开
  const [open, setOpen] = useState(false)
  const [modelList, setModelList] = useState([])
  const [modelInfo, setModelInfo] = useState(null)
  const [agentInfo, setAgentInfo] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [editorState, setEditorState] = useState(() => EditorState.createEmpty())
  const abortRef = useRef(null)
  const [canCreate, setCanCreate] = useState(false) //创建应用权限
  const [displayedText, setDisplayedText] = useState('')
  const messageBufferRef = useRef('') // 缓存完整文本
  const outputIndexRef = useRef(0) // 当前输出到的索引
  const replacePromptRef = useRef(null)
  let typingTimer = null

  let isStart = false

  // 根据文本内容判断类型并返回对应 EditorState
  const createEditorStateFromText = value => {
    const trimmed = value

    // 纯文本
    let contentState = ContentState.createFromText(value)

    return EditorState.createWithContent(contentState)
  }

  const handleTipChange = e => {
    setTip(e.target.value)
  }

  const typeWriterEffect = () => {
    if (outputIndexRef.current >= messageBufferRef.current.length) {
      typingTimer = null
      clearTimeout(typingTimer)
      // 在打字结束后更新 editorState
      let newEditorState = createEditorStateFromText(displayedText)
      setEditorState(newEditorState)
      setIsLoading(false)
      console.log(displayedText)
      return
    }

    const nextChar = messageBufferRef.current[outputIndexRef.current]
    outputIndexRef.current += 1

    setDisplayedText(prev => prev + nextChar)
    typingTimer = setTimeout(typeWriterEffect, 40)
  }
  // console.log(props.agentInfo)

  const startSSE = uuid => {
    messageBufferRef.current = ''
    outputIndexRef.current = 0
    const token = Cookies.get('userToken')
    abortRef.current = new AbortController()
    isStart = true
    setDisplayedText('')
    setIsLoading(true)
    setIsGenerating(true)
    fetchEventSource('/voicesagex-console/application-web/prompt/codeGenerate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({
        modelId,
        instruction: tip,
        language: props.agentInfo.language,
        sseConnectId: getUuid(),
      }),
      signal: abortRef.current.signal, // ✅ 正确传入 signal
      retryInterval: 2000,
      maxRetries: 1,
      openWhenHidden: false,

      onopen() {
        console.log(1)
      },
      onmessage(event) {
        console.log(event)
        if (event.event == 'error') {
          handleStop()
          if (event.data) {
            message.warning(event.data)
            handleStop(event.data)
          }
        }
        if (event.event == 'message') {
          let data = JSON.parse(event.data)
          if (isStart) {
            setIsGenerating(false)
            messageBufferRef.current += data.code
            if (!typingTimer) {
              typeWriterEffect()
            }
          }
        }
      },

      onclose(event) {
        abortRef.current?.abort()
      },

      onerror(event) {
        message.warning('响应错误')
        abortRef.current?.abort()
      },
    })
  }

  const cleanupSSE = () => {
    abortRef.current?.abort()
  }

  const clearCahce = () => {
    if (typingTimer) {
      clearTimeout(typingTimer)
      typingTimer = null
    }
    messageBufferRef.current = ''
    outputIndexRef.current = 0
  }

  const handleSend = () => {
    if (!modelId) {
      message.warning('未选择模型！')
    } else {
      cleanupSSE()
      startSSE()
    }
  }

  const handleStop = () => {
    isStart = false
    cleanupSSE()
    clearCahce()
    setTip('')
    setIsLoading(false)
    setIsGenerating(false)
  }

  const handleReplace = () => {
    replacePromptRef.current.showModal()
  }
  //替换回调事件
  const saveCallBack = () => {
    props.replaceEvent(displayedText)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(displayedText)
    message.success('复制成功')
  }

  const handleReset = () => {
    handleStop()
    handleSend()
  }

  const closeEvent = () => {
    console.log(eventSource, '11')
    setTip('')
    setIsLoading(false)
    setIsGenerating(false)
    setDisplayedText('')
    handleStop()
    props.closeOptimizationEvent()
  }
  //点击空白区域关闭
  const closeEventByEmpty = () => {
    console.log(displayedText)
    if (displayedText || isLoading) {
      return false
    }
    closeEvent()
  }
  useEffect(() => {
    return () => {
      cleanupSSE()
    }
  }, [])
  useEffect(() => {
    if (props.agentInfo) {
      console.log(props.agentInfo, 'props.agentInfo')
    }
  }, [props.agentInfo])

  useEffect(() => {
    setCanCreate(checkPermission('/applicationManage/operation'))
    initFunction(id)
    // const handleClickOutside = event => {
    // const container = document.getElementById('optimization_container')
    // if (container && !container.contains(event.target)) {
    //   closeEventByEmpty()
    // }
    // }
    // document.addEventListener('mousedown', handleClickOutside)

    return () => {
      // document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [displayedText, isLoading])

  const initFunction = async id => {
    await getAgentModelListEvent(id)
    // await getAgentKnowledgeListEvent(id)
    // await getVariableListEvent(id)
  }

  //获取模型列表
  const getAgentModelListEvent = () => {
    let data = {
      type: 1,
      tagIdList: [1, 2],
      isShelf: 1,
      isOr: 1,
    }
    getAgentModelList(data).then(res => {
      setModelList(res.data)
    })
  }

  //选择模型事件
  const selectChange = value => {
    let modelInfo = modelList.find(item => item.id === value)
    setModelInfo(modelInfo)
    e.stopPropagation()
  }
  const selectModelItem = (e, model) => {
    // console.log('ppppp')
    setOpen(false)
    setModelInfo(model)
    setModelId(model.id)
    e.stopPropagation()
  }

  const openSelect = e => {
    setOpen(e)
  }
  const labelRender = () => {
    if (modelInfo) {
      return (
        <div className={codeStyles['model_label_render']}>
          {modelInfo.iconUrl && (
            <img
              alt=''
              className={codeStyles['model_label_render_img']}
              src={process.env.NEXT_PUBLIC_API_BASE + modelInfo.iconUrl}
            />
          )}
          <div className={codeStyles['model_label_render_title']}>{modelInfo.name}</div>
          <div className={codeStyles['model_label_render_type']}>
            {modelInfo.classificationName ? modelInfo.classificationName : null}
          </div>
          {modelInfo && modelInfo.tagList && modelInfo.tagList.length > 0 && (
            <div className={codeStyles['model_label_render_tag']}>
              {modelInfo && modelInfo.tagList.map(tag => tag.name).join(',')}
            </div>
          )}
        </div>
      )
    }
    return <span>请选择模型</span>
  }

  const popupRender = originalElement => {
    return (
      <div>
        {modelList.map(model => {
          // 判断当前模型是否为选中状态
          const isSelected = model.id === modelId
          return (
            <div
              key={model.id}
              // 根据选中状态添加不同的类名
              className={`${codeStyles['model_select_item']} ${isSelected ? styles['model_select_item_selected'] : ''}`}
              // 绑定点击事件，触发选择操作
              onClick={e => selectModelItem(e, model)}
            >
              {model.iconUrl && (
                <img
                  alt=''
                  className={codeStyles['model_label_render_img']}
                  src={process.env.NEXT_PUBLIC_API_BASE + model.iconUrl}
                />
              )}
              <div className={codeStyles['model_label_render_title']}>{model.name}</div>
              <div className={codeStyles['model_label_render_type']}>
                {model.classificationName ? model.classificationName : null}
              </div>
              {model && model.tagList && model.tagList.length > 0 && (
                <div className={codeStyles['model_label_render_tag']}>
                  {model && model.tagList.map(tag => tag.name).join(',')}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div
      className={styles['optimization_container']}
      id='optimization_container'
    >
      <div className={styles['optimization_container_content']}>
        {isGenerating || displayedText ? (
          <div className={styles['optimization_container_content_main']}>
            <div className={styles['optimization_container_header']}>
              <div className={styles['optimization_container_header_title']}>生成结果</div>
              <div
                className={styles['optimization_container_header_close']}
                onClick={closeEvent}
              >
                <img
                  src='/close.png'
                  alt='关闭'
                />
              </div>
            </div>

            <div className={styles['optimization_container_text']}>
              <div className={styles['optimization_container_text_content']}>
                {isGenerating ? (
                  '正在生成中...'
                ) : (
                  <div className='tiptap'>
                    <Editor
                      editorState={
                        isLoading && displayedText
                          ? createEditorStateFromText(displayedText)
                          : createEditorStateFromText(displayedText)
                      }
                      readOnly={true}
                    />
                  </div>
                )}
                {isGenerating && <span className={styles['cursor']}>|</span>}
              </div>
              {!isLoading && displayedText && (
                <div className={styles['optimization_container_text_btn']}>
                  <Button
                    type='primary'
                    onClick={handleReplace}
                  >
                    替换
                  </Button>
                  <div className={styles['optimization_container_text_pause']}>
                    <CopyOutlined onClick={handleCopy} />
                  </div>
                  <div className={styles['optimization_container_text_refresh']}>
                    <ReloadOutlined onClick={handleReset} />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className={codeStyles['model_select_content_header']}>
            {/* <div className={codeStyles['model_select_content_header_title']}>模型选择</div> */}
            <Select
              disabled={!canCreate}
              defaultValue={modelId}
              labelRender={labelRender}
              onOpenChange={e => openSelect(e)}
              open={open}
              onChange={e => selectChange(e)}
              placeholder='请选择模型'
              fieldNames={{ label: 'name', value: 'id' }}
              options={modelList}
              classNames={{
                root: 'my-classname',
              }}
              className={`${codeStyles['model_select_content_select']}`}
              // 自定义下拉项渲染函数
              popupRender={popupRender}
            ></Select>
          </div>
        )}

        <div className={styles['optimization_container_footer']}>
          <Sender
            value={tip}
            onCancel={handleStop}
            submitType='enter'
            onChange={v => setTip(v)}
            loading={isLoading}
            actions={(_, info) => {
              const { SendButton, LoadingButton } = info.components
              if (isLoading) {
                return <LoadingButton />
              }
              return (
                <SendButton
                  onClick={handleSend}
                  disabled={false}
                />
              )
            }}
            placeholder='请输入想要生成的代码的具体描述'
          />
        </div>
      </div>
      {/* 替换弹框 */}
      <ReplacePrompt
        ref={replacePromptRef}
        saveCallBack={saveCallBack}
      ></ReplacePrompt>
    </div>
  )
})

export default Optimization

