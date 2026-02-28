/* eslint-disable @next/next/no-img-element */
'use client'
import { forwardRef, useState, useImperativeHandle, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { checkPermission } from '@/utils/utils'
import {
  Select,
  Checkbox,
  Button,
  Divider,
  Switch,
  Dropdown,
  Input,
  Spin,
  Empty,
  Tooltip,
  ConfigProvider,
  message,
} from 'antd'
import {
  getDocumentDetail,
  getDocumentList,
  getKnowledgeDetail,
  batchDeleteChunk,
  batchEnableChunk,
  batchDisableChunk,
} from '@/api/knowledge'
import styles from '../../page.module.css'
import { SearchOutlined } from '@ant-design/icons'
import List from 'rc-virtual-list'
import CreateSegmentDrawer from './CreateSegmentDrawer'
import EnableModal from './EnableModal'
import DisableModal from './DisableModal'
import DeleteChunksModal from './DeleteChunksModal'
import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { throttle } from 'lodash'
import Cookies from 'js-cookie'
const DocumentDetail = forwardRef((props, ref) => {
  const router = useRouter()
  const [knowledgeId, setKnowledgeId] = useState('')
  const [documentId, setDocumentId] = useState('')
  const [searchInputString, setSearchInputString] = useState('')
  const [documentImg, setDocumentImg] = useState('') //文档图片
  const [loading, setLoading] = useState(false) //加载中
  const [documentList, setDocumentList] = useState([]) //文档列表
  const [searchKeyword, setSearchKeyword] = useState('')
  const [chunks, setChunks] = useState([])
  const [defaultChunks, setDefaultChunks] = useState([])
  const [chunkingText, setChunkingText] = useState('')
  const [chunkingType, setChunkingType] = useState('') //分段类型
  const [chunkMaxLength, setChunkMaxLength] = useState(0) //分段最大字数
  const [selectAll, setSelectAll] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [documentDetail, setDocumentDetail] = useState({})
  const [documentEnable, setDocumentEnable] = useState(true)
  const [isHasSetting, setIsHasSetting] = useState(false)
  const [filterChunks, setFilterChunks] = useState([])
  const [canCreate, setCanCreate] = useState(false) //创建应用权限
  const [disabledPrimaryKeys, setDisabledPrimaryKeys] = useState([])
  const abortRef = useRef(null)
  const enableRef = useRef(null)
  const disableRef = useRef(null)
  const delChunksRef = useRef(null)
  const addSegmentRef = useRef(null)
  const tabOptions = [
    { value: null, label: '全部' },
    { value: 0, label: '已禁用' },
    { value: 1, label: '已启用' },
  ]
  let imgUrls = {
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

  const actionItems = [
    {
      key: '1',
      type: 'archive',
      label: <div className={styles['actions_drop_archive']}>{!documentDetail.isArchived ? '归档' : '撤销归档'}</div>,
    },
    {
      key: '2',
      type: 'delete',
      label: <div className={styles['actions_drop_delete']}>删除</div>,
    },
  ]

  useImperativeHandle(ref, () => ({}))
  useEffect(() => {
    closeSse()
    // 获取单个参数
    let params = new URLSearchParams(window.location.search)
    let knowId = params.get('id')
    let docId = params.get('documentId') ? parseInt(params.get('documentId')) : props.documentId
    setCanCreate(checkPermission('/main/knowledge/operation'))
    setDocumentId(docId)
    setKnowledgeId(knowId)
    getDocumentListEvent(knowId, docId)
    documentChangeEvent(docId)
    getDocumentDetailEvent(docId)
    getKnowledgeDetailInfo(knowId)
    return () => {
      console.log('组件卸载，关闭 SSE')
      closeSse()
    }
  }, [])

  //监听文档变化
  const documentChangeEvent = value => {
    // console.log(value)
    // console.log('/voicesagex-console/knowledge-web/knowledge-base/' + value + '/documents/status/stream')

    abortRef.current = new AbortController()
    let token = Cookies.get('userToken')
    fetchEventSource('/voicesagex-console/knowledge-web/knowledge-base/' + value + '/documents/status/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
        Accept: 'text/event-stream',
      },
      signal: abortRef.current.signal, // ✅ 正确传入 signal
      retryInterval: 2000,
      maxRetries: 3,
      openWhenHidden: false,
      onopen() {},

      onmessage(data) {
        if (data.event == 'process_status') {
          // console.log(data, 'gggggggggggggggggggggg')
          // let processData = JSON.parse(data.data)
          throttledRefreshData(value)
        }
      },

      onclose() {},

      onerror() {},
    })
  }

  //断开sse 连接
  const closeSse = () => {
    abortRef.current?.abort()
  }

  //修改为定时调用函数
  const throttledRefreshData = useRef(
    throttle(
      value => {
        // console.log(data, 'llllll')
        getDocumentDetailEvent(value)
      },
      2000,
      { leading: true, trailing: true }
    )
  ).current

  //获取知识库详情
  const getKnowledgeDetailInfo = knowId => {
    getKnowledgeDetail(knowId).then(res => {
      setChunkMaxLength(res.data.chunkMaxLength)
    })
  }

  //获取文档列表
  const getDocumentListEvent = (id, docId) => {
    let data = {
      status: '',
      name: '',
    }
    getDocumentList(id, data).then(res => {
      let data = res.data
      findDocumentImg(data, docId)
      setDocumentList(res.data)
    })
  }
  //查找文档对应的图片
  const findDocumentImg = (data, docId) => {
    let findObj = data.find(item => item.id == docId)
    if (findObj) {
      // 查找最后一个点的索引
      const lastDotIndex = findObj.uniqueName.lastIndexOf('.')
      if (lastDotIndex !== -1) {
        // 提取文件后缀名
        let fileExtension = findObj.uniqueName.slice(lastDotIndex + 1)
        // 根据文件后缀获取对应的图片路径
        let fileImage = imgUrls[fileExtension.toLowerCase()] || imgUrls['other']
        setDocumentImg(fileImage)
      }
    }
  }
  const documentChange = val => {
    setDocumentId(val)
    findDocumentImg(documentList, val)
    getDocumentDetailEvent(val)
  }
  //获取文档详情
  const getDocumentDetailEvent = id => {
    setLoading(true)
    cancelSelectEvent()
    getDocumentDetail(id)
      .then(res => {
        // console.log(res.data)

        let previewChunks = JSON.parse(res.data.previewChunks) || []
        console.log(previewChunks)
        // 定义分段策略与对应文本的映射关系
        const strategyMap = {
          NORMAL: '普通分段',
          NORMAL_QA: '普通-QA分段',
        }
        // 根据策略获取对应文本，若未匹配则默认为 '高级分段'
        const text = strategyMap[res.data.chunkingStrategy] || '高级分段'
        setChunkingText(text)
        setChunkingType(res.data.chunkingStrategy)
        if (res.data.processStatus === 'IN_PROGRESS' || res.data.processStatus === 'WAITING') {
          setIsHasSetting(true)
        } else {
          setIsHasSetting(false)
          closeSse()
          if (res.data.processStatus != 'FAILED') {
            // console.log(res.data.disabledPrimaryKeys)
            // res.data.isArchived = true
            // previewChunks.forEach((item, index) => {
            //   item.idx = index + 1
            // })
            setDefaultChunks(previewChunks)
            setDocumentDetail(res.data)
            // console.log(res.data)

            if (res.data.status == 'DISABLE') {
              setDocumentEnable(false)
            } else if (res.data.status === 'ENABLE') {
              setDocumentEnable(true)
            }
            setChunks(previewChunks)
            setFilterChunks(previewChunks)
            res.data.disabledPrimaryKeys && setDisabledPrimaryKeys(res.data.disabledPrimaryKeys)
          } else {
            setDefaultChunks([])
            setChunks([])
          }
        }

        setLoading(false)
        searchInputString && filterSearchChunks(previewChunks, searchInputString)
      })
      .catch(err => {
        console.log(err)
        setLoading(false)
      })
  }
  //搜索回车事件
  const searchPressEvent = e => {
    cancelSelectEvent()
    let key = e.target.value
    setSearchInputString(key)
    filterSearchChunks(defaultChunks, key)
  }

  const filterSearchChunks = (chunks, key) => {
    //搜索普通分段
    let data = []
    if (documentDetail.chunkingStrategy == 'NORMAL') {
      data = chunks.filter(item => item.content.includes(key))
    } else if (documentDetail.chunkingStrategy == 'NORMAL_QA') {
      //搜索普通分段qa 分段
      //当前为qa分段
      data = chunks.filter(item => item.question.includes(key) || item.answer.includes(key))
    } else {
      //父子分段检索
      data = chunks.filter(item => {
        if (Array.isArray(item.content)) {
          return item.content.some(contentObj => {
            console.log(contentObj, '1')
            // 确保 contentObj.content 是字符串类型再调用 includes 方法
            return typeof contentObj.content === 'string' && contentObj.content.includes(key)
          })
        }
        // 确保 item.content 是字符串类型再调用 includes 方法
        return typeof item.content === 'string' && item.content.includes(key)
      })
    }

    if (key) {
      setChunks(data)
    } else {
      setChunks(chunks)
    }
  }
  const selectAllChange = () => {
    setSelectAll(!selectAll)
    let data = []
    chunks.forEach(item => {
      data.push(item.id)
    })
    setSelectedRowKeys(data)
  }
  const cancelSelectEvent = () => {
    setSelectAll(false)
    setSelectedRowKeys([])
  }
  const searchChangeEvent = e => {
    setSearchKeyword(e.target.value)
    searchPressEvent(e)
  }
  const renderTooltip = (content, index) => {
    return (
      <div className={`${styles['chunks_list_item_header']} ${styles['tooltip_chunk']}`}>
        <div className={`${styles['chunks_list_item_header_title']} ${styles['tooltip_chunk_title']}`}>
          <img
            src='/knowledge/tooltip_bg.png'
            alt=''
            className={styles['chunks_list_item_header_title_img']}
          />
          分段 {content.id}
        </div>
        <div className={styles['chunks_list_item_header_divver']}></div>
        <div className={`${styles['chunks_list_item_header_character']} ${styles['tooltip_chunk_character']}`}>
          {content.character || 0}字符
        </div>
      </div>
    )
  }

  //切换状态事件
  const switchChangeDocumentEnable = status => {
    if (!documentDetail.isArchived) {
      let title = status ? '要启用文档吗？' : '要禁用文档吗？'
      let content = status ? '启用后可正常引用！' : '禁用后无法引用！'
      const obj = {
        id: documentDetail.id,
      }
      if (status) {
        enableRef.current.showModal(obj, title, content, 'ENABLE', [])
      } else {
        disableRef.current.showModal(obj, title, content, 'DISABLE', [], 'detail')
      }
    }
  }

  //打开新增分段抽屉
  const openAddSegmantDrawer = () => {
    // console.log(chunkingType, 'chunkingType')

    let type = ''
    switch (chunkingType) {
      case 'NORMAL':
        type = 'normal'
        break
      case 'PARENT_CHILD':
      case 'ADVANCED_PARAGRAPH':
        type = 'parent'
        break
      case 'NORMAL_QA':
        type = 'normal_qa'
        break
    }
    addSegmentRef.current.showModal({ type, action: 'add', chunkMaxLength, documentId })
  }
  //添加子分段
  const onAddChildSegment = item => {
    addSegmentRef.current.showModal({ type: 'child', action: 'add', parentId: item.id, chunkMaxLength, documentId })
  }

  const handleDropClick = async e => {
    if (e.key === '2') {
      let title = '要删除文档吗？'
      let content = '删除后无法恢复且无法引用！'
      disableRef.current.showModal('', title, content, 'del', [documentId])
    } else {
      // 已归档
      let data = [{ id: documentId }]
      if (documentDetail.isArchived) {
        let title = '要撤销归档文档吗？'
        let content = '共撤销归档' + '1个文档！'
        enableRef.current.showModal('', title, content, 'REVOKE_ARCHIVE', data)
      } else {
        let title = '要归档文档吗？'
        let content = '共归档' + '1个文档，归档后无法引用！'
        disableRef.current.showModal('', title, content, 'ARCHIVE', data, 'detail')
      }
      // disableRef.current.showModal('', title, content, 'del', [documentId])
    }
  }

  //刷新页面状态
  const refreashPage = () => {
    getDocumentDetailEvent(documentId)
  }

  //编辑分段
  const onEditChunkEvent = (item, type, child) => {
    let data = item
    if (chunkingType === 'NORMAL_QA') {
      type = 'normal_qa'
    }
    if (type === 'child') {
      data = {
        ...child,
        parentId: item.id,
      }
    }
    addSegmentRef.current.showModal({ type, action: 'edit', item: data, documentId, chunkMaxLength })
  }

  //删除单个分段
  const deleteChunks = (item, type, parent) => {
    let title = '确定删除'
    let content = '删除后分段无法恢复，是否继续？'
    switch (type) {
      case 'normal':
        const data = {
          documentId,
          chunkId: item.primary_key,
        }
        delChunksRef.current.showModal(data, title, content, type, false)
        break
      case 'parent':
        const parent_data = {
          documentId,
          parentIdx: item.id,
        }
        delChunksRef.current.showModal(parent_data, title, content, type, false)
        break
      case 'child':
        const child_data = {
          documentId,
          parentIdx: item.id,
          childChunkIdx: parent.primary_key,
        }
        delChunksRef.current.showModal(child_data, title, content, type, false)
        break
    }
  }

  // 批量删除
  const onMultipleDelete = async () => {
    let title = '确定删除'
    let content = '删除后分段无法恢复，是否继续？'
    let data
    let ids = []
    if (props.knowledgeDetail.chunkingStrategy != 'PARENT_CHILD') {
      ids = chunks.filter(ch => selectedRowKeys.includes(ch.id)).map(item => item.primary_key)
      data = {
        id: documentId,
        ids,
      }
    } else {
      ids = []
      let items = chunks.filter(ch => selectedRowKeys.includes(ch.id))
      items.forEach(content => {
        content.content.forEach(con => {
          ids.push(con.primary_key)
        })
      })
      data = {
        id: documentId,
        ids,
      }
    }

    delChunksRef.current.showModal(data, title, content, '', true)
  }

  // 批量启用禁用分段
  const onMultipleEnable = async enable_type => {
    // console.log(enable_type, 'enable_type')

    let data
    let ids = []
    if (props.knowledgeDetail.chunkingStrategy != 'PARENT_CHILD') {
      ids = chunks.filter(ch => selectedRowKeys.includes(ch.id)).map(item => item.primary_key)
      data = {
        id: documentId,
        ids,
      }
    } else {
      ids = []
      let items = chunks.filter(ch => selectedRowKeys.includes(ch.id))
      items.forEach(content => {
        content.content.forEach(con => {
          ids.push(con.primary_key)
        })
      })
      data = {
        id: documentId,
        ids,
      }
    }
    // console.log(data)
    if (enable_type === 'enable') {
      batchEnableChunk(data).then(res => {
        message.success('操作成功')
        getDocumentDetailEvent(documentId)
      })
    } else {
      batchDisableChunk(data).then(res => {
        message.success('操作成功')
        getDocumentDetailEvent(documentId)
      })
    }
  }

  // 启用禁用分段
  const handleChangeEnable = (item, type, e) => {
    // console.log(e)

    if (!documentDetail.isArchived) {
      let data
      if (type === 'normal') {
        data = {
          id: documentId,
          ids: [item.primary_key],
        }
      } else {
        let ids = item.content.map(content => content.primary_key)
        data = {
          id: documentId,
          ids,
        }
      }
      if (e) {
        batchEnableChunk(data).then(res => {
          message.success(res.msg)
          getDocumentDetailEvent(documentId)
        })
      } else {
        batchDisableChunk(data).then(res => {
          message.success('操作成功')
          getDocumentDetailEvent(documentId)
        })
      }
    }
  }

  //切换状态
  const changeTabs = key => {
    let arr = []
    if (key === null) {
      setChunks(filterChunks)
    } else {
      //禁用
      if (key === 0) {
        arr = filterChunks.filter(item => disabledPrimaryKeys.includes(item.primary_key))
      } else {
        arr = filterChunks.filter(item => !disabledPrimaryKeys.includes(item.primary_key))
      }
      setChunks(arr)
    }
  }

  //去分段设置
  const goChunksSetting = () => {
    const name = documentList.find(item => item.id === documentId).name
    router.push(`/main/knowledge/${knowledgeId}/chunks-setting?name=${name}&from=detail&docId=${documentId}`)
    closeSse()
  }

  const getChunkStatus = (item, type) => {
    // console.log(item, documentDetail, disabledPrimaryKeys)
    let status = true
    //未操作过禁用启用的文档，默认分段启用
    if (documentDetail.disabledPrimaryKeys.length == 0) {
      status = !documentDetail.isArchived
    } else {
      //归档
      if (documentDetail.isArchived) {
        status = false
      } else {
        if (type === 'normal') {
          status = item.status !== 'DISABLE'
        } else {
          status = item.content[0].status !== 'DISABLE'
          // console.log(item)
        }
      }
    }

    return status
  }

  const getChildEditStatus = parent => {
    let status = true
    if (documentDetail.isArchived) {
      status = false
    } else {
      const enableArr = parent.content.filter(item => item.status === 'ENABLE')
      status = enableArr.length === parent.content.length
    }

    return status
  }
  //返回到文档列表
  const handleBack = () => {
    router.push(`/main/knowledge/document?id=${knowledgeId}&type=list`)
    props.changeTypeEvent('list')
    closeSse()
  }
  const updateDetailEvent = () => {
    getDocumentDetailEvent(documentId)
  }
  return (
    <div className={styles['document_detail']}>
      <div className={styles['document_detail_header']}>
        <div className={styles['document_detail_header_left']}>
          <img
            onClick={handleBack}
            className={styles['document_content_left_back_icon']}
            src='/knowledge/back.png'
            alt='返回'
          />
          <div className={styles['document_detail_header_title']}>文档/</div>

          <img
            className={styles['document_detail_header_img']}
            src={documentImg}
            alt=''
          />
          <ConfigProvider
            theme={{
              token: {
                color: '#101A28',
              },
            }}
          >
            <Select
              className={styles['document_detail_header_select']}
              variant='borderless'
              disabled={loading}
              style={{ minWidth: '320px', maxWidth: '360px' }}
              value={documentId}
              onChange={documentChange}
            >
              {documentList.map(item => (
                <Select.Option
                  key={item.id}
                  value={item.id}
                  label={item.name}
                >
                  {item.name}
                </Select.Option>
              ))}
            </Select>
          </ConfigProvider>
          <div className={styles['document_detail_header_tag']}>{chunkingText}</div>
        </div>
        <div className={styles['document_detail_header_right']}>
          {canCreate && (
            <>
              {/* <Button
                color='primary'
                variant='filled'
                onClick={openAddSegmantDrawer}
                style={{  }}
              >
              </Button> */}
              <div
                className={styles['document_detail_header_add_chunk']}
                onClick={openAddSegmantDrawer}
              >
                <img
                  style={{ width: 12, height: 12, marginRight: '4px' }}
                  src='/knowledge/document/add_segment.png'
                  alt=''
                />
                添加分段
              </div>
              <Divider
                style={{ height: 28 }}
                type='vertical'
              />
            </>
          )}

          <div className={styles['detail_header_disabled_wrap']}>
            {!documentDetail.isArchived && documentDetail.status == 'ENABLE' && (
              <div className={`${styles['status_div']} ${styles['enable_status']}`}>
                <div className={`${styles['status_div_radio']} ${styles['enable_radio']}`}></div>
                启用
              </div>
            )}
            {documentDetail.isArchived ? (
              <div className={styles['status_div']}>
                <div className={styles['status_div_radio']}></div>
                已归档
              </div>
            ) : (
              documentDetail.status == 'DISABLE' && (
                <div className={styles['status_div']}>
                  <div className={styles['status_div_radio']}></div>
                  禁用
                </div>
              )
            )}
            {/* {documentDetail.isArchived && (
              <div className={styles['status_div']}>
                <div className={styles['status_div_radio']}></div>
                已归档
              </div>
            )} */}

            <Switch
              size={'small'}
              checked={documentEnable && !documentDetail.isArchived}
              style={{ marginLeft: 4 }}
              disabled={documentDetail.isArchived || !canCreate}
              onChange={e => {
                switchChangeDocumentEnable(e)
              }}
            />
          </div>

          <div
            className={styles['detail_header_archive_wrap']}
            onClick={goChunksSetting}
          >
            <img
              alt=''
              style={{ width: 16, height: 16 }}
              src='/knowledge/document/to_segment.png'
            />
          </div>

          {canCreate && (
            <Dropdown
              trigger={['click']}
              placement='bottomRight'
              overlayStyle={{
                width: 96, // 固定宽度
                minWidth: 96,
                padding: 4,
                boxSizing: 'border-box',
              }}
              menu={{ items: actionItems, onClick: handleDropClick }}
            >
              <div className={styles['detail_header_archive_wrap']}>
                <img
                  style={{ width: 24, height: 24 }}
                  src='/knowledge/document/more_action.png'
                  alt=''
                />
              </div>
            </Dropdown>
          )}
        </div>
      </div>

      <div className={styles['document_detail_search']}>
        <div className={styles['document_detail_search_left']}>
          {/* 存在文档时才能全选 */}
          {canCreate && chunks.length > 0 && (
            <div className={styles['document_content_action_wrap']}>
              <div className={styles['document_content_right_action']}>
                {(selectAll || selectedRowKeys.length > 0) && (
                  <div className={styles['document_content_right_action_check']}>
                    <div className={styles['document_content_right_action_check_item']}>
                      {' '}
                      <img
                        src='/mcp/check.png'
                        alt=''
                      />
                      {selectedRowKeys.length}项已选
                    </div>
                    <Divider type='vertical' />
                    <div
                      className={styles['document_content_right_action_check_item']}
                      onClick={() => onMultipleEnable('enable')}
                    >
                      <img
                        src='/knowledge/document/enable.png'
                        alt=''
                      />
                      启用
                    </div>
                    <div
                      className={styles['document_content_right_action_check_item']}
                      onClick={() => onMultipleEnable('disable')}
                    >
                      {' '}
                      <img
                        src='/knowledge/document/disable.png'
                        alt=''
                      />
                      禁用
                    </div>
                    <div
                      className={styles['document_content_right_action_check_item_del']}
                      onClick={onMultipleDelete}
                    >
                      {' '}
                      <img
                        src='/mcp/del.png'
                        alt=''
                      />
                      批量删除
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
                {!selectAll && selectedRowKeys.length == 0 && (
                  <div className={styles['document_content_right_action_checkAll']}>
                    <Checkbox onChange={selectAllChange}>全选</Checkbox>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className={styles['document_detail_search_right']}>
          <Select
            className='model_type_select'
            defaultValue={null}
            placeholder='请选择状态'
            style={{ width: 160, height: 36, borderRadius: 8, marginRight: 8 }}
            onChange={value => changeTabs(value)}
            options={tabOptions}
          />
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
        </div>
      </div>
      <div className={styles['document_detail_content']}>
        <Spin
          spinning={loading}
          wrapperClassName='create_conf_container_right_loading'
        >
          {chunks.length != 0 && (
            <div className={styles['create_conf_container_right_content']}>
              <List
                data={chunks}
                itemKey='id'
              >
                {(item, index) => (
                  <div className={styles['chunks_list_item']}>
                    <div className={styles['chunks_list_item_left']}>
                      <Checkbox
                        className={styles['chunks_list_item_header_title_checkbox']}
                        checked={selectedRowKeys.includes(item.id)}
                        onChange={e => {
                          setSelectedRowKeys(
                            e.target.checked
                              ? [...selectedRowKeys, item.id]
                              : selectedRowKeys.filter(id => id != item.id)
                          )
                        }}
                      />
                    </div>
                    <div
                      className={`${styles['chunks_list_item_right']} ${
                        props.knowledgeDetail.chunkingStrategy != 'PARENT_CHILD'
                          ? styles['chunks_list_item_right_hover']
                          : styles['chunks_list_item_right_parent_hover']
                      }`}
                    >
                      <div className={styles['chunks_list_item_header']}>
                        <div className={styles['chunks_list_item_header_title']}>
                          <img
                            src='/knowledge/parent.png'
                            alt=''
                            className={styles['chunks_list_item_header_title_img']}
                          />
                          {props.knowledgeDetail.chunkingStrategy == 'PARENT_CHILD' && '父'}
                          分段 {item.id}
                        </div>
                        <div className={styles['chunks_list_item_header_divver']}></div>
                        <div className={styles['chunks_list_item_header_character']}>{item.character}字符</div>
                      </div>

                      {/* 普通分段编辑启用状态标签组 */}
                      {props.knowledgeDetail.chunkingStrategy != 'PARENT_CHILD' && (
                        <>
                          {/* 操作栏浮标 */}
                          <div className={`${styles['chunks_list_item_right_action_wrap']} `}>
                            <div className={styles['item_right_action_wrap_inner']}>
                              {canCreate && (
                                <>
                                  {getChunkStatus(item, 'normal') && (
                                    <div
                                      className={styles['item_right_action_wrap_inner_edit']}
                                      onClick={() => onEditChunkEvent(item, 'normal')}
                                    >
                                      <img
                                        style={{ width: 16, height: 16, cursor: 'pointer' }}
                                        src='/knowledge/document/edit_list.png'
                                        alt=''
                                      />
                                    </div>
                                  )}
                                  {!documentDetail.isArchived && (
                                    <div
                                      className={styles['item_right_action_wrap_inner_delete']}
                                      onClick={() => deleteChunks(item, 'normal')}
                                    >
                                      <img
                                        style={{ width: 16, height: 16, cursor: 'pointer' }}
                                        src='/knowledge/document/delete.png'
                                        alt=''
                                      />
                                    </div>
                                  )}
                                </>
                              )}
                              {}
                              <Switch
                                checked={getChunkStatus(item, 'normal')}
                                onChange={e => handleChangeEnable(item, 'normal', e)}
                                disabled={documentDetail.isArchived || !canCreate}
                                style={{ cursor: 'pointer' }}
                                size={'small'}
                              />
                            </div>
                          </div>
                          <div className={`${styles['chunks_list_item_right_status_wrap']} `}>
                            <div className={styles['item_right_status_wrap_inner']}>
                              {item.isEdited && (
                                <div className={`${styles['has_edited_segment']} ${styles['right_status_wrap_btn']}`}>
                                  已编辑
                                </div>
                              )}

                              {getChunkStatus(item, 'normal') ? (
                                <div className={`${styles['status_div']} ${styles['enable_status']}`}>
                                  <div className={`${styles['status_div_radio']} ${styles['enable_radio']}`}></div>
                                  启用
                                </div>
                              ) : (
                                <div className={styles['status_div']}>
                                  <div className={styles['status_div_radio']}></div>
                                  禁用
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                      {/* 高级分段编辑启用状态标签组 */}
                      {props.knowledgeDetail.chunkingStrategy === 'PARENT_CHILD' && (
                        <>
                          {/* 添加子分段 */}
                          {canCreate && !documentDetail.isArchived && (
                            <div className={`${styles['chunks_list_item_right_addChild_wrap']} `}>
                              <div
                                className={styles['item_right_addChild_wrap_inner']}
                                onClick={() => onAddChildSegment(item)}
                              >
                                <img
                                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                                  src='/knowledge/document/add_child.png'
                                  alt=''
                                />
                                添加子分段
                              </div>
                            </div>
                          )}
                          {/* 操作栏浮标 */}
                          <div className={`${styles['chunks_list_item_right_action_wrap']} `}>
                            <div className={styles['item_right_action_wrap_inner']}>
                              {canCreate && (
                                <>
                                  {getChunkStatus(item, 'parent') && (
                                    <div
                                      className={styles['item_right_action_wrap_inner_edit']}
                                      onClick={() => onEditChunkEvent(item, 'parent')}
                                    >
                                      <img
                                        style={{ width: 16, height: 16, cursor: 'pointer' }}
                                        src='/knowledge/document/edit_list.png'
                                        alt=''
                                      />
                                    </div>
                                  )}
                                  {!documentDetail.isArchived && (
                                    <div
                                      className={styles['item_right_action_wrap_inner_delete']}
                                      onClick={() => deleteChunks(item, 'parent')}
                                    >
                                      <img
                                        style={{ width: 16, height: 16, cursor: 'pointer' }}
                                        src='/knowledge/document/delete.png'
                                        alt=''
                                      />
                                    </div>
                                  )}
                                </>
                              )}

                              <Switch
                                checked={getChunkStatus(item, 'parent')}
                                onChange={e => handleChangeEnable(item, 'parent', e)}
                                disabled={documentDetail.isArchived || !canCreate}
                                style={{ cursor: 'pointer' }}
                                size={'small'}
                              />
                            </div>
                          </div>
                          <div className={`${styles['chunks_list_item_right_status_wrap']} `}>
                            <div className={styles['item_right_status_wrap_inner']}>
                              {item.isEdited && (
                                <div className={`${styles['has_edited_segment']} ${styles['right_status_wrap_btn']}`}>
                                  已编辑
                                </div>
                              )}
                              {getChunkStatus(item, 'parent') ? (
                                <div className={`${styles['status_div']} ${styles['enable_status']}`}>
                                  <div className={`${styles['status_div_radio']} ${styles['enable_radio']}`}></div>
                                  启用
                                </div>
                              ) : (
                                <div className={styles['status_div']}>
                                  <div className={styles['status_div_radio']}></div>
                                  禁用
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                      {/* 普通分段渲染 */}
                      {props.knowledgeDetail.chunkingStrategy == 'COMMON' && !item.question && (
                        <div className={styles['chunks_list_item_content']}>
                          {item.content && <ReactMarkdown remarkPlugins={[remarkBreaks]}>{item.content}</ReactMarkdown>}
                          {!item.content && (
                            <span className={styles['chunks_list_item_content_fail']}>{item.failed_reason}</span>
                          )}
                        </div>
                      )}
                      {/* 普通qa模式 */}
                      {props.knowledgeDetail.chunkingStrategy == 'COMMON' && item.question && (
                        <div className={styles['chunks_list_item_content_qa']}>
                          <div className={styles['chunks_list_item_content_question']}>
                            <span className={styles['chunks_list_item_content_qa_span']}>Q </span>
                            <ReactMarkdown remarkPlugins={[remarkBreaks]}>{item.question}</ReactMarkdown>
                          </div>
                          <div className={styles['chunks_list_item_content_answer']}>
                            <span className={styles['chunks_list_item_content_qa_span']}>A </span>
                            <ReactMarkdown remarkPlugins={[remarkBreaks]}>{item.answer}</ReactMarkdown>
                          </div>
                        </div>
                      )}

                      {/* 父子分段渲染 */}
                      {props.knowledgeDetail.chunkingStrategy == 'PARENT_CHILD' && (
                        <div className={styles['chunks_list_item_content_parent']}>
                          {Array.isArray(item.content) ? (
                            item.content.map((parent, a) => (
                              <Tooltip
                                key={a}
                                placement={'topRight '}
                                autoAdjustOverflow={true}
                                title={renderTooltip(parent, a)}
                                getPopupContainer={triggerNode => triggerNode.parentNode}
                              >
                                <div className={` ${styles['child_chunks_wrap']}`}>
                                  {!documentDetail.isArchived && canCreate && (
                                    <div className={`${styles['chunks_list_child_action_wrap']} `}>
                                      <div className={styles['display_flex']}>
                                        {getChildEditStatus(item) && (
                                          <img
                                            onClick={e => onEditChunkEvent(item, 'child', parent, e)}
                                            style={{ width: 28, height: 28, cursor: 'pointer' }}
                                            src='/knowledge/document/child_edit.png'
                                            alt=''
                                          />
                                        )}

                                        <img
                                          onClick={() => deleteChunks(item, 'child', parent)}
                                          style={{ width: 28, height: 28, cursor: 'pointer' }}
                                          src='/knowledge/document/child_delete.png'
                                          alt=''
                                        />
                                      </div>
                                    </div>
                                  )}
                                  <div className={styles['chunks_list_item_content_parent_item_title']}></div>{' '}
                                  <div className={styles['chunks_list_item_content_parent_item_content']}>
                                    <ReactMarkdown remarkPlugins={[remarkBreaks]}>{parent.content}</ReactMarkdown>
                                  </div>
                                </div>
                              </Tooltip>
                            ))
                          ) : (
                            <div className={styles['chunks_list_item_content_parent_item']}>
                              <ReactMarkdown remarkPlugins={[remarkBreaks]}>{item.content}</ReactMarkdown>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </List>
            </div>
          )}

          {chunks.length == 0 && (
            <div className={styles['create_conf_container_right_content_empty']}>
              <Empty
                image={'/knowledge/document/document_empty.png'}
                styles={{ image: { height: 260, width: 380 } }}
                description={
                  <span style={{ color: '#666E82', fontWeight: 500 }}>
                    {isHasSetting ? '嵌入处理中' : '未找到分段'}
                  </span>
                }
              />
            </div>
          )}
        </Spin>
      </div>
      {/* 添加\编辑文档属性弹框 */}
      <CreateSegmentDrawer
        ref={addSegmentRef}
        updateDocumentDetail={refreashPage}
      ></CreateSegmentDrawer>
      {/* 启用弹窗 */}
      <EnableModal
        ref={enableRef}
        searchEvent={refreashPage}
      />
      {/* 禁用弹窗 */}
      <DisableModal
        ref={disableRef}
        searchEvent={handleBack}
        updateDetailEvent={updateDetailEvent}
      />
      {/* 禁用弹窗 */}
      <DeleteChunksModal
        ref={delChunksRef}
        updateDocumentDetail={refreashPage}
      />
    </div>
  )
})

export default DocumentDetail

