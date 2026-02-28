"use client";
import { useState, useEffect, useRef } from "react";
import {
  Button,
  Input,
  Tag,
  Modal,
  Form,
  Avatar,
  Popover,
  message,
  Space,
  Dropdown,
  Typography,
  Empty,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  DownOutlined,
  AppstoreAddOutlined,
} from "@ant-design/icons";
import styles from "../mcp.module.css";
import AppCard from "../components/AppCard.jsx";
import { useRouter } from "next/navigation";
import TagGroup from "../components/TagGroup";
import { checkPermission } from "@/utils/utils";
import AddOrEdit from "../components/AddOrEdit"; //新增编辑弹框
import DeleteModal from "../components/DeleteModal"; //删除弹框
import {getMcpTagList,getMcpList,getMcpTagListUp} from '@/api/mcp';
import TagModel from "../components/Tag"; //标签弹框
import McpDetail from '../components/Detail';
export default function KnowledgePage() {
  const { TextArea } = Input;
  const { Paragraph, Text } = Typography;
  const addOrEditRef = useRef(null);
  const deleteRef = useRef(null); //删除弹框
  const tagModelRef = useRef(null); //标签弹框
  const router = useRouter();
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedType, setSelectedType] = useState([]);
  const [appList, setAppList] = useState([]); //应用列表
  const [tagList, setTagList] = useState([]); //标签列表
  const [form] = Form.useForm();
  const [tabValue, setTabValue] = useState("1"); //1 传统Rag 2  Graph Rag
  const [cardOption, setCardOption] = useState([]); //卡片操作权限
  const [canCreate, setCanCreate] = useState(false); //创建应用权限
  const [deleteModalShow, setDeleteModalShow] = useState(false);
  const [deleteObj, setDeleteObj] = useState("");
  const updateRef = useRef(null);
  const detailRef = useRef(null);
  const handleTagChange = (tag, checked) => {
    const next =
      tag.length == 0
        ? []
        : checked
          ? [
            ...selectedTags.filter(
              (t) => t.name !== "全部标签" && t.id !== tag.id
            ),
            tag,
          ]
          : selectedTags.filter((t) => t.id !== tag.id);
    // 若未有选中的标签，默认选中全部标签
    setSelectedTags(next);
    fetchMcpListEvent(next);
  };
  useEffect(() => {
    fetchMcpListEvent();
  }, [searchKeyword]);

  useEffect(() => {
    fetMcpTagListEvent();
  }, []);
  //获取知识库所有标签列表
  const fetMcpTagListEvent = async (name) => {

    getMcpTagListUp().then((res) => {
      let data = res.data;
      setTagList(data);

      if (!selectedTags.length) {
        setSelectedTags([]);
      } else {
        setSelectedTags(selectedTags);
      }
   
    });
  };
  //获取知识库列表
  const fetchMcpListEvent = async (tagData, status) => {
    let arr = tagData ? tagData : selectedTags;
    let tagIds = []; //标签id
    if (arr.some((tag) => tag.name === "全部标签")) {
      // 当前选中包含全部标签，tagIds 为空
      tagIds = [];
    } else {
      // 当前选中不包含全部标签，循环获取标签 id
      tagIds = arr.map((tag) => tag.id);
    }
    // 定义请求参数对象
    let data = {
      displayName: searchKeyword, // 搜索关键词
      tagIdList: tagIds, // 标签ID列表
      current: 1, // 当前页码，固定为第一页
      size: 10000, // 每页数据量，设置为10000
      isShelf:true, // MCP上架状态
    };
    getMcpList(data).then((res) => {
      let records =res.data.records;
      setAppList(records);
    });
  };
  useEffect(()=>{
  },[appList])
  //管理标签弹窗
  const [tagModalVisible, setTagModalVisible] = useState(false);
  const openTagModal = () => {
    tagModelRef.current.showModal();
  }; //删除标签

  //知识库删除事件
  const deleteAppHandle = (record) => {
    setDeleteModalShow(true);
    setDeleteObj(record);
  };
  //知识库删除确认事件
  const delKnowlegeEvent = () => {
    deleteKnowledgeBase(deleteObj.id).then((res) => {
      message.success("删除成功");
      setDeleteModalShow(false);
      fetchMcpListEvent();
    });
  };
  //编辑知识库信息
  const handleEditAppInfo = (appInfo) => {
    if(appInfo.isEmpty){//编辑空知识库
      addOrEditRef.current.showModal(appInfo, "edit");
    }
    else{ //编辑非空知识库
      updateRef.current.showModal(appInfo,'knowledge');

    }
  
  };
  //搜索事件
  const searchEvent = () => {
    fetchMcpListEvent();
  };
  //添加mcp点击事件
  const addMcpEvent =()=>{
     addOrEditRef.current.showModal("", "add");
  }
  //详情点击事件
  const detailClickEvent =(app)=>{
    detailRef.current.showModal(app);
  }

  return (
    <div className={styles["knowledge_container"]}>
      <div className={styles["mcp_square_header"]}>
       <div className={styles["mcp_square_header_title"]}>MCP广场
        <span className={styles["mcp_square_header_title_num"]}>{appList.length}</span>
       </div>
      </div>
     <div className={styles["mcp_square_header_search"]}>
        {tagList.length > 0 && (
      <TagGroup
        list={tagList}
        selectedTags={selectedTags}
        onChange={handleTagChange}
        keyField="id"
        labelField="name"
    
      >
      </TagGroup>
      )}
      <div className={styles["mcp_square_header_search_input"]}>
        <Input
            style={{
              width: 360,
              borderRadius: 8,
              backgroundColor: "rgba(255,255,255,0.6)",
              height: 36,
            }}
            placeholder="搜索MCP名称,不超过50个字"
            maxLength={50}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onPressEnter={() => searchEvent()}
            suffix={
              <SearchOutlined
                style={{ cursor: "pointer" }}
                onClick={() => searchEvent()}
              />
            }
          />
          </div>
      </div>

      {appList.length > 0 && (
        <div className={styles["app-list"]}>
          {appList.map((appItem) => (
            <AppCard
              key={appItem.id}
              app={appItem}
              allTagList={tagList}
              onEditAppInfo={handleEditAppInfo}
              openTagModal={openTagModal}
              updateAppList={searchEvent}
              updatetagList={fetMcpTagListEvent}
              deleteAppHandle={deleteAppHandle}
              cardOptions={cardOption}
              tagManageModal={tagModalVisible}
              permission={canCreate}
              detailClickEvent={detailClickEvent}
              isSquare={true}
            />
          ))}
        </div>
      )}
      {appList.length == 0 && (
        <div className={styles["app-list_empty"]}>
         <Empty image={"/mcp/mcp_empty.png"} styles={{ image: { height: 220, width: 220 } }} description={
            <span style={{ color: '#666E82', fontWeight: 500 }}>
              暂无MCP
            </span>
          } />
        </div>
      )}
      {/* 删除弹框  */}
      <DeleteModal
        visible={deleteModalShow}
        title={`要删除知识库吗？`}
        content="删除知识库是不可逆的。用户将无法再访问您的知识库，所有的提示配置和日志将被被永久删除?"
        onCancel={() => setDeleteModalShow(false)}
        onOk={delKnowlegeEvent}
      />
        {/* 详情 */}
      <McpDetail ref={detailRef} searchEvent={searchEvent}></McpDetail>
    </div>
  );
}
