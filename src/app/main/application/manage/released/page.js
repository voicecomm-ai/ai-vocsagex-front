"use client";
import { useState, useEffect, useRef } from "react";
import { Button, Input, Modal, Form, Avatar, Popover, Spin, Empty, Segmented, ConfigProvider, message,Select } from "antd";
import { SearchOutlined, PlusOutlined, AppstoreAddOutlined } from "@ant-design/icons";
import styles from "../manage.module.css";
import AppCard from "../components/AppCard.jsx";
import { useRouter } from "next/navigation";
import {
  getApplicationList,
  getApplicationTagList,
  updateApplication,
  deleteApplication,
  addApplicationTag
} from "@/api/application";
import TagGroup from "../components/TagGroup";
import IconSelectorPopover from "../components/IconSelectorPopover";
import { checkPermission } from "@/utils/utils";
import TagModal from "../components/TagModal.jsx";
import DeleteModal from "../components/DeleteModal";
import TakeDownModal from "../components/TakeDownModal";
import TagSelect from "@/app/components/TagSelect";
const { TextArea } = Input;

/**
 * 应用类型选项配置
 * 用于筛选不同类型的应用
 */
const TYPE_OPTIONS = [
  { label : "智能体应用", value: "agent" },
  { label: "工作流应用", value: "workflow" },
  { label: "智能体编排应用", value: "agent_arrangement" },
];

/**
 * 默认"全部标签"选项
 * 用于标签筛选的默认选项
 */
const ALL_TAG_OPTION = { name: "全部标签", id: 0 };

/**
 * 表单验证规则配置
 */
const FORM_RULES = {
  name: [
    { required: true, message: "请输入应用名称" },
    { max: 50, message: "应用名称不能超过50个字符" },
  ],
};

/**
 * 分页配置
 */
const PAGINATION_CONFIG = {
  current: 1,
  size: 10000000, // 获取所有数据，不分页
};

/**
 * 模态框样式配置
 */
const MODAL_STYLES = {
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
};

const statusOptions = [
  { label: "已上架", key: "published" },
  { label: "未上架", key: "unpublished" },
 
];

/**
 * 应用管理页面组件
 * 提供应用的查看、编辑、删除、标签管理等功能
 */
export default function AppManagePage() {
  const router = useRouter();
  
  // 搜索和筛选相关状态
  const [searchKeyword, setSearchKeyword] = useState(""); // 搜索关键词
  const [selectedTags, setSelectedTags] = useState([]); // 已选择的标签
  const [selectedType, setSelectedType] = useState(null); // 已选择的应用类型
  const [appList, setAppList] = useState([]); // 应用列表数据
  const [tagList, setTagList] = useState([]); // 标签列表数据
  const [form] = Form.useForm(); // 表单实例
  const [status, setStatus] = useState('published'); // 状态
  const takeDownModalRef=useRef(null);
  const tagSelectRef=useRef(null);//标签选择器ref
  // 权限和加载状态
  const [hasPermission, setHasPermission] = useState(false); // 操作权限状态
  const [iconLoading, setIconLoading] = useState(false); // 图标加载状态


  useEffect(() => {
    let status = checkPermission("/main/application/manage/unreleased/operation") || checkPermission("/main/application/manage/released/operation");
    setHasPermission(status);
  }, [appList]);
  /**
   * 初始化默认的标签和类型选择
   * 设置默认的筛选条件并获取应用列表
   */
  const initTag = () => {
    const defaultTags = [ALL_TAG_OPTION]; // 默认选择"全部标签"
    setSelectedTags(defaultTags);
  };
  /**
   * 获取应用列表数据
   * @param {Array} typeListInput - 应用类型列表
   * @param {Array} tagListInput - 标签列表
   * @param {string} keyword - 搜索关键词
   */
  const fetchApplications = (
    type,
    tagListInput = selectedTags,
    keyword = searchKeyword,
    action=null
  ) => {
    let typeList = type ? [type] :selectedType?[selectedType]: [];
    if(action == 'typeChange'){
      typeList=type?[type]:[];
    }
    console.log(typeList,'typeList')
    const tagIdList = tagListInput;
    // 构建请求参数
    const params = {
      typeList,
      tagIdList,
      name: keyword,
      ...PAGINATION_CONFIG,
      hasPublish:true,//是否已经发布  false:未发布 true:已发布
      hasExperience:status === 'published' ? true : false,//是否已经上架  false:未上架 true:已上架
    };

    // 获取应用列表数据
    getApplicationList(params)
      .then((res) => {
        setAppList(res.data.records);
      })
      .catch((error) => {
        console.error("获取应用列表失败:", error);
      });
  };

  /**
   * 处理应用类型筛选变化
   * @param {Object} tag - 选中的类型标签
   * @param {boolean} checked - 是否选中
   */
  const handleTypeChange = (value) => {
    setSelectedType(value);
    fetchApplications(value, selectedTags,searchKeyword,'typeChange');
  };
  /**
   * 处理标签筛选变化
   * @param {Object} tag - 选中的标签
   * @param {boolean} checked - 是否选中
   */
  const handleTagChange = (tags) => {
    setSelectedTags(tags);
    fetchApplications(selectedType, tags);
  };

  /**
   * 获取所有标签列表
   * 从服务器获取标签数据并更新本地状态
   */
  const fetchApplicationTagList = () => {
    getApplicationTagList().then(res => {
      console.log(res,'res');
      let data =res.data;
      setTagList(data);
          // 重新映射已选择的标签，保持引用一致
          setSelectedTags((prevSelected) => {
            return data.filter((tag) => 
              prevSelected.some((selected) => selected.id === tag.id)
            );
          });
    }).catch(err => {
      console.log(err,'err');
    })
  };

  /**
   * 跳转到创建应用页面
   */
  const goToCreate = () => {
    router.push("/main/application/manage/create");
  };

  // 编辑应用相关状态
  const [modalVisible, setModalVisible] = useState(false); // 编辑模态框显示状态
  const [currentAppInfo, setCurrentAppInfo] = useState({}); // 当前编辑的应用信息

  /**
   * 处理编辑应用信息
   * @param {Object} appInfo - 应用信息对象
   */
  const handleEditAppInfo = (appInfo) => {
    setCurrentAppInfo(appInfo);
    setModalVisible(true);
    // 使用setTimeout确保模态框完全打开后再设置表单值
    setTimeout(() => {
      form.setFieldsValue(appInfo);
    }, 0);
  };

  /**
   * 提交编辑应用信息
   * 获取表单数据并调用更新接口
   */
  const editAppInfo = () => {
    const formValues = form.getFieldsValue(); // 获取表单最新值
    const editParams = {
      ...currentAppInfo,
      ...formValues,
    };
    
    updateApplication(editParams)
      .then((res) => {
        setModalVisible(false);
        fetchApplications(); // 刷新应用列表
      })
      .catch((error) => {
        console.error("更新应用信息失败:", error);
      });
  };

  // 标签管理弹窗相关状态
  const [tagModalVisible, setTagModalVisible] = useState(false); // 标签管理弹窗显示状态

  /**
   * 打开标签管理弹窗
   */
  const openTagModal = () => {
    setTagModalVisible(true);
  };

  /**
   * 关闭标签管理弹窗
   */
  const onClose = () => {
    setTagModalVisible(false);
  };

  // 删除应用相关状态
  const [deleteModalShow, setDeleteModalShow] = useState(false); // 删除确认弹窗显示状态
  const [deleteAppId, setDeleteAppId] = useState(null); // 待删除的应用ID

  /**
   * 处理删除应用操作
   * @param {string|number} id - 应用ID
   */
  const deleteAppHandle = (obj) => {
    if(obj.onShelf){
    return message.warning('应用已上架到发现页，请先下架应用！');
    }
    setDeleteAppId(obj.id);
    setDeleteModalShow(true);
  };

  /**
   * 取消删除操作
   */
  const cancelDeleteHandle = () => {
    setDeleteModalShow(false);
  };

  /**
   * 确认删除应用
   * 调用删除接口并刷新应用列表
   */
  const confirmDeleteHandle = () => {
    deleteApplication(deleteAppId)
      .then((res) => {
        fetchApplications(); // 刷新应用列表
        setDeleteModalShow(false);
      })
      .catch((error) => {
        console.error("删除应用失败:", error);
      });
  };

  // 权限相关状态
  const [cardOption, setCardOption] = useState([]); // 卡片操作权限配置
  const [canCreate, setCanCreate] = useState(false); // 创建应用权限状态

  /**
   * 组件初始化效果
   * 获取标签数据、初始化筛选条件、设置权限
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchApplicationTagList();
      } catch (error) {
        console.error("加载数据失败:", error);
      }
    };
    
    // 初始化默认筛选条件
    initTag();
    // 获取标签数据
    fetchData();
    
    // 设置操作权限
    const hasOperationPermission = checkPermission("/main/application/manage/released/operation");
    setHasPermission(hasOperationPermission);
    
    // 设置卡片操作权限配置
    setCardOption([
      {
        label: "编辑信息",
        key: "edit",
        isDisabled: !hasOperationPermission,
      },
      {
        label: "删除",
        key: "delete",
        isDisabled: !hasOperationPermission,
      },
    ]);
    
    // 设置创建权限
    setCanCreate(hasOperationPermission);
  }, []);

  /**
   * 搜索关键词变化效果
   * 当搜索关键词改变时重新获取应用列表
   */
  useEffect(() => {
    fetchApplications();
  }, [searchKeyword,status]);

  //下架点击事件
  const offShelfEvent=(obj)=>{  
   takeDownModalRef.current.showModal(obj);
  }
  
  const addTagEvent = (tag) => {
    addApplicationTag({name:tag.name}).then(res => {
      message.success('添加成功');
      fetchApplicationTagList();
      tagSelectRef.current.addCallback();
   
    })
    .catch(err => {
      console.log(err);
    })
  
  }

  return (
    <div className={styles["app-manage-page"]}>
      <div className={styles["page-title"]}>
        <span className={styles["page-title-text"]}>已发布</span>
        <div className={styles["title-right"]}>
        <Select
            variant="borderless"
            classNames={{
              root: styles['app_type_select'],
            }} 
            placeholder='全部应用'
            style={{ width: 136, height: 36, borderRadius: 8 }}
            onChange={handleTypeChange}
            options={TYPE_OPTIONS}
            value={selectedType}
            allowClear={true}
          />
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
              borderRadius: 8,
              backgroundColor: "rgba(255,255,255,0.6)",
              border: "1px solid #DDDFE4",
            }}
            placeholder='搜索应用名称,不超过50个字'
            maxLength={50}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onPressEnter={() => fetchApplications()}
            suffix={
              <SearchOutlined style={{ cursor: "pointer" }} onClick={() => fetchApplications()} />
            }
          />
        </div>
      </div>
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
              className="custom-segmented"
              value={status}
              style={{
                padding: 3,
                height: 36,
                width: 190,
                marginBottom:16,
                marginTop:6
              }}
              onChange={(val) => setStatus(val)}
              options={statusOptions.map((item) => ({
                value: item.key,
                label: (
                  <div
                    style={{
                      padding: "0 14px",
                      height: 30,
                      lineHeight: "30px",
                    }}
                  >
                    {item.label}
                  </div>
                ),
              }))}
            />
          </ConfigProvider>
      {/* 应用列表 - 有数据时显示 */}
      {appList.length > 0 && (
        <div className={styles["app-list"]}>
          {appList.map((appItem) => (
            <AppCard
              key={appItem.id}
              app={appItem}
              allTagList={tagList}
              onEditAppInfo={handleEditAppInfo}
              openTagModal={openTagModal}
              updateAppList={fetchApplications}
              updatetagList={fetchApplicationTagList}
              cardOptions={cardOption}
              tagManageModal={tagModalVisible}
              permission={canCreate}
              deleteApp={deleteAppHandle}
              offShelfEvent={offShelfEvent} 
            />
          ))}
        </div>
      )}
      
      {/* 空状态 - 无数据时显示 */}
      {appList.length === 0 && (
        <div className={styles["app-list_empty"]}>
          <Empty
            image={"/application/app_empty.png"}
            styles={{ image: { height: 220, width: 220 } }}
            description={<span style={{ color: "#666E82", fontWeight: 500 }}>暂无应用</span>}
          />
        </div>
      )}
      {/* 编辑应用信息模态框 */}
      <Modal
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        className='app-custom-modal'
        width={640}
        height={440}
        title={<div style={{ fontSize: 24 }}>编辑信息</div>}
        footer={null}
        styles={MODAL_STYLES}
      >
        <Form form={form} layout='vertical' initialValues={currentAppInfo} onFinish={editAppInfo}>
          {/* 应用图标和名称输入区域 */}
          <div style={{ display: "flex", marginTop: 20 }}>
            {/* 图标选择器 */}
            <Popover
              placement='rightTop'
              content={
                <IconSelectorPopover
                  value={currentAppInfo.iconUrl}
                  onChange={(val) =>
                    setCurrentAppInfo((prev) => ({
                      ...prev,
                      iconUrl: val,
                    }))
                  }
                  onLoadingChange={setIconLoading}
                />
              }
              arrow={false}
            >
              {iconLoading ? (
                <div className={styles["app-image"]}>
                  <Spin spinning={iconLoading}></Spin>
                </div>
              ) : (
                <Avatar
                  className={styles["app-image"]}
                  shape='square'
                  size={48}
                  src={process.env.NEXT_PUBLIC_API_BASE + currentAppInfo.iconUrl}
                />
              )}
            </Popover>

            {/* 应用名称输入框 */}
            <Form.Item
              name='name'
              rules={FORM_RULES.name}
              style={{ flex: 1, marginBottom: 0, height: 48 }}
            >
              <Input
                placeholder='给你的应用起一个响亮的名字'
                showCount
                maxLength={50}
                style={{ height: 48 }}
              />
            </Form.Item>
          </div>
          
          {/* 应用描述输入框 */}
          <Form.Item name='description' style={{ marginTop: 20 }} rules={[{ required: true, message: "请输入应用描述" }]}>
            <TextArea 
              rows={5} 
              placeholder='描述该应用的内容，详细的描述可以让AI更好的理解并访问应用的内容' 
              showCount 
              maxLength={400} 
            />
          </Form.Item>
          
          {/* 操作按钮 */}
          <Form.Item style={{ marginTop: 32, textAlign: "right" }}>
            <Button 
              style={{ marginRight: 16, width: 112 }} 
              onClick={() => setModalVisible(false)}
            >
              取消
            </Button>
            <Button type='primary' htmlType='submit' style={{ width: 112 }}>
              确定
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      {/* 标签管理模态框 */}
      <TagModal
        visible={tagModalVisible}
        tagList={tagList}
        onClose={onClose}
        setTagList={setTagList}
        fetApplicationTagList={fetchApplicationTagList}
        fetchApplications={fetchApplications}
        canCreate={canCreate}
      />
      
      {/* 删除确认模态框 */}
      <DeleteModal
        visible={deleteModalShow}
        onCancel={cancelDeleteHandle}
        onOk={confirmDeleteHandle}
        title='要删除应用吗?'
        content='删除应用将无法撤销。用户将不能访问你的应用，所有Prompt编排配置和日志均将一并被删除。'
      />
      {/* 下架模态框 */}
      <TakeDownModal ref={takeDownModalRef} refreshEvent={fetchApplications}      />
    </div>
  );
}
