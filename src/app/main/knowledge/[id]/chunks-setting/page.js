'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Steps, message } from 'antd'
import Conf from './components/Conf'
import styles from './create.module.css'
import { getKnowledgeBaseDocumentCount, getKnowledgeDetail } from '@/api/knowledge'

export default function AddDocument() {
  const { id } = useParams() //knowledgeId
  const router = useRouter()
  const cofRef = useRef(null)
  const [current, setCurrent] = useState(1) //0 编排 1 访问API‘
  const [documentList, setDocumentList] = useState([]) //文档列表
  const [cacheList, setCacheList] = useState([]) //
  const [documentId, setDocumentId] = useState([]) //
  const [loading, setLoading] = useState(true) // 加载状态
  const [routerFrom, setRouterFrom] = useState(null)

  const [knowledgeBase, setKnowledgeBase] = useState(null)
  const [disableConf, setDisableConf] = useState(true)
  //返回上一页
  const handleBack = () => {
    router.push(`/main/knowledge/document?id=${id}&type=list`)
  }

  //保存处理下一步事件
  const nextResultEvent = obj => {
    setSaveData(obj)
    setCurrent(2)
  }
  //返回上一步
  const backNext = () => {
    if (routerFrom === 'detail') {
      router.push(`/main/knowledge/document?id=${id}&type=detail&documentId=${documentId}`)
    } else {
      router.push(`/main/knowledge/document?id=${id}&type=list`)
    }
  }

  useEffect(() => {
    let params = new URLSearchParams(window.location.search)
    // let knowId = params.get('id')
    let name = params.get('name')
    let from = params.get('from')
    let docId = params.get('docId')

    setRouterFrom(from)
    setDocumentId(docId)
    let arr = [
      {
        id: docId,
        name,
      },
    ]
    setDocumentList(arr)

    getKnowledgeDetail(id).then(resp => {
      setKnowledgeBase(resp.data)
      resp.data.documentId = docId
      cofRef.current.setParams(resp.data)
    })
    getKnowledgeBaseDocumentCount(id).then(resp => {
      if (resp.data === 0) {
        setDisableConf(false)
        cofRef.current.setDisableConf(resp.data)
      }
      console.log('知识库文档数量', resp.data)
    })
  }, [id])

  return (
    <div className={styles['create_container']}>
      <div className={styles['create_container_content']}>
        {documentList.length && (
          <Conf
            ref={cofRef}
            disableConf={disableConf}
            documentList={documentList}
            backNext={backNext}
          />
        )}
      </div>
    </div>
  )
}

