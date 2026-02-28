/* eslint-disable @next/next/no-img-element */
import React, { useState, forwardRef, useRef, useEffect } from 'react'
import styles from './codeEditor.module.css'
import { Input, Button, message, Modal, Select } from 'antd'
import codeStyles from '../workflow/nodes/CodeExtractor/runCode.module.css'
import { CopyOutlined, ReloadOutlined } from '@ant-design/icons'
import { Sender } from '@ant-design/x'
import { useRouter, useParams } from 'next/navigation'
import Cookies from 'js-cookie'
import { Editor, EditorState, ContentState } from 'draft-js'
import 'draft-js/dist/Draft.css'
import ReplacePrompt from './ReplacePrompt'
import { getUuid } from '@/utils/utils'
import { checkPermission } from '@/utils/utils'
import { getAgentModelList } from '@/api/agent'
import { codeGenerate } from '@/api/workflow'
let eventSource = null
const Optimization = forwardRef((props, ref) => {
  const [tip, setTip] = useState('')
  const { id } = useParams()
  const [modelId, setModelId] = useState(0)
  // 控制下拉框是否展开
  const [open, setOpen] = useState(false)
  const [modelList, setModelList] = useState([])
  const [modelInfo, setModelInfo] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [editorState, setEditorState] = useState(() => EditorState.createEmpty())

  const [canCreate, setCanCreate] = useState(false) //创建应用权限
  const [isStop, setIsStop] = useState(false) //创建应用权限
  const [displayedText, setDisplayedText] = useState('')
  const messageBufferRef = useRef('') // 缓存完整文本
  const outputIndexRef = useRef(0) // 当前输出到的索引
  const replacePromptRef = useRef(null)
  //生成代码
  const getCodeGenerate = async () => {
    setIsGenerating(true)
    setIsLoading(true)
    try {
      const data = {
        modelId,
        instruction: tip,
        language: props.language,
        sseConnectId: getUuid(),
      }
      // console.log(data, 'dager')

      await codeGenerate(data).then(res => {
        let data = res.data
        if (!isStop && data?.data) {
          setDisplayedText(data?.data.code)
        }
        setIsGenerating(false)
        setIsLoading(false)
      })
    } catch (error) {
      setIsGenerating(false)
      setIsLoading(false)
    }
  }
  const handleSend = () => {
    setIsStop(false)
    if (!modelId) {
      message.warning('未选择模型！')
    } else {
      getCodeGenerate()
    }
  }

  const handleStop = () => {
    // clearCahce()
    setIsStop(true)
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
    closeEvent()
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(displayedText)
    message.success('复制成功')
  }

  const handleReset = () => {
    setIsLoading(false)
    setIsGenerating(false)
    handleSend()
  }

  // 根据文本内容判断类型并返回对应 EditorState
  const createEditorStateFromText = value => {
    const trimmed = value

    // 纯文本
    let contentState = ContentState.createFromText(value)

    return EditorState.createWithContent(contentState)
  }

  const closeEvent = () => {
    setTip('')
    setIsLoading(false)
    setIsGenerating(false)
    setDisplayedText('')
    handleStop()
    props.closeOptimizationEvent()
  }

  useEffect(() => {
    let status = checkPermission("/main/application/manage/unreleased/operation") || checkPermission("/main/application/manage/released/operation");
    setCanCreate(status)
    initFunction(id)
  }, [displayedText, isLoading])

  useEffect(() => {
    if (props.visible) {
      setTip('')
      setDisplayedText('')
      setModelId(0)
      // console.log(props.agentInfo, 'props.visible')
    }
  }, [props.visible])

  const initFunction = async id => {
    await getAgentModelListEvent(id)
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
    return <span style={{color:'#8d96a7'}}>请选择模型</span>
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
        {(isGenerating || displayedText)&& !isStop ? (
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
        ) : null}
        <div className={codeStyles['model_select_content_header']}>
          <Select
            disabled={!canCreate}
            defaultValue={modelId}
            labelRender={labelRender}
            onOpenChange={e => openSelect(e)}
            open={open}
            onChange={e => selectChange(e)}
            // placeholder='请选择模型'
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

