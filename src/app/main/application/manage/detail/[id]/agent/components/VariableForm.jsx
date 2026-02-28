'use client'

import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect
} from "react";
import styles from "../page.module.css";
import {
  Button,
  Select,
  Form,
  Input,
  Space,
  Radio,
  Checkbox,
  Popover,
  Slider,
  Tag,
  Modal,
  InputNumber
} from 'antd';
import { useRouter, useParams } from 'next/navigation';
import{getAgentModelList,getSubAgentVariableList} from '@/api/agent'
import { getAgentVariableList } from '@/api/agent'
const { TextArea } = Input;

/**
 * 变量表单组件
 * 用于动态渲染智能体的变量输入表单
 * @param {Object} props - 组件属性
 * @param {Object} props.agentInfo - 智能体信息
 * @param {Function} props.updateChatFormHeight - 更新表单高度的回调
 * @param {Function} props.cancelConfirmAddVisible - 取消添加变量的回调
 * @param {Function} props.batchsaveVariable - 批量保存变量的回调
 * @param {number} props.chatWidth - 表单宽度
 * @param {Object} ref - 父组件引用
 */
const VariableForm = forwardRef((props, ref) => {
  const { id } = useParams();
  // 变量列表状态
  const [variableList, setVariableList] = useState([]);
  // 表单引用
  const formRef = useRef(null);
  // 表单容器引用，用于计算高度
  const formContentRef = useRef(null);
  // 应用ID状态
  const [appId, setAppId] = useState('');

  // 向父组件暴露方法
  useImperativeHandle(ref, () => ({
    validateFrom,
    updateChatForm,
    getAllValue
  }));
  
  /**
   * 获取变量表单的高度
   * 并通过回调函数通知父组件
   */
  const getFormHeight = () => {
    if (formContentRef.current) {
      const height = formContentRef.current.clientHeight;
      props.updateChatFormHeight(height);
    }
  }

  // 当变量列表变化时，重新计算表单高度
  useEffect(() => {
    getFormHeight();
  }, [variableList]);

  /**
   * 使用 ResizeObserver 监听表单容器尺寸变化
   * 当尺寸变化时更新高度
   */
  useEffect(() => {
    const ref = formContentRef.current;
    if (!ref) return;

    const observer = new ResizeObserver(() => {
      getFormHeight();
    });

    observer.observe(ref);

    // 清理函数
    return () => {
      observer.disconnect();
    };
  }, [formContentRef]);

  /**
   * 根据变量新增编辑更新变量表单
   */
  const updateChatForm = () => {
    getFormHeight();
    getVariableListEvent(appId);
  }

  /**
   * 表单验证事件
   * @returns {Promise<Object>} 验证通过的表单值
   */
  const validateFrom = async () => {
    let value = await formRef.current.validateFields();
    return value;
  }

  /**
   * 获取表单的所有值
   * @returns {Promise<Object>} 表单所有字段的值
   */
  const getAllValue = async () => {
    let value = await formRef.current.getFieldsValue(true);
    return value;
  }

  // 当智能体信息变化时，获取对应变量列表
  useEffect(() => {
    let agentType = props.agentInfo.agentType || 'single';
    setAppId(id);
    // 根据智能体类型获取不同的变量列表
    if (agentType === 'multiple') {
      getSubAgentVariableListEvent();
    } else {
      getVariableListEvent(id);
    }
  }, [props.agentInfo]);

  /**
   * 获取单个智能体的变量列表
   */
  const getVariableListEvent = async () => {
    getAgentVariableList(id).then((res) => {
      let data = res.data;
      handleFormUpdate(data);
    });
  }

  /**
   * 获取子智能体变量列表
   * 处理多个智能体的变量，为变量名添加应用ID前缀
   */
  const getSubAgentVariableListEvent = async () => {
    const params = {
      applicationId: id,
    };
    await getSubAgentVariableList(params).then((res) => {
      let data = res.data || [];
      let variableArr = [];
      data.forEach(item => {
        let variableList = item.variableList || [];
        variableList.forEach(variable => {
          // 为子智能体变量添加应用ID前缀，避免变量名冲突
          variable.name = variable.applicationId + '.' + variable.name;
          variableArr.push(variable);
        });
      });
      handleFormUpdate(variableArr);
    });
  };

  /**
   * 处理表单更新事件
   * @param {Array} data - 变量列表数据
   */
  const handleFormUpdate = async (data) => {
    let values = await getAllValue();
    // 取出当前表单所有字段和值
    const formValues = await formRef.current.getFieldsValue(true);
    // 转成数组方便查找
    let newValues = Object.entries(values).map(([label, value]) => ({ label, value }));
    
    // 1. 清理表单中存在但接口返回中不存在的字段的值
    const currentNames = data.map(item => item.name);
    Object.keys(formValues).forEach(fieldName => {
      if (!currentNames.includes(fieldName)) {
        formRef.current.setFieldValue(fieldName, undefined);
      }
    });
    
    // 2. 处理选项及值校验
    data.forEach((item) => {
      // 处理选择框选项
      item.selectOptionArr = item.selectOptions ? item.selectOptions.split(',') : [];
      // 检查是否存在已有的表单值
      if (newValues.length) {
        const findObj = newValues.find((item1) => item1.label === item.name);
        // 如果是选择框类型，检查值是否在选项中
        if (findObj && item.fieldType === 'select') {
          const findIndex = item.selectOptionArr.findIndex((select) => select === findObj.value);
          if (findIndex === -1) {
            // 值不在选项中，重置为null
            formRef.current.setFieldValue(item.name, null);
          }
        }
      }
    });

    // 3. 更新变量列表状态
    setVariableList(data);
  }

  /**
   * 取消事件
   */
  const cancelEvent = () => {
    props.cancelConfirmAddVisible();
  }

  /**
   * 保存点击事件
   */
  const saveEvent = () => {
    props.batchsaveVariable(variableList);
  }

  return (
    <div className={styles['variable_form_container']} style={{ width: props.chatWidth }} ref={formContentRef}>
      <Form layout="vertical" ref={formRef}>
        {variableList.map((item, index) => (
          <div key={index}>
            {/* 文本输入框类型 */}
            {item.fieldType === 'text' && (
              <Form.Item
                label={item.displayName}
                name={item.name}
                rules={[{ required: item.required, message: '请输入' + item.displayName }]}
              >
                <Input variant="filled" className={styles['variable_input']} placeholder='请输入' maxLength={item.maxLength} />
              </Form.Item>
            )}
            
            {/* 段落文本类型 */}
            {item.fieldType === 'paragraph' && (
              <Form.Item
                label={item.displayName}
                name={item.name}
                rules={[{ required: item.required, message: '请输入' + item.displayName }]}
              >
                <TextArea variant="filled" className={styles['variable_input_textarea']} autoSize={{ minRows: 2, maxRows: 11 }} showCount placeholder='请输入' maxLength={item.maxLength} />
              </Form.Item>
            )}
            
            {/* 数字输入框类型 */}
            {item.fieldType === 'number' && (
              <Form.Item
                label={item.displayName}
                name={item.name}
                rules={[{ required: item.required, message: '请输入' + item.displayName }]}
              >
                <InputNumber variant="filled" className={styles['variable_input']} style={{ width: '100%' }} placeholder='请输入' min={0} />
              </Form.Item>
            )}
            
            {/* 选择框类型 */}
            {item.fieldType === 'select' && (
              <Form.Item
                label={item.displayName}
                name={item.name}
                rules={[{ required: item.required, message: '请选择' + item.displayName }]}
              >
                <Select variant="borderless" style={{ width: '100%', backgroundColor: '#F5F9FC', height: '36px', borderRadius: '8px' }} options={item.selectOptionArr.map(option => ({ value: option, label: option }))} placeholder='请选择' />
              </Form.Item>
            )}
          </div>
        ))}
      </Form>
    </div>
  )
});

export default VariableForm;
