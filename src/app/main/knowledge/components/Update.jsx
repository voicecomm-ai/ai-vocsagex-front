'use client'

import React, { useState, forwardRef, useImperativeHandle, useRef } from 'react'
import { Button, Drawer, Form, Select, Radio, Input, InputNumber, Tooltip, Slider, ConfigProvider, Switch } from 'antd'
import { message } from 'antd'
import styles from './update.module.css'
import { useRouter } from 'next/navigation'
const { TextArea } = Input
import { getKnowledgeDetail, updateKnowledge } from '@/api/knowledge'
import { getAgentModelList } from '@/api/agent'
const AddOrEdit = forwardRef((props, ref) => {
  useImperativeHandle(ref, () => ({
    showModal,
    hideModal,
  }))
  const [open, setOpen] = useState(false)
  const formRef = useRef(null)
  const [title, setTitle] = useState('知识库编辑') //标题
  const [data, setData] = useState({}) //数据
  const [loading, setLoading] = useState(false) //加载中
  const [action, setAction] = useState('knowledge') //操作类型 knowledge 知识库，agent 智能体
  const [searchCurrent, setSearchCurrent] = useState(3) //3
  const [parentValue, setParentValue] = useState(true) //true 为段落 false 为全文
  const [isRerank, setIsRerank] = useState(true) //true 为Rerank模型 false 权重
  const [mixValue, setMixValue] = useState(0.7)
  const [rerankModelList, setRerankModelList] = useState([]) //
  const [searchModeList, setSearchModeList] = useState([]) //选中的树状结构
  const [placeholder, setPlaceholder] = useState('请输入知识库描述')
  const [multiModalityModel, setMultiModalityModel] = useState([]) //多模态数组

  let searchStrategyMap = {
    VECTOR: 3,
    FULL_TEXT: 4,
    HYBRID: 5,
  }
  //检索配置
  const [searchConf, setSearchConf] = useState({
    id: null,
    enableMultimodal: false, //是否启用多模态
    embeddingModelId: null,
    rerankModelId: null,
    topK: 3,
    enableScore: false, //是否启用Score
    enableRerank: true,
    score: 0.5, //score 值
    hybridSearchSemanticMatchingWeight: 0.7,
    hybridSearchKeywordMatchingWeight: 0.3,
    chunkingStrategy: null,
    vectorRerank: true, //向量rerank
    fullRerank: true, //全文
    mixRerank: true, //混合检索
  })
  const showModal = async (obj, type) => {
    setLoading(true)
    setOpen(true)
    setAction(type) //agent 智能体 knowledge 知识库
    setPlaceholder(
      type == 'agent'
        ? '描述该数据集的内容。详细描述可以让AI更快地访问数据集的内容'
        : '描述该数据集的内容。详细描述可以让AI更快地访问数据集的内容'
    )

    await getKnowledgeDetail(obj.id)
      .then(res => {
        formRef.current.setFieldsValue({
          name: res.data.name,
          description: res.data.description,
        })
        let setData = {
          type: res.data.type,
          id: res.data.id,
          enableMultimodal: res.data.enableMultimodal,
          embeddingModelId: res.data.embeddingModelId,
          rerankModelId: res.data.rerankModelId,
          topK: res.data.topK,
          enableScore: res.data.enableScore,
          enableRerank: res.data.enableRerank,
          vectorRerank: res.data.searchStrategy == 'VECTOR' ? res.data.enableRerank : true,
          fullRerank: res.data.searchStrategy == 'FULL_TEXT' ? res.data.enableRerank : true,
          score: res.data.score,
          hybridSearchSemanticMatchingWeight:
            res.data.semanticMatchingWeight != null
              ? res.data.semanticMatchingWeight
              : searchConf.hybridSearchSemanticMatchingWeight,
          hybridSearchKeywordMatchingWeight:
            res.data.keywordMatchingWeight != null
              ? res.data.keywordMatchingWeight
              : searchConf.hybridSearchKeywordMatchingWeight,
        }
        getAgentModelListEvent(setData)
        setSearchConf({
          ...setData,
        })
        setSearchCurrent(searchStrategyMap[res.data.searchStrategy])
        //混合检索reRank
        setIsRerank(res.data.searchStrategy == 'HYBRID' ? res.data.enableRerank : true)
        console.log(res.data.semanticMatchingWeight != null ? res.data.semanticMatchingWeight : 0.7)
        setMixValue(res.data.semanticMatchingWeight != null ? res.data.semanticMatchingWeight : 0.7)
      })
      .catch(err => {
        console.log(err)
        setLoading(false)
      })
  }

  //获取模型列表
  const getAgentModelListEvent = async setData => {
    let data = {
      type: 1,
      tagIdList: [1, 2, 3, 6, 9], //1 文本模型 2 多模态模型 3推理 9 排序
      isShelf: 1,
      isOr: 1,
    }
    await getAgentModelList(data)
      .then(res => {
        let data = res.data || []
        let searchModeArr = data.filter(item => {
          if (item.classification) {
            return item.classification == 6;
          }
          return false
        })
        setSearchModeList(searchModeArr)
        //多模态不开启，仅选择不支持视觉的向量模型；开启，仅选择支持视觉的向量模型
        let multiModalityModelArr = searchModeArr.filter(item => {
          return item.isSupportVisual === setData.enableMultimodal
        })
        //查找当前embeddingModelId是否在多模态模型中
        let currentEmbeddingModel = multiModalityModelArr.find(item => {
          return item.id === setData.embeddingModelId
        })

        setMultiModalityModel(multiModalityModelArr)
        let rerankModelArr = data.filter(item => {
          if (item.classification) {
            return  item.classification==9;
          }
          return false
        })
        //查找rerankModelId当前模型是否在多模态模型中
        let rerankModel = rerankModelArr.find(item => {
          return item.id === setData.rerankModelId
        })
        // 检查多模态模型数组是否为空或当前嵌入模型是否不存在，若满足条件则将 embeddingModelId 设置为 null，否则使用 setData 中的 embeddingModelId
        let embeddingModelId =
          multiModalityModelArr.length == 0 || !currentEmbeddingModel ? null : setData.embeddingModelId
        // 检查排序模型数组是否为空或当前排序模型是否不存在，若满足条件则将 rerankModelId 设置为 null，否则使用 setData 中的 rerankModelId
        let rerankModelId = rerankModelArr.length == 0 || !rerankModel ? null : setData.rerankModelId
        // 更新搜索配置，展开 setData 对象，并更新 embeddingModelId 和 rerankModelId
        setSearchConf({
          ...setData,
          embeddingModelId: embeddingModelId,
          rerankModelId: rerankModelId,
        })
        setRerankModelList(rerankModelArr)
        setLoading(false)
      })
      .catch(err => {
        setLoading(false)
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
  }
  //提交事件
  const submitEvent = async e => {
    e.preventDefault()
    const values = await formRef.current.validateFields()
    let enableRerank = {
      3: searchConf.vectorRerank,
      4: searchConf.fullRerank,
      5: isRerank,
    }[searchCurrent]
    if (!searchConf.embeddingModelId) {
      return message.warning('Embedding 模型不能为空')
    }
    if (enableRerank && !searchConf.rerankModelId) {
      return message.warning('Rerank模型不能为空')
    }
    let addData = {
      ...searchConf,
      ...values,
      enableRerank: enableRerank,
      searchStrategy: searchCurrent == 3 ? 'VECTOR' : searchCurrent == 5 ? 'HYBRID' : 'FULL_TEXT',
    }
    setLoading(true)
    updateKnowledge(addData)
      .then(res => {
        submitSuccessEvent()
      })
      .catch(err => {
        getAgentModelListEvent()
        setLoading(false) // 加载结束
      })
  }

  //检索
  const confSearchItemClick = val => {
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
  //提交成功事件
  const submitSuccessEvent = () => {
    setLoading(false) // 加载结束
    hideModal()
    message.success('操作成功')
    //调用父元素方法
    props?.searchEvent()
  }
  //多模态选择事件
  const embeddingChange = value => {
    //多模态不开启，仅选择不支持视觉的向量模型；开启，仅选择支持视觉的向量模型
    let multiModalityModelArr = searchModeList.filter(item => {
      return item.isSupportVisual === value
    })
    let modelId = multiModalityModelArr.length ? multiModalityModelArr[0].id : null
    //存在模型时默认选中第一个
    setSearchConf({
      ...searchConf,
      enableMultimodal: value,
      embeddingModelId: modelId,
    })
    console.log('111')
    setMultiModalityModel(multiModalityModelArr)
  }

  return (
    <div>
      <Drawer
        closable={false}
        destroyOnHidden
        title={null}
        placement='right'
        open={open}
        rootStyle={{ boxShadow: 'none' }}
        style={{ borderRadius: '24px 0px 0px 24px' }}
        width={656}
        onClose={hideModal}
        classNames={classNames}
        footer={null}
        zIndex={action == 'agent' ? 10000 : 999}
      >
        <div className={styles['knowledge_update']}>
          <div className={styles['knowledge_update_header']}>
            <div className={styles['knowledge_update_header_title']}>{title}</div>
            <img
              className={styles['knowledge_update_header_close']}
              src='/close.png'
              alt=''
              onClick={hideModal}
            />
          </div>
          <div className={styles['knowledge_update_content']}>
            <ConfigProvider
              theme={{
                components: {
                  Form: {
                    labelColor: ' #666E82',
                  },
                },
              }}
            >
              <Form
                ref={formRef}
                name='basic'
                layout={'vertical'}
                disabled={action === 'show' || loading} // 禁用表单
                autoComplete='off'
              >
                <Form.Item
                  label='知识库名称'
                  name='name'
                  rules={[
                    {
                      required: true,
                      message: '请输入知识库名称',
                      trigger: 'blur',
                    },
                    {
                      // 正则修改为不能全为空格
                      pattern: /^(?!\s+$).+$/,
                      message: '格式错误',
                      trigger: 'blur',
                    },
                  ]}
                >
                  <Input
                    showCount
                    maxLength={50}
                    placeholder='请输入知识库名称，不超过50个字'
                  />
                </Form.Item>
                <Form.Item
                  label='知识库描述'
                  name='description'
                >
                  <TextArea
                    showCount
                    autoSize={{ minRows: 3, maxRows: 5 }}
                    maxLength={400}
                    placeholder={placeholder}
                  />
                </Form.Item>
              </Form>
            </ConfigProvider>
            <div className={styles['knowledge_update_content_conf']}>
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
                      disabled={action == 'agent'}
                      checked={searchConf.enableMultimodal}
                      onChange={embeddingChange}
                    />{' '}
                    多模态
                  </div>

                  <div className={styles['conf_iten_indexing_model_right']}>
                    <Select
                      disabled={action == 'agent'}
                      style={{ width: '100%' }}
                      placeholder='请选择模型'
                      value={searchConf.embeddingModelId}
                      onChange={value =>
                        setSearchConf({
                          ...searchConf,
                          embeddingModelId: value,
                        })
                      }
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
              {/* 向量检索 */}
              <div className={styles['conf_iten_indexing']}>
                <div className={styles['conf_iten_indexing_title']}>检索设置</div>
              </div>
              <div className={styles['conf_item']}>
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
                            onChange={value =>
                              setSearchConf({
                                ...searchConf,
                                rerankModelId: value,
                              })
                            }
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
              <div className={styles['conf_item']}>
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
                            onChange={value =>
                              setSearchConf({
                                ...searchConf,
                                rerankModelId: value,
                              })
                            }
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
              {/* 全文检索 */}
              <div className={styles['conf_item']}>
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
                            value={mixValue}
                            min={0}
                            max={1}
                            step={0.1}
                            tooltip={{ open: false }}
                            onChange={mixValueChange}
                            styles={{
                              track: {
                                background: 'transparent',
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
                          onChange={value =>
                            setSearchConf({
                              ...searchConf,
                              rerankModelId: value,
                            })
                          }
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
            </div>
          </div>
          {/* 底部 */}
          <div className={styles['knowledge_update_footer']}>
            <Button
              key='back'
              className={styles['role_cancel_btn']}
              onClick={hideModal}
            >
              取消
            </Button>
            <Button
              key='submit'
              className={styles['role_save_btn']}
              disabled={action === 'show' || loading}
              type='primary'
              onClick={submitEvent}
            >
              确定
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  )
})

export default AddOrEdit

