
'use client'
import React, { useEffect,useState} from 'react';
import { Button, Result, message } from 'antd';
import { useParams, useRouter  } from 'next/navigation';
import { getApplicationInfoByUrlKey }  from "@/api/chat";


export default function NotFoundPage() {
  const {key} = useParams()
    const router =useRouter();
    const [msg,setMsg] = useState('404');

  //返回首页
  const backEvent =()=>{
    router.push("/main")
  }

  //获取应用信息
  //获取智能体信息
  const getApplicationInfoEvent = () => {
    getApplicationInfoByUrlKey(key)
      .then((res) => {
        let data = res.data;
        message.warning(res.msg);
        setMsg(res.msg);
      })
      .catch((err) => {
        console.log(err,'err')
        console.error("获取智能体信息失败:", err);
      });
  };

  useEffect(()=>{
    getApplicationInfoEvent()
  },[key])

  return(
    <Result
    status="404"
    title={msg}
    subTitle="抱歉，您访问的页面不存在"
 
  />
  )
}