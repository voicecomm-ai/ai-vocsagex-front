'use client'

import React, { useState, forwardRef, useImperativeHandle, useRef, useEffect } from 'react'

import { Button, Drawer, Form, Cascader, Radio, Input, Tree, ConfigProvider, Upload, Typography, Spin } from 'antd'
import { message } from 'antd'
// import styles from './test.module.css'
import styles from '../node.module.css'
import docStyles from '../DocumentParse/docParse.module.css'
import { useStore } from '@/store/index'
import { uploadFile, uploadRemoteFile } from '@/api/workflow'
import { validateFile } from '@/utils/fileValidation'

// URL地址验证正则表达式
export const FILE_URL_REGEX = /^(https?|ftp):\/\//

const { TextArea } = Input

const SingleFile = forwardRef((props, ref) => {
  const { Paragraph, Text } = Typography
  const { Dragger } = Upload
  const [loading, setLoading] = useState(false)
  const [uploadType, setUploadType] = useState('local_file')
  const [fileType, setFileType] = useState('') //文件上传类型
  const uploadTypes = {
    local_file: '从本地上传',
    remote_url: '粘贴URL链接',
  }
  const options = [
    { label: '从本地上传', value: 'local_file' },
    { label: '粘贴URL链接', value: 'remote_url' },
  ]
  const [remote_url, setRemoteUrl] = useState('')
  useImperativeHandle(ref, () => ({}))
  const [accept, setAccept] = useState('')
  const fileTypeList = [
    {
      label: '文档',
      value: 'document',
      desc: [
        '.txt',
        '.md',
        '.mdx',
        '.markdown',
        '.pdf',
        '.html',
        '.xlsx',
        '.xls',
        '.doc',
        '.docx',
        '.csv',
        '.eml',
        '.msg',
        '.pptx',
        '.ppt',
        '.xml',
        '.epub',
      ],
    },
    {
      label: '图片',
      value: 'image',
      desc: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
    },
    {
      label: '音频',
      value: 'audio',
      desc: ['.mp3', '.m4a', '.wav', '.amr', '.mpga'],
    },
    {
      label: '视频',
      value: 'video',
      desc: ['.mp4', '.mov', '.mpeg', '.webm'],
    },
  ]
  const [fileList, setFileList] = useState([])
  //处理文件上传事件
  const beforeUploadEvent = info => {
    const file = info

    // 使用独立的验证函数
    const validation = validateFile(file, accept, fileList, props.item.max_length, props.item.type)
    if (!validation.isValid) {
      return Upload.LIST_IGNORE
    }
    let newFileList = []
    let addFile = new FormData()
    addFile.append('file', file)
    setLoading(true)
    props.fileLoadingChange(true)
    uploadFile(addFile)
      .then(res => {
        setLoading(false)
        props.fileLoadingChange(false)

        let fileData = {
          type: getFileType(res.data.extension),
          transfer_method: uploadType,
          name: res.data.name,
          upload_file_id: res.data.id,
          url: res.data.url,
          size:
            res.data.size / 1024 < 100
              ? `${(res.data.size / 1024).toFixed(2)}KB`
              : `${(res.data.size / 1024 / 1024).toFixed(2)}MB`,
          fileType: file.name.slice(file.name.lastIndexOf('.')),
        }
        newFileList.push(fileData)
        let data = []
        data = [...fileList, ...newFileList]
        setFileList(prev => {
          handleUploadChange([...prev, ...newFileList])
          return [...prev, ...newFileList]
        })
      })
      .catch(err => {
        props.fileLoadingChange(true)
        setLoading(false)
      })

    return false
  }
  //根据文件后缀名从fileTypeList 获取文件value
  const getFileType = type => {
    const matchedItem = fileTypeList.find(item => item.desc.includes(`.${type}`))
    return matchedItem ? matchedItem.value : ''
  }

  //删除文件
  const deleteFileEvent = index => {
    let newFileList = [...fileList]
    newFileList.splice(index, 1)
    setFileList(newFileList)
    handleUploadChange(newFileList)
  }
  useEffect(() => {
    let acceptObj = ''
    if (props.item) {
      // console.log(props.item, 'props.item')

      let allowed_file_types = props.item.allowed_file_types //允许上传的文件类型
      if (allowed_file_types.includes('custom')) {
        acceptObj = props.item.allowed_file_extensions.join(',')
        setFileType('custom')
      } else {
        setFileType('default')
        const acceptParts = []
        allowed_file_types.forEach(item => {
          fileTypeList.forEach(type => {
            if (type.value === item) {
              acceptParts.push(type.desc.join(','))
            }
          })
        })
        acceptObj = acceptParts.join(',')
      }
      // console.log(acceptObj)

      setAccept(acceptObj)
    }
    // let acceptObj = ''

    // const acceptParts = []
    // fileTypeList.forEach(type => {
    //   if (type.value === 'document') {
    //     acceptParts.push(type.desc.join(','))
    //   }
    // })
    // acceptObj = acceptParts.join(',')

    setAccept(acceptObj)
  }, [props.item])

  //处理上传文件change 事件
  const handleUploadChange = newFileList => {
    props.fileChange(newFileList)
  }

  //远程文件上传点击确定事件
  const uploadRemoteUrlEvent = () => {
    let url = remote_url
    if (!url) {
      message.warning('请输入远程文件地址')
      return
    }

    // 验证URL地址格式
    if (!FILE_URL_REGEX.test(url)) {
      message.warning('文件地址无效')
      return
    }
    setLoading(true)
    let newFileList = [...fileList]
    uploadRemoteFile(url)
      .then(res => {
        setLoading(false)

        // 创建文件对象用于验证
        const file = {
          name: res.data.name,
          size: res.data.size,
        }

        // 使用独立的验证函数验证远程文件
        const validation = validateFile(file, accept, fileList, props.item.max_length, props.item.type)
        if (!validation.isValid) {
          setLoading(false)
          return
        }

        let fileData = {
          type: getFileType(res.data.extension),
          transfer_method: uploadType,
          name: res.data.name,
          upload_file_id: res.data.id,
          url: res.data.url,
          size:
            res.data.size / 1024 < 100
              ? `${(res.data.size / 1024).toFixed(2)}KB`
              : `${(res.data.size / 1024 / 1024).toFixed(2)}MB`,
          fileType: res.data.name.slice(res.data.name.lastIndexOf('.')),
        }
        newFileList.push(fileData)
        setRemoteUrl('')
        setFileList(newFileList)
        handleUploadChange(newFileList)
      })
      .catch(err => {
        console.log(err)

        setLoading(false)
      })
  }
  return (
    <Spin spinning={loading}>
      <div className={docStyles['single_input']}>
        <div className={docStyles['single_input_header']}>
          {/* <div className={styles['single_input_header_left']}>
            <Text
              style={{ maxWidth: 120 }}
              ellipsis={{ tooltip: props.item.label }}
            >
              {props.item.required && <span style={{ color: 'red' }}>*</span>} {props.item.label}
            </Text>
          </div> */}
          <div className={docStyles['single_input_header_right']}>
            <Radio.Group
              disabled={loading || fileList.length >= 5}
              value={uploadType}
              options={options}
              onChange={e => {
                setUploadType(e.target.value)
              }}
              className={docStyles['custom-radio-group']}
            ></Radio.Group>
          </div>
        </div>
        {uploadType === 'local_file' && fileList.length < 5 && (
          <div className={docStyles['single_input_upload']}>
            <Dragger
              disabled={loading}
              // accept={accept} // 使用配置中的文件类型
              multiple={true}
              onChange={info => {}}
              beforeUpload={info => {
                beforeUploadEvent(info)
                return false
              }}
              showUploadList={false}
              fileList={fileList}
              className={docStyles['create_upload_main']}
            >
              <div className={docStyles['create_upload_content']}>
                <img
                  className={docStyles['create_upload_content_img']}
                  src='/knowledge/upload.png'
                />
                <div className={docStyles['create_upload_content_text']}>点击上传文件</div>
              </div>
            </Dragger>
          </div>
        )}

        {uploadType === 'remote_url' && fileList.length < 5 && (
          <div className={docStyles['single_input_upload_remote']}>
            <Input
              value={remote_url}
              onChange={e => {
                setRemoteUrl(e.target.value)
              }}
              placeholder='请输入文件URL'
              disabled={loading || fileList.length >= 5}
            />
            <Button
              onClick={uploadRemoteUrlEvent}
              type='primary'
              disabled={loading || !remote_url || fileList.length >= 5}
            >
              {' '}
              确定{' '}
            </Button>
          </div>
        )}
        <div className={docStyles['create_upload_container_fileList']}>
          {fileList.map((file, index) => (
            <div
              key={index}
              className={docStyles['fileList_item']}
            >
              <div className={docStyles['fileList_item_left']}>
                <div className={docStyles['fileList_item_left_img']}>
                  <img src={'/workflow/' + file.type + '.png'}></img>
                </div>
                <div className={docStyles['fileList_item_left_title']}>
                  <div className={docStyles['fileList_item_left_name']}>
                    <Text
                      style={{ maxWidth: 200 }}
                      ellipsis={{ tooltip: file.name }}
                    >
                      {file.name}
                    </Text>
                  </div>
                  <div className={docStyles['fileList_item_left_desc']}>
                    {file.fileType.toUpperCase().slice(1)}·{file.size}
                  </div>
                </div>
              </div>
              <div className={docStyles['fileList_item_right']}>
                <img
                  src='/knowledge/delete.png'
                  onClick={() => deleteFileEvent(index)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Spin>
  )
})

export default SingleFile

