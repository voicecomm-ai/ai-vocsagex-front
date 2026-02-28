/* eslint-disable @next/next/no-img-element */
'use client'

import React, { useState, forwardRef, useImperativeHandle, useRef, useEffect } from 'react'
import {
  Button,
  Drawer,
  Form,
  TabPane,
  Cascader,
  Radio,
  InputNumber,
  Spin,
  Input,
  Tree,
  Tabs,
  ConfigProvider,
  Typography,
} from 'antd'
import { message, Divider } from 'antd'
import { useParams } from 'next/navigation'
import styles from '../../node.module.css'
import docStyles from '../../DocumentParse/docParse.module.css'
import codeStyles from '../runCode.module.css'
import TabItem from '../TabItem'

// import Variable from '../../../Dialog/Variable'
import { useStore } from '@/store/index'
import { useNodesInteractions, useNodeData } from '../../../hooks'
const { TextArea } = Input
// import SingleFile from '../../../test/SingleFile'
import { runNode, getLastRunResult } from '@/api/workflow'
import JsonEditorPage from '../../../../test/JsonEditorPage'
import TestInput from '../testinputCode'
import RunStatus from "../../../../test/RunStatus";
import { useRun } from '../../../hooks/use-run'
const CodeRun = forwardRef((props, ref) => {
  const { id } = useParams()
  const { Paragraph, Text } = Typography
  useImperativeHandle(ref, () => ({
    hideModal,
  }))
  const { getNodeById } = useNodeData()
  const { runVisible, setRunVisible, pannerNode, codeInputsData, setPannerNode } = useStore(state => state)
  const { getNodeVariables } = useRun()
  const [open, setOpen] = useState(false)
  const [fileLoading, setFileLoading] = useState(false)
  const formRef = useRef(null)
  const [tabKey, setTabKey] = useState('1') //输入
  const [data, setData] = useState({}) //数据
  const [loading, setLoading] = useState(false) //加载中
  const [isEditing, setIsEditing] = useState(false) //是否编辑
  const variableRef = useRef(null)
  const [isHovered, setIsHovered] = useState(false)
  const [selectVariable, setSelectVariable] = useState({})
  const [variables, setVariables] = useState([])
  const testInputRef = useRef(null)
  const [runData, setRunData] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [fullscreenData, setFullscreenData] = useState({})
  const [fullscreenTitle, setFullscreenTitle] = useState('')
  const [tabsKey, setTabsKey] = useState('input')
  const [form] = Form.useForm()
  const items = [
    {
      key: 'input',
      label: '输入',
      children: <div>输入</div>,
    },
    {
      key: 'detail',
      label: '详情',
    },
  ]
  const singleItems = [
    {
      key: 'input',
      label: '输入',
      children: <div>输入</div>,
    },
  ]
  const [tabItems, setTabItems] = useState([
    {
      key: '1',
      label: '输入',
    },
    // {
    //   key: '2',
    //   label: '详情',
    // },
  ])
  const runStatus = {
    succeeded: 'SUCCESS',
    failed: 'FAILED',
    running: 'RUNNING',
  }
  useEffect(() => {
    if (pannerNode && runVisible) {
      getLastRunResultEvent(pannerNode.id)
      let nodeData = getNodeById(pannerNode.id)
      if (nodeData.data.runInputs) {
        getNodeVariablesEvent(nodeData.data.runInputs)
      }
      setData(nodeData.data)
    }
  }, [getNodeById, pannerNode, runVisible])

  // console.log(variables, 'variables')
 
   //获取运行所需要的变量列表
   const getNodeVariablesEvent = (runInputs) => {
    let arr =[];
    runInputs.forEach(input=>{
      let addData ={
         label:input.variable,
         variable_type:input.value_type,
         value_selector:input.value_selector,
      }
      arr.push(addData)
    })
    let variableArr = getNodeVariables(arr,pannerNode.id);
    console.log(variableArr, 'variableArr')
    setVariables(variableArr)
   }

  //关闭事件
  const hideModal = () => {
    setOpen(false)
  }

  const closePanelEvent = () => {
    setPannerNode(null)
    setRunVisible(false)
  }

  const runSingeNodeEvent = async value => {
    let runData = {
      app_id: id,
      node_id: pannerNode.id,
      user_inputs: value,
    }
    setLoading(true)
    setRunData({
      status: 'running',
    })

    runNode(runData)
      .then(res => {
        let runObj = res.data
        setRunData(runObj)
        setLoading(false)
        // console.log(runObj, 'runObj')
        // setTabsKey('detail')

        if (tabItems.length === 1) {
          setTabItems([
            ...tabItems,
            {
              key: '2',
              label: '详情',
            },
          ])
        }
        setTabKey('2')

        testInputRef.current.closeLoading()
      })
      .catch(() => {
        setLoading(false)
        testInputRef.current.closeLoading()
      })
  }

  // 获取上一次运行结果
  const getLastRunResultEvent = async nodeId => {
    getLastRunResult({
      app_id: id,
      node_id: nodeId,
    }).then(res => {
      let runObj = res.data
      setRunData(runObj)
      let tabs = tabItems
      if (runObj) {
        setTabItems([
          ...tabItems,
          {
            key: '2',
            label: '详情',
          },
        ])
      } else {
       !tabItems.length  && setTabItems([
          ...tabItems,
          {
            key: '1',
            label: '输入',
          },
        ])
      }
    })
  }
  const handleFullscreen = (data, title) => {
    setIsFullscreen(!isFullscreen)
    setFullscreenData(data)
    setFullscreenTitle(title)
  }

  // 标签点击事件
  const handleTabClick = key => {
    setTabKey(key)
  }

  return (
    <div className={styles['start_run_panel_main']}>
      <div className={styles['panel_run_header']}>
        <div className={styles['panel_main_header_top']}>
          <div className={styles['panel_main_header_left']}>
            {data.type && (
              <img
                className={styles['panel_main_header_left_icon']}
                src={`/workflow/${data.type}.png`}
                alt=''
              />
            )}

            <div className={styles['panel_main_header_left_title']}>
              <Text
                style={{ maxWidth: 100 }}
                ellipsis={{ tooltip: data.title }}
              >
                {data.title}
              </Text>
            </div>
          </div>

          <div className={styles['panel_run_header_right']}>
             <RunStatus runData={runData} />

            <img
              onClick={closePanelEvent}
              className={styles['panel_close']}
              src='/close.png'
              alt=''
            />
          </div>
        </div>
      </div>
      <div style={{ height: 'calc(100% - 76px)' }}>
        {
          runData && <div className={docStyles['test_container_tab']}>
          {tabItems.map(item => (
            <TabItem
              key={item.key}
              item={item}
              isActive={item.key === tabKey}
              onClick={handleTabClick}
            />
          ))}
        </div>
        }
        
        {variables && (
          <div style={{ display: tabKey === '1' ? 'block' : 'none' }}>
            <TestInput
              ref={testInputRef}
              variables={variables}
              handleFullscreen={handleFullscreen}
              runSingeNodeEvent={runSingeNodeEvent}
            />
          </div>
        )}
        {tabKey === '2' && runData && (
          <div style={{ height: 'calc(100% - 50px)', paddingTop: '8px' }}>
            <div className={codeStyles['run_panel_content']}>
              {runData && (
                <>
                  {runData.status === 'failed' && (
                    <div className={styles['run_error_status_content']}>
                      <img
                        className={styles['run_status_img']}
                        src={`/workflow/run/error.png`}
                        alt=''
                      ></img>
                      <span>{runData.error}</span>
                    </div>
                  )}
                  {runData.status != 'running' && (
                    <div className={styles['run_panel_result']}>
                      <JsonEditorPage
                        handleFullscreen={handleFullscreen}
                        isFullscreen={isFullscreen}
                        title='输入'
                        content={runData.inputs}
                      />
                      <JsonEditorPage
                        handleFullscreen={handleFullscreen}
                        isFullscreen={isFullscreen}
                        title='输出'
                        content={runData.outputs}
                      />

                      <div className={styles['run_panel_footer']}>
                        <div className={styles['run_panel_footer_item']}>
                          <div className={styles['run_panel_footer_item_left']}>状态：</div>
                          <div className={styles['run_panel_footer_item_right']}>
                            {runStatus[runData.status] || runData.status}
                          </div>
                        </div>
                        <div className={styles['run_panel_footer_item']}>
                          <div className={styles['run_panel_footer_item_left']}>执行人：</div>

                          <div className={styles['run_panel_footer_item_right']}> {runData.executor_name}</div>
                        </div>
                        <div className={styles['run_panel_footer_item']}>
                          <div className={styles['run_panel_footer_item_left']}>开始时间：</div>
                          <div className={styles['run_panel_footer_item_right']}>{runData.createTime}</div>
                        </div>
                        <div className={styles['run_panel_footer_item']}>
                          <div className={styles['run_panel_footer_item_left']}>运行时间：</div>
                          <div className={styles['run_panel_footer_item_right']}>{runData.elapsed_time || 0} s</div>
                        </div>
                        <div className={styles['run_panel_footer_item']}>
                          <div className={styles['run_panel_footer_item_left']}>总token数：</div>
                          <div className={styles['run_panel_footer_item_right']}>0 Tokens</div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
         {isFullscreen && (
              <div className={styles.fullscreen_container}>
                <JsonEditorPage
                  handleFullscreen={handleFullscreen}
                  isFullscreen={isFullscreen}
                  title={fullscreenTitle}
                  content={fullscreenData}
                />
              </div>
            )}
      </div>
    </div>
  )
})

export default CodeRun
