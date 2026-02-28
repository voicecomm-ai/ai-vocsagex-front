import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
} from "react";
import { Form, Input } from "antd";
const { TextArea } = Input;
import runStyle from "./run.module.css";
import { message } from "antd";
import { useStore } from "@/store/index";
const ArgInput = forwardRef((props, ref) => {
  const { readOnly } = useStore((state) => state);

  //复制内容
  const handleCopy = () => {
    navigator.clipboard.writeText(props.value).then(() => {
      message.success("复制成功");
    });
  };

  //全屏
  const toggleFullscreen = () => {
    let status = !props.argFullscreen;
    props.onFullscreen(status, props.item, props.index);
  };
  //处理输入变化事件
  const handleChange = (e) => {
    let value = e.target.value;
    props.onChange(value);
  };
  //处理删除事件
  const handleDelete = () => {
    props.onDelete(props.item.id);
  };
  
  return (
    <div className={`${runStyle["arg_input"]} ${props.argFullscreen ? runStyle["arg_input_fullscreen"] : ""}`}>
      <div className={runStyle["arg_input_header"]}>
        <div className={runStyle["arg_input_header_title"]}>{props.label}</div>
        <div className={runStyle["arg_input_header_right"]}>
          {props.labelLength > 1 && (
          <img
            onClick={() => {
              handleDelete();
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.src = "/workflow/common/delete_hover.png")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.src = "/workflow/common/delete.png")
            }
            className={`${runStyle["arg_input_header_right_del"]} ${
              readOnly ? "readOnly" : ""
            }`}
            src="/workflow/common/delete.png"
            alt=""
          />
          )}
          <img src="/workflow/json_copy.png" alt="" onClick={handleCopy} />
          {props.argFullscreen && (
            <img src="/workflow/common/zoom.png" alt="" onClick={toggleFullscreen} />
          )}
          {!props.argFullscreen && (
            <img src="/workflow/json_full.png" onClick={toggleFullscreen} />
          )}
        </div>
      </div>
      <div className={runStyle["arg_input_content"]}>
        <TextArea
          bordered={false}
          placeholder="请输入"
          value={props.value}
          autoSize={{ minRows: 3, maxRows: 116 }}
          onChange={handleChange}
          classNames={{ root: runStyle["arg_input_content_textarea"] }}
        
        />
      </div>
    </div>
  )
})
export default ArgInput
