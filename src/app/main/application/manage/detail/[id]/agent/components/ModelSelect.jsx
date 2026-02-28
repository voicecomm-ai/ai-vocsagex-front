import React, { useState, forwardRef, useImperativeHandle, useRef, useEffect } from 'react'
import styles from '../page.module.css'
import { Select } from 'antd'
import { getAgentModelList } from '@/api/agent'

const ModelSelect = forwardRef((props, ref) => {
  const [modelList, setModelList] = useState([])
  const [modelInfo, setModelInfo] = useState(null)
  const [modelId, setModelId] = useState(0)
  //获取模型列表
  const getAgentModelListEvent = () => {
    let data = {
      type: 1,
      tagIdList: [1, 2],
      isShelf: 1,
      isOr: 1,
    }
    getAgentModelList(data).then(res => {
      let defaultModel = res.data.find(item => item.id === props.agentInfo.modelId)
      console.log(defaultModel)
      if (defaultModel) {
        setModelInfo(defaultModel)
        setModelId(defaultModel.id)
      }

      setModelList(res.data)
    })
  }
  useImperativeHandle(ref, () => ({
    showModal,
  }))

  const showModal = () => {
    getAgentModelListEvent()
  }
  //选择模型事件
  const selectChange = value => {
    let modelInfo = modelList.find(item => item.id === value)
    setModelInfo(modelInfo)
    //更新模型信息到智能体
    let updateData = {
      modelId: value,
      modelName: modelInfo.name,
    }
    props.updateModelSelect(updateData)
  }
  useEffect(() => {
    getAgentModelListEvent()
  }, [])
  const labelRender = props => {
    const { label, value } = props
    console.log(modelInfo,'模型信息')
    if (modelInfo) {
      return (
        <div className={styles['model_label_render']}>
          {modelInfo.iconUrl && (
            <img
              className={styles['model_label_render_img']}
              src={process.env.NEXT_PUBLIC_API_BASE + modelInfo.iconUrl}
            />
          )}
          <div className={styles['model_label_render_title']}>{modelInfo.name}</div>
          <div className={styles['model_label_render_type']}>
            {modelInfo.classificationName ? modelInfo.classificationName : null}
          </div>
          {modelInfo && modelInfo.tagList && modelInfo.tagList.length > 0 && (
            <div className={styles['model_label_render_tag']}>
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
              className={`${styles['model_select_item']} ${isSelected ? styles['model_select_item_selected'] : ''}`}
              // 绑定点击事件，触发选择操作
              onClick={() => {
                setModelInfo(model)
                setModelId(model.id)
                // 调用更新模型信息的函数
                let updateData = {
                  modelId: model.id,
                  modelName: model.name,
                ...model
                }
                props.updateModelSelect(updateData)
              }}
            >
              {model.iconUrl && (
                <img
                  className={styles['model_label_render_img']}
                  src={process.env.NEXT_PUBLIC_API_BASE + model.iconUrl}
                />
              )}
              <div className={styles['model_label_render_title']}>{model.name}</div>
              <div className={styles['model_label_render_type']}>
                {model.classificationName ? model.classificationName : null}
              </div>
              {model && model.tagList && model.tagList.length > 0 && (
                <div className={styles['model_label_render_tag']}>
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
    <div className={styles['model_select_content']}>
      <div className={styles['model_select_content_header']}>
        <div className={styles['model_select_content_header_title']}>模型选择</div>
        <Select
          disabled={!props.canCreate}
          defaultValue={modelId}
          labelRender={labelRender}
          onChange={selectChange}
          placeholder='请选择模型'
          fieldNames={{ label: 'name', value: 'id' }}
          options={modelList}
          style={{
         
            height: '36px',
          
          }}
          variant='borderless'
          classNames={{
            root: styles['model_select_content_select'],
          }}
          // 自定义下拉项渲染函数
          popupRender={popupRender}
        ></Select>
      </div>
      <div className={styles['model_select_content_parameter']}>参数配置</div>
      <div className={styles['model_select_parameter_content']}>暂无数据</div>
    </div>
  )
})
export default ModelSelect

