"use client";

import { Button, Checkbox, Form, Input, Space, message,Carousel  } from "antd";
import { UserOutlined, LockOutlined, SafetyOutlined } from "@ant-design/icons";
import React, { useState, useEffect, useRef } from "react";
import styles from "./page.module.css";
import Cookies from "js-cookie";
import { getCheckCode, login } from "@/api/login";
import { useRouter } from "next/navigation";
import { rsa } from "@/utils/rsa";
export default function LoginPage() {
  const userPwdRef = useRef();
  const router = useRouter();
  //登录验证码base64
  const [codeImg, setCodeImg] = useState("");
  // 提交loading
  const [loading, setLoading] = useState(false);
  //初始化
  useEffect(() => {
    sessionStorage.clear(); //获取菜单失败清除所有
    Cookies.remove("userToken"); //删除普通的cookie
    getCheckCodeEvent();
  }, []);

  const handleUserPwdSubmit = (values) => {
    // 提交表单
    let loginData = new FormData();
    setLoading(true);
    loginData.append("account", values.userName.trim());
    loginData.append("password", rsa(values.password));
    loginData.append("captchaImage", values.captchaImage);
    loginData.append("grant_type", "password");
    // 登录
    login(loginData)
      .then((response) => {
        const { data } = response;
        Cookies.set("userToken", data.access_token, {
          expires: data.expires_in,
        });
        //处理登录成功获取菜单
        handleLoginSuccess();
      })
      .catch((err) => {
        setLoading(false);
        getCheckCodeEvent();
        console.log(err);
      });
  };
  //处理登录成功获取菜单
  const handleLoginSuccess = () => {
    router.push("/");
  };

  const getCheckCodeEvent = () => {
    //获取登录验证码
    getCheckCode()
      .then((res) => {
        let imgData = "data:image/png;base64," + res.data;
        setCodeImg(imgData);
      })
      .catch((err) => {});
  };
  return (
    <div className={styles["login_container"]}>
      {/* 左上角Logo */}
      <div className={styles["top_logo"]}>
        <img src="/login/logo.png" alt="Logo" />
      </div>

      {/* 左侧平台介绍区域 */}
      <div className={styles["login_left_section"]}>
        <div className={styles["platform_content"]}>
          <div className={styles["platform_title"]}>
            企业级<span className={styles["highlight_blue"]}>AI智能体</span>开发平台，快速搭应用
          </div>
          <div className={styles["platform_description"]}>
            <div className={styles["feature_tag"]}>开发效率高</div>
            <div className={styles["divider"]}></div>
            <div className={styles["feature_tag"]}>智能性突出</div>
            <div className={styles["divider"]}></div>
            <div className={styles["feature_tag"]}>易扩展适配</div>
            <div className={styles["divider"]}></div>
            <div className={styles["feature_tag"]}>多场景可用</div>
            <div className={styles["divider"]}></div>
            <div className={styles["feature_tag"]}>集成更简便</div>
          </div>
         <div className={styles["platform_image_container"]}> 
         <Carousel autoplay autoplaySpeed={3000} dots={ {className:styles.carousel_dots}}>
    <div className={styles["platform_image"]}>
      <img src="/login/left_main.png" alt="平台展示" />
    </div>
    <div className={styles["platform_image"]}>
    <img src="/login/login_two.png" alt="平台展示" />
     
    </div>
    <div className={styles["platform_image"]}>
    <img src="/login/login_three.png" alt="平台展示" />
    </div>
 
  </Carousel>
          </div> 
        </div>
      </div>

      {/* 右侧登录表单区域 */}
      <div className={styles["login_right_section"]}>
        <div className={styles["login_form_wrapper"]}>
          <div className={styles["login_form_container"]}>
            <div className={styles["login_header"]}>
              <div className={styles["login_title"]}>
                欢迎登录
                <img
                  className={styles["brand_logo"]}
                  src="/login/right_logo.png"
                />
              </div>
              <div className={styles["login_subtitle"]}>
                一款无代码快速搭建大模型 AI 应用的开发平台
              </div>
            </div>

            <Form
              ref={userPwdRef}
              name="basic"
              autoComplete="off"
              onFinish={handleUserPwdSubmit}
              className={styles["login_form"]}
            >
              <Form.Item
                name="userName"
                rules={[{ required: true, message: "请输入账号" }]}
                className={styles["form_item"]}
              >
                <Input
                  className={styles["form_input"]}
                  size="large"
                  prefix={<UserOutlined className={styles["input_icon"]} />}
                  placeholder="请输入账号"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[{ required: true, message: "请输入密码" }]}
                className={styles["form_item"]}
              >
                <Input.Password
                  className={styles["form_input"]}
                  size="large"
                  prefix={<LockOutlined className={styles["input_icon"]} />}
                  placeholder="请输入密码"
                />
              </Form.Item>

              <Form.Item className={styles["form_item"]}>
                <div className={styles["captcha_row"]}>
                  <Form.Item
                    name="captchaImage"
                    noStyle
                    rules={[{ required: true, message: "请输入验证码" }]}
                  >
                    <Input
                      className={styles["form_input"]}
                      prefix={
                        <SafetyOutlined className={styles["input_icon"]} />
                      }
                      size="large"
                      placeholder="请输入验证码"
                    />
                  </Form.Item>
                  <img
                    onClick={getCheckCodeEvent}
                    className={styles["captcha_image"]}
                    src={codeImg}
                  />
                </div>
              </Form.Item>

              {/* <Form.Item
                name="agreement"
                valuePropName="checked"
                rules={[{ required: true, message: "请阅读并同意用户协议" }]}
                className={styles["agreement_item"]}
              >
                <Checkbox className={styles["agreement_checkbox"]}>
                  <span className={styles["agreement_text"]}>
                    已阅读并同意
                    <a href="#" className={styles["agreement_link"]}>
                      《用户服务条款》
                    </a>
                    <a href="#" className={styles["agreement_link"]}>
                      《隐私协议》
                    </a>
                  </span>
                </Checkbox>
              </Form.Item> */}

              <Form.Item className={styles["login_button_item"]}>
                <Button
                  size="large"
                  className={styles["login_button"]}
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                >
                  登录
                </Button>
              </Form.Item>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
