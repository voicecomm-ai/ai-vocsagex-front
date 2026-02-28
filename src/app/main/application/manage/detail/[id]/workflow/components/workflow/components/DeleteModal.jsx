"use client";
import { forwardRef,useState,useImperativeHandle } from "react";
import { Modal, Button,message } from "antd";
// 定义样式对象，提高代码可维护性
const modalStyles = {
  content: {
    backgroundImage: 'url("/model/bg_delete.png")',
    borderRadius: 24,
    padding: "26px",
    backgroundColor: "#fff",
    backgroundPosition: "top center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "100% auto",
  },
  header: {
    background: "transparent",
  },
};

const containerStyle = {
  display: "flex",
  gap: 12,
};

const infoWrapperStyle = {
  display: "flex",
  flexDirection: "column",
};

const titleStyle = {
  color: "#364052", // 修正颜色值，添加 # 前缀
  fontWeight: 500,
  fontSize: 20,
  wordBreak: "break-all",
};

const contentStyle = {
  color: "#666E82",
  fontSize: 14,
  lineHeight: "20px",
  marginTop: 4,
};

const buttonWrapperStyle = {
  marginTop: 16,
};

const cancelButtonStyle = {
  borderRadius: 8,
};

const confirmButtonStyle = {
  marginLeft: 12,
  background: "#EE5A55",
  borderRadius: 8,
};

const DeleteModal = forwardRef((props, ref) => {
const  [visible,setVisible] = useState(false);
const [title,setTitle]=useState("删除确认");
const [content,setContent]=useState("删除后数据无法恢复，是否继续？");
const [data,setData]=useState({});
const [loading,setLoading]=useState(false);
  useImperativeHandle(ref, () => ({
    showModal,
    hideModal,
  }));

  // 显示模态框，将 visible 状态设置为 true
  const showModal = (obj,title,content) => {
    console.log(obj,title,content,'obj,title,content');
    setVisible(true);
    setData(obj);
    setContent(content);
    setTitle(title);
  };
  // 隐藏模态框，将 visible 状态设置为 false
  const hideModal = () => {
    setVisible(false);
  };
  // 点击确认按钮的回调函数，当前为空实现
  const onOk = () => {
    setLoading(true);
    props.deleteCallBack(data);
    hideModal();
    setLoading(false);
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
      width="480px"
    >
      <div style={containerStyle}>
        <img src="/del_tip.png" alt="" style={{ width: 64, height: 64 }} />
        <div style={infoWrapperStyle}>
          <div style={titleStyle}>
            {title}
          </div>
          <div style={contentStyle}>
            {content}
          </div>
          <div style={buttonWrapperStyle}>
            <Button  loading={loading} style={cancelButtonStyle} onClick={hideModal}>
              取消
            </Button>
            <Button
            loading={loading}
              type="primary"
              danger
              style={confirmButtonStyle}
              onClick={onOk}
            >
              确定
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
});

export default DeleteModal;
