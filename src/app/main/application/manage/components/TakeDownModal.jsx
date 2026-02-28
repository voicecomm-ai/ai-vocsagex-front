"use client";
import { useState,useImperativeHandle,forwardRef} from "react";
import { Modal, Button,message } from "antd";
import { workflowDown,agentDown } from "@/api/application";
const TakeDownModal = forwardRef((props, ref) => {
  const [visible,setVisible] = useState(false);
  const [title,setTitle] = useState("下架");
  const [content,setContent] = useState("应用下架后，将不在发现页显示且也不能作为模板继续被引用");
  const [appInfo,setAppInfo] = useState({});
  const [loading,setLoading] = useState(false);
  useImperativeHandle(ref, () => ({
    showModal,
    hideModal,
  }));


 //显示模态框 
 const showModal = (obj) => {
  setVisible(true);
  setLoading(false);
  setAppInfo(obj);
 }
 //点击取消按钮 
 const hideModal = () => {
  setVisible(false);
 }


 //智能体下架事件
 const  agentDownEvent = () => {
  setLoading(true);
  agentDown({id:appInfo.id}).then(res=>{

    handleSuccessEvent();
  }).catch(()=>{
    setLoading(false);  

  })
 }
 //工作流下架事件
 const  workflowDownEvent = () => {
  workflowDown({id:appInfo.id}).then(res=>{
    handleSuccessEvent();
  }).catch(()=>{
    setLoading(false);  
  })
 }



 //点击确定按钮 
 const handleSuccessEvent = () => {
  hideModal();
  message.success("下架成功");
  
  props.refreshEvent();
 }

 //提交点击事件
 const handleSubmitEvent=()=>{
  if(appInfo.type=='agent'){
    agentDownEvent();
  }else{
    workflowDownEvent();
  }
 }
  return (
    <Modal
      open={visible}
      onCancel={hideModal}
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
            <Button style={{ borderRadius: 8 }} onClick={hideModal}>
              取消
            </Button>
            <Button
              type="primary"
              loading={loading}
              danger
              style={{ marginLeft: 12, background: "#EE5A55", borderRadius: 8 }}
              onClick={handleSubmitEvent}
            >
              确定
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
});
export default TakeDownModal;
