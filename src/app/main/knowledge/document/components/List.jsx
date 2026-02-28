/* eslint-disable @next/next/no-img-element */
'use client'
import React, { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react'
import styles from '../../page.module.css'
import { useRouter, useParams } from 'next/navigation'
import {
  Select,
  Input,
  Button,
  Table,
  ConfigProvider,
  Checkbox,
  Divider,
  Tooltip,
  message,
  Switch,
  Typography,
} from 'antd'
import { SearchOutlined, PlusOutlined } from '@ant-design/icons'
import { getKnowledgeDetail, getDocumentList } from '@/api/knowledge'
import EnableModal from './EnableModal'
import DisableModal from './DisableModal'
import BatchEditPropertyModal from './BatchEditPropertyModal'
import AddPropertyModal from './AddProperlyDrawer'
import { checkPermission } from '@/utils/utils'
const DocumentList = forwardRef((props, ref) => {
  const { Paragraph, Text } = Typography
  const router = useRouter()
  const tabRef = useRef(null)
  const selectAllRef = useRef(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState([]) // 存储选中的行key
  const [selectAll, setSelectAll] = useState(false)
  const [knowledgeId, setKnowledgeId] = useState(null) //知识库id
  const [knowledgeDetail, setKnowledgeDetail] = useState({}) //知识库详情
  const [documentList, setDocumentList] = useState([]) //文档列表
  const [tabType, setTabType] = useState('list') //当前tab list 列表 detail 文档详情
  const abortRef = useRef(null)
  const enableRef = useRef(null)
  const disableRef = useRef(null)
  // 当前正在编辑的项
  const [editingId, setEditingId] = useState(null)
  const addPropertyRef = useRef(null)
  const batchEditPropertyRef = useRef(null)
  const loadingRef = useRef(false)
  useImperativeHandle(ref, () => ({
    refreshData,
  }))
  const imgUrls = {
    txt: '/knowledge/txt.png',
    markdown: '/knowledge/other.png',
    mdx: '/knowledge/other.png',
    pdf: '/knowledge/pdf.png',
    html: '/knowledge/other.png',
    xlsx: '/knowledge/xlsx.png',
    docx: '/knowledge/docx.png',
    csv: '/knowledge/csv.png',
    md: '/knowledge/other.png',
    htm: '/knowledge/other.png',
  }
  const tabList = [
    { label: '文档', key: '0' },
    { label: '检索测试', key: '1' },
  ]
  const statusList = [
    { label: '全部状态', value: '1' },
    { label: '启用', value: 'ENABLE' },
    { label: '禁用', value: 'DISABLE' },
    { label: '已归档', value: 'ARCHIVE' },
  ]
  const columns = [
    {
      title: '文档名称',
      dataIndex: 'name',
      key: 'name',

      ellipsis: true,
      render: (_, record) => (
        <div className={styles['document_name']}>
          <img src={imgUrls[record.uniqueName.split('.')[1]]} />
          {/* {editingId === record.id ? ( */}
          {/* <Input
            style={{
              border: 0,
              backgroundColor: 'transparent',
              height: 36,
            }}
            maxLength={50}
            onBlur={e => handleBlurEditDocumentName(e, record.id)}
            onChange={e => handleEditDocumentName(e, record.id)}
            onFocus={e => focusEditDocumentName(e, record.id)}
            value={record.name}
          /> */}
          {/* ) : ( */}
          <Text
            style={{ maxWidth: '100%' }}
            ellipsis={{ tooltip: record.name }}
          >
            {record.name}
          </Text>
          {/* )} */}

          {/* <img
            className={styles['document_name_edit_icon']}
            onClick={e => onEditListDocName(e, record)}
            src='/knowledge/document/edit_list.png'
            alt=''
          /> */}
        </div>
      ),
    },
    {
      title: '分段模式',
      dataIndex: 'chunkingStrategy',
      key: 'chunkingStrategy',
      width: 160,
      render: (_, record) => (
        <div className={styles['operation_container']}>
          {record.chunkingStrategy == 'NORMAL' && (
            <div className={styles['chunkingStrategy_div']}>
              <img src='/knowledge/document/normal.png' />
              普通
            </div>
          )}
          {record.chunkingStrategy == 'NORMAL_QA' && (
            <div className={styles['chunkingStrategy_div']}>
              <img src='/knowledge/document/normal.png' />
              普通-QA
            </div>
          )}
          {record.chunkingStrategy != 'NORMAL' && record.chunkingStrategy != 'NORMAL_QA' && (
            <div className={styles['chunkingStrategy_div']}>
              <img src='/knowledge/document/advanced.png' />
              高级
            </div>
          )}
        </div>
      ),
    },
    {
      title: '字符数',
      dataIndex: 'wordCount',
      key: 'wordCount',
      width: 120,
      render: wordCount => {
        return `${(wordCount / 1000).toFixed(2)}k`
      },
    },
    {
      title: '嵌入处理',
      dataIndex: 'processStatus',
      key: 'processStatus',
      width: 120,
      render: (_, record) => (
        <div className={styles['operation_container']}>
          {record.processStatus == 'IN_PROGRESS' && (
            <div className={styles['processStatus_div']}>
              <img
                className={styles['processStatus_div_process']}
                src='/knowledge/document/process.png'
              />
              处理中...
            </div>
          )}
          {record.processStatus == 'WAITING' && (
            <div className={styles['processStatus_div']}>
              <img
                className={styles['processStatus_div_process']}
                src='/knowledge/document/process.png'
              />
              处理中...
            </div>
          )}
          {record.processStatus == 'SUCCESS' && (
            <div className={styles['processStatus_div']}>
              <img src='/knowledge/document/success.png' />
              处理完成
            </div>
          )}
          {record.processStatus == 'FAILED' && (
            <Tooltip title={record.processFailedReason}>
              <div className={styles['processStatus_div']}>
                <img src='/knowledge/document/fail.png' />
                处理失败
              </div>
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      title: '上传时间',
      dataIndex: 'createTime',
      key: 'createTime',
      sorter: (a, b) => new Date(a.createTime).getTime() - new Date(b.createTime).getTime(),
      width: 200,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      key: 'status',
      render: (_, record) => (
        <div className={styles['operation_container']}>
          {!record.isArchived && record.status == 'ENABLE' && (
            <div className={`${styles['status_div']} ${styles['enable_status']}`}>
              <div className={`${styles['status_div_radio']} ${styles['enable_radio']}`}></div>
              启用
            </div>
          )}
          {!record.isArchived && record.status == 'DISABLE' && (
            <div className={styles['status_div']}>
              <div className={styles['status_div_radio']}></div>
              禁用
            </div>
          )}
          {record.isArchived && (
            <div className={styles['status_div']}>
              <div className={styles['status_div_radio']}></div>
              已归档
            </div>
          )}
        </div>
      ),
    },
    {
      title: '操作',
      dataIndex: 'action',
      width: 120,
      key: 'action',
      onCell: (record, rowIndex) => ({
        onClick: event => {
          // 阻止事件继续冒泡
          event.stopPropagation()
        },
      }),
      render: (_, record) => {
        let statusText = !record.isArchived && record.status === 'ENABLE' ? true : false
        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip
              placement='top'
              title={statusText ? '点击禁用' : '点击启用'}
            >
              <Switch
                size={'small'}
                disabled={record.isArchived || !canCreate}
                checked={statusText}
                onChange={e => {
                  switchChangeEvent(e, record)
                }}
              />
            </Tooltip>

            <Tooltip
              placement='top'
              title='分段设置'
            >
              <div className={styles['list_action_segment_icon']}>
                <img
                  onClick={e => goChunksSetting(e, record)}
                  style={{ width: '16px', height: '16px' }}
                  src='/knowledge/document/segment.png'
                  alt=''
                />
              </div>
            </Tooltip>
          </div>
        )
      },
    },
  ]
  const [tab, setTab] = useState(0)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [status, setStatus] = useState('')
  const [canCreate, setCanCreate] = useState(false) //创建应用权限
  //管理文档属性弹窗
  const [batchPropertyModalVisible, setBatchPropertyModalVisible] = useState(false)
  useEffect(() => {
    // 获取单个参数
    let params = new URLSearchParams(window.location.search)
    let value = params.get('id')
    setKnowledgeId(value)
    setCanCreate(checkPermission('/main/knowledge/operation'))
  }, [])

  useEffect(() => {
    if (!knowledgeId) return
    getKnowledgeDetailEvent(knowledgeId)
    getDocumentListEvent()
  }, [knowledgeId])

  //返回知识库
  const handleBack = () => {
    router.push('/main/knowledge')
  }

  // 处理输入框内容变化
  const handleEditDocumentName = (e, editId) => {
    console.log(editId)

    e.stopPropagation()
    // setDocumentList(documentList.map(item => (item.id === editId ? { ...item, name: e.target.value } : item)))
  }

  const focusEditDocumentName = (e, record) => {
    e.stopPropagation()
    e.preventDefault()
    setEditingId(record.id)
  }

  // 处理编辑完成（按 Enter 或失去焦点）
  const handleBlurEditDocumentName = async (e, id) => {
    console.log(id)
    setEditingId(null)
    // const data = {
    //   id,
    //   name: e.target.value,
    // }
    // editDocumentProperty(data)
    //   .then(res => {})
    //   .catch(err => {})

    setEditingId(null)
  }

  const onEditListDocName = (e, record) => {
    e.stopPropagation()
    setEditingId(record.id)
  }
  //跳转到分段页面
  const onJumpToSegment = () => {}

  //获取知识库详情
  const getKnowledgeDetailEvent = async id => {
    getKnowledgeDetail(id).then(res => {
      setKnowledgeDetail(res.data)
    })
  }
  const convertObjToIdValue = obj => {
    return Object.entries(obj).map(([id, value]) => ({ id, ...value }))
  }
  const refreshData = obj => {
    // console.log(obj, 'ooooo')

    let map = obj.documentStatus
    let idValueList = convertObjToIdValue(map)
    let data = JSON.parse(JSON.stringify(documentList))
    if (data && data.length) {
      //查找当前数组是否存在处理中的状态
      let index = data.findIndex(item => item.processStatus === 'IN_PROGRESS')
      if (index != -1) {
        // 遍历数据，对比 processStatus 状态，如果不同则更新为 idValueList 中的状态
        data.forEach(item => {
          idValueList.forEach(({ id, status, wordCount }) => {
            if (item.id == parseInt(id)) {
              item.processStatus = status
              item.wordCount = wordCount
            }
          })
        })
        setDocumentList(data)
      } else {
        //关闭sse
        props.closeSse()
      }
    }
  }
  //搜索事件
  const searchEvent = () => {
    getDocumentListEvent()
  }
  //获取文档列表
  const getDocumentListEvent = (state, name, type) => {
    loadingRef.current = true
    let data = {
      status: type == 'status' ? state : status,
      name: type == 'search' ? name : searchKeyword,
    }
    cancelSelectEvent()

    getDocumentList(knowledgeId, data)
      .then(res => {
        let list = res.data
        let index = list.findIndex(item => item.processStatus === 'IN_PROGRESS')
        if (index == -1) {
          // 不存在处理中的状态 关闭sse
          props.closeSse()
        }
        setDocumentList(res.data)
        loadingRef.current = false
      })
      .catch(() => {
        loadingRef.current = false
      })
  }
  //表格选择事件
  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys, selectedRows) => {
      // console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows)
      setSelectedRowKeys(selectedRowKeys) // 更新选中的行key
      // 当选中的行数等于文档列表长度时，设置全选状态为true，否则为false
      setSelectAll(selectedRowKeys.length === documentList.length)
    },
    onSelect: (record, selected, selectedRows) => {
      const newSelectedRowKeys = selected
        ? [...selectedRowKeys, record.id]
        : selectedRowKeys.filter(key => key !== record.id)
      setSelectedRowKeys(newSelectedRowKeys) // 更新选中的行key
      console.log(newSelectedRowKeys, 'newSelectedRowKeys')

      // 当选中的行数等于文档列表长度时，设置全选状态为true，否则为false
      setSelectAll(newSelectedRowKeys.length === documentList.length)
    },
    onSelectAll: (selected, selectedRows, changeRows) => {
      setSelectedRowKeys(selected ? documentList.map(item => item.id) : []) // 更新选中的行key
      setSelectAll(selected) // 设置全选状态
    },
    onCell: (record, rowIndex) => ({
      onClick: event => {
        // 阻止事件继续冒泡
        event.stopPropagation()
      },
    }),
  }
  //全部选择
  const selectAllChange = e => {
    setSelectAll(e.target.checked)
    //表格选择全部;
    setSelectedRowKeys(e.target.checked ? documentList.map(item => item.id) : [])
  }
  //取消全选点击事件
  const cancelSelectEvent = () => {
    setSelectAll(false)
    setSelectedRowKeys([])
  }

  //切换状态事件
  const switchChangeEvent = (status, obj) => {
    let title = status ? '要启用文档吗？' : '要禁用文档吗？'
    let content = status ? '启用后可正常引用！' : '禁用后无法引用！'

    if (status) {
      enableRef.current.showModal(obj, title, content, 'ENABLE', [])
    } else {
      disableRef.current.showModal(obj, title, content, 'DISABLE', [])
    }
  }
  //批量删除文档
  const batchDelDocumentEvent = () => {
    let title = '要删除文档吗？'
    let content = '共删除' + selectedRowKeys.length + '个文档，删除后无法恢复且无法引用！'
    disableRef.current.showModal('', title, content, 'del', selectedRowKeys)
  }
  //批量启用点击事件
  const batchEnableDocumentEvent = () => {
    let title = '要启用文档吗？'
    let data = documentList.filter(
      item => selectedRowKeys.includes(item.id) && item.status === 'DISABLE' && !item.isArchived
    )
    let content = '共启用' + data.length + '个文档，启用后可正常引用！'
    //根据当前选中从documentList获取所有状态为DISABLE的文档
    if (data.length === 0) {
      return message.warning('无可操作数据')
    }
    enableRef.current.showModal('', title, content, 'ENABLE', data)
  }
  //批量禁用点击事件
  const batchDisableDocumentEvent = () => {
    let title = '要禁用文档吗？'
    let data = documentList.filter(
      item => selectedRowKeys.includes(item.id) && item.status === 'ENABLE' && !item.isArchived
    )
    let content = '共禁用' + data.length + '个文档，禁用后无法引用！'
    if (data.length === 0) {
      return message.warning('无可操作数据')
    }
    disableRef.current.showModal('', title, content, 'DISABLE', data)
  }
  //批量文档属性点击事件
  const batchPropertyDocumentEvent = () => {
    batchEditPropertyRef.current.showModal(selectedRowKeys)
    // setBatchPropertyModalVisible(true)
    // let title = '要禁用文档吗？'
    // let data = documentList.filter(
    //   item => selectedRowKeys.includes(item.id) && item.status === 'ENABLE' && !item.isArchived
    // )
    // let content = '共禁用' + data.length + '个文档，禁用后无法引用！'
    // if (data.length === 0) {
    //   return message.warning('无可操作数据')
    // }
    // disableRef.current.showModal('', title, content, 'DISABLE', data)
  }

  // 跳转管理
  const onOpenmanageProperty = () => {
    openPropertyEvent()
  }
  //批量归档点击事件
  const batchArchiveDocumentEvent = () => {
    let title = '要归档文档吗？'
    let data = documentList.filter(item => selectedRowKeys.includes(item.id) && !item.isArchived)
    let content = '共归档' + data.length + '个文档，归档后无法引用！'
    if (data.length === 0) {
      return message.warning('无可操作数据')
    }
    disableRef.current.showModal('', title, content, 'ARCHIVE', data)
  }
  //批量撤销归档
  const batchRevokeArchiveDocumentEvent = () => {
    let title = '要撤销归档文档吗？'
    let data = documentList.filter(item => selectedRowKeys.includes(item.id) && item.isArchived)
    let content = '共撤销归档' + data.length + '个文档！'
    if (data.length === 0) {
      return message.warning('无可操作数据')
    }
    enableRef.current.showModal('', title, content, 'REVOKE_ARCHIVE', data)
  }
  //回车搜索事件
  const searchPressEvent = e => {
    let value = e.target.value
    getDocumentListEvent(status, value, 'search')
  }
  //搜索change事件
  const searchChangeEvent = e => {
    let value = e.target.value
    setSearchKeyword(value)
    getDocumentListEvent(status, value, 'search')
  }
  //状态change 事件
  const statusChangeEvent = value => {
    let statusText = value == 1 ? '' : value
    setStatus(statusText)
    getDocumentListEvent(statusText, '', 'status')
  }
  const statusSearchEvent = () => {
    searchEvent()
    setSelectAll(false)
    setSelectedRowKeys([])
    getDocumentListEvent()
  }
  //表格行点击事件
  const goDetailEvent = (e, obj) => {
    // console.log(editingId, 'editingId')

    e.stopPropagation()
    if (!editingId) {
      router.push(`/main/knowledge/document?id=${knowledgeId}&type=detail&documentId=${obj.id}`)
    }
    props.changeTypeEvent('detail', obj)
  }

  //去分段设置
  const goChunksSetting = (e, record) => {
    e.stopPropagation()
    router.push(`/main/knowledge/${knowledgeId}/chunks-setting?name=${record.name}&from=list&docId=${record.id}`)
  }

  //添加文档属性点击事件
  const openPropertyEvent = () => {
    addPropertyRef.current.showModal()
  }

  const goUploadEvent = () => {
    props.closeSse()
    router.push(`/main/knowledge/${knowledgeId}/upload-document`)
  }
  return (
    <div className={styles['document_content_list']}>
      <div className={styles['document_content_right']}>
        <div className={styles['document_content_right_header']}>
          <div className={styles['document_content_right_header_left']}>文档</div>
          <div className={styles['document_content_right_header_right']}>
            <Select
              placeholder='全部状态'
              variant='borderless'
              defaultValue={'1'}
              onChange={statusChangeEvent}
              className={styles['document_content_right_header_right_select']}
            >
              {statusList.map(item => (
                <Select.Option
                  key={item.value}
                  value={item.value}
                >
                  {item.label}
                </Select.Option>
              ))}
            </Select>

            <Input
              className={styles['document_content_right_header_right_input']}
              variant='borderless'
              placeholder='搜索'
              maxLength={50}
              value={searchKeyword}
              onChange={e => searchChangeEvent(e)}
              onPressEnter={e => searchPressEvent(e)}
              suffix={<SearchOutlined style={{ cursor: 'pointer' }} />}
            />
            <Divider
              type='vertical'
              style={{ height: 30 }}
            ></Divider>
            {canCreate && (
              <Button
                className={styles['document_content_right_header_right_button_left']}
                onClick={openPropertyEvent}
              >
                <img
                  className={styles['button_left_icon']}
                  src='/knowledge/document/property_btn.png'
                />
                <span>文档属性</span>
              </Button>
            )}
            {canCreate && (
              <Button
                type='primary'
                className={styles['document_content_right_header_right_button_right']}
                onClick={() => {
                  goUploadEvent()
                }}
                icon={<PlusOutlined />}
              >
                添加文件
              </Button>
            )}
          </div>
        </div>
        {/* 存在文档时才能全选 */}
        {canCreate && documentList.length > 0 && (
          <div className={styles['document_content_right_action']}>
            {(selectAll || selectedRowKeys.length > 0) && (
              <div className={styles['document_content_right_action_check']}>
                <div className={styles['document_content_right_action_check_item']}>
                  {' '}
                  <img src='/mcp/check.png' />
                  {selectedRowKeys.length}项已选
                </div>
                <Divider type='vertical' />
                <div
                  onClick={batchEnableDocumentEvent}
                  className={styles['document_content_right_action_check_item']}
                >
                  <img src='/knowledge/document/enable.png' />
                  启用
                </div>
                <div
                  onClick={batchDisableDocumentEvent}
                  className={styles['document_content_right_action_check_item']}
                >
                  {' '}
                  <img src='/knowledge/document/disable.png' />
                  禁用
                </div>
                <div
                  onClick={batchPropertyDocumentEvent}
                  className={styles['document_content_right_action_check_item']}
                >
                  {' '}
                  <img src='/knowledge/document/property.png' />
                  文档属性
                </div>
                <div
                  onClick={batchArchiveDocumentEvent}
                  className={styles['document_content_right_action_check_item']}
                >
                  {' '}
                  <img src='/knowledge/document/archive.png' />
                  归档
                </div>
                <div
                  onClick={batchRevokeArchiveDocumentEvent}
                  className={styles['document_content_right_action_check_item']}
                >
                  {' '}
                  <img src='/knowledge/document/archive.png' />
                  撤销归档
                </div>
                <div
                  className={styles['document_content_right_action_check_item_del']}
                  onClick={batchDelDocumentEvent}
                >
                  {' '}
                  <img src='/mcp/del.png' />
                  删除
                </div>
                <Divider type='vertical' />
                <div
                  className={styles['document_content_right_action_check_item']}
                  onClick={cancelSelectEvent}
                >
                  取消
                </div>
              </div>
            )}
          </div>
        )}
        <div className={styles['document_content_right_tab']}>
          <ConfigProvider
            theme={{
              components: {
                Table: {
                  headerColor: '#666E82',
                  selectionColumnWidth: 40,
                },
              },
              token: {
                colorBgContainer: 'rgba(255, 255, 255, 0.1)', //背景颜色
              },
            }}
          >
            <Table
              onRow={(record, index) => ({
                onClick: event => {
                  // 否则正常跳转详情页
                  goDetailEvent(event, record)
                },
              })}
              size={'small'}
              ref={tabRef}
              rowKey={record => record.id}
              rowSelection={rowSelection}
              dataSource={documentList}
              columns={columns}
              pagination={false}
              scroll={{ y: 'calc(100vh - 226px)', x: false }}
            />
          </ConfigProvider>
        </div>
      </div>
      {/* 启用弹窗 */}
      <EnableModal
        ref={enableRef}
        searchEvent={statusSearchEvent}
      />
      {/* 禁用弹窗 */}
      <DisableModal
        ref={disableRef}
        searchEvent={statusSearchEvent}
      />
      {/* 添加文档属性弹框 */}
      <AddPropertyModal ref={addPropertyRef}></AddPropertyModal>
      {/* 批量管理文档属性弹窗 */}
      <BatchEditPropertyModal
        ref={batchEditPropertyRef}
        onManageProperty={onOpenmanageProperty}
      />
    </div>
  )
})
export default DocumentList

