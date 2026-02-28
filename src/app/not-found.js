
'use client'
import React from 'react';
import { Button, Result } from 'antd';
import { usePathname, useRouter  } from 'next/navigation';


export default function NotFoundPage() {
    const router =useRouter();
  //返回首页
  const backEvent =()=>{
    router.push("/main")
  }

  return(
    <Result
    status="404"
    title="404"
    subTitle="抱歉，您访问的页面不存在"
 
  />
  )
}