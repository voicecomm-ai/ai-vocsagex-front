'use client'
import React, { useState, forwardRef, useEffect } from 'react'
import styles from '../create.module.css'
import { useRouter, useParams } from 'next/navigation'
import {
  Button,
  InputNumber,
  Input,
  Checkbox,
  Select,
  Radio,
  Tooltip,
  Switch,
  Slider,
  Empty,
  message,
  Spin,
  Divider,
} from 'antd'
import { getAgentModelList } from '@/api/agent'
import { previewCommon, previewParent, saveAndProcessExistKnowledge, saveAndProcessKnowledge } from '@/api/knowledge'
import List from 'rc-virtual-list'
import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
const CreateUpload = forwardRef((props, ref) => {
  const { id } = useParams()
  const [loading, setLoading] = useState(false)
  const [previewCurrent, setPreviewCurrent] = useState(1) //1 普通预览 2 高级分段
  const [current, setCurrent] = useState(1)
  const [searchCurrent, setSearchCurrent] = useState('VECTOR')
  const [parentValue, setParentValue] = useState(true) //true 为段落 false 为全文
  const [isRerank, setIsRerank] = useState(true) //true 为Rerank模型 false 权重
  const [mixValue, setMixValue] = useState(0.7)
  const [baseModeList, setBaseModeList] = useState([]) //基础模型配置
  const [searchModeList, setSearchModeList] = useState([]) //多模态模型配置
  const [rerankModelList, setRerankModelList] = useState([]) //
  const [character, setCharacter] = useState(0)
  const [chunks, setChunks] = useState([])
  const [documentId, setDocumentId] = useState(null) //文档ID
  const [documentImg, setDocumentImg] = useState(null) //文档ID
  const [chunkType, setChunkType] = useState('NORMAL')
  const [oneLoading, setOneLoading] = useState(false)
  const [twoLoading, setTwoLoading] = useState(false)
  const [multiModalityModel, setMultiModalityModel] = useState([]) //多模态数组
  const [submitLoading, setSubmitLoading] = useState(false) //提交加载

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
  const [baseConf, setBaseConf] = useState({
    chunkIdentifier: '\\n\\n', //分隔符
    chunkSize: 1024, //分段大小
    chunkOverlap: 50, //重叠大小
    filterBlank: true, //过滤空白
    removeUrl: false, //去除链接
    language: 'Chinese Simplified',
    enable: false, //是否启用Qa分段
    modelId: null, //Qa模型id
  }) //基础配置
  const [parentConf, setParentConf] = useState({
    fulltext: false, //全文
    chunkIdentifier: '\\n\\n', //段落
    chunkSize: 1024, //段落大小
    filterBlank: true, //过滤空白
    removeUrl: false, //去除链接
  })
  const [childChunkSetting, setChildChunkSetting] = useState({
    chunkIdentifier: '\\n', //段落
    chunkSize: 512, //段落大小
  })
  //检索配置
  const [searchConf, setSearchConf] = useState({
    enableMultimodal: false, //是否启用多模态
    embeddingModelId: null,
    rerankModelId: null,
    topK: 3,
    enableScore: false, //是否启用Score
    enableRerank: true,
    score: 0.5, //score 值
    hybridSearchSemanticMatchingWeight: 0.7,
    hybridSearchKeywordMatchingWeight: 0.3,
    vectorRerank: true, //向量rerank
    fullRerank: true, //全文
  })
  const handleBack = () => {
    props.backNext()
  }

  // console.log('searchConf', searchConf)

  useEffect(() => {
    const kb = props.knowledgeBase
    setSearchCurrent(kb.searchStrategy || 'VECTOR')
    setCurrent(kb.chunkingStrategy === 'PARENT_CHILD' ? 2 : 1)
    // console.log(props.disableConf,'kkkkk');

    getAgentModelListEvent(kb)
  }, [props.knowledgeBase])

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
  useEffect(() => {
    setDefaultValue()
  }, [])
  //设置默认值
  const setDefaultValue = () => {
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
    setDocumentId(id)
    setDocumentImg(fileImage)
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
      let baseModeArr = data.filter(item => {
        if (item.classification) {
          return item.classification === 1 || item.classification === 2
        }
        return false
      })
      setBaseModeList(baseModeArr)
      //基础
      if (baseModeArr.length > 0) {
        setBaseConf({ ...baseConf, modelId: baseModeArr[0].id })
      }
      if (kb.chunkingStrategy === 'COMMON') {
        const isModelAvailable = baseModeArr.findIndex(e => e.id === kb.qaModelId) !== -1
        setBaseConf({
          ...baseConf,
          enable: kb.enableQaChunk,
          modelId: isModelAvailable ? kb.qaModelId : null,
        })
      }
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

      if (kb.searchStrategy === 'HYBRID' && kb.enableRerank !== null) {
        setIsRerank(kb.enableRerank)
      }
    })
  }
  //基础分段-分隔符
  const baseChunkIdentifierChange = e => {
    setBaseConf({ ...baseConf, chunkIdentifier: e.target.value })
  }
  //父子分段-分隔符
  const parentChunkIdentifierChange = e => {
    setParentConf({ ...parentConf, chunkIdentifier: e.target.value })
  }

  //模块点击事件
  const confItemClick = value => {
    setCurrent(value)
  }
  //检索
  const confSearchItemClick = val => {
    if (props.disableConf) {
      return
    }
    setSearchCurrent(val)
    switch (val) {
      case 3:
        setSearchConf({
          ...searchConf,
          fullRerank: true,
        })
        break
      case 4:
        setSearchConf({
          ...searchConf,
          vectorRerank: true,
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
  //父子段落选择
  const paragraphChange = e => {
    setParentConf({ ...parentConf, fulltext: false })
  }
  //父子福分全文选择
  const fullTextChange = e => {
    setParentConf({ ...parentConf, fulltext: e.target.checked })
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
  //文档选择事件
  const documentChange = value => {
    setDocumentId(value)
    let arr = props.documentList || []
    let found = arr.find(element => element.id == value)
    // 初始化文件后缀名为 null
    let fileExtension = null
    let fileImage = null // 用于存储对应的图片路径
    if (found) {
      // 查找最后一个点的索引
      const lastDotIndex = found.name.lastIndexOf('.')
      if (lastDotIndex !== -1) {
        // 提取文件后缀名
        fileExtension = found.name.slice(lastDotIndex + 1)
        // 根据文件后缀获取对应的图片路径
        fileImage = imgUrls[fileExtension.toLowerCase()] || imgUrls['other']
      }
    }
    setDocumentImg(fileImage)
    setChunks([])
    setCharacter(0)
  }
  //普通分段预览点击事件
  const previewCommonClick = () => {
    previewCommonEvent()
  }
  const unescapeString = str => {
    return str
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\b/g, '\b')
      .replace(/\\f/g, '\f')
      .replace(/\\v/g, '\v')
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
  }
  //预览普通分段
  const previewCommonEvent = id => {
    let data = {
      documentId: id ? id : documentId,
      chunkSetting: {
        chunkIdentifier: unescapeString(baseConf.chunkIdentifier),
        chunkSize: baseConf.chunkSize,
        chunkOverlap: baseConf.chunkOverlap,
      },
      cleanerSetting: {
        filterBlank: baseConf.filterBlank,
        removeUrl: baseConf.removeUrl,
      },
      qaSetting: {
        enable: baseConf.enable,
        language: baseConf.language,
        modelId: baseConf.modelId,
      },
    }
    setLoading(true)
    setOneLoading(true)
    setPreviewCurrent(1)
    setChunks([])
    setCharacter(0)
    previewCommon(data)
      .then(res => {
        setLoading(false)
        setOneLoading(false)
        setChunkType(res.data.chunk_type)
        let data = res.data.chunk.length ? res.data.chunk : res.data.qa_chunk
        setCharacter(data.length)
        setChunks(data)
      })
      .catch(err => {
        setOneLoading(false)
        setLoading(false)
        console.log(err)
      })
  }
  //重置普通分段配置
  const resetCommonEvent = () => {
    let qaModelId = baseModeList && baseModeList.length ? baseModeList[0].id : null
    setBaseConf({
      chunkIdentifier: '\\n\\n', //分隔符
      chunkSize: 1024, //分段大小
      chunkOverlap: 50, //重叠大小
      filterBlank: true, //过滤空白
      removeUrl: false, //去除链接
      language: 'Chinese Simplified',
      enable: false, //是否启用Qa分段
      modelId: qaModelId, //Qa模型id
    })
  }
  //父子分段重置事件
  const resetParentEvent = () => {
    setParentConf({
      fulltext: false, //全文
      chunkIdentifier: '\\n\\n', //段落
      chunkSize: 1024, //段落大小
      filterBlank: true, //过滤空白
      removeUrl: false, //去除链接
    })
    setChildChunkSetting({
      chunkIdentifier: '\\n', //段落
      chunkSize: 512, //段落大小
    })
  }

  const previewParentClick = () => {
    previewParentEvent()
  }
  //预览父子分段
  const previewParentEvent = id => {
    let data = {
      documentId: id ? id : documentId,
      parentChunkSetting: {
        fulltext: parentConf.fulltext,
        chunkIdentifier: unescapeString(parentConf.chunkIdentifier),
        chunkSize: parentConf.chunkSize,
      },
      cleanerSetting: {
        filterBlank: parentConf.filterBlank,
        removeUrl: parentConf.removeUrl,
      },
      childChunkSetting: {
        chunkIdentifier: unescapeString(childChunkSetting.chunkIdentifier),
        chunkSize: childChunkSetting.chunkSize,
      },
    }
    setPreviewCurrent(2)
    setLoading(true)
    setTwoLoading(true)
    setChunks([])
    setCharacter(0)
    previewParent(data)
      .then(res => {
        setCharacter(res.data.chunk.length)
        setChunks(res.data.chunk)
        setLoading(false)
        setTwoLoading(false)
      })
      .catch(err => {
        setLoading(false)
        setTwoLoading(false)
        console.log(err)
      })
  }
  //保存点击事件
  const saveEvent = () => {
    setSubmitLoading(true)

    let arr = props.documentList
    let documentIds = []
    arr.forEach(element => {
      documentIds.push(element.id)
    })
    if (searchConf.enableMultimodal && !searchConf.embeddingModelId) {
      return message.warning('Embedding 模型不能为空')
    }
    let saveData = {
      ...searchConf,
      searchStrategy: searchCurrent,
      enableRerank: {
        VECTOR: searchConf.vectorRerank,
        FULL_TEXT: searchConf.fullRerank,
        HYBRID: isRerank,
      }[searchCurrent],
      name: props.knowledgeBase.name ? props.knowledgeBase.name : arr[0].name ? arr[0].name.slice(0, 50) : '',
      type: 'TRAD',
      knowledgeBaseId: id,
      documentIds: documentIds,
      chunkingStrategy: current === 1 ? 'COMMON' : 'PARENT_CHILD',
      previewParams: {
        chunkingStrategy: current === 1 ? 'COMMON' : 'PARENT_CHILD',
        chunkSetting: {
          chunkIdentifier: unescapeString(baseConf.chunkIdentifier),
          chunkSize: baseConf.chunkSize,
          chunkOverlap: baseConf.chunkOverlap,
        },
        cleanerSetting: {
          filterBlank: baseConf.filterBlank,
          removeUrl: baseConf.removeUrl,
        },
        qaSetting: {
          enable: baseConf.enable,
          language: baseConf.language,
          modelId: baseConf.modelId,
        },
        parentChunkSetting: {
          fulltext: parentConf.fulltext,
          chunkIdentifier: unescapeString(parentConf.chunkIdentifier),
          chunkSize: parentConf.chunkSize,
        },
        childChunkSetting: {
          chunkIdentifier: unescapeString(childChunkSetting.chunkIdentifier),
          chunkSize: childChunkSetting.chunkSize,
        },
      },
    }

    if (props.disableConf) {
      saveAndProcessExistKnowledge(saveData)
        .then(res => {
          message.success('保存成功')
          props.nextResultEvent({
            ...saveData,
            baseConf: baseConf,
            parentConf: parentConf,
          })
        })
        .catch(err => {
          console.log(err)
        })
        .finally(() => {
          setSubmitLoading(false)
        })
    } else {
      saveAndProcessKnowledge(saveData)
        .then(res => {
          message.success('保存成功')
          props.nextResultEvent({
            ...saveData,
            baseConf: baseConf,
            parentConf: parentConf,
            id: res.data,
          })
        })
        .catch(err => {
          console.log(err)
        })
        .finally(() => {
          setSubmitLoading(false)
        })
    }
  }
  //多模态选择事件
  const embeddingChange = value => {
    //多模态不开启，仅选择不支持视觉的向量模型；开启，仅选择支持视觉的向量模型
    let multiModalityModelArr = searchModeList.filter(item => {
      return item.isSupportVisual === value
    })
    let modelId = multiModalityModelArr.length ? multiModalityModelArr[0].id : null
    //存在模型时默认选中第一个
    setSearchConf({ ...searchConf, enableMultimodal: value, embeddingModelId: modelId })
    setMultiModalityModel(multiModalityModelArr)
  }

  const renderTooltip = (content, index) => {
    return (
      <div className={`${styles['chunks_list_item_header']} ${styles['tooltip_chunk']}`}>
        <div className={`${styles['chunks_list_item_header_title']} ${styles['tooltip_chunk_title']}`}>
          <img
            src='/knowledge/tooltip_bg.png'
            className={styles['chunks_list_item_header_title_img']}
          />
          分段 {index + 1}
        </div>
        <div className={styles['chunks_list_item_header_divver']}></div>
        <div className={`${styles['chunks_list_item_header_character']} ${styles['tooltip_chunk_character']}`}>
          {content.character || 0}字符
        </div>
      </div>
    )
  }

  return (
    <div className={styles['create_conf_container']}>
      <div className={styles['create_conf_container_left']}>
        <div className={styles['create_conf_container_left_content']}>
          <div className={styles['create_conf_container_left_title']}>分段配置</div>
          {/* 普通分段 */}
          {(!props.disableConf || current === 1) && (
            <div
              className={styles['conf_item']}
              onClick={() => confItemClick(1)}
            >
              <div
                className={
                  current === 1
                    ? `${styles['conf_item_header']} ${styles['conf_item_select']}`
                    : styles['conf_item_header']
                }
              >
                <div className={styles['conf_item_header_left']}>
                  <div className={styles['conf_item_header_left_img']}>
                    <img src='/knowledge/normal.png' />
                  </div>
                  <div className={styles['conf_item_header_left_title']}>
                    <div className={styles['conf_item_header_left_text']}>普通分段</div>
                    <div className={styles['conf_item_header_left_tip']}>检索和召回的分段是相同的</div>
                  </div>
                </div>
                {current === 1 && (
                  <div className={styles['conf_item_header_right']}>
                    <Button
                      className={styles['conf_item_header_right_cancel']}
                      onClick={resetCommonEvent}
                    >
                      {' '}
                      <img src='/knowledge/refresh.png' /> 重置
                    </Button>
                    <Button
                      disabled={twoLoading}
                      className={styles['conf_item_header_right_preview']}
                      onClick={previewCommonClick}
                      loading={oneLoading}
                    >
                      {' '}
                      <img src='/knowledge/preview.png' />
                      预览
                    </Button>
                  </div>
                )}
              </div>

              {current === 1 && (
                <div className={styles['conf_item_content']}>
                  <div className={styles['conf_item_content_top']}>
                    <div className={styles['conf_item_content_top_item']}>
                      <div className={styles['conf_item_content_top_item_title']}>
                        分段标识符
                        <Tooltip
                          title='分隔符是用于分隔文本的字符。
                           \n\n和\n是常用于分隔段落和行的分隔符。你也可以使用自定义的特殊分隔符（例如***）'
                        >
                          <img
                            className={styles['info_img']}
                            src='/agent/info.png'
                            alt=''
                          />
                        </Tooltip>
                      </div>
                      <div className={styles['conf_item_content_top_item_input']}>
                        <Input
                          value={baseConf.chunkIdentifier}
                          onChange={baseChunkIdentifierChange}
                          style={{ width: '100%' }}
                          placeholder='\n\n用于分段；\n用于分行'
                        />
                      </div>
                    </div>
                    <div className={styles['conf_item_content_top_item']}>
                      <div className={styles['conf_item_content_top_item_title']}>分段最大长度</div>
                      <div className={styles['conf_item_content_top_item_input']}>
                        <InputNumber
                          min={50}
                          max={2000}
                          onChange={value => setBaseConf({ ...baseConf, chunkSize: value })}
                          value={baseConf.chunkSize}
                          suffix='字符'
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>
                    <div className={styles['conf_item_content_top_item']}>
                      <div className={styles['conf_item_content_top_item_title']}>
                        分段重叠长度
                        <Tooltip title='说明：设置分段之间的重叠长度可以保留分段之间的语义关系，提升召回效果。建议设置为最大分段长度的10%-25%'>
                          <img
                            className={styles['info_img']}
                            src='/agent/info.png'
                            alt=''
                          />
                        </Tooltip>
                      </div>
                      <div className={styles['conf_item_content_top_item_input']}>
                        <InputNumber
                          min={0}
                          max={baseConf.chunkSize}
                          onChange={value => setBaseConf({ ...baseConf, chunkOverlap: value })}
                          value={baseConf.chunkOverlap}
                          suffix='字符'
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>
                  </div>
                  {/* 文本预处理规则 */}
                  <div className={styles['conf_item_content_rule']}>
                    <div className={styles['conf_item_content_rule_title']}>文本预处理规则</div>
                    <div className={styles['conf_item_content_column']}>
                      <Checkbox
                        checked={baseConf.filterBlank}
                        onChange={e =>
                          setBaseConf({
                            ...baseConf,
                            filterBlank: e.target.checked,
                          })
                        }
                        style={{ color: baseConf.filterBlank ? 'inherit' : 'rgba(0, 0, 0, 0.45)' }}
                      >
                        替换掉连续的空格、换行符和制表符
                      </Checkbox>
                      <Checkbox
                        checked={baseConf.removeUrl}
                        onChange={e =>
                          setBaseConf({
                            ...baseConf,
                            removeUrl: e.target.checked,
                          })
                        }
                        style={{ color: baseConf.removeUrl ? 'inherit' : 'rgba(0, 0, 0, 0.45)' }}
                      >
                        删除所有 URL 和电子邮件地址
                      </Checkbox>
                    </div>
                  </div>
                  {/* 使用QA分段 */}
                  <div className={styles['conf_item_content_qa']}>
                    <Checkbox
                      checked={baseConf.enable}
                      onChange={e => setBaseConf({ ...baseConf, enable: e.target.checked })}
                      style={{ color: baseConf.enable ? 'inherit' : 'rgba(0, 0, 0, 0.45)' }}
                      disabled={props.disableConf}
                    >
                      使用Q&A分段,语言
                    </Checkbox>
                    <Select
                      style={{ width: 100 }}
                      value={baseConf.language}
                      onChange={value => setBaseConf({ ...baseConf, language: value })}
                    >
                      <Select.Option value='Chinese Simplified'>中文</Select.Option>
                      <Select.Option value='English'>英文</Select.Option>
                    </Select>
                    <Tooltip title='说明：开启后将会消耗额外的 token'>
                      <img
                        className={styles['info_img']}
                        src='/agent/info.png'
                        alt=''
                      />
                    </Tooltip>
                    {/* 模型选择 */}
                    {baseConf.enable && (
                      <div className={styles['conf_item_content_qa_select']}>
                        <Select
                          style={{ width: '100%' }}
                          placeholder='请选择模型'
                          value={baseConf.modelId}
                          onChange={value => setBaseConf({ ...baseConf, modelId: value })}
                        >
                          {baseModeList.map(item => (
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
                </div>
              )}
            </div>
          )}
          {/* 高级分段 */}
          {(!props.disableConf || current === 2) && (
            <div
              className={styles['conf_item']}
              onClick={() => confItemClick(2)}
            >
              <div
                className={
                  current === 2
                    ? `${styles['conf_item_header']} ${styles['conf_item_select']}`
                    : styles['conf_item_header']
                }
              >
                <div className={styles['conf_item_header_left']}>
                  <div className={styles['conf_item_header_left_img']}>
                    <img src='/knowledge/advanced.png' />
                  </div>
                  <div className={styles['conf_item_header_left_title']}>
                    <div className={styles['conf_item_header_left_text']}>高级分段</div>
                    <div className={styles['conf_item_header_left_tip']}>
                      使用父子分段模式，子分段用于检索，父分段用作上下文
                    </div>
                  </div>
                </div>
                {current === 2 && (
                  <div className={styles['conf_item_header_right']}>
                    <Button
                      className={styles['conf_item_header_right_cancel']}
                      onClick={resetParentEvent}
                    >
                      {' '}
                      <img src='/knowledge/refresh.png' /> 重置
                    </Button>
                    <Button
                      disabled={oneLoading}
                      className={styles['conf_item_header_right_preview']}
                      onClick={previewParentClick}
                      loading={twoLoading}
                    >
                      {' '}
                      <img src='/knowledge/preview.png' />
                      预览
                    </Button>
                  </div>
                )}
              </div>
              {current === 2 && (
                <div className={styles['conf_item_content']}>
                  <div className={styles['conf_item_content_rule_title']}>父块用作上下文</div>
                  <div className={styles['conf_item_parent']}>
                    <div className={styles['conf_item_parent_item']}>
                      <div className={styles['conf_item_parent_item_header']}>
                        <div className={styles['conf_item_parent_item_left']}>
                          <div className={styles['conf_item_parent_item_left_img']}>
                            <img src='/knowledge/paragraph.png' />
                          </div>
                          <div className={styles['conf_item_parent_item_left_content']}>
                            <div className={styles['conf_item_parent_item_left_content_title']}>段落</div>
                            <div className={styles['conf_item_parent_item_left_content_tip']}>
                              此模式根据分隔符和最大块长度将文本拆分为段落，使用拆分文本作为检索的父块
                            </div>
                          </div>
                        </div>
                        <div className={styles['conf_item_parent_item_right']}>
                          <Radio
                            checked={!parentConf.fulltext}
                            onChange={paragraphChange}
                          ></Radio>
                        </div>
                      </div>
                      {/* 段落配置 */}
                      {parentValue && (
                        <div className={styles['conf_item_content_top']}>
                          <div className={styles['conf_item_content_top_item']}>
                            <div className={styles['conf_item_content_top_item_title']}>
                              分段标识符
                              <Tooltip
                                title='分隔符是用于分隔文本的字符。
                               建议用\n\n将原始文档划分为较大的父级片段。您也可以自定义特殊分隔符。'
                              >
                                <img
                                  className={styles['info_img']}
                                  src='/agent/info.png'
                                  alt=''
                                />
                              </Tooltip>
                            </div>
                            <div className={styles['conf_item_content_top_item_input']}>
                              <Input
                                value={parentConf.chunkIdentifier}
                                onChange={parentChunkIdentifierChange}
                                placeholder='\n\n用于分段；\n用于分行'
                                style={{ width: '100%' }}
                              />
                            </div>
                          </div>
                          <div className={styles['conf_item_content_top_item']}>
                            <div className={styles['conf_item_content_top_item_title']}>分段最大长度</div>
                            <div className={styles['conf_item_content_top_item_input']}>
                              <InputNumber
                                min={50}
                                max={2000}
                                onChange={value =>
                                  setParentConf({
                                    ...parentConf,
                                    chunkSize: value,
                                  })
                                }
                                value={parentConf.chunkSize}
                                suffix='字符'
                                style={{ width: '100%' }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className={styles['conf_item_parent_item']}>
                      <div className={styles['conf_item_parent_item_header']}>
                        <div className={styles['conf_item_parent_item_left']}>
                          <div className={styles['conf_item_parent_item_left_img']}>
                            <img src='/knowledge/fullText.png' />
                          </div>
                          <div className={styles['conf_item_parent_item_left_content']}>
                            <div className={styles['conf_item_parent_item_left_content_title']}>全文</div>
                            <div className={styles['conf_item_parent_item_left_content_tip']}>
                              整个文档用作父块并直接检索。请注意，出于性能原因，超过10000个标记的文本将被自动截断。
                            </div>
                          </div>
                        </div>
                        <div className={styles['conf_item_parent_item_right']}>
                          <Radio
                            checked={parentConf.fulltext}
                            onChange={fullTextChange}
                          ></Radio>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* 字段设置 */}
                  <div className={styles['conf_item_content_rule_title']}>子块用于检索</div>
                  <div className={styles['conf_item_content_top']}>
                    <div className={styles['conf_item_content_top_item']}>
                      <div className={styles['conf_item_content_top_item_title']}>
                        分段标识符
                        <Tooltip
                          title='分隔符是用于分隔文本的字符。
                          建议使用\n将父级片段划分为较小的子级片段。您也可以自定义特殊分隔符'
                        >
                          <img
                            className={styles['info_img']}
                            src='/agent/info.png'
                            alt=''
                          />
                        </Tooltip>
                      </div>
                      <div className={styles['conf_item_content_top_item_input']}>
                        <Input
                          value={childChunkSetting.chunkIdentifier}
                          onChange={e =>
                            setChildChunkSetting({
                              ...childChunkSetting,
                              chunkIdentifier: e.target.value,
                            })
                          }
                          style={{ width: '100%' }}
                          placeholder='\n\n用于分段；\n用于分行'
                        />
                      </div>
                    </div>
                    <div className={styles['conf_item_content_top_item']}>
                      <div className={styles['conf_item_content_top_item_title']}>分段最大长度</div>
                      <div className={styles['conf_item_content_top_item_input']}>
                        <InputNumber
                          min={50}
                          max={2000}
                          onChange={value =>
                            setChildChunkSetting({
                              ...childChunkSetting,
                              chunkSize: value,
                            })
                          }
                          value={childChunkSetting.chunkSize}
                          suffix='字符'
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>
                  </div>
                  {/* 文本预处理规则 */}
                  <div>
                    <div className={styles['conf_item_content_rule_title']}>文本预处理规则</div>
                    <div className={styles['conf_item_content_column']}>
                      <Checkbox
                        checked={baseConf.filterBlank}
                        onChange={e =>
                          setBaseConf({
                            ...baseConf,
                            filterBlank: e.target.checked,
                          })
                        }
                        style={{ color: baseConf.filterBlank ? 'inherit' : 'rgba(0, 0, 0, 0.45)' }}
                      >
                        替换掉连续的空格、换行符和制表符
                      </Checkbox>
                      <Checkbox
                        checked={baseConf.removeUrl}
                        onChange={e =>
                          setBaseConf({
                            ...baseConf,
                            removeUrl: e.target.checked,
                          })
                        }
                        style={{ color: baseConf.removeUrl ? 'inherit' : 'rgba(0, 0, 0, 0.45)' }}
                      >
                        删除所有 URL 和电子邮件地址
                      </Checkbox>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {/* 索引方式 */}
          <div className={styles['conf_iten_indexing']}>
            <div className={styles['conf_iten_indexing_title']}>索引模式</div>
            <div className={styles['conf_iten_indexing_content']}>
              (调用嵌入模型来处理文档以实现更精确的检索，可以帮助LLM生成高质量的回答)
            </div>
          </div>
          {/*Embedding 模型 */}
          <div className={styles['conf_iten_indexing']}>
            <div className={styles['conf_iten_indexing_title']}>Embedding 模型</div>
            <div className={styles['conf_iten_indexing_model']}>
              <div className={styles['conf_iten_indexing_model_left']}>
                <Switch
                  defaultChecked
                  size='small'
                  checked={searchConf.enableMultimodal}
                  onChange={embeddingChange}
                  disabled={props.disableConf}
                />{' '}
                多模态
              </div>

              <div className={styles['conf_iten_indexing_model_right']}>
                <Select
                  style={{ width: '100%' }}
                  placeholder='请选择模型'
                  value={searchConf.embeddingModelId}
                  onChange={value => setSearchConf({ ...searchConf, embeddingModelId: value })}
                  disabled={props.disableConf}
                >
                  {multiModalityModel.map(item => (
                    <Select.Option
                      key={item.id}
                      value={item.id}
                      label={item.name}
                    >
                      {item.name}
                    </Select.Option>
                  ))}
                </Select>
                <div className={styles['conf_iten_indexing_model_right_tip']}>
                  知识库文档嵌入处理中时将影响应用的知识检索结果
                </div>
              </div>
            </div>
          </div>
          <div className={styles['create_conf_container_left_title']}>检索设置</div>
          {/* 向量检索 */}
          {(!props.disableConf || searchCurrent === 'VECTOR') && (
            <div className={styles['conf_item']}>
              <div
                onClick={() => confSearchItemClick('VECTOR')}
                className={
                  searchCurrent === 'VECTOR'
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
              {searchCurrent === 'VECTOR' && (
                <div className={styles['conf_item_content']}>
                  {/* Rerank模型 */}
                  <div className={styles['conf_rerank']}>
                    <div className={styles['conf_rerank_top']}>
                      <Switch
                        defaultChecked
                        size='small'
                        checked={searchConf.vectorRerank}
                        onChange={e => setSearchConf({ ...searchConf, vectorRerank: e })}
                        disabled={props.disableConf}
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
                          disabled={props.disableConf}
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
                          disabled={props.disableConf}
                        />
                        <div className={styles['conf_rerank_content_item_slider']}>
                          {' '}
                          <Slider
                            onChange={value => setSearchConf({ ...searchConf, topK: value })}
                            value={searchConf.topK}
                            disabled={props.disableConf}
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
                          disabled={props.disableConf}
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
                          disabled={props.disableConf}
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
                            disabled={props.disableConf}
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
          )}
          {/* 全文检索 */}
          {(!props.disableConf || searchCurrent === 'FULL_TEXT') && (
            <div className={styles['conf_item']}>
              <div
                onClick={() => confSearchItemClick('FULL_TEXT')}
                className={
                  searchCurrent === 'FULL_TEXT'
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
              {searchCurrent === 'FULL_TEXT' && (
                <div className={styles['conf_item_content']}>
                  {/* Rerank模型 */}
                  <div className={styles['conf_rerank']}>
                    <div className={styles['conf_rerank_top']}>
                      <Switch
                        defaultChecked
                        size='small'
                        disabled={props.disableConf}
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
                          disabled={props.disableConf}
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
                          disabled={props.disableConf}
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
                            disabled={props.disableConf}
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
                            disabled={props.disableConf}
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
                            disabled={props.disableConf}
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
                              disabled={props.disableConf}
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
          )}
          {/* 混合检索 */}
          {(!props.disableConf || searchCurrent === 'HYBRID') && (
            <div className={styles['conf_item']}>
              <div
                onClick={() => confSearchItemClick('HYBRID')}
                className={
                  searchCurrent === 'HYBRID'
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
              {searchCurrent === 'HYBRID' && (
                <div className={styles['conf_item_content']}>
                  <div className={styles['conf_mix_top']}>
                    <div
                      className={styles['conf_mix_top_item']}
                      onClick={() => {
                        if (props.disableConf) {
                          return
                        }
                        setIsRerank(false)
                      }}
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
                      onClick={() => {
                        if (props.disableConf) {
                          return
                        }
                        setIsRerank(true)
                      }}
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
                          disabled={props.disableConf}
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
                        disabled={props.disableConf}
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
                          disabled={props.disableConf}
                        />
                        <div className={styles['conf_rerank_content_item_slider']}>
                          {' '}
                          <Slider
                            onChange={value => setSearchConf({ ...searchConf, topK: value })}
                            value={searchConf.topK}
                            min={1}
                            max={10}
                            disabled={props.disableConf}
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
                          disabled={props.disableConf}
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
                          disabled={props.disableConf || !searchConf.enableScore}
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
                            disabled={props.disableConf || !searchConf.enableScore}
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
          )}
          {/*  */}
        </div>
        <div className={styles['create_conf_container_left_footer']}>
          <Button
            loading={submitLoading}
            className={styles['create_conf_container_left_footer_btn']}
            onClick={handleBack}
          >
            上一步
          </Button>
          <Button
            loading={submitLoading}
            className={styles['create_conf_container_left_footer_save']}
            type='primary'
            onClick={saveEvent}
          >
            保存并处理
          </Button>
        </div>
      </div>
      <div className={styles['create_conf_container_right']}>
        <div className={styles['create_conf_container_right_header']}>
          <div className={styles['create_conf_container_right_header_title']}>分段预览</div>
          <div className={styles['create_conf_container_right_header_select']}>
            <img src={documentImg} />
            <Select
              variant='borderless'
              disabled={loading}
              style={{ minWidth: '120px', maxWidth: '320px' }}
              value={documentId}
              onChange={documentChange}
            >
              {props.documentList &&
                props.documentList.map(item => (
                  <Select.Option
                    key={item.id}
                    value={item.id}
                    label={item.name}
                  >
                    {item.name}
                  </Select.Option>
                ))}
            </Select>
            {/* 展示分段数量 */}
            <div className={styles['create_conf_container_right_header_num']}>
              <img src='/knowledge/total.png' />
              {character} 个分段
            </div>
          </div>
        </div>
        <Spin
          spinning={loading}
          wrapperClassName='create_conf_container_right_loading'
        >
          {chunks.length !== 0 && (
            <div className={styles['create_conf_container_right_content']}>
              <List
                data={chunks}
                itemKey='id'
              >
                {(item, index) => (
                  <div className={styles['chunks_list_item']}>
                    <div className={styles['chunks_list_item_header']}>
                      <div className={styles['chunks_list_item_header_title']}>
                        <img
                          src='/knowledge/parent.png'
                          className={styles['chunks_list_item_header_title_img']}
                        />
                        {previewCurrent === 2 && '父'}
                        分段 {index + 1}
                      </div>
                      <div className={styles['chunks_list_item_header_divver']}></div>
                      <div className={styles['chunks_list_item_header_character']}>{item.character}字符</div>
                    </div>
                    {/* 普通分段渲染 */}
                    {previewCurrent === 1 && chunkType === 'NORMAL' && (
                      <div className={styles['chunks_list_item_content']}>
                        <ReactMarkdown remarkPlugins={[remarkBreaks]}>{item.content}</ReactMarkdown>
                      </div>
                    )}
                    {previewCurrent === 1 && chunkType === 'NORMAL_QA' && (
                      <div className={styles['chunks_list_item_content_qa']}>
                        <div className={styles['chunks_list_item_content_question']}>
                          Q <ReactMarkdown remarkPlugins={[remarkBreaks]}>{item.question}</ReactMarkdown>
                        </div>
                        <div className={styles['chunks_list_item_content_answer']}>
                          A <ReactMarkdown remarkPlugins={[remarkBreaks]}>{item.answer}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                    {/* 父子分段渲染 */}
                    {previewCurrent === 2 && (
                      <div className={styles['chunks_list_item_content_parent']}>
                        {Array.isArray(item.content) ? (
                          item.content.map((parent, a) => (
                            <Tooltip
                              placement={'topRight '}
                              getPopupContainer={triggerNode => triggerNode.parentNode}
                              title={renderTooltip(parent, a)}
                            >
                              <div
                                key={a}
                                className={styles['chunks_list_item_content_parent_item']}
                              >
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
                )}
              </List>
            </div>
          )}

          {chunks.length === 0 && (
            <div className={styles['create_conf_container_right_content_empty']}>
              <Empty
                image={'/knowledge/conf_empty.png'}
                styles={{ image: { height: 260, width: 380 } }}
                description={<span style={{ color: '#666E82', fontWeight: 500 }}>点击“预览”按钮加载预览</span>}
              />
            </div>
          )}
        </Spin>
      </div>
    </div>
  )
})
export default CreateUpload

