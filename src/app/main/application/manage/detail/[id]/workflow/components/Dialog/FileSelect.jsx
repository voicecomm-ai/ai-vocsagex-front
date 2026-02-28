import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
} from "react";
import styles from "./dialog.module.css";
import { Select, Tag, Input,message,Tooltip } from "antd";
import { PlusOutlined } from "@ant-design/icons";
const FileSelect = forwardRef((props, ref) => {
  const [selectArr, setSelectArr] = useState([]);
  const [tagList, setTagList] = useState([]);
  const [inputVisible, setInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef(null);

  //获取模型列表
  useImperativeHandle(ref, () => ({
    setDetailEvent,
    clearDataEvent
  }));
  const tagInputStyle = {
    height: 22,
    borderStyle: "dashed",
    width: 100,
    background: '#fff',
    borderRadius: '6px',
    border: '1px solid #DDDFE4',
    padding: '0 6px',
  };
  const tagPlusStyle = {
    borderStyle: "dashed",
  };
  const fileTypeList = [
    {
      label: "文档",
      value: "document",
      desc: "TXT, MD, MDX, MARKDOWN, PDF, HTML, XLSX, XLS, DOC, DOCX, CSV, EML, MSG, PPTX, PPT, XML, EPUB",
    },
    {
      label: "图片",
      value: "image",
      desc: "JPG, JPEG, PNG, GIF, WEBP, SVG",
    },
    {
      label: "音频",
      value: "audio",
      desc: "MP3, M4A, WAV, AMR, MPGA",
    },
    {
      label: "视频",
      value: "video",
      desc: "MP4, MOV, MPEG, WEBM",
    },
  ];

  const clearDataEvent=()=>{
    setTagList([]);
    setSelectArr([]);
    setInputValue('');
  }
  const setDetailEvent = (obj) => {
     if(obj?.allowed_file_types.includes('custom')){
      setTagList(obj?.allowed_file_extensions);
      setSelectArr(["custom"]);

     }
     else{
     setTagList([]);
    setSelectArr(obj?.allowed_file_types);
     }
 
  
  };
  const showInput = () => {
    setInputVisible(true);
  };
  //选择事件
  const selectChange = (value) => {
    let data = selectArr;
    if (data.includes(value)) {
      data = data.filter((item) => item !== value);
    } else {
      if (data.includes("custom")) {
        data = data.filter((item) => item !== "custom").concat(value);
      } else {
        data = [...data, value];
      }
    }

    setSelectArr(data);
    setTagList([]);
    updataFormDataEvent('default',data);

  };
  //删除节点类型
   const delFileTypeEvent =(item,index)=>{
    let data = selectArr.filter((i) => i !== item);
    if(item==='custom'){
      setTagList([]);
      props.onChange('');
    }else{
     if(data.length){ //存在选择的值时
     updataFormDataEvent('default',data);
     }
     else{
      props.onChange('');
     }
    }
    setSelectArr(data);
  }
  //更新数据到表单
  const updataFormDataEvent =(type,data)=>{
    let changeData ={
      type:type,
      data:data,

    }
    props.onChange(changeData);

  }
  useEffect(() => {
    if (selectArr.includes("custom")) {
      let arr =tagList.length?tagList:'';
     updataFormDataEvent('custom',arr);
    }
  }, [tagList]);

  const selectOtherChange = (value) => {
    setSelectArr(["custom"]);
    updataFormDataEvent('custom','');
  };
  useEffect(() => {}, []);
  const labelRender = (props) => {
    const { label, value } = props;

    if (selectArr.length) {
      return (
        <div className={styles["model_label_render"]}>
          {selectArr.map((item,index) => {
            return (
              <div className={styles["file_select_item"]} key={item}>
                <div className={styles["file_select_item_icon"]}>
                  {item === "custom" ? (
                    <img
                      className={styles["file_select_item_icon_img"]}
                      src={"/workflow/custom.png"}
                      alt={item}
                    />
                  ) : (
                    <img
                      className={styles["file_select_item_icon_img"]}
                      src={"/workflow/" + item + ".png"}
                      alt={item}
                    />
                  )}
                </div>
                <div className={styles["file_select_item_title"]}>
                  {item === "custom"
                    ? "其他文件类型"
                    : fileTypeList.find((type) => type.value === item)?.label ||
                      item}
                </div>

                <img
                  onClick={() => {
                   delFileTypeEvent(item,index);

                  }}
                  className={styles["file_select_item_del"]}
                  src={"/close.png"}
                  alt="del"
                ></img>
              </div>
            );
          })}
        </div>
      );
    }
    return <span>请选择支持的文件类型</span>;
  };

  const popupRender = (originalElement) => {
    return (
      <div className={styles["file_select_popup"]}>
        {fileTypeList.map((item) => {
          // 判断当前模型是否为选中状态
          return (
            <div
              onClick={() => {
                selectChange(item.value);
              }}
              key={item.id}
              // 根据选中状态添加不同的类名
              className={`${styles["model_select_item"]} ${
                selectArr.includes(item.value)
                  ? styles["model_select_item_selected"]
                  : ""
              }`}
            >
              <img
                className={styles["model_select_item_img"]}
                src={"/workflow/" + item.value + ".png"}
                alt={item.label}
              />
              <div className={styles["model_select_item_title"]}>
                <div className={styles["model_select_item_title_text"]}>
                  {item.label}
                </div>
                <div className={styles["model_select_item_title_desc"]}>
                  {item.desc}
                </div>
              </div>
            </div>
          );
        })}
        <div
          className={styles["model_select_item_separator"]}
          onClick={() => {
            selectOtherChange("custom");
          }}
        >
          <img
            className={styles["model_select_item_img"]}
            src={"/workflow/custom.png"}
            alt="separator"
          />

          <div className={styles["model_select_item_separator_title"]}>
            其他文件类型
          </div>
        </div>
      </div>
    );
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };
  //文件类型判断是否重复
  const handleInputConfirm = () => {
    if(tagList.includes(inputValue.trim())){
      message.warning('文件拓展名重复');
      return;
    }
    if (inputValue.trim()) {
      setTagList([...tagList, inputValue.trim()]);
      setInputValue("");
    }
    setInputVisible(false);
  };
  const handleClose = (tag) => {
    setTagList(tagList.filter((item) => item !== tag));
  };

  return (
    <div className={styles["file_select"]}>
      <Select
        labelRender={labelRender}
        placeholder="请选择支持的文件类型"
        value={selectArr}
        variant="borderless"
        classNames={{
          root: styles.file_select_select,
        }}
       style={{height: '36px',background:'#F5F9FC'}}
        // 自定义下拉项渲染函数
        popupRender={popupRender}
      ></Select>
      {selectArr.includes("custom") && (
        <div className={styles["file_select_other"]}>
          {tagList.map((tag, index) => {
            const isLongTag = tag.length > 10;
            const tagElem = (
              <Tag
                key={tag}
                closable={true}
                style={{ userSelect: "none",background: '#fff',borderRadius: '6px',border: '1px solid #DDDFE4',padding: '0 6px',lineHeight: '26px',fontSize: '14px',
                  color: '#364052' }}
                onClose={() => handleClose(tag)}
              >
                <span
                  onDoubleClick={(e) => {
                    if (index !== 0) {
                      setEditInputIndex(index);
                      setEditInputValue(tag);
                      e.preventDefault();
                    }
                  }}
                >
                  {isLongTag ? `${tag.slice(0, 10)}...` : tag}
                </span>
              </Tag>
            );
            return isLongTag ? (
              <Tooltip title={tag} key={tag}>
                {tagElem}
              </Tooltip>
            ) : (
              tagElem
            );
          })}
          {inputVisible ? (
            <Input
              ref={inputRef}
              placeholder="请输入文件扩展名"
              type="text"
              size="small"
              maxLength={20}
              autoFocus
              style={tagInputStyle}
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputConfirm}
              onPressEnter={handleInputConfirm}
            />
          ) : (
            <div
            className={styles["file_select_other_plus"]}
              style={tagPlusStyle}
              icon={<PlusOutlined />}
              onClick={showInput}
            >
              + 文件扩展名，例如 .doc
            </div>
          )}
        </div>
      )}
    </div>
  );
});
export default FileSelect;
