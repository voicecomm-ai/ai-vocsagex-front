"use client";

import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import { Button, Modal, Spin, Form, Input, message, Select } from "antd";
import styles from "../mcp.module.css";
import { useRouter } from "next/navigation";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { getMcpTagList, batchBindMcpTag } from "@/api/mcp";

const BatchTag = forwardRef((props, ref) => {
  //子组件暴露方法
  const router = useRouter();
  const [title, setTitle] = useState("批量调整标签"); //标题
  const [actionType, setActionType] = useState("add"); //
  const { TextArea } = Input;
   const [searchText, setSearchText] = useState('');
  useImperativeHandle(ref, () => ({
    showModal,
  }));
  const [open, setOpen] = useState(false);
  const formRef = useRef(null);
  const [loading, setLoading] = useState(false); //加载状态
const  [selectArr,setSelectArr] = useState([]);
const [tagList,setTagList] = useState([]);
  //显示弹窗
  const showModal = (arr) => {
    setOpen(true);
    setSelectArr(arr);
    getTagListEvent();
   
  };
    const handleSearch = (value) => {
    if (value && value.length > 50) {
      const truncated = value.slice(0, 50);
      setSearchText(truncated);
    } else {
      setSearchText(value);
    }
  };
  const handleSearchChange=(value)=>{
    console.log(value,'222')
  }

 //获取标签列表
  const getTagListEvent = async () => {
    let data = {
      name: "",
    };
    await getMcpTagList(data).then((res) => {
      let data = res.data;
      setTagList(data);
    });
  };
  //关闭事件
  const modelCancelEvent = () => {
    setOpen(false);
    formRef.current.resetFields();
    setLoading(false); // 加载结束
  };
  const classNames = {
    content: "my-modal-content",
  };
  //提交事件
  const submitEvent = async (e) => {
    e.preventDefault();
    const values = await formRef.current.validateFields();
    let addData = {
      ids: selectArr,
      tagIds: values.tagList,
    };
    setLoading(true); // 加载开始
    batchBindMcpTag(addData)
      .then((res) => {
        submitSuccessEvent();
      })
      .catch((err) => {
        setLoading(false); // 加载结束
        console.log(err);
      });
  };
  //提交成功事件
  const submitSuccessEvent = () => {
    setLoading(false); // 加载结束
    modelCancelEvent();
    message.success("操作成功");
    //调用父元素方法
    props?.searchEvent('refresh');
  };
  const handleBlurChange = (value) => {
   setSearchText('');
  }

  return (
    <Modal
      open={open}
      title=""
      footer={null}
      width="520px"
      closable={false}
      onCancel={modelCancelEvent}
      classNames={classNames}
    >
      <div
        className={`${styles["knowledge_add_container"]} ${"model_container"}`}
      >
        <div className={styles["knowledge_add_container_header"]}>
          <div className="model_header">
            <div className={styles["knowledge_add_container_header_title"]}>
              {title}
            </div>
            <img
              className={styles["knowledge_add_container_header_close_img"]}
              onClick={modelCancelEvent}
              src="/close.png"
              alt=""
            />
          </div>
        </div>
        <div
          className="model_content"
          style={{
            padding: 16,
          }}
        >
          <Spin spinning={loading}>
            <Form
              ref={formRef}
              name="basic"
            layout="vertical"
            >
               <Form.Item name="tagList" label="标签" rules={[{required:true,message:'请选择标签'}]}>
                <Select
                    showSearch // 显示搜索框
                    filterOption={(
                      input,
                      option // 自定义搜索逻辑
                    ) =>
                      option.children
                        .toLowerCase()
                        .indexOf(input.toLowerCase()) >= 0
                    }
                    onBlur={handleBlurChange}
                    optionFilterProp="children" // 指定搜索的字段
                    className={styles["mcp_update_input"]}
                    placeholder="请选择标签"
                    mode="multiple"
                    maxTagCount={1}
                  onSearch={handleSearch}
                  searchValue={searchText}
                >
                  {tagList.map((tag) => (
                    <Select.Option key={tag.id} value={tag.id}>
                      {tag.name || tag.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Form>
          </Spin>
        </div>
        <div className="model_footer">
          <Button loading={loading} className="model_footer_btn" onClick={modelCancelEvent}>
            取消
          </Button>
          <Button
          loading={loading}
            onClick={submitEvent}
            className="model_footer_btn"
            type="primary"
          >
            保存
          </Button>
        </div>
      </div>
    </Modal>
  );
});

   BatchTag.displayName = "BatchTag";
export default BatchTag;
