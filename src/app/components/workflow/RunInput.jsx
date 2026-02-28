'use client'

import React, { useState, forwardRef, useImperativeHandle, useRef, useEffect } from 'react'
import { Button, Spin, Form, InputNumber, Select, Input, message, ConfigProvider } from 'antd'
import styles from './run.module.css'
const { TextArea } = Input
import FileUpload from './FileUpload'
import { getUuid } from '@/utils/utils'

const RunInput = forwardRef((props, ref) => {
  const [variables, setVariables] = useState([])
  const [loading, setLoading] = useState(false)
  const [fileLoading, setFileLoading] = useState(false)
  const [fileKey, setFileKey] = useState(0)

  const formRef = useRef(null)
  useImperativeHandle(ref, () => ({
    closeLoading,
    clearFormEvent,
    initFun,
    getFormData,
  }))

  const closeLoading = () => {
    setLoading(false)
  }
  //初始化
  const initFun = (params) => {
    setLoading(false);
    setVariables(params)
    setFileKey(getUuid())
    setFileLoading(false);
  }

   //获取当前表单提交数据
   const getFormData = async () => {
   
    await formRef.current.validateFields()
    let fieldSet = await formRef.current.getFieldsValue(true)
    let inputs = {}
    for (const key in fieldSet) {
      if (Object.prototype.hasOwnProperty.call(fieldSet, key)) {
        if (fieldSet[key] && (Array.isArray(fieldSet[key]) ? fieldSet[key].length > 0 : true)) {
          inputs[key] = fieldSet[key]
        }
      }
    }
   
    return inputs;
   } 
  //清除表单提交数据
  const clearFormEvent = () => {
    formRef.current.resetFields()
  }

  return (
    <div className={styles['test_input']}>
      <ConfigProvider
        theme={{
          components: {
            Input: {
            
             
            },
            Select: {
              selectorBg: '#F5F9FC',
            },
          },
        }}>
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
                      className={styles['run_input_input']}
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
                      className={styles['run_input_input']}
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
                      className={styles['run_input_input']}
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
                   
                      options={item.options.map(option => ({ value: option, label: option }))}
                      placeholder='请选择'
                      style={{ height : '36px' }}
                      classNames={{ root: styles['run_input_select'] }}
                      variant='borderless'
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
                    <FileUpload
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
                    <FileUpload
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
      </ConfigProvider>
    </div>
  )
})

export default RunInput;

