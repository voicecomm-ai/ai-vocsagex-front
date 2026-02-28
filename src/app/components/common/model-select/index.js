import React, { useState, forwardRef, useImperativeHandle, useRef, useEffect } from 'react'
import styles from './index.module.css'
import { Select } from 'antd'


const ModelSelect = forwardRef((props, ref) => {
  const [modelList, setModelList] = useState([])
  const [modelInfo, setModelInfo] = useState(null)
  const [modelId, setModelId] = useState(null)
  useImperativeHandle(ref, () => ({
    
  }))

  //模型默认选中事件
  const modelDefaultSelectedEvent = (arr) => {
    let defaultModel = arr.find(item => item.id === props.modelId)
    if(defaultModel){
      setModelInfo(defaultModel)
      setModelId(defaultModel.id)
    }
    else{
      let model = props.model || null;
      setModelInfo(model?model:null )
      setModelId(model?model.id:null)
    
    }
  }

  //选择模型事件 弃用
  const selectChange = value => {
    let selectModel = modelList.find(item => item.id === value);

    setModelInfo(selectModel)
    props.updateModelSelect(selectModel)//更新到父级
  }

  //模型列表变化事件
  useEffect(() => {
    if(props.modelList&&props.modelList.length>0){   
    modelDefaultSelectedEvent(props.modelList);
    setModelList(props.modelList);
    }
  }, [props.modelList])
  
  //选择模型项事件
  const selectModelItem = (model) => {
    setModelInfo(model)
    setModelId(model.id)
    props.updateModelSelect(model)//更新到父级
  }

  //标签渲染事件
  const labelRender = props => {
    const { label, value } = props
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

  //下拉项渲染事件
  const popupRender = originalElement => {
    return (
      <div className={styles['model_select_popup_content']}>
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
                selectModelItem(model)
    
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

  //渲染组件
  return (
    <div className={styles['model_select_content']}>

        <Select
          disabled={props.disabled}
          value={modelId}
          labelRender={labelRender}
          onChange={selectChange}
          placeholder='请选择模型'
          fieldNames={{ label: 'name', value: 'id' }}
          options={modelList}
          style={{
            width: '100%',  
            border: '1px solid rgba(55,114,254,0.3)',
            height: '36px',
            background: 'rgba(55,114,254,0.06)',
            borderRadius: '8px!important',
          }}
          classNames={{
            root:styles['model_select_content_select'],
          }}
           variant='borderless'
          // 自定义下拉项渲染函数
          popupRender={popupRender}
        ></Select>
   
    </div>
  )
})

export default ModelSelect

