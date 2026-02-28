'use client'
import React,{useState,useRef} from 'react'
import styles from './create.module.css';
import {useRouter,useParams  } from 'next/navigation';
import { Steps } from 'antd';
import CreateUpload from './components/Upload';
import Conf from './components/Conf';
import Result from './components/Result';

export default function CreateKnowledgePage({searchParams}) {
const router = useRouter();
const uploadRef =useRef(null)
const [current, setCurrent] = useState(0); //0 编排 1 访问API‘
const [documentList,setDocumentList]=useState([]);//文档列表
const [cacheList,setCacheList]=useState([]);//
const [saveData,setSaveData]=useState(null);
  //返回上一页
  const handleBack = () => {
    router.push('/main/knowledge')
  }
  //创建知识库上传下一步
  const uploadNextEvent=(arr,files)=>{
    setDocumentList(arr);
    setCacheList(files)
    setCurrent(1)
  }
  //保存处理下一步事件
  const nextResultEvent=(obj)=>{
    setSaveData(obj)
  setCurrent(2);
  }
  //返回上一步
  const backNext=()=>{
    setCurrent(0)
   setTimeout(() => {
  if (uploadRef.current) {
    uploadRef.current.showFileListByNext(cacheList,documentList);
  }
}, 0);
  }

  return (
    <div className={styles['create_container']}>
    <div className={styles['create_container_header']}>
    <div className={styles['create_container_header_left']}>
     <img onClick={handleBack} className={styles['create_container_header_left_icon']} src='/knowledge/back.png' alt='返回' />
     <div  className={styles['create_container_header_title']}>创建知识库</div>
     </div>
     <div className={styles['create_container_header_right']}>
     <Steps
    size="small"
    current={current}
    items={[
      {
        title: '选择数据源',
      },
      {
        title: '数据处理',
      },
      {
        title: '处理并完成',
      },
    ]}
  />
     </div>
    </div>
    <div className={styles['create_container_content']}>
      {current == 0 && <CreateUpload ref={uploadRef} uploadNextEvent={uploadNextEvent} />}
      {current ==1 && <Conf documentList={documentList} nextResultEvent={nextResultEvent} backNext={backNext} />}
      {current ==2 && <Result saveData={saveData} documentList={documentList} backNext={backNext} />}
    </div>
    </div>
  )
}
