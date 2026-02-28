/* eslint-disable @next/next/no-img-element */
'use client'
import { forwardRef, useRef, useImperativeHandle, useState, useEffect } from 'react'
import { Drawer, Row, Button, Divider, ConfigProvider, Tooltip, Input, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { modelKeyList, modelKeyAdd, modelKeyDelete } from '@/api/model'
import styles from '../../page.module.css'
// import DeleteModal from "../../components/DeleteModal";
import { checkPermission } from '@/utils/utils'
import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
const SegmentTestDrawer = forwardRef((props, ref) => {
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(false)
  const [chunkType, setchunkType] = useState('')
  const [character, setCharacter] = useState(0)
  const [chunkScore, setchunkScore] = useState('')
  const [modelId, setModelId] = useState(null)
  const [chunk, setChunk] = useState([])
  const [index, setIndex] = useState(false)
  const [documentImg, setDocumentImg] = useState('')

  let imgUrls = {
    txt: '/knowledge/txt.png',
    markdown: '/knowledge/other.png',
    mdx: '/knowledge/other.png',
    pdf: '/knowledge/pdf.png',
    html: '/knowledge/other.png',
    xlsx: '/knowledge/xlsx.png',
    docx: '/knowledge/docx.png',
    csv: '/knowledge/csv.png',
    md: '/knowledge/other.png',
    htm: '/knowledge/other.png',
  }

  const renderTooltip = (content, index) => {
    return (
      <div className={`${styles['chunks_list_item_header']} ${styles['tooltip_chunk']}`}>
        <div className={`${styles['chunks_list_item_header_title']} ${styles['tooltip_chunk_title']}`}>
          <img
            src='/knowledge/tooltip_bg.png'
            alt=''
            className={styles['chunks_list_item_header_title_img']}
          />
          分段 {index + 1}
        </div>
        <div className={styles['chunks_list_item_header_divver']}></div>
        <div className={`${styles['chunks_list_item_header_character']} ${styles['tooltip_chunk_character']}`}>
          {content.character || 0}字符
        </div>
      </div>
    )
  }
  useImperativeHandle(ref, () => ({
    open: (data, type) => {
      // setModelId(id);
      setChunk(data)
      setchunkType(type)
      setIndex(data.metadata.idx)
      setchunkScore(data.metadata.score.toFixed(2))
      setCharacter(data.metadata.content_len)
      // console.log(data, 'kkkk', type)
      const fileImage = imgUrls[data.url.split('.')[1]]
      setDocumentImg(fileImage)
      setOpen(true)
    },
    onClose: () => setOpen(false),
  }))
  useEffect(() => {}, [open]) // 监听 open 和 modelId 的变化

  return (
    <Drawer
      open={open}
      onClose={() => setOpen(false)}
      closable={false}
      width={560}
      styles={{
        content: {
          borderRadius: '24px 0px 0px 24px',
          padding: 0,
        },
        body: {
          padding: 0,
          overflow: 'hidden',
        },
        footer: null,
      }}
    >
      <div className={styles['search_test_detail']}>
        <div className={styles['search_test_detail_header']}>
          <span>段落详情</span>
          <img
            src='/close.png'
            style={{ cursor: 'pointer' }}
            alt=''
            onClick={() => setOpen(false)}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div className={styles['search_right_info_wrap_header']}>
            <div className={styles['search_right_info_wrap_header_title']}>
              <img
                src='/knowledge/parent.png'
                alt=''
                style={{ width: 12, height: 12, marginRight: 4 }}
              />
              分段-{index}
              <Divider
                type='vertical'
                style={{ height: 12 }}
              ></Divider>
              {character}字符
            </div>
            <div className={styles['search_right_info_wrap_header_score']}>
              <div className={styles['search_header_score_left']}>SCORE</div>
              <div className={styles['search_header_score_right']}>{chunkScore}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              className={styles['search_right_info_wrap_content']}
              style={{ background: 'transparent' }}
            >
              {/* 普通分段渲染 */}

              {chunkType === 'COMMON' && (
                <div className={styles['chunks_list_item_content']}>
                  {chunk.content && <ReactMarkdown remarkPlugins={[remarkBreaks]}>{chunk.content}</ReactMarkdown>}
                </div>
              )}
              {/* 普通qa模式 */}
              {/* {chunkType === 'COMMON' &&
                chunk.question(
                  <div className={styles['chunks_list_item_content_qa']}>
                    <div className={styles['chunks_list_item_content_question']}>
                      <span className={styles['chunks_list_item_content_qa_span']}>Q </span>
                      <ReactMarkdown remarkPlugins={[remarkBreaks]}>{chunk.question}</ReactMarkdown>
                    </div>
                    <div className={styles['chunks_list_item_content_answer']}>
                      <span className={styles['chunks_list_item_content_qa_span']}>A </span>
                      <ReactMarkdown remarkPlugins={[remarkBreaks]}>{chunk.answer}</ReactMarkdown>
                    </div>
                  </div>
                )} */}

              {/* 父子分段渲染 */}
              {chunkType == 'PARENT_CHILD' && (
                <div className={styles['chunks_list_item_content_parent']}>
                  {Array.isArray(chunk.content) ? (
                    chunk.content.map((parent, a) => (
                      <Tooltip
                        key={a}
                        placement={'topRight '}
                        autoAdjustOverflow={true}
                        title={renderTooltip(parent, a)}
                        getPopupContainer={triggerNode => triggerNode.parentNode}
                      >
                        <div className={` ${styles['child_chunks_wrap']}`}>
                          <div className={styles['chunks_list_item_content_parent_item_title']}></div>{' '}
                          <div className={styles['chunks_list_item_content_parent_item_content']}>
                            <ReactMarkdown remarkPlugins={[remarkBreaks]}>{parent.content}</ReactMarkdown>
                          </div>
                        </div>
                      </Tooltip>
                    ))
                  ) : (
                    <div
                      className={styles['chunks_list_item_content_parent_item']}
                      style={{ height: 'calc(100vh - 250px)' }}
                    >
                      <ReactMarkdown remarkPlugins={[remarkBreaks]}>{chunk.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <Divider style={{ width: '100%', margin: 0 }}></Divider>
          <div className={styles['search_detail_attachment']}>
            <div className={styles['search_detail_attachment_header']}>
              <div className={styles['search_detail_attachment_header_line']}></div>
              附件
            </div>
            <div className={styles['search_detail_attachment_list']}>
              <div className={styles['search_right_content_footer_left']}>
                <img
                  alt=''
                  src={documentImg}
                />
                {chunk.title}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  )
})

export default SegmentTestDrawer
