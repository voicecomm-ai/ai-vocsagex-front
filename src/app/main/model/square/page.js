"use client";
import styles from "./page.module.css";
import { useState, useEffect, useCallback } from "react";
import { Input, Empty, Button, Checkbox } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import ModelCard from "./components/ModelCard";
import { modelCategoryList, modelPage } from "@/api/model";
import { useStore } from "@/store/index";

const tabOptions = [
  { value: null, label: "全部" },
  { value: 0, label: "算法模型" },
  { value: 1, label: "预训练模型" },
];

export default function ModelSquarePage() {
  const { showFilter, setShowFilter } = useStore();//是否显示筛选面板

  const [searchValue, setSearchValue] = useState(""); //模型名称搜索
  const [activeKey, setActiveKey] = useState(null);
  const [classList, setClassList] = useState([]); //模型分类
  const [modelList, setModelList] = useState([]); //模型列表
  const [queryParams, setQueryParams] = useState({
    type: null, // 类型
    isShelf: true, // 是否上架
    tagIdList: [], //标签id集合
    classificationIdList: [], //分类id集合
    current: 1,
    size: 10000000,
  });
  // 初始化：分两个数组存储不同类型的标签ID
  const [builtTagIds, setBuiltTagIds] = useState([]); // 内置标签ID
  const [customTagIds, setCustomTagIds] = useState([]); // 自定义标签ID
  const [expandStatus, setExpandStatus] = useState({});

  // 切换分类展开/收起状态
  const toggleExpand = (categoryId) => {
    setExpandStatus((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId], // 取反当前分类的状态
    }));
  };

  //获取模型列表
  const getModelList = useCallback(
    async (params = queryParams) => {
      const res = await modelPage(params);
      setModelList(res.data.records || []);
    },
    [queryParams]
  );
  const handleCheckboxChange = (tagId, isBuilt, e) => {
    const { checked } = e.target;

    if (isBuilt) {
      // 处理isBuilt=true的标签（classificationIdList）
      setBuiltTagIds((prev) => (checked ? [...prev, tagId] : prev.filter((id) => id !== tagId)));
    } else {
      // 处理isBuilt=false的标签（tagIdList）
      setCustomTagIds((prev) => (checked ? [...prev, tagId] : prev.filter((id) => id !== tagId)));
    }
  };

  //监听标签选择获取模型列表
  useEffect(() => {
    setQueryParams((prev) => ({
      ...prev,
      classificationIdList: builtTagIds,
      tagIdList: customTagIds,
      current: 1,
    }));
  }, [builtTagIds, customTagIds]);

  //清空已选标签
  const clearChecked = () => {
    setBuiltTagIds([]);
    setCustomTagIds([]);
  };

  useEffect(() => {
    getModelList();
  }, [queryParams, getModelList]);

  //获取模型分类
  const getModelCategoryList = async () => {
    const res = await modelCategoryList({ isSquare: true });
    console.log(res.data, "res.data");

    setClassList(res.data);
  };

  //切换模型
  const changeTabs = (key) => {
    setActiveKey(key);
    const updated = { ...queryParams, type: key, current: 1 };
    setQueryParams(updated);
  };

  // 搜索模型名称
  useEffect(() => {
    searchModal();
  }, [searchValue]);

  const searchModal = () => {
    const updated = { ...queryParams, name: searchValue, current: 1 };
    setQueryParams(updated);
  };

  useEffect(() => {
    getModelCategoryList();
    getModelList(queryParams);
  }, []);

  return (
    <div className={styles["model-square-page"]}>
      <div className={styles["page-title"]}>模型广场</div>
      <div className={styles["page-content"]}>
        <div className={styles["page-content-left"]}>
          <div className={styles["search-container"]}>
            <div className={styles["search-container-left"]}>
              <div className={styles["tab-buttons"]}>
                {tabOptions.map((item) => (
                  <div
                    key={item.key}
                    onClick={() => changeTabs(item.value)}
                    className={`${styles["tab-button"]} ${
                      activeKey === item.value ? styles["active"] : ""
                    }`}
                  >
                    {item.label}
                  </div>
                ))}
              </div>{" "}
              <div className={styles["search-right"]}>
                {" "}
                <Input
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onPressEnter={searchModal}
                  onBlur={searchModal}
                  placeholder='搜索模型名称,不超过50个字'
                  style={{
                    width: 360,
                    height: 36,
                    backgroundColor: "rgba(255,255,255,0.6)",
                    border: "1px solid #DDDFE4",
                  }}
                  suffix={<SearchOutlined style={{ color: "rgba(0,0,0,.45)" }} />}
                  maxLength={50}
                ></Input>
                {!showFilter && (
                  <Button className={styles.filter_button_fold} onClick={() => setShowFilter(true)}>
                    <img src='/model/filter_icon.png' alt='' className={styles.filter_icon} />
                  </Button>
                )}
              </div>
            </div>
          </div>
          {modelList.length > 0 && (
            <div
              className={styles["model-content"]}
              style={{
                marginRight: showFilter ? 20 : 0,
                // 核心：动态设置网格列的最小宽度
                gridTemplateColumns: showFilter
                  ? "repeat(auto-fill, minmax(330px, 1fr))"
                  : "repeat(auto-fill, minmax(310px, 1fr))",
              }}
            >
              {modelList.map((appItem) => (
                <ModelCard key={appItem.id} app={appItem} />
              ))}
            </div>
          )}
          {modelList.length == 0 && (
            <div className={styles["app-list_empty"]}>
              <Empty
                image={"/model/model_empty.png"}
                styles={{ image: { height: 220, width: 220 } }}
                description={
                  <span style={{ color: "#666E82", fontWeight: 500 }}>模型都飞走啦</span>
                }
              />
            </div>
          )}
        </div>
        {/* </div> */}
        {showFilter && (
          <div className={styles["page-content-right"]}>
            <div className={styles.filter_button}>
              <div className={styles.filter_content}
                  onClick={() => setShowFilter(false)}>
                <img
                  src='/model/filter_icon.png'
                  alt=''
                  className={styles.filter_icon}
                />
                <span>筛选</span>
              </div>
              <img
                src='/model/clean_icon.png'
                alt=''
                className={styles.clean_icon}
                onClick={clearChecked}
              />
            </div>
            <div className={styles["filter"]}>
              {classList.map((item) => (
                <div key={item.id}>
                  {item.modelTagList.length > 0 && (
                    <div
                      className={`${styles["filter_title"]} ${
                        expandStatus[item.id] ? styles.expanded : ""
                      }`}
                      onClick={() => toggleExpand(item.id)} // 点击切换展开状态
                    >
                      <img
                        src='/model/arrow.png'
                        alt=''
                        className={`${styles.clean_icon} ${
                          expandStatus[item.id] ? styles.rotate : ""
                        }`}
                      />
                      {item.name}
                    </div>
                  )}
                  {/* 根据展开状态控制标签列表显示/隐藏 */}
                  {(expandStatus[item.id] ?? true) && ( // 默认展开（?? true 处理初始状态）
                    <div className={styles["checkbox_group"]}>
                      {item.modelTagList.map((tag) => (
                        <div key={tag.id} className={styles["checkbox_item"]}>
                          <Checkbox
                            className={styles["checkbox"]}
                            checked={
                              item.isBuilt
                                ? builtTagIds.includes(tag.id)
                                : customTagIds.includes(tag.id)
                            }
                            onChange={(e) => handleCheckboxChange(tag.id, item.isBuilt, e)}
                          >
                            {tag.name}
                          </Checkbox>
                          <span className={styles["count"]}>{tag.modelRelationNum}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
