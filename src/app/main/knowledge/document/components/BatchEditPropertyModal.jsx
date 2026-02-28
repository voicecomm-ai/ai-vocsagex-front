/* eslint-disable @next/next/no-img-element */
import { useState, useRef, forwardRef, useEffect, useImperativeHandle } from 'react'
import { Input, InputNumber, Modal, message, Button, Form, Tooltip, Checkbox, Dropdown, DatePicker } from 'antd'
import styles from '../../page.module.css'
import { SearchOutlined, PlusOutlined } from '@ant-design/icons'
import {
  getDocumentPropertyById,
  getKnowledgePropertyList,
  addDocumentProperty,
  editDocumentPropertyValue,
  getSameDocumentProperty,
} from '@/api/knowledge'
import dayjs from 'dayjs'

// import DeleteModal from '../components/DeleteModal'

const BatchEditPropertyModal = forwardRef((props, ref) => {
  useImperativeHandle(ref, () => ({
    showModal,
    hideModal,
  }))
  const [propertyList, setPropertyList] = useState([]) //新建文档属性列表
  const [knowledgeId, setKnowledgeId] = useState('')
  const [isShowList, setIsShowList] = useState(false) //是否打开属性列表
  const [visible, setVisible] = useState(false) //是否展示新建文档属性面板
  const [isShowPanel, setIsShowPanel] = useState(false) //是否展示新建属性面板
  const [isApplyAll, setIsApplyAll] = useState(false) //是否展示新建属性面板
  const [searchKeyword, setSearchKeyword] = useState('') //搜索文档属性名称
  const [propertyName, setPropertyName] = useState('') //属性名称
  const [selectedIds, setSelectedIds] = useState([]) //属性名称

  const [type, setType] = useState('String') //属性类型 默认选第一个
  const modalRef = useRef(null) //弹窗ref
  const [hasEditedList, sethasEditedList] = useState([]) //已经编辑过的属性列表
  const [newData, setNewData] = useState([]) // b区域的新增数据
  const [deleteIds, setDeleteIds] = useState([]) // 新增数据
  const { Item: FormItem } = Form
  const [form] = Form.useForm() // Form实例
  const [newEditList, setNewEditList] = useState([]) //新建的待编辑属性
  const formRef = useRef(null)

  const propertyTypeList = [
    { label: '文本', value: 'String', url: '/knowledge/document/string.png' },
    { label: '数字', value: 'Number', url: '/knowledge/document/number.png' },
    { label: '时间', value: 'Time', url: '/knowledge/document/time.png' },
  ]

  const iconUrlMap = {
    String: '/knowledge/document/string.png',
    Number: '/knowledge/document/number.png',
    Time: '/knowledge/document/time.png',
  }

  const getDocumentPropertyByIdList = async ids => {
    const data = {
      documentIds: ids,
    }
    getDocumentPropertyById(data)
      .then(res => {
        // let data = res.data || []
        const arr = res.data
          .filter(item => !item.isBuiltIn)
          .map(item => ({
            ...item,
            selId: generateId(), // 确保selId唯一且正确生成
            value: item.values[0],
          }))
        sethasEditedList(arr)
        console.log(arr)
      })
      .then(err => {})
  }

  useEffect(() => {
    let params = new URLSearchParams(window.location.search)
    let knowId = params.get('id')
    setKnowledgeId(knowId)
  }, [])
  useEffect(() => {
    hasEditedList.forEach(item => {
      if (item.type === 'Time') {
        form.setFieldValue(item.selId, dayjs(item.value, 'YYYY-MM-DD HH:mm'))
      } else {
        form.setFieldValue(item.selId, item.value)
      }
    })
  }, [hasEditedList])
  // 显示模态框，将 visible 状态设置为 true
  const showModal = selectedRowKeys => {
    setVisible(true)
    setSelectedIds(selectedRowKeys)
    getDocumentPropertyByIdList(selectedRowKeys)
  }

  // 隐藏模态框，将 visible 状态设置为 false
  const hideModal = () => {
    setVisible(false)
  }

  // 关闭管理标签modal
  const handleClose = () => {
    hideModal()
    setSearchKeyword('')
    setPropertyName('')
    setType('String')
    setNewData([])
    setIsShowList(false)
    setIsShowPanel(false)
    setIsApplyAll(false)
    setDeleteIds([])
  }
  //保存
  const handleSaveEdit = async () => {
    let data = {}
    // 组合所有数据

    try {
      // 验证所有表单字段
      // const allValues = await form.validateFields()
      // const allData = [...hasEditedList, ...newData]
      let editArr = hasEditedList.map(item => {
        return { metadataId: item.id, newValue: item.value }
      })
      let addArr = newData.map(item => {
        return { metadataId: item.id, newValue: item.value }
      })

      // 模拟保存操作
      // console.log('保存的数据:', allData, editArr)
      data = {
        applyToAllDocuments: isApplyAll,
        documentIds: selectedIds,
        deletedMetadataIds: deleteIds,
        metadataEditRequests: editArr,
        metadataAddRequests: addArr,
      }
      // console.log(data)

      editDocumentPropertyValue(data)
        .then(res => {
          handleClose()
          message.success(res.msg)
        })
        .then(err => {})
    } catch (errorInfo) {
      message.error(errorInfo)
    }
  }
  //打开管理弹窗
  const openManagePropertyModal = () => {
    setSearchKeyword('')
    setIsShowList(false)
    setIsShowPanel(false)
    setTimeout(() => {
      hideModal()
    }, 200)
    props.onManageProperty()
  }

  //搜索change事件
  const searchChangeEvent = e => {
    let value = e.target.value
    setSearchKeyword(value)
  }

  // 根据搜索词过滤列表
  const filteredItems = propertyList.filter(item => item.name.toLowerCase().includes(searchKeyword.toLowerCase()))

  const selectTypeEvent = (item, e) => {
    setType(item.value)
    e.stopPropagation()
  }

  //保存添加属性
  const saveAddProperty = () => {
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
            setIsShowList(true)
            setIsShowPanel(false)
          }
        })
        .catch(err => {})
    }
  }

  // 取消添加
  const cancelAdd = () => {
    setIsShowList(true)
    setPropertyName('')
    setType('String')
  }
  //打开文档属性列表
  const openPropertyListEvent = e => {
    e.preventDefault()
    setIsShowList(true)
    setIsShowPanel(false)
    getKnowledgePropertyListData()
  }

  const getKnowledgePropertyListData = async () => {
    getKnowledgePropertyList(knowledgeId)
      .then(res => {
        // let data = res.data || []
        const arr = res.data.filter(item => !item.isBuiltIn)
        let data = arr
        setPropertyList(data)
      })
      .catch(() => {})
  }
  //打开新建属性面板
  const addNewPropertyEvent = e => {
    setIsShowList(false)
    setIsShowPanel(true)
    e.stopPropagation()
  }

  // 删除新建的属性
  const deleteEditItem = (deleteItem, isExisting) => {
    // console.log(deleteItem, isExisting)

    if (isExisting) {
      const arr = hasEditedList.filter(item => item.selId !== deleteItem.selId)
      let delIds = []
      delIds = [...deleteIds, deleteItem.id]
      // console.log(delIds)

      setDeleteIds(delIds)
      sethasEditedList(arr)
    } else {
      const arr = newData.filter(item => item.selId !== deleteItem.selId)
      setNewData(arr)
    }
  }

  //选择属性到新建元数据下编辑
  const selectItemToNewEdit = async selectItem => {
    // console.log(selectItem)

    // selectItem.isSaved = false
    selectItem.selId = generateId()
    const arr = [...newData, selectItem]
    setNewData(arr)
    setIsShowList(false)
    setIsShowPanel(false)
  }

  // 处理表单值变化
  const handleValueChange = (selId, value, isExisting = false, type, dateString = '') => {
    if (isExisting) {
      if (type === 'Time') {
        form.setFieldValue(selId, value)
        sethasEditedList(hasEditedList.map(item => (item.selId === selId ? { ...item, value: dateString } : item)))
      } else {
        sethasEditedList(hasEditedList.map(item => (item.selId === selId ? { ...item, value } : item)))
      }
    } else {
      if (type === 'Time') {
        form.setFieldValue(selId, value)
        setNewData(newData.map(item => (item.selId === selId ? { ...item, value: dateString } : item)))
      } else {
        sethasEditedList(hasEditedList.map(item => (item.selId === selId ? { ...item, value } : item)))
        setNewData(newData.map(item => (item.selId === selId ? { ...item, value } : item)))
      }
    }
  }

  // 生成唯一ID
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
  }

  // 根据类型渲染表单组件
  const renderFormComponent = (item, isExisting = false) => {
    // console.log(item)

    switch (item.type) {
      case 'String':
        return (
          <Input
            placeholder='请输入文本'
            maxLength={50}
            value={item.value || ''}
            onChange={e => handleValueChange(item.selId, e.target.value, isExisting, item.type)}
            style={{ width: '100%' }}
          />
        )
      case 'Number':
        return (
          <InputNumber
            placeholder='请输入数字'
            value={item.value || null}
            max={9999}
            onChange={value => handleValueChange(item.selId, value, isExisting, item.type)}
            style={{ width: '100%' }}
          />
        )
      case 'Time':
        return (
          <DatePicker
            locale='zhCN'
            defaultValue={item.value ? dayjs(item.value) : null}
            format='YYYY-MM-DD HH:mm'
            placeholder='请选择时间'
            showTime
            onChange={(date, dateString) => handleValueChange(item.selId, date, isExisting, item.type, dateString)}
            style={{ width: '100%' }}
          />
        )
      default:
        return null
    }
  }

  return (
    <Modal
      open={visible}
      onCancel={handleClose}
      ref={modalRef}
      className='app-custom-modal'
      width={640}
      centered={true}
      height={440}
      title={<div style={{ fontSize: 24, marginBottom: 20 }}>编辑文档属性</div>}
      footer={null}
      styles={{
        content: {
          backgroundImage: 'url("/application/app_modal_back.png")',
          borderRadius: 24,
          padding: '24px 24px 32px',
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
      <div className={styles['edit_property_modal_title']}>
        编辑<span style={{ color: '#3772FE', margin: '0 4px' }}>{selectedIds.length}</span>个文档
      </div>
      <div className={styles['edit_property_content_scroll_wrap']}>
        {/* 上一次编辑的 */}
        {hasEditedList.length > 0 && (
          <Form
            form={form}
            layout='horizontal'
          >
            {hasEditedList.map((item, index) => (
              <div
                className={styles['has_edited_property_item']}
                key={item.id}
              >
                <Form.Item
                  name={item.selId}
                  rules={[{ required: true, message: '此字段不能为空' }]}
                  style={{ margin: 0, flexGrow: 1 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className={styles['has_edited_item_label_wrap']}>
                      <div className={styles['has_edited_item_label_inner']}>
                        <img
                          style={{ width: '16px', height: '16px' }}
                          src={iconUrlMap[item.type]}
                          alt=''
                        />
                        <Tooltip
                          placement='top'
                          title={item.name}
                        >
                          <div className={`${styles['buildIn_property_item_name']}`}>{item.name}</div>
                        </Tooltip>
                        <span className={`${styles['buildIn_property_item_type']}`}>{item.type}</span>
                      </div>
                    </div>
                    {renderFormComponent(item, true)}
                    <div className={styles['delete_icon_wrap']}>
                      <img
                        style={{ width: '16px', height: '16px' }}
                        className={styles['delete_icon_normal']}
                        src='/knowledge/document/edit_delete.png'
                        alt=''
                      />
                      <img
                        onClick={() => deleteEditItem(item, true)}
                        style={{ width: '16px', height: '16px' }}
                        className={styles['delete_icon_hover']}
                        src='/knowledge/document/delete.png'
                        alt=''
                      />
                    </div>
                  </div>
                </Form.Item>
              </div>
            ))}
          </Form>
        )}

        {/* <div>新建元数据：</div> */}
        <div>
          {newData.length > 0 && (
            <Form
              form={form}
              layout='horizontal'
            >
              {newData.map(item => (
                <div
                  className={styles['has_edited_property_item']}
                  key={item.id}
                >
                  <Form.Item
                    name={item.selId}
                    rules={[{ required: true, message: '此字段不能为空' }]}
                    style={{ margin: 0, flexGrow: 1 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className={styles['has_edited_item_label_wrap']}>
                        <div className={styles['has_edited_item_label_inner']}>
                          <img
                            style={{ width: '16px', height: '16px' }}
                            src={iconUrlMap[item.type]}
                            alt=''
                          />
                          <Tooltip
                            placement='top'
                            title={item.name}
                          >
                            <span className={`${styles['buildIn_property_item_name']}`}>{item.name}</span>
                          </Tooltip>
                          <span className={`${styles['buildIn_property_item_type']}`}>{item.type}</span>
                        </div>
                      </div>
                      {renderFormComponent(item)}
                      <div className={styles['delete_icon_wrap']}>
                        <img
                          style={{ width: '16px', height: '16px' }}
                          className={styles['delete_icon_normal']}
                          src='/knowledge/document/edit_delete.png'
                          alt=''
                        />
                        <img
                          onClick={() => deleteEditItem(item)}
                          style={{ width: '16px', height: '16px' }}
                          className={styles['delete_icon_hover']}
                          src='/knowledge/document/delete.png'
                          alt=''
                        />
                      </div>
                    </div>
                  </Form.Item>
                </div>
              ))}
            </Form>
          )}
        </div>

        {/* 新建的元数据 */}

        {/* 新建文档数据弹窗 */}
        <Dropdown
          overlayStyle={{
            width: 400, // 固定宽度
            minWidth: 400,
          }}
          popupRender={() => (
            <>
              {isShowList ? (
                <div className={styles['property_list_handle_wrap']}>
                  <div className={styles['property_list_handle_header']}>
                    <Input
                      className={styles['property_list_handle_wrap_input']}
                      variant='borderless'
                      placeholder='搜索文档属性名称'
                      maxLength={50}
                      value={searchKeyword}
                      onChange={e => searchChangeEvent(e)}
                      onPressEnter={e => searchPressEvent(e)}
                      suffix={<SearchOutlined style={{ cursor: 'pointer' }} />}
                    />
                    <div className={styles['property_list_handle_wrap_content']}>
                      {filteredItems.length > 0 &&
                        filteredItems.map((item, index) => (
                          <div
                            key={index}
                            onClick={() => selectItemToNewEdit(item)}
                            className={styles['property_list_item']}
                          >
                            <div className={styles['display_flex']}>
                              <img
                                style={{ width: '16px', height: '16px' }}
                                src={iconUrlMap[item.type]}
                                alt=''
                              />
                              <Tooltip
                                placement='top'
                                title={item.name}
                              >
                                <span className={styles['property_list_handle_name']}>{item.name}</span>
                              </Tooltip>
                            </div>
                            <span className={styles['property_list_handle_type']}>{item.type}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                  <div className={styles['property_list_handle_footer']}>
                    <div
                      className={styles['property_list_handle_footer_left']}
                      onClick={e => {
                        addNewPropertyEvent(e)
                      }}
                    >
                      <img
                        style={{ width: '10px', height: '10px', marginRight: '3px' }}
                        src='/knowledge/document/edit_add.png'
                        alt=''
                      />
                      新建文档属性
                    </div>
                    <div className={styles['property_list_handle_footer_right']}>
                      <div className={styles['manage_property_btn_line']}></div>
                      <div
                        className={styles['manage_property_btn']}
                        onClick={openManagePropertyModal}
                      >
                        管理
                        <img
                          style={{ width: '16px', height: '16px', marginLeft: '4px' }}
                          src='/knowledge/document/edit_manage.png'
                          alt=''
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : isShowPanel ? (
                <div className={styles['edit_add_new_property']}>
                  <div className={styles['edit_add_new_property_title']}>新建文档属性</div>
                  <div className={styles['edit_document_property_label']}>类型</div>
                  <div className={styles['edit_document_property_type_list']}>
                    {propertyTypeList.map(item => (
                      <div
                        onClick={e => selectTypeEvent(item, e)}
                        key={item.value}
                        className={`${styles['edit_document_property_type_item']} ${
                          type === item.value ? styles['edit_type_item_selected'] : ''
                        }`}
                      >
                        <img
                          className={styles['edit_property_type_item_icon']}
                          src={item.url}
                          alt=''
                        />
                        <div className={styles['edit_property_type_item_desc']}>
                          {item.label}({item.value})
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className={styles['edit_document_property_label']}>名称</div>

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
                    onChange={e => {
                      setPropertyName(e.target.value)
                      e.stopPropagation()
                    }}
                    value={propertyName}
                  />

                  <div className={styles['edit_add_new_property_footer']}>
                    <div
                      className={`${styles['edit_property_footer_btn']} ${styles['edit_footer_cancel']}`}
                      onClick={cancelAdd}
                    >
                      取消
                    </div>
                    <div
                      className={`${styles['edit_property_footer_btn']} ${styles['edit_footer_save']}`}
                      onClick={() => saveAddProperty()}
                    >
                      保存
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          )}
          trigger={['click']}
          placement='topLeft'
        >
          <div
            className={styles['edit_property_add_btn']}
            id='handlePanel'
            onClick={e => openPropertyListEvent(e)}
          >
            <img
              style={{ width: '10px', height: '10px', marginRight: '3px' }}
              src='/knowledge/document/edit_add.png'
              alt=''
            />
            添加文档属性
            {/* 添加文档属性列表面板 */}
            {/* {isOpenHandlePanel ? (

        ) : null} */}
          </div>
        </Dropdown>
      </div>

      <div className={styles['edit_property_footer']}>
        <div className={styles['display_flex']}>
          <Checkbox
            checked={isApplyAll}
            onChange={e => setIsApplyAll(e.target.checked)}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              应用于所有选定文档
              <Tooltip
                placement='top'
                title='自动为所有选定文档创建上述编辑和新文档属性，否则仅对具有文档属性的文档应用编辑。'
              >
                <img
                  style={{ width: '16px', height: '16px' }}
                  src='/knowledge/document/tip.png'
                  alt=''
                />
              </Tooltip>
            </div>
          </Checkbox>
        </div>
        <div className={styles['display_flex']}>
          <Button
            style={{ marginRight: '16px', borderRadius: '8px' }}
            onClick={handleClose}
          >
            取消
          </Button>
          <Button
            onClick={handleSaveEdit}
            type='primary'
            style={{ borderRadius: '8px' }}
          >
            保存
          </Button>
        </div>
      </div>
      {/* </div> */}
    </Modal>
  )
})

export default BatchEditPropertyModal

