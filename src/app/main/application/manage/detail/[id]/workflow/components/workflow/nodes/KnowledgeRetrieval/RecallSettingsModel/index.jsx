"use client";

import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect 
} from "react";
import Image from "next/image";
import {
  Modal,
  Button,
  Form,
  Input,
  Select,
  InputNumber,
  Slider,
  Switch,
  Tooltip,
} from "antd";
import { getAgentModelList } from "@/api/agent";

import styles from "./style.module.css";

const RecallSettingsModel = forwardRef((props, ref) => {
  const formRef = useRef(null);

  const [form] = Form.useForm();

  const [open, setOpen] = useState(false);
  const [rerankModelList, setRerankModelList] = useState([]); //排序模型
  const [searchModeList, setSearchModeList] = useState([]); //向量模型
  const [loading, setLoading] = useState(false);
  const [optionType, setOptionType] = useState("reranking_model");

  // 检索配置
  const [searchConf, setSearchConf] = useState({
    topK: 4, // 顶部K值。
    score_threshold: 0.8, // 分数阈值。
    enableScore:false,//是否启用Score 阈值
    reranking_mode: "reranking_model", // 重新排序模式。
    reranking_model: {
      id: null, // 模型id
      completion_params: {
        topK: null, // top_k 参数
        temperature: null, // 温度参数
        topP: null, // top_p 参数
        max_tokens: null, // 最大令牌数
        seed: null, // 随机种子
        responseFormat: null, // 响应格式
        repetitionPenalty: null, // 重复惩罚参数
        stop: [], // 停止符列表
      },
    },
    weights: {
      // 权重设置。
      vector_setting: {
        // 向量设置。
        vector_weight: 0.7, // 向量权重。
        embedding_provider_name: null, // 嵌入提供者名称。
        embedding_model_name: null, // 嵌入模型名称。
      },
      keyword_setting: {
        // 关键字设置。
        keyword_weight: 0.3, // 关键字权重。
      },
      model: {
        // 模型
    
        mode: null, // 模式
        id: null, // 模型id
        completion_params: {
          topK: null, // top_k 参数
          temperature: null, // 温度参数
          topP: null, // top_p 参数
          max_tokens: null, // 最大令牌数
          seed: null, // 随机种子
          responseFormat: null, // 响应格式
          repetitionPenalty: null, // 重复惩罚参数
          stop: [], // 停止符列表
        },
      },
    },
    reranking_enable: false, // 是否启用重新排序。
  });
  // 子组件暴露方法
  useImperativeHandle(ref, () => ({
    showModal,
  }));

  // 显示弹窗
  const showModal = (obj) => {
    let  configData =obj.multiple_retrieval_config?obj.multiple_retrieval_config:searchConf;
    setOptionType(configData.reranking_mode);//设置选项类型
    getAgentModelListEvent(configData);
    setOpen(true);
  };

  //获取模型列表
  const getAgentModelListEvent = async (configData) => {
    let data = {
      type: 1,
      tagIdList: [1, 2, 3, 6, 9], //1 文本模型 2 多模态模型 3推理 9 排序
      isShelf: 1,
      isOr: 1,
    }
    let rerankModelId = configData?.reranking_model?.id;//排序模型
    let weightsModelId = configData?.weights?.model?.id;//权重模型
    await getAgentModelList(data)
      .then(res => {
        let data = res.data || []
        //向量模型
        let searchModeArr = data.filter(item => {
          if (item.classification) {
            return item.classification == 6;
          }
          return false
        })
        setSearchModeList(searchModeArr)//向量模型 
          // 查找当前权重模型（向量模型）是否在向量模型数组中
          let currentWeightsModel = searchModeArr.find(item => {
            return item.id === weightsModelId
          })
          // 如果当前权重模型存在，则使用原有ID，否则默认取第一个向量模型的ID
          weightsModelId = currentWeightsModel ? weightsModelId : searchModeArr[0].id;

          // 排序模型
          // 从所有模型中过滤出分类为9的模型（即排序模型）
          let rerankModelArr = data.filter(item => {
            if (item.classification) {
              return item.classification == 9;
            }
            return false
          })
          console.log(rerankModelArr,'rerankModelArr');
          // 查找当前排序模型是否在排序模型数组中
          let currentRerankModel = rerankModelArr.find(item => {
            return item.id === rerankModelId
          })
          // 如果当前排序模型存在，则使用原有ID，否则默认取第一个排序模型的ID
          rerankModelId = currentRerankModel ? rerankModelId : rerankModelArr[0].id;
          console.log(configData, 'rerankModelId');
          configData.reranking_model.id = rerankModelId;
          configData.weights.model.id = weightsModelId;
         setSearchConf(configData);  
        setRerankModelList(rerankModelArr)
        setLoading(false)
    
      })
      .catch(err => {
        console.log(err,'err');
        setLoading(false)
      })
  }
  // 关闭事件
  const modelCancelEvent = () => {
    setOpen(false);
    formRef.current.resetFields();
  };
  const classNames = {
    content: styles["my-modal-content"],
  };

  // 提交事件
  const submitEvent = async (e) => {
    e.preventDefault();
    props.updateCallBackEvent(searchConf)
    setOpen(false);
  };

  // 选择召回配置选项
  const handleSelectSeting = (parString) => {
    if(props.readOnly) return;
    setOptionType(parString);
    setSearchConf((prev) => ({
      ...prev,
      reranking_mode: parString,
    }));
  };


  // 权重配置slider
  const handleSlider = (value) => {
    setSearchConf(prev => ({
      ...prev,
      weights: {
        ...prev.weights,
        vector_setting: {
          ...prev.weights?.vector_setting,
          vector_weight: value,
        },
        keyword_setting: {
          ...prev.weights?.keyword_setting,
          keyword_weight: Number((1 - value).toFixed(2)),
        },
        model: {
          ...prev.weights?.model,
        },
      },
    }));
  }


  //选择排序模型
  const handleSelectedModel = (itemPar) => {
    setSearchConf({
      ...searchConf,
      reranking_model: {
        ...searchConf.reranking_model,
        id: itemPar
      }
    })
  };
   //选择权重模型
   const handleWeightModel = (itemPar) => {
    setSearchConf({
      ...searchConf,
      weights: {
        ...searchConf.weights,
        model: {
          ...searchConf.weights.model,
          id: itemPar
        }
      }
    })
   }

  // 处理是否开启Score 阈值
  const handleSetEnableScore = (evalPar) => {
    setSearchConf({
      ...searchConf,
      enableScore: evalPar
    })

  }


  // 权重配置
  const weightConfiguration = () => {
    return (
      <div className={styles["weightConfiguration_con"]}>
        <div>
          <Form
            ref={formRef}
            name="basic"
            layout={"vertical"}
            wrapperCol={{
              span: 24,
            }}
            initialValues={{
              maxLength: 48,
              required: true,
            }}
            autoComplete="off"
            disabled={props.readOnly}
          >
            <Form.Item
             label="Embedding 模型"
              name="name"
              required
           
           
            >
              <div className={styles["conf_rerank_select"]}>
                <Select
                  style={{ width: "100%" }}
                  placeholder="请选择模型"
                  value={searchConf.weights.model.id}
                  onChange={handleWeightModel}
                >
                  {searchModeList.map((item) => (
                    <Select.Option
                      key={item.id}
                      value={item.id}
                      label={item.name}
                    >
                      {item.name}
                    </Select.Option>
                  ))}
                </Select>
              </div>
            </Form.Item>
            <Form.Item label="" name="name" required>
              <div className={styles["conf_rerank_content_item_sliderqzpz"]}>
                {/* <Slider
                  step={0.01}
                  min={0}
                  max={1}
                  onChange={(value) =>
                    setSearchConf({ ...searchConf, weights: value })
                  }
                  value={searchConf.weights.vector_setting.vector_weight}
                /> */}
                <Slider
                  step={0.1}
                  min={0.0}
                  max={1.0}
                  onChange={handleSlider}
                  value={searchConf.weights.vector_setting.vector_weight}
                />
                <div className={styles["conf_rerank_sliderqzpznum"]}>
                  <div className={styles["conf_rerank_sliderqzpznuma"]}>
                    语义{searchConf.weights.vector_setting.vector_weight}
                  </div>
                  <div className={styles["conf_rerank_sliderqzpznumb"]}>
                    {Math.round((1.0 - searchConf.weights.vector_setting.vector_weight) * 100) / 100}
                    关键词
                  </div>
                </div>
              </div>
            </Form.Item>
            <Form.Item label="" name="name" required>
              <div className={styles["conf_rerank_content_item"]}>
                <div className={styles["conf_rerank_content_item_title"]}>
                  Top K
                  <Tooltip title="用于筛选与用户问题相似度最高的文本片段。系统同时会根据选用模型上下文窗口大小动态调整分段数量">
                    <Image
                      src="/agent/info.png"
                      alt=""
                      width="16"
                      height="16"
                    />
                  </Tooltip>
                </div>
                <div className={styles["conf_rerank_content_item_content"]}>
                  <InputNumber
                    min={1}
                    max={10}
                    step={1}
                    onChange={(value) =>
                      setSearchConf({
                        ...searchConf,
                       topK: value ? parseInt(value) : searchConf.topK,
                      })
                    }
                    value={searchConf.topK}
                  />
                  <div className={styles["conf_rerank_content_item_slider"]}>
                    {" "}
                    <Slider
                      onChange={(value) =>
                        setSearchConf({ ...searchConf, topK: value })
                      }
                      value={searchConf.topK}
                      min={1}
                      max={10}
                    />{" "}
                  </div>
                </div>
              </div>
            </Form.Item>
            <Form.Item name="name">
              <div className={styles["conf_rerank_content_item"]}>
                <div className={styles["conf_rerank_content_item_title"]}>
                  <Switch
                    defaultChecked
                    size="small"
                    disabled={props.readOnly}
                    checked={searchConf.enableScore}
                  
                    onChange={handleSetEnableScore}
                  />
                  Score 阈值
                  <Tooltip title="用于设置文本片段筛选的相似度阈值">
                    <Image
                      src="/agent/info.png"
                      alt=""
                      width="16"
                      height="16"
                    />
                  </Tooltip>
                </div>
                <div className={styles["conf_rerank_content_item_content"]}>
                  <InputNumber
                    step={0.01}
                    min={0}
                    max={1}
                    disabled={!searchConf.enableScore||props.readOnly}
                    onChange={(value) =>
                      setSearchConf({
                        ...searchConf,
                        score_threshold: value,
                      })
                    }
                    value={searchConf.score_threshold}
                  />
                  <div className={styles["conf_rerank_content_item_slider"]}>
                    {" "}
                    <Slider
                      disabled={!searchConf.enableScore||props.readOnly}
                      step={0.01}
                      min={0}
                      max={1}
                      onChange={(value) =>
                        setSearchConf({ ...searchConf, score_threshold: value })
                      }
                      value={searchConf.score_threshold}
                    />{" "}
                  </div>
                </div>
              </div>
            </Form.Item>
          </Form>
        </div>
      </div>
    );
  };
  // Rerank 模型
  const rerankModel = () => {
    return (
      <div className={styles["weightConfiguration_con"]}>
        <div>
          <Form
            ref={formRef}
            name="basic"
            layout={"vertical"}
            wrapperCol={{
              span: 24,
            }}
            initialValues={{
              maxLength: 48,
              required: true,
            }}
            autoComplete="off"
            disabled={props.readOnly}
          >
            <Form.Item
              label="RERANK 模型"
              name="name"
              required
              tooltip="重排序模型将根据候选文档列表与用户问题语义匹配度进行重新排序，从而改进语义排序的结果"
            >
              <div className={styles["conf_rerank_select"]}>
                <Select
                  style={{ width: "100%" }}
                  placeholder="请选择模型"
                  value={searchConf.reranking_model.id}
                  onChange={handleSelectedModel}
                >
                  {rerankModelList.map((item) => (
                    <Select.Option
                      key={item.id}
                      value={item.id}
                      label={item.name}
                    >
                      {item.name}
                    </Select.Option>
                  ))}
                </Select>
              </div>
            </Form.Item>
            <Form.Item label="" name="name" required>
              <div className={styles["conf_rerank_content_item"]}>
                <div className={styles["conf_rerank_content_item_title"]}>
                  Top K
                  <Tooltip title="用于筛选与用户问题相似度最高的文本片段。系统同时会根据选用模型上下文窗口大小动态调整分段数量">
                    <Image
                      src="/agent/info.png"
                      alt=""
                      width="16"
                      height="16"
                    />
                  </Tooltip>
                </div>
                <div className={styles["conf_rerank_content_item_content"]}>
                  <InputNumber
                    min={1}
                    max={10}
                    step={1}
                    onChange={(value) =>
                      setSearchConf({
                        ...searchConf,
                        topK: value ? parseInt(value) : searchConf.topK,
                      })
                    }
                    value={searchConf.topK}
                  />
                  <div className={styles["conf_rerank_content_item_slider"]}>
                    {" "}
                    <Slider
                      onChange={(value) =>
                        setSearchConf({ ...searchConf, topK: value })
                      }
                      value={searchConf.topK}
                      min={1}
                      max={10}
                    />{" "}
                  </div>
                </div>
              </div>
            </Form.Item>
            <Form.Item name="name">
              <div className={styles["conf_rerank_content_item"]}>
                <div className={styles["conf_rerank_content_item_title"]}>
                  <Switch
                    defaultChecked
                    size="small"
                    checked={searchConf.enableScore}
                    disabled={props.readOnly}
                    onChange={handleSetEnableScore}
                  />
                  Score 阈值
                  <Tooltip title="用于设置文本片段筛选的相似度阈值">
                    <Image
                      src="/agent/info.png"
                      alt=""
                      width="16"
                      height="16"
                    />
                  </Tooltip>
                </div>
                <div className={styles["conf_rerank_content_item_content"]}>
                  <InputNumber
                    step={0.01}
                    min={0}
                    max={1}
                    disabled={!searchConf.enableScore||props.readOnly}
                    onChange={(value) =>
                      setSearchConf({
                        ...searchConf,
                        score_threshold: value,
                      })
                    }
                    value={searchConf.score_threshold}
                  />
                  <div className={styles["conf_rerank_content_item_slider"]}>
                    {" "}
                    <Slider
                      disabled={!searchConf.enableScore}
                      step={0.01}
                      min={0}
                      max={1}
                      onChange={(value) =>
                        setSearchConf({ ...searchConf, score_threshold: value })
                      }
                      value={searchConf.score_threshold}
                    />{" "}
                  </div>
                </div>
              </div>
            </Form.Item>
          </Form>
        </div>
      </div>
    );
  };

  return (
    <Modal
      open={open}
      title=""
      footer={null}
      width="480px"
      closable={false}
      onCancel={modelCancelEvent}
      classNames={classNames}
      zIndex={10000}
    >
      <div className={styles["recallsettingsmodel_con"]}>
        <div className={styles["recallsettingsmodel_header_zhsz"]}>
          <div className={styles["recallsettingsmodel_header_title"]}>
            召回设置
          </div>
          <div className={styles["settings_header_subtitle"]}>
          默认情况下使用多路召回。从多个知识库中检索知识，然后重新排序。
          </div>
        </div>
        <div className={styles["recallsettings_content"]}>
          <div className={styles["recallsettings_content_selectcon"]}>
            <div
              className={`${styles["content_selectcon_common"]} ${optionType === "weighted_score"
                ? styles["content_selectcon_commonactive"]
                : ""
                }`}
              onClick={() => handleSelectSeting("weighted_score")}
            >
              <Image
                src="/workflow/zsjzqzsz_icon.png"
                alt=""
                width="32"
                height="32"
              />
              <div className={styles["content_selectcon_qzpztxt"]}>
                <span className={styles["content_selectcon_qzpztxtspan"]}>
                  权重配置
                </span>
              <Tooltip title="通过调整分配的权重，重新排序策略确定是优先进行语义匹配还是关键字匹配。">
                <Image
                  src="/workflow/zsjsquestion_icon.png"
                  alt=""
                  width="20"
                  height="20"
                ></Image>
                </Tooltip>
              </div>
            </div>
            <div
              className={`${styles["content_selectcon_common"]} ${optionType === "reranking_model"
                ? styles["content_selectcon_commonactive"]
                : ""
                }`}
              onClick={() => handleSelectSeting("reranking_model")}
            >
              
              <Image
                className={styles["custom_node_header_icon"]}
                src="/workflow/zsjsrmm_icon.png"
                alt=""
                width="32"
                height="32"
              />
              <div className={styles["content_selectcon_qzpztxt"]}>
                <span className={styles["content_selectcon_qzpztxtspan"]}>
                  Rerank 模型
                </span>
                <Tooltip title="重排序模型将根据候选文档列表与用户问题语义匹配度进行重新排序，从而改进语义排序的结果">
                <Image
                  src="/workflow/zsjsquestion_icon.png"
                  alt=""
                  width="20"
                  height="20"
                ></Image>
                </Tooltip>
              </div>
            </div>
          </div>
          {optionType === "weighted_score"
            ? weightConfiguration()
            : rerankModel()}
        </div>
        <div className={styles["add_variable_content_footer"]}>
          <Button
            className={styles["knowledge_cancel"]}
            onClick={modelCancelEvent}
          >
            取消
          </Button>
          <Button
          disabled={props.readOnly}
            onClick={submitEvent}
            className={styles["knowledge_save"]}
            type="primary"
          >
            保存
          </Button>
        </div>
      </div>
    </Modal>
  );
});

export default RecallSettingsModel;
