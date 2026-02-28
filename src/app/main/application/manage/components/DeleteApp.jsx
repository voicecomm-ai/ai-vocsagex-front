"use client";
import { useState,useEffect ,useRef ,useImperativeHandle  ,forwardRef} from "react";
import { Modal, Button } from "antd";

const DeleteAppModalRef = forwardRef((props, ref) => {
  const [visible, setVisible] = useState(false);

  const [title, setTitle] = useState("删除确认");
  const [content, setContent] = useState("删除后数据无法恢复，是否继续？");
 const [data,setData] = useState(null);
  useImperativeHandle(ref, () => ({
showDeleteModal,
onCancel
  }));

 
  // 显示删除确认弹窗
const showDeleteModal = (appInfo,titleText,contentText) => {
    setData(appInfo);
    setTitle(titleText);
    setContent(contentText);  
    setVisible(true)
  };
  // 处理取消删除
const onCancel = () => {
    setVisible(false);
  };
  // 处理删除确认
const onOk = () => {
    props?.deleteCallBack(data);
  };
  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      centered={true}
      styles={{
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
      }}
      footer={null}
    >
      <div style={{ display: "flex", gap: 12 }}>
        <img src="/del_tip.png" alt="" style={{ width: 64, height: 64 }} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ color: "364052", fontWeight: 500, fontSize: 20,
              wordBreak: "break-all" }}>
            {title}
          </div>
          <div
            style={{
              color: "#666E82",
              fontSize: 14,
              lineHeight: "20px",
              marginTop: 4,
            }}
          >
            {content}
          </div>
          <div style={{ marginTop: 16 }}>
            <Button style={{ borderRadius: 8 }} onClick={onCancel}>
              取消
            </Button>
            <Button
              type="primary"
              danger
              style={{ marginLeft: 12, background: "#EE5A55", borderRadius: 8 }}
              onClick={onOk}
            >
              确定
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );

})
export default DeleteAppModalRef;