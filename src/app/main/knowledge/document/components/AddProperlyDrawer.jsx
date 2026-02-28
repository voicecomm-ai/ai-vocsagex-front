/* eslint-disable @next/next/no-img-element */
'use client'

import React, { useState, forwardRef, useImperativeHandle, useRef, useEffect } from 'react'
import { Button, Drawer, Input, Tooltip, Switch, Modal } from 'antd'
import { message } from 'antd'
import styles from '../../page.module.css'
import {
  getKnowledgePropertyList,
  enableBuiltIn,
  disableBuiltIn,
  addDocumentProperty,
  editDocumentProperty,
  deleteDocumentProperty,
} from '@/api/knowledge'
import { PlusOutlined } from '@ant-design/icons'
import Ajv from 'ajv'
// import DeletePropertyModal from './DeletePropertyModal'
const AddProperlyDrawer = forwardRef((props, ref) => {
  useImperativeHandle(ref, () => ({
    showModal,
    hideModal,
  }))
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('文档属性') //标题
  const drawerRef = useRef(null)
  const [isShowAdd, setIsShowAdd] = useState(false) //是否展示新建文档属性面板
  const [loading, setLoading] = useState(false) //加载中
  const [delloading, setDelLoading] = useState(false) //加载中
  const [type, setType] = useState('String') //属性类型 默认选第一个
  const [isEnableBuildIn, setIsEnableBuildIn] = useState(false) //是否启用内置属性
  const [propertyName, setPropertyName] = useState('') //属性名称
  const [delId, setDelId] = useState('') //属性名称
  const [addPropertiesList, setAddPropertiesList] = useState([]) //添加的属性列表
  const [deleteTitle, setDeleteTitle] = useState('删除确认')
  const [content, setContent] = useState('删除后数据无法恢复，是否继续？')
  const [jsonError, setJsonError] = useState(null)
  // 当前正在编辑的项
  const [visible, setVisible] = useState(false)
  const [editingId, setEditingId] = useState(null)
  // 弹窗
  const deleteRef = useRef(null)

  const [knowledgeId, setKnowledgeId] = useState(null)

  // 鼠标悬停的项
  const [hoveredId, setHoveredId] = useState(null)
  const modalStyles = {
    content: {
      backgroundImage: 'url("/model/bg_delete.png")',
      borderRadius: 24,
      padding: '26px',
      backgroundColor: '#fff',
      backgroundPosition: 'top center',
      backgroundRepeat: 'no-repeat',
      backgroundSize: '100% auto',
      zIndex: 1003,
    },
    header: {
      background: 'transparent',
    },
  }

  const containerStyle = {
    display: 'flex',
    gap: 12,
  }

  const infoWrapperStyle = {
    display: 'flex',
    flexDirection: 'column',
  }

  const titleStyle = {
    color: '#364052', // 修正颜色值，添加 # 前缀
    fontWeight: 500,
    fontSize: 20,
    wordBreak: 'break-all',
  }

  const contentStyle = {
    color: '#666E82',
    fontSize: 14,
    lineHeight: '20px',
    marginTop: 4,
    maxWidth: 400,
  }

  const buttonWrapperStyle = {
    marginTop: 16,
  }

  const cancelButtonStyle = {
    borderRadius: 8,
  }

  const confirmButtonStyle = {
    marginLeft: 12,
    background: '#EE5A55',
    borderRadius: 8,
  }
  const propertyTypeList = [
    { label: '文本', value: 'String', url: '/knowledge/document/string.png' },
    { label: '数字', value: 'Number', url: '/knowledge/document/number.png' },
    { label: '时间', value: 'Time', url: '/knowledge/document/time.png' },
  ]
  const [buildInList, setBuildInList] = useState([
    {
      name: 'source',
      type: 'String',
    },
    {
      name: 'last_update_date',
      type: 'Time',
    },
    {
      name: 'upload_date',
      type: 'Time',
    },
    {
      name: 'uploader',
      type: 'String',
    },
    {
      name: 'document_name',
      type: 'String',
    },
  ])
  const iconUrlMap = {
    String: '/knowledge/document/string.png',
    Number: '/knowledge/document/number.png',
    Time: '/knowledge/document/time.png',
  }
  useEffect(() => {
    let params = new URLSearchParams(window.location.search)
    let knowId = params.get('id')
    setKnowledgeId(knowId)
  }, [])
  const showModal = () => {
    // setLoading(true);
    setOpen(true)
    getKnowledgePropertyListData()
  }

  const addPropertyEvent = () => {
    setIsShowAdd(true)
  }

  // 处理删除按钮点击
  const handleDelete = id => {
    setItems(items.filter(item => item.id !== id))
  }

  // 处理输入框内容变化
  const handleEditPropertyName = (e, editId) => {
    setAddPropertiesList(addPropertiesList.map(item => (item.id === editId ? { ...item, name: e.target.value } : item)))
  }

  // 处理编辑完成（按 Enter 或失去焦点）
  const handleBlurEditPropertyName = async (e, id) => {
    const data = {
      id,
      name: e.target.value,
    }
    editDocumentProperty(data)
      .then(res => {})
      .catch(err => {})

    setEditingId(null)
  }

  const getKnowledgePropertyListData = async () => {
    getKnowledgePropertyList(knowledgeId)
      .then(res => {
        let data = res.data

        const buildInArr = data.filter(item => item.isBuiltIn)
        const otherArr = data.filter(item => !item.isBuiltIn)
        const isEnableBuildInStatus = buildInArr.length === 0 ? false : true
        setIsEnableBuildIn(isEnableBuildInStatus)
        setAddPropertiesList(otherArr)

        setLoading(false)
      })
      .catch(err => {
        console.log(err, '测试')
      })
  }

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
    setIsShowAdd(false)
    setEditingId(null)
    setHoveredId(null)
  }

  const selectTypeEvent = item => {
    setType(item.value)
  }
  // 取消添加
  const cancelAdd = () => {
    setIsShowAdd(false)
  }

  //保存添加属性
  const saveAddProperty = async () => {
    if (!propertyName) {
      message.error('文档属性不能为空！')
    } else {
      const data = {
        knowledgeBaseId: knowledgeId,
        name: propertyName,
        type,
      }
      addDocumentProperty(data)
        .then(res => {
          if (res.code === 1000) {
            getKnowledgePropertyListData(knowledgeId)
            setPropertyName('')
            setIsShowAdd(false)
          }
        })
        .catch(err => {})
    }
  }

  const handleEditName = id => {
    setEditingId(id)
  }

  const handleDeleteProperty = item => {
    let modalTitle = '确定删除'
    let modalContent = '确定要删除文档属性' + item.name + '吗'
    setIsShowAdd(false)
    setVisible(true)
    setContent(modalContent)
    setDelId(item.id)
    setDeleteTitle(modalTitle)
    // deleteRef.current.showModal(item.id, title, content, 'del')
  }

  //切换状态事件
  const switchChangeEvent = async e => {
    setIsEnableBuildIn(e)
    if (e) {
      enableBuiltIn(knowledgeId)
        .then(res => {
          message.success(res.msg)
          getKnowledgePropertyListData()
        })
        .catch(err => {})
    } else {
      disableBuiltIn(knowledgeId)
        .then(res => {
          message.success(res.msg)
          getKnowledgePropertyListData()
        })
        .catch(err => {})
    }
  }

  const updateListEvent = () => {
    getKnowledgePropertyListData()
  }

  // 校验 params 字段是否为合法的 JSON Schema 格式
  const validateParams = (value, jsonError) => {
    if (!value) {
      return Promise.reject(new Error('请输入参数'))
    }

    if (jsonError) {
      return Promise.reject(new Error(jsonError))
    }

    try {
      const parsed = typeof value === 'string' ? JSON.parse(value) : value
      const ajv = new Ajv()

      // 尝试编译 schema，判断其合法性
      ajv.compile(parsed)

      return Promise.resolve()
    } catch (err) {
      return Promise.reject(new Error('参数不是一个合法的 JSON Schema'))
    }
  }

  //  // 隐藏模态框，将 visible 状态设置为 false
  const hideDelModal = e => {
    console.log('eeeeeeeeee')

    setVisible(false)
    e.stopPropagation()
  }
  // 点击确认按钮的回调函数，当前为空实现
  const onOk = async () => {
    // setLoading(true)
    setDelLoading(true)
    const data = {
      id: delId,
    }
    deleteDocumentProperty(data)
      .then(res => {
        submitSuccess()
      })
      .catch(err => {})
  }
  const submitSuccess = () => {
    message.success('操作成功')
    setVisible(false)
    setDelLoading(false)
    updateListEvent()
  }

  return (
    <div>
      <div style={{ display: open ? 'block' : 'none' }}>
        {open && (
          <Drawer
            ref={drawerRef}
            closable={false}
            destroyOnHidden
            title={null}
            placement='right'
            open={open}
            rootStyle={{ boxShadow: 'none' }}
            style={{ borderRadius: '24px 0px 0px 24px' }}
            width={560}
            onClose={hideModal}
            classNames={classNames}
            footer={null}
          >
            <div className={styles['property_drawer']}>
              <div className={styles['property_drawer_header']}>
                <div className={styles['property_drawer_header_title']}>{title}</div>
                <img
                  className={styles['property_drawer_header_close']}
                  src='/close.png'
                  alt=''
                  onClick={hideModal}
                />
              </div>
              <div className={styles['property_description']}>文档属性是定义关于文档的属性，帮助用户更好的维护文档</div>
              <Button
                className={styles['document_content_right_header_right_button_right']}
                onClick={addPropertyEvent}
                icon={<PlusOutlined />}
              >
                添加属性
              </Button>
              {addPropertiesList.length > 0 && (
                <div className={styles['add_property_list']}>
                  {addPropertiesList.map((item, index) => (
                    <div
                      key={index}
                      className={styles['add_property_list_item']}
                      onMouseEnter={() => setHoveredId(item.id)}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      {editingId === item.id ? (
                        <>
                          <Input
                            style={{
                              borderRadius: 8,
                              border: 1,
                              borderColor: '#3772FE',
                              backgroundColor: 'rgba(244,244,244,0.5)',
                              height: 36,
                              marginBottom: 24,
                            }}
                            prefix={
                              <img
                                src={iconUrlMap[item.type]}
                                alt=''
                                style={{ width: '16px', height: '16px' }}
                              />
                            }
                            maxLength={50}
                            onBlur={e => handleBlurEditPropertyName(e, item.id)}
                            onChange={e => handleEditPropertyName(e, item.id)}
                            value={item.name}
                          />
                        </>
                      ) : (
                        <div className={styles['add_property_list_item_text_wrap']}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <img
                              className={styles['add_property_list_item_icon']}
                              src={iconUrlMap[item.type]}
                              alt=''
                            />
                            <Tooltip
                              placement='top'
                              title={item.name}
                            >
                              <div className={styles['add_property_list_item_name']}>{item.name}</div>
                            </Tooltip>
                            <span className={styles['add_property_list_item_type']}>{item.type}</span>
                          </div>
                          {/* 操作按钮：移入显示，移出隐藏 */}
                          {hoveredId === item.id && editingId !== item.id && (
                            <div className={styles['add_property_buttons-actions']}>
                              <img
                                onClick={() => handleEditName(item.id)}
                                style={{ width: '16px', height: '16px', marginRight: '8px' }}
                                src='/knowledge/document/edit.png'
                                alt=''
                              />
                              <img
                                onClick={() => handleDeleteProperty(item)}
                                style={{ width: '16px', height: '16px' }}
                                src='/knowledge/document/delete.png'
                                alt=''
                              />
                            </div>
                          )}

                          {hoveredId !== item.id && (
                            <div className={styles['add_property_list_item_value_number']}>
                              {item.distinctValueCount}个值
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className={styles['buildIn_property_switch_title']}>
                <Switch
                  size={'small'}
                  style={{ width: '28px' }}
                  checked={isEnableBuildIn}
                  onChange={e => {
                    switchChangeEvent(e)
                  }}
                />
                <span style={{ marginLeft: '4px' }}>内置</span>
                <Tooltip
                  placement='top'
                  title='内置文档属性是系统预定义的元数据，您可以在此处查看和管理内置文档属性。'
                >
                  <img
                    style={{ width: '16px', height: '16px' }}
                    src='/knowledge/document/tip.png'
                    alt=''
                  />
                </Tooltip>
              </div>
              <div className={styles['buildIn_property_list']}>
                {buildInList.length > 0 &&
                  buildInList.map(item => (
                    <div
                      key={item.id}
                      className={styles['buildIn_property_list_item']}
                    >
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <img
                          style={{ width: '16px', height: '16px' }}
                          src={iconUrlMap[item.type]}
                          alt=''
                        />
                        <span
                          className={`${styles['buildIn_property_item_name']} ${
                            !isEnableBuildIn ? styles['item_name_disabled_color'] : ''
                          }`}
                        >
                          {item.name}
                        </span>
                        <span
                          className={`${styles['buildIn_property_item_type']} ${
                            !isEnableBuildIn ? styles['item_type_disabled_color'] : ''
                          }`}
                        >
                          {item.type}
                        </span>
                      </div>
                      {!isEnableBuildIn && <div className={styles['item_right_disabled_text']}>已禁用</div>}
                    </div>
                  ))}
              </div>
            </div>

            <Modal
              open={visible}
              onCancel={e => hideDelModal(e)}
              closable={false}
              centered={true}
              styles={modalStyles} // 修正属性名，从 styles 改为 style
              footer={null}
              ref={ref}
            >
              <div style={containerStyle}>
                <img
                  src='/del_tip.png'
                  alt=''
                  style={{ width: 64, height: 64 }}
                />
                <div style={infoWrapperStyle}>
                  <div style={titleStyle}>{deleteTitle}</div>
                  <div style={contentStyle}>{content}</div>
                  <div style={buttonWrapperStyle}>
                    <Button
                      loading={loading}
                      style={cancelButtonStyle}
                      onClick={e => hideDelModal(e)}
                    >
                      取消
                    </Button>
                    <Button
                      loading={loading}
                      type='primary'
                      danger
                      style={confirmButtonStyle}
                      onClick={onOk}
                    >
                      确定
                    </Button>
                  </div>
                </div>
              </div>
            </Modal>
          </Drawer>
        )}
        {/* 新建文档属性面板 */}
        {isShowAdd && (
          <div className={styles['add_new_property']}>
            <div className={styles['add_new_property_title']}>新建文档属性</div>
            <div className={styles['document_property_label']}>类型</div>
            <div className={styles['document_property_type_list']}>
              {propertyTypeList.map(item => (
                <div
                  onClick={() => selectTypeEvent(item)}
                  key={item.value}
                  className={`${styles['document_property_type_item']} ${
                    type === item.value ? styles['type_item_selected'] : ''
                  }`}
                >
                  <img
                    className={styles['property_type_item_icon']}
                    src={item.url}
                    alt=''
                  />
                  <div className={styles['property_type_item_desc']}>
                    {item.label}({item.value})
                  </div>
                </div>
              ))}
            </div>
            <div className={styles['document_property_label']}>名称</div>

            <Input
              style={{
                width: 372,
                borderRadius: 8,
                border: 0,
                backgroundColor: 'rgba(244,244,244,0.5)',
                height: 36,
                marginBottom: 24,
              }}
              placeholder='添加属性名称'
              maxLength={50}
              onChange={e => setPropertyName(e.target.value)}
              value={propertyName}
            />

            <div className={styles['add_new_property_footer']}>
              <div
                className={`${styles['property_footer_btn']} ${styles['footer_cancel']}`}
                onClick={cancelAdd}
              >
                取消
              </div>
              <div
                className={`${styles['property_footer_btn']} ${styles['footer_save']}`}
                onClick={() => saveAddProperty()}
              >
                保存
              </div>
            </div>
          </div>
        )}
        {/* 删除弹窗 */}
        {/* <DeletePropertyModal
          ref={deleteRef}
          updateList={updateListEvent}
        /> */}
      </div>
    </div>
  )
})

export default AddProperlyDrawer

