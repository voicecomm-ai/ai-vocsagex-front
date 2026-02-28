'use client'
import { forwardRef, useState, useImperativeHandle } from 'react'
import { Modal, Button, message } from 'antd'
import { batchChangeDocumentStatus } from '@/api/knowledge'

// 定义样式对象，提高代码可维护性
const modalStyles = {
  content: {
    backgroundImage: 'url("/mcp/up_bg.png")',
    borderRadius: 24,
    padding: '26px',
    backgroundColor: '#fff',
    backgroundPosition: 'top center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '100% auto',
  },
  header: {
    background: 'transparent',
  },
}

const containerStyle = {
  display: 'flex',
  gap: 12,
}

const infoWrapperStyle = {
  display: 'flex',
  flexDirection: 'column',
}

const titleStyle = {
  color: '#364052', // 修正颜色值，添加 # 前缀
  fontWeight: 500,
  fontSize: 20,
  wordBreak: 'break-all',
}

const contentStyle = {
  color: '#666E82',
  fontSize: 14,
  lineHeight: '20px',
  marginTop: 4,
}

const buttonWrapperStyle = {
  marginTop: 16,
}

const cancelButtonStyle = {
  borderRadius: 8,
}

const confirmButtonStyle = {
  marginLeft: 12,
  background: '#3772FE',
  borderRadius: 8,
}

const DeleteModal = forwardRef((props, ref) => {
  const [visible, setVisible] = useState(false)
  const [title, setTitle] = useState('删除确认')
  const [content, setContent] = useState('删除后数据无法恢复，是否继续？')
  const [ids, setIds] = useState([])
  const [action, setAction] = useState('del')
  const [loading, setLoading] = useState(false)
  useImperativeHandle(ref, () => ({
    showModal,
    hideModal,
  }))

  // 显示模态框，将 visible 状态设置为 true
  const showModal = (obj, modalTitle, modalContent, type, arr) => {
    setVisible(true)
    setContent(modalContent)
    setTitle(modalTitle)
    setAction(type)

    let idArr = []
    if (obj) {
      //单个
      idArr.push(obj.id)
    } else {
      arr.forEach(element => {
        idArr.push(element.id)
      })
    }

    setIds(idArr)
  }
  // 隐藏模态框，将 visible 状态设置为 false
  const hideModal = () => {
    setVisible(false)
  }
  // 点击确认按钮的回调函数，当前为空实现
  const onOk = () => {
    setLoading(true)
    let data = {}
    if (action == 'REVOKE_ARCHIVE') {
      data = {
        documentIds: ids,
        isArchived: action == 'REVOKE_ARCHIVE' ? false : null,
      }
    } else {
      data = {
        documentIds: ids,
        status: action,
      }
    }
    batchChangeDocumentStatus(data)
      .then(res => {
        message.success('操作成功')
        hideModal()
        setLoading(false)
        props.searchEvent()
      })
      .catch(() => {
        setLoading(false)
      })
  }
  return (
    <Modal
      open={visible}
      onCancel={hideModal}
      closable={false}
      centered={true}
      styles={modalStyles} // 修正属性名，从 styles 改为 style
      footer={null}
      ref={ref}
    >
      <div style={containerStyle}>
        <img
          src='/mcp/up_tip.png'
          alt=''
          style={{ width: 64, height: 64 }}
        />
        <div style={infoWrapperStyle}>
          <div style={titleStyle}>{title}</div>
          <div style={contentStyle}>{content}</div>
          <div style={buttonWrapperStyle}>
            <Button
              loading={loading}
              style={cancelButtonStyle}
              onClick={hideModal}
            >
              取消
            </Button>
            <Button
              type='primary'
              style={confirmButtonStyle}
              onClick={onOk}
            >
              确定
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
})

export default DeleteModal

