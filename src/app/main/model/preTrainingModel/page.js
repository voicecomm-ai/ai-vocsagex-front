"use client";
import styles from "./page.module.css";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Input,
  Button,
  Segmented,
  ConfigProvider,
  Modal,
  Empty,
  Checkbox,
  Form,
  Select,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import ModelCard from "./components/ModelCard";
import {
  modelCategoryList,
  modelPage,
  modelCategoryUpdate,
  modelCategoryDelete,
  modelDeleteBatch,
  modelShelfBatch,
  updatBatchCategory,
} from "@/api/model";
import PreTrainingDrawer from "./components/PreTrainingDrawer";
import TagModal from "../components/TagModal";
import { checkPermission } from "@/utils/utils";
import DeleteModal from "../components/DeleteModal";
import { useStore } from "@/store/index";
import CustomMultiSelect from "../components/CustomMultiSelect";

const statusOptions = [
  { label: "已上架", key: true },
  { label: "未上架", key: false },
];

const putOnBtnList = [
  {
    name: "批量下架",
    id: "takeOff",
    icon: "take_off_icon",
  },
];
const takeOffBtnList = [
  {
    name: "调整分类",
    id: "category",
    icon: "category_icon",
  },
  {
    name: "批量上架",
    id: "putOn",
    icon: "put_on_icon",
  },
  {
    name: "批量删除",
    id: "delete",
    icon: "red_delete_icon",
  },
];
// 初始查询参数
const resetParams = {
  type: 1, // 类型
  isShelf: true, // 是否上架
  tagIdList: [], //标签id集合
  classificationIdList:[],  // 分类id集合
  current: 1,
  size: 10000000,
  isAuth: true,
};
export default function ModelManagePage() {
  const [searchValue, setSearchValue] = useState(""); //模型名称搜索
  const [classList, setClassList] = useState([]); //模型分类
  const [modelList, setModelList] = useState([]); //模型列表
  const [tagModalVisible, setTagModalVisible] = useState(false); //管理标签
  const [currentCategory, setCurrentCategory] = useState(null); // 新增状态保存 id
  const [preTrainingDrawer, setPreTrainingDrawer] = useState(false); // 算法模型抽屉
  const [modelStatus, setModelStatus] = useState(true); //上下架
  const [queryParams, setQueryParams] = useState(resetParams);
  const [hasPermission, setHasPermission] = useState(false); //按钮权限
  const [allChecked, setAllChecked] = useState(false); //全选
  const [batchBtns, setBatchBtns] = useState(putOnBtnList);
  const [batchBtnStatus, setBatchBtnStatus] = useState(false);
  const [batchCategoryModal, setBatchCategoryModal] = useState(false); //批量修改类型模态框
  const [noBuiltCategory, setNoBuiltCategory] = useState({}); //非内置模型
  const [builtCategory, setbuiltCategory] = useState({}); //内置标签
  const [editModelId, setEditModelId] = useState(null); //编辑id
  const [categoryValue, setCategoryValue] = useState(""); //批量调整分类搜索内容// 定义状态：是否为窄屏（宽度 < 1480）
  const [isNarrowScreen, setIsNarrowScreen] = useState(false);
  // 监听窗口宽度变化
  useEffect(() => {
    // 初始化判断
    const checkScreenWidth = () => {
      setIsNarrowScreen(window.innerWidth < 1568);
    };
    checkScreenWidth();

    // 监听窗口resize
    window.addEventListener("resize", checkScreenWidth);

    // 清除监听
    return () => window.removeEventListener("resize", checkScreenWidth);
  }, []);
  // 获取socket推送更新列表
  const messageUuid = useStore((state) => state.messageUuid);
  const socketData = useStore((state) => state.socketData);
  const { showSecondSide } = useStore((state) => state)
   useEffect(() => {
    if (socketData.msgType === 304) {
      getModelList(queryParams)
    }
  }, [messageUuid]);

    //接收标签选择变化
  const handleSelectedTags = (selectedIds) => {
    const updatedQuery = {
      ...queryParams,
      tagIdList: selectedIds,
      current: 1,
    };
    setQueryParams(updatedQuery);
    getModelList(updatedQuery);
  };

  //获取模型分类
  const getModelCategoryList = async () => {
    const res = await modelCategoryList({ isSquare: 0 });
    setClassList(res.data);
    //存值用于批量调整分类
    const noBuiltList = res.data.find((item) => item.isBuilt === false);
    const builtList = res.data.find((item) => item.isBuilt === true);
    setNoBuiltCategory(noBuiltList);
    setbuiltCategory(builtList);
  };
    //内置标签选择变化
  const handleSelectChange = (values) => {
    const updatedParams = {
      ...queryParams,
      classificationIdList: values,
      current: 1,
    };

    setQueryParams(updatedParams);
    getModelList(updatedParams);
  };

  const openTagModal = (id) => {
    setCurrentCategory(id);
    setTagModalVisible(true);
  };

  //获取模型列表
  const getModelList = useCallback(
    async (params = queryParams) => {
      const res = await modelPage(params);
      const records = res.data.records || [];
      setModelList(records);
    },
    [queryParams]
  );

  //切换上下架
  const changeShelfHandle = (val) => {
    setModelStatus(val);
    setBatchBtns(val ? putOnBtnList : takeOffBtnList);
    const updated = { ...queryParams, isShelf: val, current: 1 };
    setQueryParams(updated);
    getModelList(updated);
    setSelectedKeys([]);
  };
  // 搜索模型名称
  const isFirstRender = useRef(true);
  useEffect(() => {
    //解决从详情页进来会重复请求的问题
    if (isFirstRender.current) {
      isFirstRender.current = false; // 第一次渲染，跳过执行
      return;
    }
    searchModal(); // 非首次渲染才执行
  }, [searchValue]);
  const searchModal = () => {
    const updated = { ...queryParams, name: searchValue, current: 1 };
    setQueryParams(updated);
    getModelList(updated);
  };

  const resetSearch = () => {
    setModelStatus(false);
    setSearchValue("");
    // 完全重置 queryParams，包括 tagIdList
    const resetQueryParams = {
      ...resetParams,
      tagIdList: [],
      classificationIdList: [],
      isShelf: false,
    };

    setQueryParams(resetQueryParams);
    getModelList(resetQueryParams);
  };

  useEffect(() => {
    // 获取 URL 参数中的 modelStatus
    const searchParmas = new URLSearchParams(window.location.search);
    const modelStatusParam = searchParmas.get("modelStatus");

    // 如果存在 modelStatus 参数，转换成布尔值后更新状态并请求列表
    if (modelStatusParam !== null) {
      const parsedStatus = modelStatusParam === "true";
      console.log(parsedStatus, "parsedStatus");
      setModelStatus(parsedStatus);
      setBatchBtns(parsedStatus ? putOnBtnList : takeOffBtnList);

      const updatedParams = {
        ...queryParams,
        isShelf: parsedStatus,
        current: 1,
      };

      setQueryParams(updatedParams);

      getModelList(updatedParams);
    } else {
      // 否则保持默认状态（true）并拉取数据
      getModelList(queryParams);
    }

    // 权限检查与分类初始化
    getModelCategoryList();
    setHasPermission(checkPermission("/main/model/preTrainingModel/operation"));
  }, []);

  // 多选
  const [selectedKeys, setSelectedKeys] = useState([]); // 选中的应用 ID 列表
  //  切换选择状态
  const toggleSelect = (id) => {
    setSelectedKeys((prev) =>
      prev.includes(id) ? prev.filter((key) => key !== id) : [...prev, id]
    );
  };

  //全选
  const allCheckHandle = (e) => {
    const checked = e.target.checked;
    setAllChecked(checked);

    if (checked) {
      const allIds = modelList.map((item) => item.id);
      setSelectedKeys(allIds);
    } else {
      setSelectedKeys([]);
    }
  };
  // 避免点击单个项时全选状态不同步
  useEffect(() => {
    if (modelList.length === 0) return;
    const allIds = modelList.map((item) => item.id);
    const isAllSelected = allIds.every((id) => selectedKeys.includes(id));
    setAllChecked(isAllSelected);
    //只要选中就展示批量按钮
    const hasSelected = selectedKeys.length > 0;
    setBatchBtnStatus(hasSelected ? true : false);
  }, [selectedKeys, modelList]);

  //单个操作
  const actionConFirm = ({ label, id }) => {
    let config = {};
    switch (label) {
      case "删除":
        config = {
          title: "要删除模型吗？",
          content: "删除后将不可恢复！",
          keys: [id],
          action: async (keys) => {
            await modelDeleteBatch(keys);
          },
          onSuccess: () => {
            setSelectedKeys((prev) => prev.filter((key) => key !== id));
            getModelList(queryParams); // 刷新
          },
        };
        break;
      case "上架":
        config = {
          title: "上架",
          content: "模型上架后，可在模型广场查看&应用！",
          keys: [id],
          action: async (keys) => {
            await modelShelfBatch({ ids: keys, isShelf: true });
          },
          onSuccess: () => {
            setSelectedKeys((prev) => prev.filter((key) => key !== id));
            getModelList(queryParams);
          },
          backgroundImage: "/model/shelf_back.png",
          iconImage: "/model/shelf_tip.png",
          btnColor: "#3772FE",
        };
        break;
      case "下架":
        config = {
          title: "下架",
          content: "模型下架后，将不可在模型广场查看及被应用！",
          keys: [id],
          action: async (keys) => {
            await modelShelfBatch({ ids: keys, isShelf: false });
          },
          onSuccess: () => {
            setSelectedKeys((prev) => prev.filter((key) => key !== id));
            getModelList(queryParams);
          },
        };
        break;
    }

    modalRef.current?.open(config);
  };

  const modalRef = useRef(null);
  const [categoryForm] = Form.useForm(); //调整法分类表单
  //批量操作
  const batchOperation = (option) => {
    let config = {};
    switch (option) {
      case "category":
        setBatchCategoryModal(true);
        categoryForm.resetFields();
        return;
      case "takeOff":
        config = {
          title: "下架",
          content: `共下架${selectedKeys.length}个模型，模型下架后，将不可在模型广场查看及被应用！`,
          action: async (keys) => {
            await modelShelfBatch({ ids: keys, isShelf: 0 });
          },
          keys: selectedKeys,
          onSuccess: () => {
            setSelectedKeys([]);
            getModelList(queryParams);
          },
        };
        break;
      case "putOn":
        config = {
          title: "上架",
          content: `共上架${selectedKeys.length}个模型，模型上架后，可在模型广场查看&应用！`,
          action: async (keys) => {
            await modelShelfBatch({ ids: keys, isShelf: 1 });
          },
          keys: selectedKeys,
          onSuccess: () => {
            setSelectedKeys([]);
            getModelList(queryParams);
          },
          backgroundImage: "/model/shelf_back.png",
          iconImage: "/model/shelf_tip.png",
          btnColor: "#3772FE",
        };
        break;
      case "delete":
        config = {
          title: "要删除模型吗？",
          content: `共删除 ${selectedKeys.length} 个模型，删除后将不可恢复！`,
          action: async (keys) => {
            await modelDeleteBatch(keys);
          },
          keys: selectedKeys,
          onSuccess: () => {
            setSelectedKeys([]);
            getModelList(queryParams);
          },
        };
        break;
    }
    modalRef.current?.open(config);
  };

  //批量调整分类
  const submitCategory = async () => {
    try {
      const values = await categoryForm.getFieldsValue();
      await updatBatchCategory({
        ids: selectedKeys,
        tagIdList: values.tagIdList,
      });
      setBatchCategoryModal(false);
      setSelectedKeys([]);
      getModelList(queryParams);
    } catch (error) {
      return console.log("校验未通过，error:", error);
    }
  };

  //编辑
  const editModel = (app) => {
    setEditModelId(app.id);
    setPreTrainingDrawer(true);
  };

  return (
    <div className={`${styles["model-square-page"]} ${!showSecondSide ? styles["no-second-sidebar"] : ''}`}>
      <div className={styles["search-container"]}>
        <div className={styles["page-title"]}>预训练模型</div>
        <div className={styles["search-right"]}>
           <Select
            options={
              builtCategory.modelTagList?.map((item) => ({ label: item.name, value: item.id })) ||
              []
            }
            value={queryParams.classificationIdList}
            mode='multiple'
            maxTagCount='responsive'
            placeholder='全部类型'
            className={styles["built-tag-select"]}
            onChange={handleSelectChange}
            suffixIcon={
              <img
                src='/model/arrow.png'
                style={{
                  width: 16,
                  height: 16,
                }}
              />
            }
            // style={{ width: isNarrowScreen ? 120 : 180 }}
          ></Select>
          <CustomMultiSelect
            tagList={noBuiltCategory}
            onOpenTagModal={openTagModal}
            onSelectedChange={handleSelectedTags}
            onRefresh={getModelCategoryList}
            readOnly={!hasPermission}
            screenWidth={isNarrowScreen ? 200 : 320}
          ></CustomMultiSelect>
          <Input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onPressEnter={searchModal}
            onBlur={searchModal}
            placeholder='搜索模型名称,不超过50个字'
            style={{
              width: isNarrowScreen ? 240 : 360,
              height: 36,
              backgroundColor: "rgba(255,255,255,0.6)",
              border: "1px solid #DDDFE4",
            }}
            suffix={<SearchOutlined style={{ color: "rgba(0,0,0,.45)" }} />}
            maxLength={50}
          ></Input>
          <div className={styles["right-btn"]}>
            <Button
              type='primary'
              style={{
                width: "160px",
                borderRadius: 12,
                height: 36,
              }}
              disabled={!hasPermission}
              onClick={() => setPreTrainingDrawer(true)}
            >
              <img src='/layout/create/white_add.png' className={styles.template_create_icon} />
              预训练模型
            </Button>
          </div>
        </div>
      </div>
      <div className={styles["options-container"]}>
        <ConfigProvider
          theme={{
            components: {
              Segmented: {
                itemColor: "#666E82",
                borderRadius: 8,
                fontSize: 14,
                trackBg: "rgba(219,226,234,0.6)",
              },
            },
          }}
        >
          <Segmented
            className='custom-segmented'
            value={modelStatus}
            style={{
              padding: 3,
              height: 36,
            }}
            onChange={(val) => {
              changeShelfHandle(val);
            }}
            options={statusOptions.map((status) => ({
              value: status.key,
              label: (
                <div
                  style={{
                    padding: "0 14px",
                    height: 30,
                    lineHeight: "30px",
                  }}
                >
                  {status.label}
                </div>
              ),
            }))}
          />
        </ConfigProvider>
        {/* 批量按钮 */}
        {modelList.length > 0 &&
          hasPermission &&
          (batchBtnStatus ? (
            <div className={styles["batch-container"]}>
              <div className={styles["all-checked"]}>
                <img className={styles["batch_icon"]} src='/model/check_icon.png' />
                <span>{selectedKeys.length}项已选</span>
              </div>
              <div className={styles["batch-btns"]}>
                {batchBtns.map((item) => (
                  <div
                    className={`${styles["btn-item"]} ${
                      item.id === "delete" ? styles["btn-delete"] : ""
                    }`}
                    key={item.id}
                    onClick={() => batchOperation(item.id)}
                  >
                    <img className={styles["batch_icon"]} src={`/model/${item.icon}.png`} />
                    <span
                      style={{
                        color: item.id === "delete" ? "#EE5A55" : "#364052",
                      }}
                    >
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>
              <div
                className={styles["cancel-check"]}
                onClick={() => {
                  setBatchBtnStatus(false);
                  setSelectedKeys([]);
                }}
              >
                取消
              </div>
            </div>
          ) : (
            <Checkbox checked={allChecked} onChange={allCheckHandle} className={styles["func-btn"]}>
              全选
            </Checkbox>
          ))}
      </div>
      {modelList.length > 0 && (
        <div className={styles["model-list"]}>
          {modelList.map((appItem) => (
            <ModelCard
              key={appItem.id}
              app={appItem}
              onRefresh={() => getModelList({ ...queryParams })}
              checked={selectedKeys.includes(appItem.id)}
              onCheck={() => toggleSelect(appItem.id)}
              modelStatus={modelStatus}
              edit={editModel}
              permission={hasPermission}
              onAction={actionConFirm}
            />
          ))}
        </div>
      )}
      {modelList.length == 0 && (
        <div className={styles["app-list_empty"]}>
          <Empty
            image={"/model/model_empty.png"}
            styles={{ image: { height: 220, width: 220 } }}
            description={<span style={{ color: "#666E82", fontWeight: 500 }}>模型都飞走啦</span>}
          />
        </div>
      )}
      <PreTrainingDrawer
        open={preTrainingDrawer}
        editId={editModelId}
        categoryList={classList}
        onRefresh={resetSearch}
        onClose={() => {
          setPreTrainingDrawer(false);
          setEditModelId(null);
          setBatchBtns(takeOffBtnList);
        }}
      />
      <TagModal
        visible={tagModalVisible}
        onClose={() => setTagModalVisible(false)}
        currentId={noBuiltCategory?.id}
        onRefreshCategory={getModelCategoryList}
        onRefreshModalList={getModelList}
        readOnly={hasPermission}
      />
      <DeleteModal ref={modalRef} />

      <Modal
        open={batchCategoryModal}
        centered={true}
        width='520px'
        title={<div style={{ fontSize: 24, marginBottom: 20 }}>批量调整分类</div>}
        okText='保存'
        onOk={submitCategory}
        onCancel={() => setBatchCategoryModal(false)}
        styles={{
          content: {
            backgroundImage: 'url("/application/app_modal_back.png")',
            borderRadius: 24,
            padding: "24px 24px 32px",
            backgroundColor: "#fff",
            backgroundPosition: "top center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "100% auto",
          },
          header: {
            background: "transparent",
          },
        }}
      >
        <Form layout='vertical' form={categoryForm}>
          <Form.Item
            label={`${noBuiltCategory?.name}:`}
            rules={[{ required: true, message: "请选择分类" }]}
            name='tagIdList'
          >
            <Select
              placeholder='请选择'
              optionFilterProp='label'
              options={
                noBuiltCategory?.modelTagList?.map((item) => ({
                  label: item.name,
                  value: item.id,
                })) || []
              }
              mode='multiple'
              showSearch
              searchValue={categoryValue}
              onSearch={(value) => setCategoryValue(value.length > 50 ? value.slice(0, 50) : value)}
              onBlur={() => setCategoryValue("")}
            ></Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
