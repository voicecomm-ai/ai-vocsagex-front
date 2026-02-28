/* eslint-disable @next/next/no-img-element */
'use client'

import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react'
import { Button, Drawer, Form, Divider, Checkbox, Input, Tooltip, Slider, ConfigProvider, Switch, Popover } from 'antd'
import { message } from 'antd'
import styles from '../../page.module.css'
import DisableModal from './DisableModal'
const { TextArea } = Input
import {
  updateNormalChunk,
  updateNormalQAChunk,
  updateParentChunk,
  updateChildChunk,
  addNormalChunk,
  addNormalQAChunk,
  addParentChunk,
  addChildChunk,
} from '@/api/knowledge'
import { PlusOutlined } from '@ant-design/icons'
import Ajv from 'ajv'
const CreateSegmentDrawer = forwardRef((props, ref) => {
  useImperativeHandle(ref, () => ({
    showModal,
    hideModal,
  }))
  const [open, setOpen] = useState(false)
  const [isCheckedContinue, setIsCheckedContinue] = useState(true)
  const formRef = useRef(null)
  const [form] = Form.useForm()
  const [normalQAform] = Form.useForm()
  const normalQAformRef = useRef(null)
  const [title, setTitle] = useState('') //标题
  const [isZoomIn, setIsZoomIn] = useState(false) //是否放大
  const [data, setData] = useState({}) //数据
  const [loading, setLoading] = useState(false) //加载中
  const [type, setType] = useState('') //属性类型 默认选第一个
  const [action, setAction] = useState('') //属性类型 默认选第一个
  const [documentId, setDocumentId] = useState('') //
  const [parentId, setParentId] = useState('') //
  const [chunckIndexTitle, setChunckIndexTitle] = useState('新分段') //
  const [characterNum, setCharacterNum] = useState(0) //
  const [chunkMaxLength, setChunkMaxLength] = useState(null) //分段最大字数
  const [editValue, setEditValue] = useState(null)
  const onhandleChange = () => {
    const values = formRef.current.getFieldsValue()
    // console.log(values.chunkContent.length, type)
    switch (
      type
      // case 'parent':
      // case 'normal':
      // case 'child':
      //   console.log(values.chunkContent.length)
      //   setCharacterNum(values.chunkContent.length)
      //   break
    ) {
    }
  }

  // 处理输入并过滤空格
  const handleInput = (name, e) => {
    // 获取原始输入值
    // setCharacterNum(e.target.value.length)
  }

  const handleTextChange = type => {
    if (type === 'qa') {
      const chunkAnswerLength = normalQAform.getFieldsValue().chunkAnswer
        ? normalQAform.getFieldsValue().chunkAnswer.length
        : 0
      const chunkQuestionLength = normalQAform.getFieldsValue().chunkQuestion
        ? normalQAform.getFieldsValue().chunkQuestion.length
        : 0
      setCharacterNum(chunkAnswerLength + chunkQuestionLength)
    } else {
      setCharacterNum(form.getFieldsValue().chunkContent ? form.getFieldsValue().chunkContent.length : 0)
    }
  }
  function ContentTypeInput({ type }) {
    // console.log(type)

    if (type === 'normal' || type === 'parent' || type === 'child') {
      return (
        <Form
          ref={formRef}
          form={form}
          layout='vertical'
        >
          <Form.Item
            label=''
            name='chunkContent'
            rules={[
              {
                required: true,
                message: '请输入内容',
                trigger: 'blur',
              },
            ]}
          >
            <TextArea
              style={{ height: 'calc(100vh - 223px)', background: '#F2F4F6', border: 0 }}
              showCount
              onChange={e => handleInput('chunkContent', e)}
              onBlur={() => handleTextChange('')}
              placeholder='在这里添加内容'
            />
          </Form.Item>
        </Form>
      )
    } else if (type === 'normal_qa') {
      return (
        <div>
          <Form
            form={normalQAform}
            ref={normalQAformRef}
            layout='vertical'
          >
            <Form.Item
              label='QUESTION'
              name='chunkQuestion'
              rules={[
                {
                  required: true,
                  message: '请输入提问',
                  trigger: 'blur',
                },
              ]}
            >
              <TextArea
                style={{ height: 160, background: '#F2F4F6', border: 0 }}
                showCount
                onChange={e => handleInput('chunkQuestion', e)}
                onBlur={() => handleTextChange('qa')}
                placeholder='在这里添加问题'
              />
            </Form.Item>

            <Form.Item
              label='ANSWER'
              name='chunkAnswer'
              rules={[
                {
                  required: true,
                  message: '请输入回答',
                  trigger: 'blur',
                },
              ]}
            >
              <TextArea
                style={{ height: 'calc(100vh - 471px)', background: '#F2F4F6', border: 0 }}
                showCount
                onChange={e => handleInput('chunkQuestion', e)}
                onBlur={() => handleTextChange('qa')}
                placeholder='在这里添加问题'
              />
            </Form.Item>
          </Form>
        </div>
      )
    }
  }
  const showModal = async obj => {
    // console.log(obj)
    if (obj.action === 'edit') {
      setEditValue(obj.item)
      setCharacterNum(obj.item.character)
      setChunckIndexTitle(`分段${obj.item.id}`)
      setIsCheckedContinue(false)
    } else {
      setIsCheckedContinue(true)
      setChunkMaxLength(obj.chunkMaxLength)
    }
    setDocumentId(obj.documentId)
    setParentId(obj.parentId)
    setType(obj.type)
    setAction(obj.action)
    switch (obj.type) {
      case 'normal':
        if (obj.action === 'add') {
          setTitle('新增分段')
        } else {
          setTitle('编辑分段')
          let chunkContent = obj.item.content
          setTimeout(() => {
            form.setFieldsValue({
              chunkContent,
            })
          }, 500)
        }
        break
      case 'parent':
        if (obj.action === 'add') {
          setTitle('新增分段')
        } else {
          setTitle('编辑分段')
          let chunkContent = ''
          obj.item.content.forEach(item => {
            chunkContent += item.content
          })
          setTimeout(() => {
            form.setFieldsValue({
              chunkContent,
            })
          }, 500)
        }
        break
      case 'normal_qa':
        if (obj.action === 'add') {
          setTitle('新增分段')
        } else {
          setTitle('编辑分段')
          setTimeout(() => {
            normalQAform.setFieldsValue({
              chunkQuestion: obj.item.question,
              chunkAnswer: obj.item.answer,
            })
          }, 500)
        }
        break
      case 'child':
        if (obj.action === 'add') {
          setTitle('新增子分段')
        } else {
          setTimeout(() => {
            form.setFieldsValue({
              chunkContent: obj.item.content,
            })
          }, 500)
          setTitle('编辑子分段')
        }
        break
    }
    setOpen(true)
  }

  useEffect(() => {
    // 获取单个参数
  }, [])

  //弹框 className
  const classNames = {
    footer: styles['role-drawer-footer'],
    content: styles['knowledge-drawer-content'],
    header: styles['role-drawer-header'],
    body: styles['knowledge-drawer-body'],
  }
  //关闭事件
  const hideModal = () => {
    setOpen(false)
    setIsZoomIn(false)
    form.resetFields()
    normalQAform.resetFields()
    setIsCheckedContinue(false)
    setCharacterNum(0)
    setChunckIndexTitle('新分段')
  }
  const onChangeContinue = e => {
    setIsCheckedContinue(e.target.checked)
  }

  const handleSaveChunk = async () => {
    let values
    if (type === 'normal_qa') {
      values = await normalQAform.validateFields()
    } else {
      values = await form.validateFields()
    }
    // console.log(values, editValue, documentId)
    if (!values) return
    if (action === 'edit') {
      let trimmedValue
      //编辑
      switch (type) {
        case 'normal':
          const data = {
            documentId,
            chunkId: editValue.primary_key,
            chunkContent: values.chunkContent,
          }
          trimmedValue = values.chunkContent.trim()
          if (trimmedValue === '') {
            message.error('请输入有效内容')
          } else {
            setLoading(true)
            updateNormalChunk(data).then(res => {
              submitSuccessEvent()
            })
          }
          break
        case 'normal_qa':
          const qa_data = {
            documentId,
            chunkId: editValue.primary_key,
            chunkQuestion: values.chunkQuestion,
            chunkAnswer: values.chunkAnswer,
          }
          const trimmedValueQ = values.chunkQuestion.trim()
          const trimmedValueA = values.chunkAnswer.trim()
          if (trimmedValueQ === '') {
            message.error('请输入有效提问')
          } else if (trimmedValueA === '') {
            message.error('请输入有效回答')
          } else {
            setLoading(true)
            updateNormalQAChunk(qa_data).then(res => {
              submitSuccessEvent()
            })
          }
          // console.log(qa_data)

          break
        case 'parent':
          const parent_data = {
            documentId,
            parentIdx: editValue.id,
            chunkContent: values.chunkContent,
          }
          trimmedValue = values.chunkContent.trim()
          if (trimmedValue === '') {
            message.error('请输入有效内容')
          } else {
            setLoading(true)
            updateParentChunk(parent_data).then(res => {
              submitSuccessEvent()
            })
          }
          break
        case 'child':
          const child_data = {
            documentId,
            parentIdx: editValue.parentId,
            childChunkIdx: editValue.primary_key,
            chunkContent: values.chunkContent,
          }
          if (trimmedValue === '') {
            message.error('请输入有效内容')
          } else {
            setLoading(true)
            updateChildChunk(child_data).then(res => {
              submitSuccessEvent()
            })
          }
          break
      }
    } else {
      let trimmedValue
      switch (type) {
        case 'normal':
          const data = {
            documentId,
            chunkContent: values.chunkContent,
          }
          trimmedValue = values.chunkContent.trim()
          if (trimmedValue === '') {
            message.error('请输入有效内容')
          } else {
            setLoading(true)
            addNormalChunk(data).then(res => {
              submitSuccessEvent()
            })
          }
          break
        case 'normal_qa':
          const trimmedValueQ = values.chunkQuestion.trim()
          const trimmedValueA = values.chunkAnswer.trim()
          if (trimmedValueQ === '') {
            message.error('请输入有效提问')
          } else if (trimmedValueA === '') {
            message.error('请输入有效回答')
          } else {
            const qa_data = {
              documentId,
              chunkQuestion: values.chunkQuestion,
              chunkAnswer: values.chunkAnswer,
            }
            setLoading(true)
            addNormalQAChunk(qa_data).then(res => {
              submitSuccessEvent()
            })
          }
          break
        case 'parent':
          trimmedValue = values.chunkContent.trim()
          if (trimmedValue === '') {
            message.error('请输入有效内容')
          } else {
            const parent_data = {
              documentId,
              chunkContent: values.chunkContent,
            }
            setLoading(true)
            addParentChunk(parent_data).then(res => {
              submitSuccessEvent()
            })
          }
          break
        case 'child':
          trimmedValue = values.chunkContent.trim()
          if (trimmedValue === '') {
            message.error('请输入有效内容')
          } else {
            const child_data = {
              documentId,
              parentIdx: parentId,
              chunkContent: values.chunkContent,
            }
            setLoading(true)
            addChildChunk(child_data).then(res => {
              submitSuccessEvent()
            })
          }
          break

        default:
          break
      }
    }
  }

  //提交成功事件
  const submitSuccessEvent = () => {
    // console.log(isCheckedContinue)

    if (!isCheckedContinue) {
      hideModal()
    } else {
      form.resetFields()
      normalQAform.resetFields()
      setCharacterNum(0)
      setChunckIndexTitle('新分段')
    }
    setLoading(false) // 加载结束
    message.success('操作成功')
    //调用父元素方法
    props.updateDocumentDetail()
  }

  const zoomChangeModal = () => {
    if (isZoomIn) {
      setIsZoomIn(false)
    } else {
      setIsZoomIn(true)
    }
    // console.log(editValue)
    if (action === 'edit') {
      let chunkContent = ''
      switch (type) {
        case 'normal':
          form.setFieldsValue({
            chunkContent,
          })
          break
        case 'parent':
          editValue.content.forEach(item => {
            chunkContent += item.content
          })
          form.setFieldsValue({
            chunkContent,
          })
          break
        case 'child':
          form.setFieldsValue({
            chunkContent: editValue.content,
          })
          break
        case 'normal_qa':
          normalQAform.setFieldsValue({
            chunkQuestion: editValue.question,
            chunkAnswer: editValue.answer,
          })
          break
      }
    }
  }

  const containerStyle = {
    borderRadius: !isZoomIn ? '24px 0 0 24px' : '0',
  }

  return (
    <div>
      <div style={{ display: open ? 'block' : 'none' }}>
        <Drawer
          closable={false}
          destroyOnHidden
          title={null}
          placement='right'
          open={open}
          rootStyle={{ boxShadow: 'none' }}
          style={containerStyle}
          width={!isZoomIn ? '640px' : 'calc(100vw)'}
          onClose={hideModal}
          classNames={classNames}
          footer={null}
        >
          <div className={`${styles['segment_drawer']} ${!isZoomIn ? styles['zoom_out_bg'] : styles['zoom_in_bg']}`}>
            <div className={styles['segment_drawer_header']}>
              <div className={styles['segment_drawer_header_title']}>{title}</div>
              <div className={styles['segment_drawer_header_btn_wrap']}>
                {!isZoomIn ? (
                  <img
                    src='/knowledge/document/zoom_in.png'
                    alt=''
                    onClick={zoomChangeModal}
                  />
                ) : (
                  <img
                    src='/knowledge/document/zoom_out.png'
                    alt=''
                    onClick={zoomChangeModal}
                  />
                )}

                <img
                  src='/close.png'
                  alt=''
                  onClick={hideModal}
                />
              </div>
            </div>
            <div className={styles['segment_drawer_info_tip']}>
              <div className={styles['segment_drawer_info_tip_left']}>
                <img
                  src='/knowledge/parent.png'
                  alt=''
                />
                {chunckIndexTitle}
              </div>
              <Divider
                style={{ height: 12 }}
                type='vertical'
              />
              <span>{characterNum}字符</span>
            </div>

            <div className={styles['segment_drawer_content']}>
              <ContentTypeInput type={type}></ContentTypeInput>

              <Divider style={{ width: 576, margin: '0 0 12px 0' }} />
            </div>
            <div className={styles['add_new_segment_footer']}>
              {action === 'add' && (
                <Checkbox
                  checked={isCheckedContinue}
                  onChange={e => onChangeContinue(e)}
                >
                  连续新增
                </Checkbox>
              )}

              <div
                className={
                  isCheckedContinue ? `${styles['display_flex']}` : `${styles['add_new_segment_footer_right']}`
                }
              >
                <div
                  className={`${styles['segment_footer_btn']} ${styles['footer_cancel']}`}
                  onClick={hideModal}
                >
                  取消
                </div>
                <div
                  className={`${styles['segment_footer_btn']} ${styles['footer_save']}`}
                  onClick={() => handleSaveChunk()}
                >
                  保存
                </div>
              </div>
            </div>
          </div>
        </Drawer>
      </div>
    </div>
  )
})

export default CreateSegmentDrawer

