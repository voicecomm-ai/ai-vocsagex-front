"use client";

import React, { useState, forwardRef, useImperativeHandle,useRef  } from 'react';
import { Button, Modal,Spin,Form,Input,message,Space} from 'antd';
import styles from '../mcp.module.css';
import { useRouter } from 'next/navigation';
import {ExclamationCircleOutlined } from '@ant-design/icons'; 
import DeleteTag  from './DeleteTag';
import {getMcpTagList,addMcpTag,editMcpTag,deleteMcpTag,getMcpTagDetail} from '@/api/mcp';
const TagModel = forwardRef((props, ref) => {
  //子组件暴露方法
  const router = useRouter();
  const [title, setTitle] = useState('创建空知识库'); //标题
  const [actionType, setActionType] = useState('add'); // 
  const { TextArea } = Input;
  const [tabList, setTabList] = useState([ ])
  const [deleteModalShow, setDeleteModalShow] = useState(false);
  const [delName,setDelName]=useState(null);
  let deleteTag={ name: "" };
  const [deleteId,setDeleteId] =useState(null);
  useImperativeHandle(ref, () => ({
    showModal,
  }));
  const [open, setOpen] = useState(false);
  const formRef = useRef(null);
  const [loading, setLoading] = useState(false); //加载状态
  const [inputValue, setInputValue] = useState('');
  const [tagList, setTagList] = useState([]); //标签列表
  const deleteRef= useRef(null); //删除组件ref
  const showModal = () => {
    console.log('数据展示')
    setInputValue(''); // 清空输入框内容
   setOpen(true);
   getMcpTagListEvent();
  };
    //获取知识库所有标签列表
  const getMcpTagListEvent = async () => {
      let data={
        tagName:''
      }
      getMcpTagList(data).then(res => {
        let data = res.data;
        console.log(data)
        setTagList(data);
      })
    }
  
     const saveTagName= (tag, newName) => {
      if (newName === tag.name || newName.trim() === '') {
        updateTagStatus(tag, false);
        return
      }
      editMcpTag({ ...tag, name: newName, }).then(res => {
        message.success('修改成功')
        submitSuccessEvent();
         props.fetchMcpList();
      }) 
     }
     //编辑标签
    const editTagHandle = (tag) => {
      updateTagStatus(tag, true);
    };
    //更新标签状态
    const updateTagStatus = (tag, status) => {
      setTagList(tagList.map(t =>
        t.id === tag.id ? { ...t, isEditing: status } : t
      ));
    }
     //删除标签
      const deleteTagHandle= (tag) => {
        deleteTag =tag;
        setDeleteId(tag.id);
        setDelName(tag.name)
        getMcpTagDetail(tag.id).then(res => {
          let data =res.data;
          if (data.tagUsedNumber) {
            setDeleteModalShow(true) 
          } else {
            delTagEvent(tag);
          }  
        }).catch(err=>{
          console.log(err)
        })
      } 
     const modalDeleteEvent=()=>{
      delTagEvent();
     } 
      //删除标签提交事件
    const delTagEvent=(tag)=>{
      let id =tag?tag.id:deleteId;
      deleteMcpTag(id).then(res=>{
        message.success('删除成功')
        getMcpTagListEvent(); // 重新获取标签列表
        setDeleteModalShow(false) 
        props.fetMcpTagList();
        props.fetchMcpList();
      }).catch(err=>{

      })
    }
      //添加标签
     const addTagHandle= (e) => {
      if (e.target.value.trim() === '') {
        setInputValue('');
        return
      }
      addMcpTag({name:e.target.value}).then(res => {
        submitSuccessEvent();
      })
     }
    // 接口提交成功事件
    const submitSuccessEvent = () => {
      setInputValue(''); // 请求成功后清空输入框
      getMcpTagListEvent(); // 重新获取标签列表
      props.fetMcpTagList();
    }

  return (
    <Space>
 
         <Modal
         open={open}
         onCancel={() => setOpen(false)}
         // className="app-custom-modal"
         width={640}
         height={440}
         title='管理标签'
         footer={null}
         zIndex={1050}
         styles={{
           content: {
             backgroundImage: 'url("/application/app_modal_back.png")',
             borderRadius: 24,
             padding: '24px 24px 32px',
             backgroundColor: '#fff',
          backgroundPosition: "top center",
             backgroundRepeat: 'no-repeat',
          backgroundSize: "100% auto",
           },
           header: {
             background: 'transparent',
           }
         }}
 >
         <Space size={[8, 12]} wrap>
           <Input
             placeholder="输入并按回车添加标签"
             value={inputValue}
             onChange={(e) => setInputValue(e.target.value)}
             onPressEnter={addTagHandle}
             onBlur={addTagHandle}
             maxLength={50}
             disabled={!props.canCreate}
             style={{ width: 320, height: 34, borderRadius: 8 }}
           />
           {tagList.map((tag) => (
             <div key={tag.id} className={styles['manage-tag-item']}>
               {tag.isEditing ? (
                 <Input
                   autoFocus
                   defaultValue={tag.name}
                   onBlur={(e) => saveTagName(tag, e.target.value)}
                   onPressEnter={(e) => saveTagName(tag, e.target.value)}
                   maxLength={50}
                   variant="borderless"
                   style={{ padding: 0 }}
                 />) :
                 (<div><span>{tag.name}</span> <span style={{ color: '#666E82', marginLeft: 6 }}>{tag.tagUsedNumber}</span></div>)}
  {!tag.isEditing&&props.canCreate&&  (
               <div style={{ display: 'flex' }}>
                 <img alt='编辑' src='/application/edit_icon.svg' className={styles["edit-icon"]} onClick={() => editTagHandle(tag)}></img>
                 <div className={styles["delete-icon"]} onClick={() => deleteTagHandle(tag)}></div></div>
 )}
             </div>
           ))}
         </Space>
       </Modal>
      {/* 删除弹框  */}
      <DeleteTag
        visible={deleteModalShow}
        title={`删除标签「${delName}」`}
        content="标签正在使用中，是否删除？"
        onCancel={() => setDeleteModalShow(false)}
        onOk={modalDeleteEvent}
      />
       </Space> 
  );
});

export default TagModel;