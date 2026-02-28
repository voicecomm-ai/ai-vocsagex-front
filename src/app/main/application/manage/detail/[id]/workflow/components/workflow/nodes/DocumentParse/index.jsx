/* eslint-disable @next/next/no-img-element */
/**
 * 文档解析节点组件
 * 用于工作流中的文档解析节点展示和交互
 * 支持节点标题编辑、上游变量显示、节点连接等功能
 */
import React, { useState, useRef, useEffect } from 'react'
import styles from '../node.module.css'
import docStyles from './docParse.module.css'
import { message,Typography } from 'antd'
const { Text } = Typography;
import { useReactFlow } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import Operator from '../../components/Operator'
import { useStore } from '@/store/index'
import { useNodesInteractions, useNodeData } from '../../hooks'
import debounce from 'lodash/debounce'
import { NodeSourceHandle, NodeTargetHandle } from "../../node-handle"
import { useNode } from '../../../hooks'

// 防抖延迟时间（毫秒）
const DEBOUNCE_DELAY = 100

/**
 * 文档解析节点组件
 * @param {Object} props - 组件属性
 * @param {string|Object} props.id - 节点ID
 * @param {Object} props.data - 节点数据对象，包含title、type、desc、inputItem等属性
 * @param {boolean} props.selected - 节点是否被选中
 * @param {string} props.type - 节点类型
 */
const DocumentParsingNode = ({ id, data, selected, type }) => {
  // 节点交互相关hooks
  const { updateNodeDetail, isNodeConnected } = useNodesInteractions()
  const { getUpstreamVariables } = useNodeData()
  const { getNodeIcon } = useNode()
  // 本地状态管理
  const [isFocus, setIsFocus] = useState(false) // 鼠标悬停状态
  const [docInput, setDocInput] = useState(null) // 上游文档输入变量信息

  // 从全局store获取状态和方法
  const { 
    setPanelVisible, 
    readOnly, 
    setPannerNode, 
    setRunVisible, 
    pannerNode,
    changeId 
  } = useStore(state => state)

  /**
   * 更新节点详情的防抖函数
   * 使用防抖避免频繁更新，提升性能
   */
  const updateNodeDetailEvent = useRef(
    debounce(async (nodeData) => {
      const newData = {
        nodeId: id,
        data: { ...nodeData, id: id.id },
      }
      updateNodeDetail(newData)
    }, DEBOUNCE_DELAY)
  ).current

  /**
   * 节点点击事件处理
   * 点击节点时打开侧边面板并设置当前节点信息
   */
  const onNodeClick = () => {
    setRunVisible(false)
    setPanelVisible(true)
    setPannerNode({ id, data, type })
  }

  /**
   * 鼠标进入节点区域
   */
  const handleMouseEnter = () => {
    setIsFocus(true)
  }

  /**
   * 鼠标离开节点区域
   */
  const handleMouseLeave = () => {
    setIsFocus(false)
  }

  /**
   * 监听上游变量变化
   * 当节点配置了inputItem且已连接上游节点时，查找并设置对应的文档输入变量
   */
  useEffect(() => {
    const upstreamVariables = getUpstreamVariables(id)
    const isConnected = isNodeConnected(id, 'target')
    
    // 如果配置了输入项且节点已连接，查找对应的上游变量
    if (data.inputItem && isConnected) {
      const upstreamNode = upstreamVariables.find(
        node => node.nodeId === data.inputItem.nodeId
      )
      
      if (upstreamNode && upstreamNode.children?.length) {
        const matchedVariable = upstreamNode.children.find(
          child => child.variable === data.inputItem.variable
        )
        setDocInput(matchedVariable || null)
      } else {
        setDocInput(null)
      }
    } else {
      // 未配置输入项或未连接时，清空文档输入
      setDocInput(null)
    }
  }, [data, changeId, id, getUpstreamVariables, isNodeConnected])

  // 判断当前节点是否被选中
  const isSelected = pannerNode && pannerNode.id === id
  
  // 判断是否显示操作按钮（选中或悬停时显示，且非只读模式）
  const shouldShowActions = (isSelected || isFocus) && !readOnly

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`${styles['custom_node']} ${docStyles['doc_parse_node']} ${
        isSelected ? styles['selected_node'] : ''
      }`}
    >
      {/* 节点主要内容区域 */}
      <div
        onClick={onNodeClick}
        className={styles['custom_node_content']}
      >
        {/* 节点头部：图标、标题、操作按钮 */}
        <div className={styles['custom_node_header']}>
          {/* 节点类型图标 */}
          <img
            className={styles['custom_node_header_icon']}
            src={`/workflow/${data.type}.png`}
            alt={`${data.type}节点图标`}
          />

          {/* 节点标题 */}
          <div className={styles['custom_node_header_title']}>
            <Text style={{maxWidth: 110}} ellipsis={{ tooltip: data.title }}>
              <span style={{fontSize: 16,fontWeight: '600',color: "#101A28"}}> {data.title}</span></Text>
            </div>
          <div className={styles["custom_node_header_type"]}>工具核心</div>
          {/* 操作按钮：仅在选中或悬停时显示 */}
          {shouldShowActions && (
            <div
              className={styles['custom_node_actions']}
              onClick={e => e.stopPropagation()}
            >
              <Operator id={id} />
            </div>
          )}
        </div>

        {/* 上游文档输入变量信息展示 */}
        {docInput && (
          <div className={docStyles['doc_parse_node_variable_content']}>
            <div className={docStyles['doc_parse_node_variable_item']}>
              <div className={styles['start_panel_variable_item_left']}>
                {/* 上游节点类型图标 */}
                <img
                  className={styles['start_panel_variable_item_left_icon_img']}
                  src={getNodeIcon(docInput.nodeType, docInput.nodeId)}
                  alt={`${docInput.nodeType}节点图标`}
                />

                {/* 变量名称信息 */}
                <div className={styles['start_panel_variable_item_left_content']}>
                  <div className={docStyles['start_panel_variable_name']}>
                   
                    <Text style={{ maxWidth: 100 }} ellipsis={{ tooltip: docInput.nodeName }}>
                        <span className={docStyles['doc_parse_node_variable_item_name_text']} style={{ color: "#666E82" }}>{docInput.nodeName}</span>
                      </Text>
                      <span className={docStyles['doc_parse_node_variable_item_name_text']}>/
                    </span>
                    <span className={docStyles['doc_parse_node_variable_item_name_text_color']}>
                      {`{{${docInput.variable_name}}}`}
                    </span>
                  </div>
                </div>

              
              </div>
                {/* 变量类型标签 */}
                <div className={docStyles['doc_parse_node_variable_item_right']}>
                  {docInput.variable_type.toUpperCase()}
                </div>
            </div>
          </div>
        )}

        {/* 节点描述信息 */}
        {data.desc && (
          <div className={styles['custom_node_desc']}>
            {data.desc}
          </div>
        )}
      </div>

      {/* 节点连接点：目标连接点（输入） */}
      <NodeTargetHandle id={id} isFocus={isFocus} nodeId={id} />
      
      {/* 节点连接点：源连接点（输出） */}
      <NodeSourceHandle id={id} isFocus={isFocus} nodeId={id} />
    </div>
  )
}

export default DocumentParsingNode

