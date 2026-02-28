"use client";
import { useState, useEffect, useRef } from "react";
import styles from "./index.module.css";
import TagSelect from "@/app/components/TagSelect";
import { getApplicationTagList, getApplicationList, deleteApplication, addApplicationTag } from "@/api/application";
import { checkPermission } from "@/utils/utils";
import { Input, Avatar, Tooltip, Typography, Empty, message } from "antd";
import { SearchOutlined, AppstoreOutlined } from "@ant-design/icons";
import TagComponent from "./components/Tag";
import UpdateModel from "../components/UpdateModel";
const { Text } = Typography;
import { useRouter } from "next/navigation";
import DeleteAppModal from "../components/DeleteApp";
import TakeDownModal from "../components/TakeDownModal";
import TagModal from "../components/TagModal";

/**
 * 分页配置
 */
const PAGINATION_CONFIG = {
  current: 1,
  size: 10000000, // 获取所有数据，不分页
};

export default function IntegratedPage() {
  const router = useRouter();
  const tagSelectRef = useRef(null);
  const tagComponentRef = useRef(null);
  const updateModelRef = useRef(null);
  const deleteModalRef = useRef(null);
  const [deleteModalShow, setDeleteModalShow] = useState(false);
  const takeDownModalRef = useRef(null);//下架模态框
  const [tagList, setTagList] = useState([]);
  const [canCreate, setCanCreate] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [applicationList, setApplicationList] = useState([]);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [tagModalVisible, setTagModalVisible] = useState(false);//标签管理模态框可见状态
  const [isEditingTag, setIsEditingTag] = useState(false);
  useEffect(() => {
    setCanCreate(
      checkPermission("/main/application/manage/integrated/operation")
    );
    getTagListEvent();

  }, []);

  /**
   * 获取标签列表
   */
  const getTagListEvent = async () => {
    getApplicationTagList().then((res) => {
      setTagList(res.data);
    });
  };

  /**
   * 处理标签筛选变化
   * @param {Object} tag - 选中的标签
   * @param {boolean} checked - 是否选中
   */
  const handleTagChange = (tags) => {
    setSelectedTags(tags);
    fetchApplicationEvent(tags);
  };
  /**
   * 添加标签
   * @param {Object} tag - 标签对象
   */
  const addTagEvent = (tag) => {
    addApplicationTag({ name: tag.name }).then(res => {
      message.success('添加成功');
      getTagListEvent();
      tagSelectRef.current?.addCallback();


    })
      .catch(err => {
        console.log(err);
      })

  }

  /**
   * 打开标签模态框
   */
  const openTagModal = () => {
    setTagModalVisible(true);
  };

  //获取应用列表
  const fetchApplicationEvent = (
    tagListInput = selectedTags,
    keyword = searchKeyword,
  ) => {
    let typeList = ['agent'];
    const tagIdList = tagListInput;
    // 构建请求参数
    const params = {
      typeList,
      tagIdList,
      name: keyword,
      ...PAGINATION_CONFIG,
      hasPublish: true,//是否已经发布  false:未发布 true:已发布
      isIntegrated: true,
    };

    getApplicationList(params).then((res) => {
      setApplicationList(res.data.records);
    });
  };

  //编辑应用信息事件
  const editAppInfoEvent = (e, appInfo) => {
    if (!canCreate) {
      return;
    }
    e.stopPropagation();
    updateModelRef.current.showModal(appInfo);
  };

  useEffect(() => {
    fetchApplicationEvent();
  }, [searchKeyword]);
  //更新应用信息成功事件
  const updateSuccessEvent = () => {
    fetchApplicationEvent();
  };


  //跳转到应用配置界面
  const gotoAppConfigEvent = (appInfo) => {
    if (appInfo.agentType === "multiple") {
      router.push(`/main/application/manage/detail/${appInfo.id}/agent/multi`);
    } else {
      router.push(`/main/application/manage/detail/${appInfo.id}/agent?from=integrated`);
    }
  };
  //删除应用事件
  const deleteAppEvent = (e, appInfo) => {
    if (!canCreate) {
      return;
    }
    e.stopPropagation();
    deleteModalRef.current.showDeleteModal(appInfo, "要删除应用吗?", "删除应用将无法撤销。用户将不能访问你的应用，所有Prompt编排配置和日志均将一并被删除。");
  };
  //删除应用回调事件
  const deleteCallBack = (appInfo) => {
    deleteApplication(appInfo.id)
      .then((res) => {
        fetchApplicationEvent(); // 刷新应用列表
        getTagListEvent();//刷新标签列表
        deleteModalRef.current.onCancel();
      })
      .catch((error) => {
        console.error("删除应用失败:", error);
      });
  };
  //下架应用事件
  const takeDownAppEvent = (e, appInfo) => {
    if (!canCreate) {
      return;
    }
    e.stopPropagation();
    takeDownModalRef.current.showModal(appInfo);

  };
  //关闭标签管理模态框
  const closeTagModal = () => {
    setTagModalVisible(false);
  };
  const handleMouseLeave = (e, item) => {
    // 如果鼠标离开的目标仍然在当前卡片内部，不处理
    if (isEditingTag) {
      return;
    }
    setHoveredItem(null);
  };
  const handleTagMouseLeave = (status) => {
    setIsEditingTag(status);
    setHoveredItem(null);
  }
  return (
    <div className={styles.integrated_page}>
      <div className={styles.integrated_page_header}>
        <div className={styles.integrated_page_header_left}>基础协作体</div>
        <div className={styles.integrated_page_header_right}>
          <TagSelect
            ref={tagSelectRef}
            tagList={tagList}
            onSelectChange={handleTagChange}
            addTagEvent={addTagEvent}
            showTagModal={openTagModal}
            canCreate={canCreate}
          />

          <Input
            style={{
              width: 360,
              height: 36,
              borderRadius: 8,
              backgroundColor: "rgba(255,255,255,0.6)",
              border: "1px solid #DDDFE4",
            }}
            placeholder="搜索应用名称,不超过50个字"
            maxLength={50}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onPressEnter={() => fetchApplicationEvent()}
            suffix={
              <SearchOutlined
                style={{ cursor: "pointer" }}
                onClick={() => fetchApplicationEvent()}
              />
            }
          />
        </div>
      </div>
      {applicationList.length > 0 && (
        <div className={styles.integrated_page_content}>
          {applicationList.map((item) => (
            <div className={styles.integrated_content_item}
              onMouseEnter={() => setHoveredItem(item)}
              onMouseLeave={(e) => handleMouseLeave(e, item)}
              onClick={() => gotoAppConfigEvent(item)}
              key={item.id}>
              <div className={styles.integrated_content_item_header}>
                <div className={styles.integrated_content_item_header_left}>
                  <Avatar
                    shape="square"
                    size={48}
                    icon={<AppstoreOutlined />}
                    src={process.env.NEXT_PUBLIC_API_BASE + item.iconUrl}
                    style={{ borderRadius: 12 }}
                  />
                  <div
                    className={styles.integrated_content_item_header_left_name}
                  >
                    <div
                      className={
                        styles.integrated_content_item_header_left_name_text
                      }
                    >
                      {item.name}
                      {item.status === 1 && (
                        <Tooltip title="已发布">
                          <img
                            className={styles.integrated_content_item_img}
                            src="/application/publish_icon.svg"
                            alt=""
                            style={{ width: 14, marginLeft: 4, flexShrink: 0 }}
                          />
                        </Tooltip>
                      )}
                    </div>
                    <div
                      className={styles.integrated_content_item_header_left_type}
                    >
                      智能体
                    </div>
                  </div>
                </div>
                <div className={styles.integrated_content_item_right}>
                  {item.onShelf && (
                    <div className={styles.integrated_content_item_right_onShelf}>

                      <span className={styles["app__onShelf"]}>已上架</span>

                    </div>
                  )}
                  <div
                    className={styles.integrated_content_item_right_updateTime}
                  >
                    {item.updateTime && (
                      <span className={styles["updated-time"]}>
                        {item.updateTime} 更新
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className={styles.integrated_content_item_description}>
                <Text style={{ maxWidth: '100%', fontSize: 12, color: '#666E82' }} ellipsis={{ tooltip: item.description }}>{item.description}</Text>
              </div>

              {(
                (item.tagList && item.tagList.length > 0) ||
                (hoveredItem && hoveredItem.id === item.id)
              ) && (
                  <div className={styles.integrated_content_item_tag} onClick={(e) => e.stopPropagation()}>
                    <TagComponent
                      tagList={tagList}
                      ref={tagComponentRef}
                      item={item}
                      canCreate={canCreate}
                      hoveredItem={hoveredItem}
                      showTagModal={openTagModal}
                      addTagEvent={addTagEvent}
                      setIsEditingTag={setIsEditingTag}
                      handleTagMouseLeave={handleTagMouseLeave}
                      getTagListEvent={getTagListEvent}
                      updateAppList={updateSuccessEvent}

                    />
                    {hoveredItem && hoveredItem.id === item.id && ( 
                    <div className={styles.integrated_content_item_btns}>
                      <div className={`${styles.integrated_content_item_btns_edit}
                        ${!canCreate ? `${styles.integrated_content_item_visible}` : ''}`}
                        onClick={(e) => editAppInfoEvent(e, item)}
                      >
                        <img src="/agent/edit.png" alt="" width={16} height={16} /> 编辑信息
                      </div>
                      {item.onShelf && (
                        <div className={styles.integrated_content_item_btns_divider + (!canCreate ? ' ' + styles.integrated_content_item_visible : '')} onClick={(e) => takeDownAppEvent(e, item)}>
                          <img src="/application/take_down.png" alt="" width={16} height={16} />     下架
                        </div>
                      )}

                      <div className={styles.integrated_content_item_btns_delete + (!canCreate ? ' ' + styles.integrated_content_item_visible : '')} onClick={(e) => deleteAppEvent(e, item)} >
                        <img src="/agent/delete.png" alt="" width={16} height={16} />
                      </div>

                    </div>
                   )} 
                  </div>
                )}
            </div>
          ))}
        </div>
      )}
      {/* 空状态 - 无数据时显示 */}
      {applicationList.length === 0 && (
        <div className={styles["app-list_empty"]}>
          <Empty
            image={"/application/app_empty.png"}
            styles={{ image: { height: 220, width: 220 } }}
            description={<span style={{ color: "#666E82", fontWeight: 500 }}>暂无应用</span>}
          />
        </div>
      )}
      {/* 标签管理模态框 */}
      <TagModal
        visible={tagModalVisible}
        tagList={tagList}
        onClose={closeTagModal}
        setTagList={setTagList}
        fetApplicationTagList={getTagListEvent}
        fetchApplications={updateSuccessEvent}
        canCreate={canCreate}

      />
      {/* 编辑信息弹窗 */}
      <UpdateModel ref={updateModelRef} onUpdateSuccess={updateSuccessEvent} />
      {/* 删除确认模态框 */}
      <DeleteAppModal
        ref={deleteModalRef}
        deleteCallBack={deleteCallBack}
      />
      {/* 下架模态框 */}
      <TakeDownModal ref={takeDownModalRef} refreshEvent={updateSuccessEvent} />
    </div>
  );
}
