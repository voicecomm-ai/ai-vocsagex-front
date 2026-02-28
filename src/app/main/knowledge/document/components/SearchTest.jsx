/* eslint-disable @next/next/no-img-element */
'use client'
import React, { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react'
import styles from '../../page.module.css'
import { useRouter, useParams } from 'next/navigation'
import {
  Switch,
  Input,
  Button,
  Select,
  InputNumber,
  Radio,
  Divider,
  Tooltip,
  message,
  Spin,
  Slider,
  Typography,
} from 'antd'
import { SearchOutlined, PlusOutlined } from '@ant-design/icons'
import { retrievalTest, getKnowledgeDetail, testRecordsApi } from '@/api/knowledge'

import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import EnableModal from './EnableModal'
import SegmentTestDrawer from './SegmentTestDrawer'
import Cookies from 'js-cookie'
import { checkPermission } from '@/utils/utils'
import { getAgentModelList } from '@/api/agent'

const { TextArea } = Input
const SearchTest = forwardRef((props, ref) => {
  const { Paragraph, Text } = Typography
  const router = useRouter()
  const segmentTestRef = useRef(null)
  const selectAllRef = useRef(null)
  const [knowledgeId, setKnowledgeId] = useState(null) //知识库id
  const [tab, setTab] = useState(0)
  const [inputNumber, setInputNumber] = useState(0)
  const [status, setStatus] = useState('')
  const [canCreate, setCanCreate] = useState(false) //创建应用权限
  const [isRerank, setIsRerank] = useState(true) //true 为Rerank模型 false 权重
  const [isRerankInit, setIsRerankInit] = useState(true) //true 为Rerank模型 false 权重
  const [isRerankUpdate, setIsRerankUpdate] = useState(true) //true 为Rerank模型 false 权重
  const [pannelShow, setPannelShow] = useState(false) //
  const [inputValue, setInputValue] = useState('')
  const [documentImg, setDocumentImg] = useState(null) //文档ID
  const [mixValue, setMixValue] = useState(0.7)
  const [documentId, setDocumentId] = useState('')
  const [searchCurrent, setSearchCurrent] = useState(3)
  const [searchCurrentUpdate, setSearchCurrentUpdate] = useState(3)
  const [searchType, setSearchType] = useState('')
  const [searchTypeText, setSearchTypeText] = useState('')
  const [searchTypeImg, setSearchTypeImg] = useState('')
  const [chunkType, setChunkType] = useState('')
  const [updateSearchSetting, setUpdateSearchSetting] = useState(null)
  const [chunks, setChunks] = useState([])
  const [baseModeList, setBaseModeList] = useState([]) //基础模型配置
  const [searchModeList, setSearchModeList] = useState([]) //多模态模型配置
  const [rerankModelList, setRerankModelList] = useState([]) //
  const [multiModalityModel, setMultiModalityModel] = useState([]) //多模态数组
  //检索配置
  const [searchConf, setSearchConf] = useState({
    enableRerank: true,
    rerankModelId: null,
    topK: 3,
    enableScore: false, //是否启用Score
    score: 0.5, //score 值
    hybridSearchSemanticMatchingWeight: 0.7,
    hybridSearchKeywordMatchingWeight: 0.3,

    // enableMultimodal: false, //是否启用多模态
    // embeddingModelId: null,
    // chunkingStrategy: null,
    // vectorRerank: true, //向量rerank
    // fullRerank: true, //全文
    // mixRerank: true, //混合检索
  })

  const [searchInitConf, setSearchInitConf] = useState([])
  const [loading, setLoading] = useState(false) //加载中
  const [contantList, setContentList] = useState([
    {
      id: 1,
      number: 111,
      score: 0.61,
      name: '1111',
      type: 'pdf',
      content: [],
    },
  ])
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

  let typeMap = {
    VECTOR: '/knowledge/document/xl.png',
    HYBRID: '/knowledge/document/mix_search.png',
  }

  const searchTypeTitle = {
    VECTOR: '向量检索',
    HYBRID: '混合检索',
  }
  const start = mixValue[0] / 100
  const end = mixValue[mixValue.length - 1] / 100
  const getGradientColor = percentage => {
    const startColor = [135, 208, 104]
    const endColor = [255, 204, 199]
    const midColor = startColor.map((start, i) => {
      const end = endColor[i]
      const delta = end - start
      return (start + delta * percentage).toFixed(0)
    })
    return `rgb(${midColor.join(',')})`
  }

  const [records, setTestRecords] = useState([])
  useEffect(() => {
    let params = new URLSearchParams(window.location.search)
    setCanCreate(checkPermission('/main/knowledge/operation'))
    let knwId = params.get('id')
    setKnowledgeId(knwId)
    getTestRecordsList(knwId)

    getKnowledgeDetailInfo(knwId)
  }, [])
  //记录
  const getTestRecordsList = id => {
    testRecordsApi(id).then(res => {
      // console.log(res)
      setTestRecords(res.data)
    })
  }

  //获取知识库详情
  const getKnowledgeDetailInfo = knowId => {
    getKnowledgeDetail(knowId).then(res => {
      console.log(res, 'rrrr')
      let TypeText = searchTypeTitle[res.data.searchStrategy] || '全文检索'
      let TypeImg = typeMap[res.data.searchStrategy] || '/knowledge/document/qw.png'
      setSearchType(res.data.searchStrategy)
      setSearchTypeText(TypeText)
      setSearchTypeImg(TypeImg)
      if (res.data.searchStrategy === 'VECTOR') {
        setSearchCurrent(3)
      } else if (res.data.searchStrategy === 'HYBRID') {
        setSearchCurrent(5)
      } else {
        setSearchCurrent(4)
      }
      getAgentModelListEvent(res.data)
      setChunkType(res.data.chunkingStrategy)
    })
  }

  //设置默认值
  const setDefaultValue = url => {
    let arr = props.documentList || []
    let id = arr.length ? arr[0].id : null
    let name = arr.length ? arr[0].name : null
    // 初始化文件后缀名为 null
    let fileExtension = null
    let fileImage = null // 用于存储对应的图片路径
    if (name) {
      // 查找最后一个点的索引
      const lastDotIndex = name.lastIndexOf('.')
      if (lastDotIndex !== -1) {
        // 提取文件后缀名
        fileExtension = name.slice(lastDotIndex + 1)
        // 根据文件后缀获取对应的图片路径
        fileImage = imgUrls[fileExtension.toLowerCase()] || imgUrls['other']
      }
    }
    // setDocumentId(id)
    setDocumentImg(fileImage)
  }

  const columns = [
    {
      title: '文本',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '时间',
      dataIndex: 'age',
      key: 'age',
    },
  ]

  const handleClickRecord = item => {
    setInputValue(item.query)
    setInputNumber(item.query.length)
  }

  //获取模型列表
  const getAgentModelListEvent = kb => {
    let data = {
      type: 1,
      tagIdList: [1, 2, 3, 6, 9], //1 文本模型 2 多模态模型 3推理 9 排序
      isShelf: 1,
      isOr: 1,
    }
    getAgentModelList(data).then(res => {
      let data = res.data || []
      // console.log(data,'bbbbbb')
      let baseModeArr = data.filter(item => {
        if (item.classification) {
          return item.classification === 1 || item.classification === 2
        }
        return false
      })

      setBaseModeList(baseModeArr)

      let searchModeArr = data.filter(item => {
        if (item.classification) {
          return item.classification == 6
        }
        return false
      })
      setSearchModeList(searchModeArr)
      //多模态不开启，仅选择不支持视觉的向量模型；开启，仅选择支持视觉的向量模型
      let multiModalityModelArr = searchModeArr.filter(item => {
        return item.isSupportVisual === (kb.enableMultimodal === null ? false : kb.enableMultimodal)
      })
      // console.log(multiModalityModelArr, 'multiModalityModelArr')

      setMultiModalityModel(multiModalityModelArr)

      let rerankModelArr = data.filter(item => {
        if (item.classification) {
          return item.classification == 9
        }
        return false
      })

      setRerankModelList(rerankModelArr)
      let embeddingModeId = multiModalityModelArr.length > 0 ? multiModalityModelArr[0].id : null
      const isEmbeddingModelAvailable = multiModalityModelArr.findIndex(e => e.id === kb.embeddingModelId) !== -1
      let rerankId = rerankModelArr.length > 0 ? rerankModelArr[0].id : null
      const isRerankModelAvailable = rerankModelArr.findIndex(e => e.id === kb.rerankModelId) !== -1
      // console.log(kb.embeddingModelId)

      setSearchConf({
        enableMultimodal: kb.enableMultimodal === null ? false : kb.enableMultimodal,
        topK: kb.topK || 3,
        enableScore: kb.enableScore === null ? false : kb.enableScore,
        enableRerank: kb.enableRerank === null ? true : kb.enableRerank,
        score: kb.score || 0.5,
        hybridSearchSemanticMatchingWeight: kb.hybridSearchSemanticMatchingWeight || 0.7,
        hybridSearchKeywordMatchingWeight: kb.hybridSearchKeywordMatchingWeight || 0.3,
        embeddingModelId:
          kb.embeddingModelId === null ? embeddingModeId : isEmbeddingModelAvailable ? kb.embeddingModelId : null,
        rerankModelId: kb.rerankModelId === null ? rerankId : isRerankModelAvailable ? kb.rerankModelId : null,
        vectorRerank: kb.searchStrategy === 'VECTOR' && kb.enableRerank,
        fullRerank: kb.searchStrategy === 'FULL_TEXT' && kb.enableRerank,
      })

      setSearchInitConf({
        enableMultimodal: kb.enableMultimodal === null ? false : kb.enableMultimodal,
        topK: kb.topK || 3,
        enableScore: kb.enableScore === null ? false : kb.enableScore,
        enableRerank: kb.enableRerank === null ? true : kb.enableRerank,
        score: kb.score || 0.5,
        hybridSearchSemanticMatchingWeight: kb.hybridSearchSemanticMatchingWeight || 0.7,
        hybridSearchKeywordMatchingWeight: kb.hybridSearchKeywordMatchingWeight || 0.3,
        embeddingModelId:
          kb.embeddingModelId === null ? embeddingModeId : isEmbeddingModelAvailable ? kb.embeddingModelId : null,
        rerankModelId: kb.rerankModelId === null ? rerankId : isRerankModelAvailable ? kb.rerankModelId : null,
        vectorRerank: kb.searchStrategy === 'VECTOR' && kb.enableRerank,
        fullRerank: kb.searchStrategy === 'FULL_TEXT' && kb.enableRerank,
      })

      if (kb.searchStrategy === 'HYBRID' && kb.enableRerank !== null) {
        setIsRerank(kb.enableRerank)
        setIsRerankInit(kb.enableRerank)
      }
    })
  }

  //返回知识库
  const handleBack = () => {
    router.push('/main/knowledge')
  }

  //权重配置slider change
  const mixValueChange = value => {
    let hybridSearchSemanticMatchingWeight = parseFloat(value.toFixed(1))
    let hybridSearchKeywordMatchingWeight = parseFloat((1 - hybridSearchSemanticMatchingWeight).toFixed(1))
    setMixValue(value)
    setSearchConf({
      ...searchConf,
      hybridSearchSemanticMatchingWeight,
      hybridSearchKeywordMatchingWeight,
    })
  }
  // console.log(loading,'llll');

  const goToTest = () => {
    let enableRerank = {
      3: searchConf.vectorRerank,
      4: searchConf.fullRerank,
      5: isRerank,
    }[searchCurrent]
    // if (!searchConf.embeddingModelId) {
    //   return message.warning('Embedding 模型不能为空')
    // }
    // if (enableRerank && !searchConf.rerankModelId) {
    //   return message.warning('Rerank模型不能为空')
    // }
    // console.log(searchConf)

    let data = {
      searchStrategy: searchCurrent == 3 ? 'VECTOR' : searchCurrent == 5 ? 'HYBRID' : 'FULL_TEXT',
      enableRerank,
      ...searchConf,
    }
    // let data = updateSearchSetting
    data.query = inputValue
    data.knowledgeBaseId = knowledgeId
    // console.log(data)
    setLoading(true)
    retrievalTest(data)
      .then(res => {
        setChunks(res.data.result)
        setLoading(false)

        getTestRecordsList(knowledgeId)
      })
      .catch(err => {
        message.error(err.msg)
        setLoading(false)
      })
  }
  const onOpenDetailModal = item => {
    segmentTestRef.current.open(item, chunkType)
  }

  const cannelSetting = () => {
    // resetSearchConfig()
    // console.log(updateSearchSetting, 'jjj')

    if (!updateSearchSetting) {
      //   // console.log('ppppppppppp')

      setSearchConf({ ...searchInitConf })
      setIsRerank(isRerankInit)
      if (searchType === 'VECTOR') {
        setSearchCurrent(3)
      } else if (searchType === 'HYBRID') {
        setSearchCurrent(5)
      } else {
        setSearchCurrent(4)
      }
    } else {
      // console.log(searchConf, updateSearchSetting)
      setSearchConf({ ...updateSearchSetting })
      setIsRerank(isRerankUpdate)
      setSearchCurrent(searchCurrentUpdate)
    }
    setPannelShow(false)
  }

  const onOpenSettingPanel = () => {
    setPannelShow(true)
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
          分段 {content.idx}
        </div>
        <div className={styles['chunks_list_item_header_divver']}></div>
        <div className={`${styles['chunks_list_item_header_character']} ${styles['tooltip_chunk_character']}`}>
          {content.metadata.content_len || 0}字符
        </div>
      </div>
    )
  }

  const handleTextChange = e => {
    // console.log(e.target.value.length)
    setInputValue(e.target.value)
    setInputNumber(e.target.value.length)
  }

  //提交事件
  const onSaveSearchSetting = () => {
    let searchStrategy = searchCurrent == 3 ? 'VECTOR' : searchCurrent == 5 ? 'HYBRID' : 'FULL_TEXT'
    let TypeText = searchTypeTitle[searchStrategy] || '全文检索'
    let TypeImg = typeMap[searchStrategy] || '/knowledge/document/qw.png'
    setSearchType(searchStrategy)
    setSearchTypeText(TypeText)
    setSearchTypeImg(TypeImg)
    setUpdateSearchSetting({ ...updateSearchSetting, ...searchConf })
    setSearchCurrentUpdate(searchCurrent)
    setIsRerankUpdate(isRerank)
    setPannelShow(false)
    setSearchType(searchCurrent)
  }

  //检索
  const confSearchItemClick = val => {
    // if (props.disableConf) {
    //   return
    // }

    setSearchCurrent(val)
    switch (val) {
      case 3:
        setSearchConf({
          ...searchConf,
          vectorRerank: true,
        })
        break
      case 4:
        setSearchConf({
          ...searchConf,
          fullRerank: true,
        })
        break
      case 5:
        setSearchConf({
          ...searchConf,
          vectorRerank: true,
          fullRerank: true,
        })
        break
    }
  }

  return (
    <div className={styles['document_content_search']}>
      {/*  检索设置*/}
      {pannelShow && (
        <div className={styles['document_content_search_setting']}>
          <div className={styles['document_search_setting_header']}>
            <span>检索设置</span>
            {/*
            <img
              onClick={() => {
               cannelSetting()
              }}
              alt=''
              style={{ width: '32px', height: '32px', marginRight: 8 }}
              src='/knowledge/document/close.png'
            ></img> */}
          </div>
          {/* 向量检索 */}
          <div
            className={styles['conf_item']}
            style={{ width: '100%', marginBottom: 12 }}
          >
            <div
              onClick={() => confSearchItemClick(3)}
              className={
                searchCurrent === 3
                  ? `${styles['conf_item_header']} ${styles['conf_item_select']}`
                  : styles['conf_item_header']
              }
            >
              <div className={styles['conf_item_header_left']}>
                <div className={styles['conf_item_header_left_img']}>
                  <img src='/knowledge/vector.png' />
                </div>
                <div className={styles['conf_item_header_left_title']}>
                  <div className={styles['conf_item_header_left_text']}>向量检索</div>
                  <div className={styles['conf_item_header_left_tip']}>
                    通过生成查询嵌入并查询与其向量表示最相似的文本分段
                  </div>
                </div>
              </div>
            </div>
            {/* 向量检索内容 */}
            {searchCurrent == 3 && (
              <div className={styles['conf_item_content']}>
                {/* Rerank模型 */}
                <div className={styles['conf_rerank']}>
                  <div className={styles['conf_rerank_top']}>
                    <Switch
                      defaultChecked
                      size='small'
                      checked={searchConf.vectorRerank}
                      onChange={e => setSearchConf({ ...searchConf, vectorRerank: e })}
                    />
                    Rerank 模型
                    <Tooltip title='重排序模型将根据候选文档列表与用户问题语义匹配度进行重新排序，从而改进语义排序的结果'>
                      <img
                        className={styles['info_img']}
                        src='/agent/info.png'
                        alt=''
                      />
                    </Tooltip>
                  </div>
                  {searchConf.vectorRerank && (
                    <div className={styles['conf_rerank_select']}>
                      <Select
                        style={{ width: '100%' }}
                        placeholder='请选择模型'
                        value={searchConf.rerankModelId}
                        onChange={value => setSearchConf({ ...searchConf, rerankModelId: value })}
                      >
                        {rerankModelList.map(item => (
                          <Select.Option
                            key={item.id}
                            value={item.id}
                            label={item.name}
                          >
                            {item.name}
                          </Select.Option>
                        ))}
                      </Select>
                    </div>
                  )}
                </div>
                <div className={styles['conf_rerank_content']}>
                  <div className={styles['conf_rerank_content_item']}>
                    <div className={styles['conf_rerank_content_item_title']}>
                      Top K
                      <Tooltip title='用于筛选与用户问题相似度最高的文本片段。系统同时会根据选用模型上下文窗口大小动态调整分段数量'>
                        <img
                          className={styles['info_img']}
                          src='/agent/info.png'
                          alt=''
                        />
                      </Tooltip>
                    </div>
                    <div className={styles['conf_rerank_content_item_content']}>
                      <InputNumber
                        min={1}
                        max={10}
                        step={1}
                        onChange={value =>
                          setSearchConf({
                            ...searchConf,
                            topK: value ? parseInt(value) : searchConf.topK,
                          })
                        }
                        value={searchConf.topK}
                      />
                      <div className={styles['conf_rerank_content_item_slider']}>
                        {' '}
                        <Slider
                          onChange={value => setSearchConf({ ...searchConf, topK: value })}
                          value={searchConf.topK}
                          min={1}
                          max={10}
                        />{' '}
                      </div>
                    </div>
                  </div>
                  <div className={styles['conf_rerank_content_item']}>
                    <div className={styles['conf_rerank_content_item_title']}>
                      <Switch
                        defaultChecked
                        size='small'
                        checked={searchConf.enableScore}
                        onChange={e => setSearchConf({ ...searchConf, enableScore: e })}
                      />
                      Score 阈值
                      <Tooltip title='用于设置文本片段筛选的相似度阈值'>
                        <img
                          className={styles['info_img']}
                          src='/agent/info.png'
                          alt=''
                        />
                      </Tooltip>
                    </div>
                    <div className={styles['conf_rerank_content_item_content']}>
                      <InputNumber
                        step={0.01}
                        min={0}
                        max={1}
                        disabled={!searchConf.enableScore}
                        onChange={value =>
                          setSearchConf({
                            ...searchConf,
                            score: value,
                          })
                        }
                        value={searchConf.score}
                      />
                      <div className={styles['conf_rerank_content_item_slider']}>
                        {' '}
                        <Slider
                          disabled={!searchConf.enableScore}
                          step={0.01}
                          min={0}
                          max={1}
                          onChange={value => setSearchConf({ ...searchConf, score: value })}
                          value={searchConf.score}
                        />{' '}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* 全文检索 */}
          <div
            className={styles['conf_item']}
            style={{ width: '100%', marginBottom: 12 }}
          >
            <div
              onClick={() => confSearchItemClick(4)}
              className={
                searchCurrent === 4
                  ? `${styles['conf_item_header']} ${styles['conf_item_select']}`
                  : styles['conf_item_header']
              }
            >
              <div className={styles['conf_item_header_left']}>
                <div className={styles['conf_item_header_left_img']}>
                  <img src='/knowledge/full.png' />
                </div>
                <div className={styles['conf_item_header_left_title']}>
                  <div className={styles['conf_item_header_left_text']}>全文检索</div>
                  <div className={styles['conf_item_header_left_tip']}>
                    索引文档中的所有词汇，从而允许用户查询任意词汇，并返回包含这些词汇的文本片段
                  </div>
                </div>
              </div>
            </div>
            {searchCurrent === 4 && (
              <div className={styles['conf_item_content']}>
                {/* Rerank模型 */}
                <div className={styles['conf_rerank']}>
                  <div className={styles['conf_rerank_top']}>
                    <Switch
                      defaultChecked
                      size='small'
                      checked={searchConf.fullRerank}
                      onChange={e => setSearchConf({ ...searchConf, fullRerank: e })}
                    />
                    Rerank 模型
                    <Tooltip title='重排序模型将根据候选文档列表与用户问题语义匹配度进行重新排序，从而改进语义排序的结果'>
                      <img
                        className={styles['info_img']}
                        src='/agent/info.png'
                        alt=''
                      />
                    </Tooltip>
                  </div>
                  {searchConf.fullRerank && (
                    <div className={styles['conf_rerank_select']}>
                      <Select
                        style={{ width: '100%' }}
                        placeholder='请选择模型'
                        value={searchConf.rerankModelId}
                        onChange={value => setSearchConf({ ...searchConf, rerankModelId: value })}
                      >
                        {rerankModelList.map(item => (
                          <Select.Option
                            key={item.id}
                            value={item.id}
                            label={item.name}
                          >
                            {item.name}
                          </Select.Option>
                        ))}
                      </Select>
                    </div>
                  )}
                </div>
                <div className={styles['conf_rerank_content']}>
                  <div className={styles['conf_rerank_content_item']}>
                    <div className={styles['conf_rerank_content_item_title']}>
                      Top K
                      <Tooltip title='用于筛选与用户问题相似度最高的文本片段。系统同时会根据选用模型上下文窗口大小动态调整分段数量'>
                        <img
                          className={styles['info_img']}
                          src='/agent/info.png'
                          alt=''
                        />
                      </Tooltip>
                    </div>
                    <div className={styles['conf_rerank_content_item_content']}>
                      <InputNumber
                        min={1}
                        max={10}
                        step={1}
                        onChange={value =>
                          setSearchConf({
                            ...searchConf,
                            topK: value ? parseInt(value) : searchConf.topK,
                          })
                        }
                        value={searchConf.topK}
                      />
                      <div className={styles['conf_rerank_content_item_slider']}>
                        {' '}
                        <Slider
                          onChange={value => setSearchConf({ ...searchConf, topK: value })}
                          value={searchConf.topK}
                          min={1}
                          max={10}
                        />{' '}
                      </div>
                    </div>
                  </div>
                  {searchConf.fullRerank && (
                    <div className={styles['conf_rerank_content_item']}>
                      <div className={styles['conf_rerank_content_item_title']}>
                        <Switch
                          defaultChecked
                          size='small'
                          checked={searchConf.enableScore}
                          onChange={e => setSearchConf({ ...searchConf, enableScore: e })}
                        />
                        Score 阈值
                        <Tooltip title='用于设置文本片段筛选的相似度阈值'>
                          <img
                            className={styles['info_img']}
                            src='/agent/info.png'
                            alt=''
                          />
                        </Tooltip>
                      </div>
                      <div className={styles['conf_rerank_content_item_content']}>
                        <InputNumber
                          step={0.01}
                          min={0}
                          max={1}
                          disabled={!searchConf.enableScore}
                          onChange={value =>
                            setSearchConf({
                              ...searchConf,
                              score: value,
                            })
                          }
                          value={searchConf.score}
                        />
                        <div className={styles['conf_rerank_content_item_slider']}>
                          {' '}
                          <Slider
                            disabled={!searchConf.enableScore}
                            step={0.01}
                            min={0}
                            max={1}
                            onChange={value => setSearchConf({ ...searchConf, score: value })}
                            value={searchConf.score}
                          />{' '}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          {/* 混合检索 */}
          <div
            className={styles['conf_item']}
            style={{ width: '100%', marginBottom: 12 }}
          >
            <div
              onClick={() => confSearchItemClick(5)}
              className={
                searchCurrent === 5
                  ? `${styles['conf_item_header']} ${styles['conf_item_select']}`
                  : styles['conf_item_header']
              }
            >
              <div className={styles['conf_item_header_left']}>
                <div className={styles['conf_item_header_left_img']}>
                  <img src='/knowledge/mix.png' />
                </div>
                <div className={styles['conf_item_header_left_title']}>
                  <div className={styles['conf_item_header_left_text']}>混合检索</div>
                  <div className={styles['conf_item_header_left_tip']}>
                    同时执行全文检索和向量检索，并应用重排序步骤，从两类查询结果中选择匹配用户问题的最佳结果，用户可以选择设置权重或配置重新排序模型。
                  </div>
                </div>
              </div>
            </div>
            {searchCurrent === 5 && (
              <div className={styles['conf_item_content']}>
                <div className={styles['conf_mix_top']}>
                  <div
                    className={styles['conf_mix_top_item']}
                    onClick={() => setIsRerank(false)}
                  >
                    <div className={styles['conf_mix_top_item_left']}>
                      <img src='/knowledge/weight.png' />
                    </div>
                    <div className={styles['conf_mix_top_item_right']}>
                      <div className={styles['conf_mix_top_item_title']}>
                        <div className={styles['conf_mix_top_item_title_left']}>权重配置</div>
                        <div className={styles['conf_mix_top_item_title_right']}>
                          <Radio checked={!isRerank}></Radio>
                        </div>
                      </div>
                      <div className={styles['conf_mix_top_item_tip']}>
                        通过调整分配的权重，重新排序策略确定是优先进行语义匹配还是关键字匹配。
                      </div>
                    </div>
                  </div>
                  <div
                    className={styles['conf_mix_top_item']}
                    onClick={() => setIsRerank(true)}
                  >
                    <div className={styles['conf_mix_top_item_left']}>
                      <img src='/knowledge/rerank.png' />
                    </div>
                    <div className={styles['conf_mix_top_item_right']}>
                      <div className={styles['conf_mix_top_item_title']}>
                        <div className={styles['conf_mix_top_item_title_left']}>Rerank 模型</div>
                        <div className={styles['conf_mix_top_item_title_right']}>
                          <Radio checked={isRerank}></Radio>
                        </div>
                      </div>
                      <div className={styles['conf_mix_top_item_tip']}>
                        重排序模型将根据候选文档列表与用户问题语义匹配度进行重新排序，从而改进语义排序的结果
                      </div>
                    </div>
                  </div>
                </div>
                {/* 权重配置 */}
                {!isRerank && (
                  <div className={styles['conf_mix_custom']}>
                    <div className={styles['conf_mix_custom_header']}>
                      <Slider
                        defaultValue={mixValue}
                        min={0}
                        value={mixValue}
                        max={1}
                        step={0.1}
                        tooltip={{ open: false }}
                        onChange={mixValueChange}
                        styles={{
                          track: {
                            background: 'transparent',
                          },
                          tracks: {
                            background: `linear-gradient(to right, ${getGradientColor(start)} 0%, ${getGradientColor(
                              end
                            )} 100%)`,
                          },
                        }}
                      />
                    </div>
                    <div className={styles['conf_mix_custom_footer']}>
                      <div className={styles['conf_mix_custom_footer_left']}>
                        <span>语义</span> <span>{searchConf.hybridSearchSemanticMatchingWeight}</span>
                      </div>
                      <div className={styles['conf_mix_custom_footer_right']}>
                        <span>关键词</span> <span>{searchConf.hybridSearchKeywordMatchingWeight}</span>
                      </div>
                    </div>
                  </div>
                )}
                {/*reRank模型  */}
                {isRerank && (
                  <div className={styles['conf_reRank_custom']}>
                    <Select
                      style={{ width: '100%' }}
                      placeholder='请选择模型'
                      value={searchConf.rerankModelId}
                      onChange={value => setSearchConf({ ...searchConf, rerankModelId: value })}
                    >
                      {rerankModelList.map(item => (
                        <Select.Option
                          key={item.id}
                          value={item.id}
                          label={item.name}
                        >
                          {item.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </div>
                )}
                {/* 权重配置 rerank模型通用配置 */}
                <div className={styles['conf_rerank_content']}>
                  <div className={styles['conf_rerank_content_item']}>
                    <div className={styles['conf_rerank_content_item_title']}>
                      Top K
                      <Tooltip title='用于筛选与用户问题相似度最高的文本片段。系统同时会根据选用模型上下文窗口大小动态调整分段数量'>
                        <img
                          className={styles['info_img']}
                          src='/agent/info.png'
                          alt=''
                        />
                      </Tooltip>
                    </div>
                    <div className={styles['conf_rerank_content_item_content']}>
                      <InputNumber
                        min={1}
                        max={10}
                        step={1}
                        onChange={value =>
                          setSearchConf({
                            ...searchConf,
                            topK: value ? parseInt(value) : searchConf.topK,
                          })
                        }
                        value={searchConf.topK}
                      />
                      <div className={styles['conf_rerank_content_item_slider']}>
                        {' '}
                        <Slider
                          onChange={value => setSearchConf({ ...searchConf, topK: value })}
                          value={searchConf.topK}
                          min={1}
                          max={10}
                        />{' '}
                      </div>
                    </div>
                  </div>
                  <div className={styles['conf_rerank_content_item']}>
                    <div className={styles['conf_rerank_content_item_title']}>
                      <Switch
                        defaultChecked
                        size='small'
                        checked={searchConf.enableScore}
                        onChange={e => setSearchConf({ ...searchConf, enableScore: e })}
                      />
                      Score 阈值
                      <Tooltip title='用于设置文本片段筛选的相似度阈值'>
                        <img
                          className={styles['info_img']}
                          src='/agent/info.png'
                          alt=''
                        />
                      </Tooltip>
                    </div>
                    <div className={styles['conf_rerank_content_item_content']}>
                      <InputNumber
                        step={0.01}
                        min={0}
                        max={1}
                        disabled={!searchConf.enableScore}
                        onChange={value =>
                          setSearchConf({
                            ...searchConf,
                            score: value,
                          })
                        }
                        value={searchConf.score}
                      />
                      <div className={styles['conf_rerank_content_item_slider']}>
                        {' '}
                        <Slider
                          disabled={!searchConf.enableScore}
                          step={0.01}
                          min={0}
                          max={1}
                          onChange={value => setSearchConf({ ...searchConf, score: value })}
                          value={searchConf.score}
                        />{' '}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={styles['document_search_setting_footer']}>
            <div
              onClick={() => {
                cannelSetting()
              }}
              className={`${styles['search_setting_footer_btn']} ${styles['search_setting_footer_cancel']}`}
            >
              取消
            </div>
            <div
              className={`${styles['search_setting_footer_btn']} ${styles['search_setting_footer_save']}`}
              onClick={() => onSaveSearchSetting()}
            >
              保存
            </div>
          </div>
        </div>
      )}
      <div className={styles['document_content_search_left']}>
        {/* 输入框 */}
        <div className={styles['document_content_search_left_header']}>
          <div className={styles['search_left_header_title']}>检索测试</div>
          <div className={styles['search_left_header_tip']}>根据给定的查询文本测试知识的召回效果。</div>
        </div>
        <div className={styles['search_left_content_wrap']}>
          <div className={styles['search_left_content_wrap_header']}>
            <span>源文本</span>
            <div
              className={styles['search_left_content_wrap_header_btn']}
              onClick={() => {
                setPannelShow(true)
              }}
            >
              <img
                style={{ width: '16px', height: '16px', marginRight: 4 }}
                src={searchTypeImg}
                alt=''
              ></img>
              {searchTypeText}
            </div>
          </div>
          <div className={styles['search_left_content_wrap_content']}>
            <TextArea
              placeholder='请输入文本'
              value={inputValue}
              onChange={e => handleTextChange(e)}
              maxLength={200}
              autoSize={{ minRows: 15, maxRows: 15 }}
              style={{
                width: '100%',
                height: 308,
                borderRadius: 0,
                borderBottom: 0,
                border: 'none',
                outline: 0,
              }}
            />
            <div className={styles['search_left_content_number_wrap']}>
              {inputNumber}/{200}
            </div>

            <div className={styles['search_left_content_wrap_footer']}>
              <div></div>
              <Button
                type='primary'
                className={styles['search_left_content_wrap_footer_btn']}
                onClick={goToTest}
                disabled={!inputValue}
              >
                <img
                  style={{ width: '16px', height: '16px', marginRight: 8 }}
                  src='/knowledge/document/gototest.png'
                  alt=''
                ></img>
                测试
              </Button>
            </div>
          </div>
        </div>
        {/* 记录 */}
        <div className={styles['search_left_record_wrap']}>
          <div className={styles['search_left_record_title']}>记录</div>
          <div className={styles['search_left_record_list']}>
            <div className={styles['search_left_record_header']}>
              <div className={styles['search_left_record_header_left']}>文本</div>
              <div className={styles['search_left_record_header_right']}>时间</div>
            </div>
            <div className={styles['search_left_record_content']}>
              {records.length > 0 &&
                records.map(item => (
                  <div
                    onClick={() => handleClickRecord(item)}
                    key={item.id}
                    className={styles['search_left_record_content_item']}
                  >
                    <Tooltip
                      placement='top'
                      title={item.query}
                    >
                      <div className={styles['search_left_record_content_left']}>{item.query}</div>
                    </Tooltip>
                    <div className={styles['search_left_record_content_right']}>{item.createTime}</div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
      <div className={styles['document_content_search_right']}>
        {chunks.length != 0 ? (
          <Spin spinning={loading}>
            <div>
              <div className={styles['document_content_search_right_header']}>{chunks.length}个检索段落</div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {chunks.map((item, index) => (
                  <div
                    key={item.id}
                    className={styles['search_right_single_wrap']}
                  >
                    <div className={styles['search_right_info_wrap_header']}>
                      <div className={styles['search_right_info_wrap_header_title']}>
                        <img
                          src='/knowledge/parent.png'
                          alt=''
                          style={{ width: 12, height: 12, marginRight: 4 }}
                        />
                        分段-{item.metadata.idx}
                        <Divider
                          type='vertical'
                          style={{ height: 12 }}
                        ></Divider>
                        {item.metadata.content_len} 字符
                      </div>
                      <div className={styles['search_right_info_wrap_header_score']}>
                        <div className={styles['search_header_score_left']}>SCORE</div>
                        <div className={styles['search_header_score_right']}>{item.metadata.score.toFixed(2)}</div>
                      </div>
                    </div>

                    <div className={styles['search_right_info_wrap_content']}>
                      {/* 普通分段渲染 */}

                      {chunkType == 'COMMON' && !item.question && (
                        <div className={styles['chunks_list_item_content']}>
                          {item.content && <ReactMarkdown remarkPlugins={[remarkBreaks]}>{item.content}</ReactMarkdown>}
                        </div>
                      )}

                      {/* 普通qa模式 */}
                      {chunkType == 'COMMON' && item.question && (
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
                      {chunkType === 'PARENT_CHILD' && (
                        <div className={styles['chunks_list_item_content_parent']}>
                          {Array.isArray(item.content) ? (
                            item.content.map((parent, a) => (
                              <Tooltip
                                key={a}
                                placement={'topRight '}
                                autoAdjustOverflow={true}
                                title={renderTooltip(item, a)}
                                getPopupContainer={triggerNode => triggerNode.parentNode}
                              >
                                <div className={` ${styles['child_chunks_wrap']}`}>
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

                      <Divider style={{ width: '100%', margin: '8px 0 0 0' }}></Divider>
                      <div className={styles['search_right_content_footer']}>
                        <div className={styles['search_right_content_footer_left']}>
                          <img
                            alt=''
                            style={{ marginRight: 8 }}
                            src={imgUrls[item.url.split('.')[1]]}
                          />
                          {item.title}
                        </div>
                        <div
                          className={styles['search_right_content_footer_right']}
                          onClick={() => onOpenDetailModal(item)}
                        >
                          <span>查看详情</span>
                          <img
                            alt=''
                            src='/knowledge/document/search_to_detail.png'
                            style={{ width: 12, height: 12 }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Spin>
        ) : (
          <Spin
            spinning={loading}
            style={{
              transform: 'translate(0%, 100%)',
              top: '50%',
            }}
          >
            <div className={styles['document_content_search_right_noData']}>
              <img
                alt=''
                style={{ width: 220, height: 220 }}
                src='/knowledge/no_content.png'
              ></img>
              <div>暂无内容</div>
            </div>
          </Spin>
        )}
      </div>

      {/* 详情弹窗 */}
      <SegmentTestDrawer ref={segmentTestRef}></SegmentTestDrawer>
    </div>
  )
})
export default SearchTest
