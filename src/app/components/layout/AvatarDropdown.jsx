
"use client";
import styles from "../page.module.css";
import { Dropdown, Menu, Avatar, Popover, ConfigProvider,Typography } from "antd";
import { RightOutlined, UserOutlined } from "@ant-design/icons";
import Cookies from "js-cookie";
import { logout } from "@/api/login";
import { useRouter } from "next/navigation";
import UpdatePwd from './../User/UpdatePwd';
import UserInfoModel from './../User/Info';
import { getCurUserInfo } from "@/api/login";
import React, { useState, useEffect, useRef } from'react';
import {useStore} from '@/store/index'

const AvatarDropdown = ({children}) => {
  const { Paragraph, Text } = Typography;
  const  setUser = useStore((state) => state.setUser); //设置用户信息
  const router = useRouter();
  const  updatePwdRef =useRef(); //修改密码组件ref
  const  userInfoRef =useRef(); //个人用户信息组件ref
  const user = useStore((state) => state.user); //用户信息
  const handleLogoutEvent = () => {
    //处理登出事件
    let accessToken = Cookies.get("userToken"); //用户token
    if (accessToken) {
      //当正常退出时
      let logoutData = new FormData();
      logoutData.append("accessToken", Cookies.get("userToken"));
      logout(logoutData).then((res) => {
        handleLogout();
      });
    } else {
      //当token过期退出时
      handleLogout();
    }
  };
  //处理登出成功事件
  const handleLogout = () => {
    Cookies.remove("userToken"); //删除登录的cookie
    router.push("/login");
  };
  //处理修改密码事件
  const handleUpdatePwdEvent = () => {
    updatePwdRef.current.showModal('',1); //显示修改密码组件
  };
  const popoverChange=(open)=>{
    if(open){
      getUserInfoEvent(); //获取用户信息事件
    }
  }
    //获取用户信息事件
    const getUserInfoEvent = () => {
      //获取用户信息
      getCurUserInfo().then((res) => {
        setUser(res.data);
      })
    }
  //处理个人用户信息事件
  const handleUserEvent = () => {
    userInfoRef.current.showModal(); //显示个人用户信息组件
  };
  const content = (
    <div className={styles["popover_content"]}>
      <div className={styles["popover_content_user"]}>
      <div className={styles["popover_content_user_content"]}>
      <div className={styles["popover_content_avatar"]}>
        <Avatar
          size={24}
          className={styles.avatar}
          src={'/avatar.png'}
          alt="avatar"
        />
     </div>
        <div className={styles["popover_content_userName"]}>
        <Paragraph className={styles["popover_content_Paragraph"]} ellipsis={{ rows: 2, expandable: false}}>{user?user.username:null}</Paragraph> </div>
      </div>
      </div>
      <div className={styles["popover_content_item"]} onClick={handleUserEvent}>
      <div className={styles["popover_content_item_content"]}>
      <img className={styles["popover_content_item_logo"]}  src='/layout/user.png'   />
        个人信息</div>   <img className={styles["popover_content_item_right"]}  src='/layout/right.png'   />
       </div>
       <div className={styles["popover_content_item"]} onClick={handleUpdatePwdEvent}>
       <div className={styles["popover_content_item_content"]}>
       <img className={styles["popover_content_item_logo"]}  src='/layout/pwd.png'   />
        修改密码</div>   <img className={styles["popover_content_item_right"]}  src='/layout/right.png'   />
       </div>
       <div className={styles["popover_content_item_logout"]} onClick={handleLogoutEvent}>
       <img className={styles["popover_content_item_logo"]}  src='/layout/logout.png'   />
        退出登录
        </div>
    </div>
  );
  return (
    <div className={styles["avatar_container"]}>
    <ConfigProvider
      theme={{
        token: {
          // Seed Token，影响范围大
          padding: "0",
          borderRadius: 16,
          colorBgContainer:'rgba(255, 255, 255, 0.1)', //背景颜色
          border: "1px solid #DDDFE4",
        },
      }}
    >
      <Popover
        className={styles["popover_content"]}
        placement="bottomLeft"
        arrow={false}
        trigger="click"
        content={content}
        onOpenChange={popoverChange}
      >
        <div className={styles["avatar_container"]}>
        <Avatar
          size={20}
          className={styles.avatar}
          src={'/avatar.png'}
          alt="avatar"
        />
        {children}
        </div>
      </Popover>
      {/* 修改密码 */}
   
    </ConfigProvider>
    {/* 修改密码 */}
       <UpdatePwd  ref={updatePwdRef}> </UpdatePwd>
       {/* 个人用户信息 */}
       <UserInfoModel ref ={userInfoRef}> </UserInfoModel>
       </div>   
  );
};

export default AvatarDropdown;
