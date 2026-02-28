'use client'

import React, { useState, forwardRef, useImperativeHandle, useRef, useEffect } from 'react'
import { Button, Spin, Form, InputNumber, Select, Input, Tree, ConfigProvider } from 'antd'
import { message } from 'antd'
import styles from './test.module.css'
const { TextArea } = Input
import { useStoreApi, useReactFlow } from '@xyflow/react'
import SingleFile from './SingleFile'
import { debounce } from 'lodash'
import { useStore } from '@/store/index'
import { getUuid } from '@/utils/utils'

const TestInput = forwardRef((props, ref) => {
  const reactFlowInstance = useReactFlow()
  const [variables, setVariables] = useState([])
  const [loading, setLoading] = useState(false)
  const [fileLoading, setFileLoading] = useState(false)
  const [fileKey, setFileKey] = useState(0)

  const { setPanelVisible, setPannerNode, runVisible,changeId,changeNodeType } = useStore(state => state)
  const formRef = useRef(null)
  useImperativeHandle(ref, () => ({
    closeLoading,
    clearFormEvent,
    initFun,
  }))

  useEffect(() => {
    if(props.variables && props.variables.length > 0){//如果llm节点有变量，则使用llm节点变量
      setVariables(props.variables)
    }else{
      getStartNodeVariables()
    }
  }, [])

  useEffect(() => {
    if(props.isRun){
      setLoading(props.isRun);
    }
  }, [props.isRun])


  useEffect(() => {
    if(changeNodeType == 'start'){
      initFun();
    }
  }, [changeId,changeNodeType]);
  const closeLoading = () => {
    setLoading(false)
  }
  //初始化
  const initFun = () => {
    setLoading(false);
    getStartNodeVariables()
    setFileLoading(false);
  }
  //获取当前开始节点变量
  const getStartNodeVariables = () => {
    let arr = []
    let nodeData = _.cloneDeep(reactFlowInstance.getNodes())
  

    const startNode = nodeData.find(node => node.type == 'start')
    if (startNode) {
      arr = startNode.data.variables
    }
    console.log(arr, 'arr')
    setVariables(arr)
    setFileKey(getUuid())
  }

  const runClickEvent = async () => {
    let value = await formRef.current.validateFields()
    let fieldSet = await formRef.current.getFieldsValue(true)
    let inputs = {}
    for (const key in fieldSet) {
      if (Object.prototype.hasOwnProperty.call(fieldSet, key)) {
        if (fieldSet[key] && (Array.isArray(fieldSet[key]) ? fieldSet[key].length > 0 : true)) {
          inputs[key] = fieldSet[key]
        }
      }
    }

    setLoading(true)
    props.runSingeNodeEvent(inputs)
  }
  const clearFormEvent = () => {
    formRef.current.resetFields()
  }

  return (
    <div className={styles['test_input']}>
      <Spin spinning={loading}>
        <Form
          layout={'vertical'}
          ref={formRef}
        >
          {variables &&
            variables.map((item, index) => (
              <div key={index}>
                {item.type === 'text-input' && (
                  <Form.Item
                    label={item.label}
                    name={item.variable}
                    rules={[{ required: item.required, message: '请输入' + item.label }]}
                  >
                    <Input
                       variant='filled'
                      placeholder='请输入'
                      maxLength={item.max_length}
                      className='run_input_input'
                    />
                  </Form.Item>
                )}
                {item.type === 'paragraph' && (
                  <Form.Item
                    label={item.label}
                    name={item.variable}
                    rules={[{ required: item.required, message: '请输入' + item.label }]}
                  >
                    <TextArea
                      variant='filled'
                      autoSize={{ minRows: 2, maxRows: 11 }}
                      showCount
                      placeholder='请输入'
                      maxLength={item.max_length}
                       className='run_input_input'
                    />
                  </Form.Item>
                )}
                {item.type === 'number' && (
                  // 数字类型通常用数字输入框，而不是选择框，这里修改为 Input.Number
                  <Form.Item
                    label={item.label}
                    name={item.variable}
                    rules={[{ required: item.required, message: '请输入' + item.label }]}
                  >
                    <InputNumber
                      variant='filled'
                      style={{ width: '100%' }}
                      placeholder='请输入'
                       className='run_input_input'
                    />
                  </Form.Item>
                )}
                {item.type === 'select' && (
                  <Form.Item
                    label={item.label}
                    name={item.variable}
                    rules={[{ required: item.required, message: '请选择' + item.label }]}
                  >
                    <Select
                      variant='filled'
                      options={item.options.map(option => ({ value: option, label: option }))}
                      placeholder='请选择'
                    />
                  </Form.Item>
                )}
                {item.type === 'file' && (
                  // 数字类型通常用数字输入框，而不是选择框，这里修改为 Input.Number
                  <Form.Item
                    label=''
                    name={item.variable}
                    rules={[{ required: item.required, message: '请上传' + item.label }]}
                  >
                    <SingleFile
                      fileLoadingChange={loading => {
                        setFileLoading(loading)
                      }}
                      key={fileKey}
                      item={item}
                      fileChange={file => {
                        formRef.current.setFieldsValue({
                          [item.variable]: file[0],
                        })
                      }}
                    />
                  </Form.Item>
                )}
                {item.type === 'file-list' && (
                  // 数字类型通常用数字输入框，而不是选择框，这里修改为 Input.Number
                  <Form.Item
                    label=''
                    name={item.variable}
                    rules={[{ required: item.required, message: '请上传' + item.label, type: 'array' }]}
                  >
                    <SingleFile
                      fileLoadingChange={loading => {
                        setFileLoading(loading)
                      }}
                      key={fileKey}
                      item={item}
                      fileChange={file => {
                        formRef.current.setFieldsValue({
                          [item.variable]: file,
                        })
                      }}
                    />
                  </Form.Item>
                )}
              </div>
            ))}
        </Form>
      </Spin>
      <div className={styles['test_input_btns']}>

        <Button
          disabled={fileLoading}
          loading={loading}
          onClick={runClickEvent}
          type='primary'
          className={styles['test_input_btn']}
        >
             {loading || fileLoading ?"": <img className={styles["test_input_btn_img"]} src="/find/find_run.png" alt="运行" />}
             {loading? "运行中..." : "运行"}
    
        </Button>
      </div>
    </div>
  )
})

export default TestInput

