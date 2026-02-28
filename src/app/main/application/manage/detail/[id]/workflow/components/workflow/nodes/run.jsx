'use client'

import React, { useState, forwardRef, useImperativeHandle, useRef, useEffect } from 'react'
import { Button, Drawer, Form, Cascader, Radio, Input, Tree, ConfigProvider } from 'antd'
import { message } from 'antd'
import styles from './node.module.css'
import { useStore } from '@/store/index'
import {getUuid} from '@/utils/utils'

import StartRun from './start/run'
import DocParseRun from './DocumentParse/run'
import CodeRun from './CodeExtractor/CodeRun/index'
import KnowledgeRetrievalRun from './KnowledgeRetrieval/run'
import LlmRun from './Llm/Run/run'
import IntentionClassificationRun from './IntentionClassification/run'
import ApiRequestRun from './ApiRequest/Run/run'
import IfElseRun from './IfElse/Run/run'
import ParameterExtractorRun from './parameterExtraction/Run/run'
import McpRun from './mcp/run'
import LoopRun from './loop/Run/run'
import CodeExtractorRun from './CodeExtractor/Run/run'
import VariableAggregatorRun from './variable-aggregator/run'
import IterationRun from './iteration/run/index'
import WorkflowRun from './workflow/run'
import AgentRun from './agent/run'
const { TextArea } = Input
const NodeRun = forwardRef((props, ref) => {
  const { runVisible, setRunVisible, pannerNode } = useStore(state => state)
  useImperativeHandle(ref, () => ({
    showModal,
    hideModal,
    runAndInputVars,
  }))
  const [open, setOpen] = useState(true)
  const formRef = useRef(null)
  const [title, setTitle] = useState('创建角色') //标题
  const [data, setData] = useState({}) //数据
  const [loading, setLoading] = useState(false) //加载中
  const [action, setAction] = useState('add') //操作类型 add 新增 edit 编辑
  const [nodeData, setNodeData] = useState({}) //选中的节点数据
  const [modalKey, setModalKey] = useState(0)
  const showModal = async (obj, type, selectDepartment) => {
    setLoading(true)
    setOpen(true)
  }
  useEffect(() => {
    if (pannerNode && runVisible) {
      setNodeData(pannerNode)
      setModalKey(getUuid())
    }
  }, [pannerNode, runVisible])
  //弹框 className
  const classNames = {
    footer: styles['node-drawer-footer'],
    content: styles['node-drawer-content'],
    header: styles['node-drawer-header'],
    body: styles['test-drawer-body'],
  }
  //关闭事件
  const hideModal = () => {
    setPanelVisible(false)
  }

  return (
    <div>
      <Drawer
        maskClosable={false}
        closable
        title={null}
        placement='right'
        open={runVisible}
        mask={false}
        destroyOnHidden={true}
        rootStyle={{ boxShadow: 'none', position: 'absolute', right: 12 }}
        width={480}
     
        getContainer={() => document.getElementById('workflow_page')}
        classNames={classNames}
      >
        <div className={styles['panel_run_content']}>
          {nodeData.type == 'start' ? <StartRun     key={modalKey}setRunVisible={setRunVisible} /> : null}
          {nodeData.type == 'document-extractor' ? <DocParseRun key={modalKey} setRunVisible={setRunVisible} /> : null}
          {nodeData.type == 'code' ? <CodeExtractorRun key={modalKey} setRunVisible={setRunVisible} /> : null}
          {nodeData.type === 'knowledge-retrieval' ? <KnowledgeRetrievalRun key={modalKey} setRunVisible={setRunVisible} /> : null}
          {nodeData.type === 'question-classifier' ? (
            <IntentionClassificationRun key={modalKey} setRunVisible={setRunVisible} />
          ) : null}
          {nodeData.type === 'llm' ? <LlmRun key={modalKey} setRunVisible={setRunVisible} /> : null}
          {nodeData.type === 'if-else' ? <IfElseRun key={modalKey}  setRunVisible={setRunVisible} /> : null}
          {nodeData.type === 'http-request' ? <ApiRequestRun key={modalKey}  setRunVisible={setRunVisible} /> : null}
          {nodeData.type === 'parameter-extractor' ? <ParameterExtractorRun key={modalKey}  setRunVisible={setRunVisible} /> : null}
          {nodeData.type === 'mcp' ? <McpRun key={modalKey}  setRunVisible={setRunVisible} /> : null}
          {nodeData.type === 'loop' ? <LoopRun key={modalKey}  setRunVisible={setRunVisible} /> : null}
          {nodeData.type === 'variable-aggregator' ? <VariableAggregatorRun key={modalKey}  setRunVisible={setRunVisible} /> : null}
          {nodeData.type === 'iteration' ? <IterationRun key={modalKey}  setRunVisible={setRunVisible} /> : null}
          {nodeData.type === 'workflow' ? <WorkflowRun key={modalKey}  setRunVisible={setRunVisible} /> : null}
          {nodeData.type === 'agent' ? <AgentRun key={modalKey}  setRunVisible={setRunVisible} /> : null}
        </div>
      </Drawer>
    </div>
  )
})

export default NodeRun

