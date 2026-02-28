'use client'

import React, { useState, forwardRef, useImperativeHandle, useRef, useEffect } from 'react'
import { Button, Spin, Form, InputNumber, Select, Input, Tree, ConfigProvider } from 'antd'
import { message } from 'antd'
// import styles from './test.module.css'
import styles from '../node.module.css'
import docStyles from './docParse.module.css'
const { TextArea } = Input
import { useStoreApi, useReactFlow } from '@xyflow/react'
import SingleFile from '../../../test/SingleFile'
import { debounce } from 'lodash'
import { useStore } from '@/store/index'

const TestInput = forwardRef((props, ref) => {
  const reactFlowInstance = useReactFlow()
  const [variable, setVariable] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fileLoading, setFileLoading] = useState(false)

  const { setPanelVisible, setPannerNode, runVisible } = useStore(state => state)
  const formRef = useRef(null)
  useImperativeHandle(ref, () => ({
    closeLoading,
    clearFormEvent,
    initFun,
  }))

  useEffect(() => {
    if (props.variable) {
      console.log(props.variable, 'props.variable')
      setVariable(props.variable)
    }
  }, [props.variable])
  // console.log(props.variable, 'props.variable')

  const closeLoading = () => {
    setLoading(false)
  }
  //初始化
  const initFun = () => {}

  const runClickEvent = async () => {
    let value = await formRef.current.validateFields()
    let fieldSet = await formRef.current.getFieldsValue(true)
    let inputs = {
      files: null,
    }
    for (const key in fieldSet) {
      if (Object.prototype.hasOwnProperty.call(fieldSet, key)) {
        if (fieldSet[key] && (Array.isArray(fieldSet[key]) ? fieldSet[key].length > 0 : true)) {
          inputs['files'] = fieldSet[key]
        }
      }
    }

    setLoading(true)
    props.runSingeNodeEvent(inputs)
  }
  const clearFormEvent = () => {
    formRef.current.resetFields()
  }
  // console.log(variable == null && fileLoading, variable == null, variable, fileLoading)

  return (
    <div className={docStyles['test_input']}>
      <Spin spinning={loading}>
        {variable && (
          <Form
            layout={'vertical'}
            ref={formRef}
          >
            {variable.variable_type === 'file' && (
              <Form.Item
                label=''
                name={variable.variable_name}
                rules={[{ required: true, message: '请上传', type: 'array' }]}
              >
                <SingleFile
                  fileLoadingChange={loading => {
                    setFileLoading(loading)
                  }}
                  item={variable}
                  fileChange={file => {
                    formRef.current.setFieldsValue({
                      [variable.variable_name]: file,
                    })
                  }}
                />
              </Form.Item>
            )}

            {variable.variable_type === 'array[file]' && (
              <Form.Item
                label=''
                name={variable.variable_name}
                rules={[{ required: true, message: '请上传', type: 'array' }]}
              >
                <SingleFile
                  fileLoadingChange={loading => {
                    setFileLoading(loading)
                  }}
                  item={variable}
                  fileChange={file => {
                    formRef.current.setFieldsValue({
                      [variable.variable_name]: file,
                    })
                  }}
                />
              </Form.Item>
            )}
          </Form>
        )}
      </Spin>
      <div className={docStyles['test_input_btns']}>
        <Button
          disabled={variable == null || fileLoading}
          loading={loading}
          onClick={runClickEvent}
          type='primary'
          className={docStyles['test_input_btn']}
        >
             {fileLoading || loading ?"": <img className={docStyles["test_input_btn_img"]} src="/find/find_run.png" alt="运行" />}
             {loading ? "运行中..." : "运行"}
        </Button>
      </div>
    </div>
  )
})

export default TestInput
