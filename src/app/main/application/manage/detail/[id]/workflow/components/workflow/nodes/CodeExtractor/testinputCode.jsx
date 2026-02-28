'use client'

import React, { useState, forwardRef, useImperativeHandle, useRef, useEffect } from 'react'
import { Button, Spin, Form, InputNumber, Select, Input, Tree, ConfigProvider } from 'antd'
import { message } from 'antd'
// import styles from './test.module.css'
import styles from '../node.module.css'
import docStyles from '../DocumentParse/docParse.module.css'
const { TextArea } = Input
import { useStoreApi, useReactFlow } from '@xyflow/react'
// import SingleFile from './singlefile'
import SingleFile from '../../../test/SingleFile'
import { debounce } from 'lodash'
import { useStore } from '@/store/index'
import JsonEditor from './JsonEditor'

const TestInput = forwardRef((props, ref) => {
  const reactFlowInstance = useReactFlow()
  const [variables, setVariables] = useState([])
  const [loading, setLoading] = useState(false)
  const [fileLoading, setFileLoading] = useState(false)
  const jsonEditorRef = useRef(null)
    const [jsonError, setJsonError] = useState(false);
  const { setPanelVisible, setPannerNode, runVisible } = useStore(state => state)
  const formRef = useRef(null)
  useImperativeHandle(ref, () => ({
    closeLoading,
    clearFormEvent,
    onJSONError,
    onChangeContextJSON
  }))

  useEffect(() => {
    // getStartNodeVariables()
    if (props.variables) {
      setVariables(props.variables)
    }
  }, [props.variables])

   const onJSONError = (error) => {
      if (error) {
        message.error("json格式错误");
      }
      setJsonError(error);
    };

     const jsonChangeEvent = (value, key) => {
    formRef.current.setFieldsValue({
      [key]: value,
    });
  };

   const handleFullscreen = (data, title, key) => {
    props.handleFullscreen(data, title, key);
  };

  //上下文JSON改变事件
  const onChangeContextJSON = (value) => {
    formRef.current.setFieldsValue({
      context: value,
    });
    // setContextJSON(value);
    jsonEditorRef.current.setContent(value);
  };

  const closeLoading = () => {
    setLoading(false)
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
    <div
      className={docStyles['test_input']}
      style={{ padding: '0 20px' }}
    >
      <Spin spinning={loading}>
        <Form
          layout={'vertical'}
          ref={formRef}
        >
          {variables &&
            variables.length !==0 &&
            variables.map((item, index) => (
              
           item.infos &&   <div key={index}>
                {item.infos[0].type === 'text-input' && (
                  <Form.Item
                    label={item.variable}
                    name={item.variable}
                    rules={[{ required: true, message: '请输入' + item.variable }]}
                  >
                    <Input
                      variant='filled'
                      placeholder='请输入'
                    />
                  </Form.Item>
                )}
                {item.infos[0].type === 'paragraph' && (
                  <Form.Item
                    label={item.variable}
                    name={item.variable}
                    rules={[{ required: true, message: '请输入' + item.variable }]}
                  >
                    <TextArea
                      variant='filled'
                      autoSize={{ minRows: 2, maxRows: 11 }}
                      showCount
                      placeholder='请输入'
                    />
                  </Form.Item>
                )}
                {item.infos[0].type === 'select' && (
                  <Form.Item
                    label={item.variable}
                    name={item.variable}
                    rules={[{ required: true, message: '请选择' + item.variable }]}
                  >
                    <Select
                      variant='filled'
                      options={item.infos[0].options.map(option => ({ value: option, label: option }))}
                      placeholder='请选择'
                    />
                  </Form.Item>
                )}
                {item.infos[0].type === 'number' && (
                  // 数字类型通常用数字输入框，而不是选择框，这里修改为 Input.Number
                  <Form.Item
                    label={item.variable}
                    name={item.variable}
                    rules={[{ required: true, message: '请输入' + item.variable }]}
                  >
                    <InputNumber
                      variant='filled'
                      style={{ width: '100%' }}
                      placeholder='请输入'
                    />
                  </Form.Item>
                )}
                {item.infos[0].type === 'file-list' && (
                  <Form.Item
                    // label={item.variable}
                    name={item.variable}
                    rules={[{ required: true, message: '请上传' + item.variable, type: 'array' }]}
                  >
                    <SingleFile
                      fileLoadingChange={loading => {
                        setFileLoading(loading)
                      }}
                      item={item.infos[0]}
                      fileChange={file => {
                        formRef.current.setFieldsValue({
                          [item.variable]: file,
                        })
                      }}
                    />
                  </Form.Item>
                )}
                {item.infos[0].type === "code" && (
                                  <Form.Item name={item.variable} label={item.variable}    rules={[{ required: true, message: '请输入' + item.variable }]}>
                                    <JsonEditor
                                      onError={(error) => onJSONError(error, item.variable)}
                                      onChange={(value) => jsonChangeEvent(value, item.variable)}
                                      handleFullscreen={(data, title) =>
                                        handleFullscreen(data, title, item.variable)
                                      }
                                      title='输入'
                                      content={formRef.current?.getFieldValue(item.variable) || {}}
                                      ref={jsonEditorRef}
                                    />
                                  </Form.Item>
                                )}
              </div>
            ))}
        </Form>
      </Spin>
      <div className={docStyles['test_input_btns']}>
        <Button
          disabled={fileLoading || loading}
          loading={loading}
          onClick={runClickEvent}
          type='primary'
          className={docStyles['test_input_btn']}
        >
          {fileLoading || loading ? '运行中' : '开始运行'}
        </Button>
      </div>
    </div>
  )
})

export default TestInput
