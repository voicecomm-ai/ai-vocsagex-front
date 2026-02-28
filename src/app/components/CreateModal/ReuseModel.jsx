import { Modal, Input, Button, Popover, Avatar, Form, Spin } from "antd";
import { forwardRef, useImperativeHandle, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { findApplicationReuse } from "@/api/find";  


const ReuseModel = forwardRef((props, ref) => {
  const router = useRouter();
  useImperativeHandle(ref, () => ({
    showModal,
  }));
  const [open, setOpen] = useState(false); // 控制模态框显示
  const [createBtnLoading, setCreateBtnLoading] = useState(false);
  const [type, setType] = useState("");
  const [appInfo, setAppInfo] = useState({});//应用信息
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);//加载状态
  //取消
  const handleCancel = () => {
    setOpen(false); // 关闭小模态框
  };
  const showModal = (obj) => {
    setCreateBtnLoading(false);
    setAppInfo(obj);
    setOpen(true);
    renameNameEvent(obj); 
  };

  //重命名名称
  const renameNameEvent = (obj) => {
    form.setFieldsValue({
      name: obj.name + '（副本）',
      description: obj.description && obj.description.length > 100 ? obj.description.slice(0, 100) : obj.description,
    });
  };

  //创建智能体事件
  const createAgentEvent = (id) => {   
    const data = { applicationId: id };
    addAgentInfo(data)
      .then(() => {
        
      })
      .catch(() => {});
  };
  //提交创建信息
  const onFinish = (values) => {
    setCreateBtnLoading(true);
    let addData ={
      name: values.name,
      description: values.description,
      type: appInfo.type,
      appId: appInfo.appId,
    } 
    findApplicationReuse(addData)
      .then((res) => {
        if (appInfo.type == "agent") {
         agentJumpEvent(res.data);
        } else if (appInfo.type == "workflow") {
          router.push(`/main/application/manage/detail/${res.data}/workflow`);
        }
        setOpen(false);
        setCreateBtnLoading(false);
        props?.onCloseModel();
      })
      .catch(() => {
        setCreateBtnLoading(false);
      });
  };
  //智能体跳转
  const agentJumpEvent = (id) => {
    if(appInfo.agentType == "multiple"){
    router.push(`/main/application/manage/detail/${id}/agent/multi`);
    }
    else{
     router.push(`/main/application/manage/detail/${id}/agent`);
    }
  }

  return (
    <Modal
      open={open}
      centered
      footer={null}
      closeIcon={false}
      width='33%'
       zIndex={10000}
      styles={{
        content: {
          backgroundImage: `url("/layout/create/create_back.png")`,
          borderRadius: 24,
          padding: "36px 40px 10px",
          backgroundColor: "#fff",
          backgroundPosition: "top center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "100% auto",
        },
        header: {
          background: "transparent",
        },
      }}
      onCancel={handleCancel}
    >
      <div className={styles.small_create_modal}>
        <div className={styles.small_create_modal_title}>
          复用到应用管理
        </div>
        <div>
          <Form
            form={form}
            layout='vertical'
            initialValues={{ name: "", description: "" }}
            onFinish={onFinish}
          >
              <Form.Item
                name='name'
                label='应用名称'
                rules={[
                  { required: true, message: "请输入应用名称" },
                  { max: 50, message: "应用名称不能超过50个字符" },
                ]}
             
              >
                <Input
                  placeholder='给你的应用起一个响亮的名字'
                  showCount
                  maxLength={50}
                  style={{ height: 48 }}
                />
              </Form.Item>
        
            <Form.Item name='description' label='应用描述' rules={[{ required: true, message: "请输入应用描述" },{ max: 400, message: "应用描述不能超过400个字符" }]}>
              <Input.TextArea
                rows={5}
                placeholder='描述该应用的内容，详细的描述可以让AI更好的理解并访问应用的内容'
                showCount
                maxLength={500}
              />
            </Form.Item>
            <Form.Item>
              <div className={styles.footer_btn}>
                <Button
                  style={{ width: 112, marginRight: 24, borderRadius: 8, height: 40 }}
                  onClick={handleCancel} // 直接使用父组件传递的 onCancel
                  loading={createBtnLoading}
                >
                  取消
                </Button>
                <Button
                  style={{ width: 112, borderRadius: 8, height: 40 }}
                  type='primary'
                  htmlType='submit'
                  loading={createBtnLoading}
                >
                  确定
                </Button>
              </div>
            </Form.Item>
          </Form>
        </div>
      </div>
    </Modal>
  );
});
export default ReuseModel;
