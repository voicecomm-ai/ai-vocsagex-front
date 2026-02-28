import styles from "./page.module.css";
import { Form, Select, Popover } from "antd";
import {
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";

const ModelSelect = forwardRef((props, ref) => {
  const [modelList, setModelList] = useState([]);
  const [modelInfo, setModelInfo] = useState(null);
  const [modelId, setModelId] = useState(null);
  //模型列表变化事件
  useEffect(() => {
    if (props.modelList && props.modelList.length > 0) {
      modelDefaultSelectedEvent(props.modelList);
      setModelList(props.modelList);
    }
  }, [props.modelList, props.modelId]);

  //模型默认选中事件
  const modelDefaultSelectedEvent = (arr) => {
    let defaultModel = arr.find((item) => item.id === props.modelId);
    if (defaultModel) {
      setModelInfo(defaultModel);
      setModelId(defaultModel.id);
    } else {
      let model = props.model || null;
      setModelInfo(model ? model : null);
      setModelId(model ? model.id : null);
    }
  };

  // 模型选择下拉项渲染函数
  const labelRender = (props) => {
    const { label, value } = props;
    if (modelInfo) {
      return (
        <div className={styles["model_label_render"]}>
          {modelInfo.iconUrl && (
            <img
              className={styles["model_label_render_img"]}
              src={process.env.NEXT_PUBLIC_API_BASE + modelInfo.iconUrl}
            />
          )}
          <div className={styles["model_label_render_title"]}>
            {modelInfo.name}
          </div>
          <div className={styles["model_label_render_type"]}>
            {modelInfo.classificationName ? modelInfo.classificationName : null}
          </div>
          {modelInfo && modelInfo.tagList && modelInfo.tagList.length > 0 && (
            <div className={styles["model_label_render_tag"]}>
              {modelInfo && modelInfo.tagList.map((tag) => tag.name).join(",")}
            </div>
          )}
        </div>
      );
    }
    return <span>请选择模型</span>;
  };
  // 模型选择下拉项自定义渲染函数
  const popupRender = (originalElement) => {
    return (
      <div>
        {modelList.map((model) => {
          // 判断当前模型是否为选中状态
          const isSelected = model.id === modelId;
          return (
            <div
              key={model.id}
              // 根据选中状态添加不同的类名
              className={`${styles["model_select_item"]} ${
                isSelected ? styles["model_select_item_selected"] : ""
              }`}
              // 绑定点击事件，触发选择操作
              onClick={() => {
              
                setModelId(model.id);
                // 调用更新模型信息的函数
                let updateData = {
                  modelId: model.id,
                  modelName: model.name,
                  ...model,
                };
                setModelInfo(updateData);
                props.onChange(updateData);
              }}
            >
              {model.iconUrl && (
                <img
                  className={styles["model_label_render_img"]}
                  src={process.env.NEXT_PUBLIC_API_BASE + model.iconUrl}
                />
              )}
              <div className={styles["model_label_render_title"]}>
                {model.name}
              </div>
              <div className={styles["model_label_render_type"]}>
                {model.classificationName ? model.classificationName : null}
              </div>
              {model && model.tagList && model.tagList.length > 0 && (
                <div className={styles["model_label_render_tag"]}>
                  {model && model.tagList.map((tag) => tag.name).join(",")}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  //选择模型事件
  const selectChange = (value) => {
    let modelInfo = modelList.find((item) => item.id === value);
    setModelInfo(modelInfo);
    //更新模型信息到智能体
    let updateData = {
      modelId: value,
      modelName: modelInfo.name,
    };
    props.onChange(updateData);
  };
  // 模型选择弹框内容
  const popoverContent = () => (
    <div className={styles["model_select_content"]}>
      <div className={styles["model_select_content_header"]}>
        <div className={styles["model_select_content_header_title"]}>
          模型选择
        </div>
        <Select
          disabled={!props.canCreate}
          value={modelId}
          labelRender={labelRender}
          onChange={selectChange}
          placeholder="请选择模型"
          fieldNames={{ label: "name", value: "id" }}
          options={modelList}
          style={{
            height: "36px",
          }}
          variant="borderless"
          classNames={{
            root: styles["model_select_content_select"],
          }}
          // 自定义下拉项渲染函数
          popupRender={popupRender}
        ></Select>
      </div>
      <div className={styles["model_select_content_parameter"]}>参数配置</div>
      <div className={styles["model_select_parameter_content"]}>暂无数据</div>
    </div>
  );

  return (
    <Popover
      className={styles["popover_content"]}
      classNames={{
        root: styles["popover_content_root"],
      }}
      placement="bottomLeft"
      arrow={false}
      content={popoverContent}
      trigger="click"
      style={{ borderRadius: "16px" }}
    >
      <div className={styles["agent_container_right_header_model"]}>
        {modelInfo ? (
          <div className={styles["model_label_render"]}>
            {modelInfo.iconUrl && (
              <img
                className={styles["model_label_render_img"]}
                src={process.env.NEXT_PUBLIC_API_BASE + modelInfo.iconUrl}
                alt={modelInfo.name}
              />
            )}
            <div className={styles["model_label_render_title"]}>
              {modelInfo.name}
            </div>
            {modelInfo.classificationName && (
              <div className={styles["model_label_render_type"]}>
                {modelInfo.classificationName}
              </div>
            )}
            {modelInfo.tagList && modelInfo.tagList.length > 0 && (
              <div className={styles["model_label_render_tag"]}>
                {modelInfo.tagList.map((tag) => tag.name).join(",")}
              </div>
            )}
          </div>
        ) : (
          <div className={styles["model_label_render"]}>请选择模型</div>
        )}
        <div className={styles["agent_container_right_header_model_img"]}>
          <img src="/agent/model.png" alt="模型" />
        </div>
      </div>
    </Popover>
  );
});

export default ModelSelect;
