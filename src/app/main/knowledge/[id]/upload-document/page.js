"use client"

import {useParams, useRouter} from "next/navigation";
import CreateUpload from "./components/Upload";
import {useEffect, useRef, useState} from "react";
import {Steps, message} from "antd";
import Conf from "./components/Conf";
import Result from "./components/Result"
import styles from './create.module.css';
import {
  getKnowledgeBaseDocumentCount,
  getKnowledgeDetail
} from "@/api/knowledge";

export default function AddDocument() {
  const { id } = useParams()
  const router = useRouter();
  const uploadRef =useRef(null)
  const [current, setCurrent] = useState(0); //0 编排 1 访问API‘
  const [documentList,setDocumentList]=useState([]);//文档列表
  const [cacheList,setCacheList]=useState([]);//
  const [saveData,setSaveData]=useState(null);
  const [knowledgeBase, setKnowledgeBase] = useState(null);
  const [disableConf, setDisableConf] = useState(true);
  //返回上一页
  const handleBack = () => {
    router.push(`/main/knowledge/document?id=${id}&type=list`);
  }
  //创建知识库上传下一步
  const uploadNextEvent=async (arr,files)=>{
    const resp = await getKnowledgeBaseDocumentCount(id)
    if (resp.data + arr.length > 50) {
      message.error("知识库文档数量超过50个")
      return
    }
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

  useEffect(() => {
    getKnowledgeDetail(id).then(resp => {
      console.log(resp)
      setKnowledgeBase(resp.data)
    })
    getKnowledgeBaseDocumentCount(id).then(resp => {
      if (resp.data === 0) {
        setDisableConf(false);
      }
      console.log('知识库文档数量', resp.data)
    })
  }, [id]);

  return (
      <div className={styles['create_container']}>
        <div className={styles['create_container_header']}>
          <div className={styles['create_container_header_left']}>
            { current !== 2 && <img onClick={handleBack} className={styles['create_container_header_left_icon']} src='/knowledge/back.png' alt='返回' /> }
            <div  className={styles['create_container_header_title']}>添加文件</div>
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
          {current === 0 && <CreateUpload ref={uploadRef} uploadNextEvent={uploadNextEvent} />}
          {current ===1 && <Conf disableConf={disableConf} knowledgeBase={knowledgeBase} documentList={documentList} nextResultEvent={nextResultEvent} backNext={backNext} />}
          {current ===2 && <Result saveData={saveData} documentList={documentList} backNext={backNext} />}
        </div>
      </div>
  )
}