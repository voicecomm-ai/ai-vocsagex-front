'use client'

import { AntdRegistry } from '@ant-design/nextjs-registry';
import './globals.css'
import { useEffect } from 'react';
import { ConfigProvider } from "antd";
import zhCN from 'antd/locale/zh_CN';
import { useRef } from 'react';
import { rsa } from '@/utils/rsa';

export default function RootLayout({children}) {
    
    // 页面初始化
    useEffect(() => {
        // 初始化
    }, []);
    //获取用户信息
    const getUserInfoEvent = () => {
        //获取用户信息
    }
    //获取菜单列表


    return (
        <html lang="en">
        <head>
            <title>VoCSageX</title>
             <meta charSet="utf-8" />
        </head>
        <body style={{
            margin: '0',
            height: '100vh',
        }}>
   <AntdRegistry>
   <ConfigProvider locale={zhCN}  theme={{
     components: {
        Button: {
            borderRadius: 8,
        },
        Input: {
            borderRadius: 8,
        },
         Message: {
          zIndexPopup:'10001'
      },
      },
        token: {
          colorBgMask:"rgba(16,26,40,0.5)"
        },
      }}> {children}
   </ConfigProvider>
   </AntdRegistry>
        </body>
        </html>
    );
}
