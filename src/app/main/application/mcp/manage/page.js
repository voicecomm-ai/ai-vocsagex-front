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
  ConfigProvider,
  Segmented,
  Checkbox,
  Divider,
  Select,
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
import McpPush from "../components/McpPush";
import { getMcpTagList, getMcpList,addMcpTag } from "@/api/mcp";
import TagModel from "../components/Tag"; //标签弹框
import BatchTag from "../components/BatchTag";
import McpDetail from "../components/Detail";
import { useStore } from "@/store/index";
import { getUuid } from "@/utils/utils";
import TagSelect from "@/app/components/TagSelect";
export default function McpPage() {
  const { TextArea } = Input;
  const { Paragraph, Text } = Typography;
  const tagSelectRef = useRef(null);
  const addOrEditRef = useRef(null);
  const deleteRef = useRef(null); //删除弹框
  const tagModelRef = useRef(null); //标签弹框
  const router = useRouter();
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [appList, setAppList] = useState([]); //应用列表
  const [tagList, setTagList] = useState([]); //标签列表
  const [cardOption, setCardOption] = useState([]); //卡片操作权限
  const [canCreate, setCanCreate] = useState(false); //创建应用权限
  const updateRef = useRef(null);
  const [mcpStatus, setMcpStatus] = useState(true); // true 已经上架 false 未上架
  const [selectedKeys, setSelectedKeys] = useState([]); //当前选择的mcp
  const [selectAll, setSelectAll] = useState(false); //是否全选
  const delRef = useRef(null);
  const mcpPushRef = useRef(null);
  const batchTagRef = useRef(null);
  const detailRef = useRef(null); //详情
  const { setMenuChangeId } = useStore((state) => state);
  const { showSecondSide } = useStore((state) => state);
  useEffect(() => {
    setCardOption([
      {
        label: "下架",
        isDisabled: !checkPermission("/main/application/mcp/manage/operation"),
        key: "remove",
      },
    ]);
    setCanCreate(checkPermission("/main/application/mcp/manage/operation"));
  }, []);
  const statusOptions = [
    { label: "已上架", key: true },
    { label: "未上架", key: false },
  ];
  //标签选择change 事件
  const handleTagChange = (tags) => {
    setSelectedTags(tags);
    fetchMcpList(tags);
  };
  useEffect(() => {
    fetchMcpList();
  }, [searchKeyword]);

  useEffect(() => {
    fetMcpTagList();
  }, []);
  //获取mcp所有标签列表
  const fetMcpTagList = async (name) => {
    let data = {
      name: "",
    };
    getMcpTagList(data).then((res) => {
      let data = res.data;

      setTagList(data);

      if (!selectedTags.length) {
        setSelectedTags([]);
      } else {
        setSelectedTags(selectedTags);
      }
    });
  };
  //获取mcp列表
  const fetchMcpList = async (tagData, status, type) => {
    cancelSelectEvent();
    let arr = tagData ? tagData : selectedTags;
    let tagIds =arr;
    // 定义请求参数对象
    let data = {
      displayName: searchKeyword, // 搜索关键词
      tagIdList: tagIds, // 标签ID列表
      current: 1, // 当前页码，固定为第一页
      size: 10000, // 每页数据量，设置为10000
      isShelf: type ? status : mcpStatus, // MCP上架状态
    };
    getMcpList(data).then((res) => {
      let records = res.data.records;
      setAppList(records);
    });
  };
  const openTagModal = () => {
    tagModelRef.current.showModal();
  }; //删除标签

  //编辑mcp信息
  const handleEditAppInfo = (appInfo) => {
    addOrEditRef.current.showModal(appInfo, "update");
  };
  //搜索事件
  const searchEvent = (type) => {
    if (type == "add") {
      setMcpStatus(false);
      updateButtonPermission(false);
      fetchMcpList("", false, "add");
    } else {
      fetchMcpList();
    }

    if (type == "refresh") {
      cancelSelectEvent();
    }
    setMenuChangeId(getUuid());
  };
  //添加mcp点击事件
  const addMcpEvent = () => {
    addOrEditRef.current.showModal("", "add");
  };
  //切换上架下架事件
  const changeShelfHandle = (val) => {
    cancelSelectEvent(); //取消全选
    setSelectedKeys([]);
    setMcpStatus(val);
    fetchMcpList("", val, 1);
    updateButtonPermission(val);
  };

  //按钮权限更新
  const updateButtonPermission = (val) => {
    if (val) {
      setCardOption([
        {
          label: "下架",
          isDisabled: !checkPermission(
            "/main/application/mcp/manage/operation"
          ),
          key: "remove",
        },
      ]);
    } else {
      setCardOption([
        {
          label: "编辑",
          isDisabled: !checkPermission(
            "/main/application/mcp/manage/operation"
          ),
          key: "edit",
        },
        {
          label: "删除",
          isDisabled: !checkPermission(
            "/main/application/mcp/manage/operation"
          ),
          key: "del",
        },
      ]);
    }
  };
  //mcp 选择事件
  const mcpCheckEvent = (id) => {
    setSelectedKeys((prev) =>
      prev.includes(id) ? prev.filter((key) => key !== id) : [...prev, id]
    );
  };
  //全选change 事件
  const selectAllChange = (e) => {
    setSelectAll(e.target.checked);
    if (e.target.checked) {
      //当前全选存在时
      setSelectedKeys(appList.map((item) => item.id));
    } else {
      setSelectedKeys([]);
    }
  };
  //取消全选事件
  const cancelSelectEvent = () => {
    setSelectedKeys([]);
    setSelectAll(false);
  };
  //mcp 状态变更事件
  const changeMcpStatusEvent = (obj, status) => {
    if (status) {
      //上架
      upMcpEvent(obj);
    } else {
      confirmEvent(obj);
    }
  };
  //mcp删除事件
  const deleteAppHandle = (record) => {
    let title = "要删除MCP吗？";
    let content = "删除MCP后不可恢复！";
    delRef.current.showModal(record, title, content, "del", []);
  };
  //删除下架弹框回调
  const confirmEvent = (record) => {
    let title = "下架";
    let content = "MCP下架后，将无法在MCP广场查看&应用！";
    delRef.current.showModal(record, title, content, "down", []);
  };
  //批量删除mcp
  const batchDelMcpEvent = () => {
    let title = "要删除MCP吗？";
    let content = "共删除" + selectedKeys.length + "个MCP，删除后不可恢复！";
    delRef.current.showModal("", title, content, "del", selectedKeys);
  };
  //批量上架mcp
  const batchUpMcpEvent = () => {
    let title = "上架";
    let content =
      "共上架" + selectedKeys.length + "个MCP，上架后可在MCP广场查看&应用！";
    mcpPushRef.current.showModal("", title, content, "batchUp", selectedKeys);
  };
  //批量下架mcp
  const batchDownMcpEvent = () => {
    let title = "下架";
    let content =
      "共下架" +
      selectedKeys.length +
      "个MCP，下架后将无法在MCP广场查看&应用！";
    delRef.current.showModal("", title, content, "down", selectedKeys);
  };
  //上架点击事件
  const upMcpEvent = (obj) => {
    let title = "上架";
    let content = "MCP上架后可在MCP广场查看&应用！";
    mcpPushRef.current.showModal(obj, title, content, "up", selectedKeys);
  };
  //批量绑定标签
  const batchTagEvent = () => {
    batchTagRef.current.showModal(selectedKeys);
  };
  //详情点击事件
  const detailClickEvent = (app) => {
    detailRef.current.showModal(app);
  };
  //添加标签事件
  const addTagEvent = (tag) => {
    addMcpTag({name:tag.name}).then(res => {
      message.success('添加成功');
      tagSelectRef.current.addCallback();
      fetMcpTagList();
    })
    .catch(err => {
      console.log(err);
    })
  };
  return (
    <div
      className={`${styles["knowledge_container"]} ${
        !showSecondSide ? styles["no-second-sidebar"] : ""
      }`}
    >
      <div className={styles["page-title"]}>
        <span className={styles["page-title-text"]}>MCP</span>
        <div className={styles["mcp_title_right"]}>
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
              marginRight: 12,
              borderRadius: 8,
              backgroundColor: "rgba(255,255,255,0.6)",
              height: 36,
              border: "1px solid #dddfe4",
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
          {canCreate && (
            <>
            <div style={{ width: 1, height: 28, backgroundColor: "#dddfe4",marginRight: 8 }} />
            <Button
              type="primary"
              style={{ width: "160px", borderRadius: 12, height: 36 }}
              onClick={addMcpEvent}
              icon={<PlusOutlined />}
            >
              添加MCP
            </Button>
            </>
          )}
        </div>
      </div>
      <div className={styles["mcp_status_switch"]}>
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
            value={mcpStatus}
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
        {canCreate && appList.length > 0 && (
          <div className={styles["mcp_status_switch_right"]}>
            {!mcpStatus && (selectAll || selectedKeys.length > 0) && (
              <div className={styles["mcp_status_switch_right_check"]}>
                <div className={styles["mcp_status_switch_right_check_item"]}>
                  {" "}
                  <img src="/mcp/check.png" />
                  {selectedKeys.length}项已选
                </div>
                <Divider type="vertical" />
                <div
                  onClick={batchTagEvent}
                  className={styles["mcp_status_switch_right_check_item"]}
                >
                  <img src="/mcp/tag.png" />
                  调整标签
                </div>
                <div
                  onClick={batchUpMcpEvent}
                  className={styles["mcp_status_switch_right_check_item"]}
                >
                  {" "}
                  <img src="/mcp/push.png" />
                  批量上架
                </div>
                <div
                  onClick={batchDelMcpEvent}
                  className={styles["mcp_status_switch_right_check_item_del"]}
                >
                  {" "}
                  <img src="/mcp/del.png" />
                  批量删除
                </div>
                <Divider type="vertical" />
                <div
                  className={styles["mcp_status_switch_right_check_item"]}
                  onClick={cancelSelectEvent}
                >
                  取消
                </div>
              </div>
            )}
            {mcpStatus && (selectAll || selectedKeys.length > 0) && (
              <div className={styles["mcp_status_switch_right_check"]}>
                <div className={styles["mcp_status_switch_right_check_item"]}>
                  {" "}
                  <img src="/mcp/check.png" alt="" />
                  {selectedKeys.length}项已选
                </div>
                <Divider type="vertical" />

                <div
                  onClick={batchDownMcpEvent}
                  className={styles["mcp_status_switch_right_check_item"]}
                >
                  {" "}
                  <img src="/mcp/push.png" alt="" />
                  批量下架
                </div>

                <Divider type="vertical" />
                <div
                  className={styles["mcp_status_switch_right_check_item"]}
                  onClick={cancelSelectEvent}
                >
                  取消
                </div>
              </div>
            )}
            {!selectAll && selectedKeys.length == 0 && (
              <div className={styles["mcp_status_switch_right_checkAll"]}>
                <Checkbox onChange={selectAllChange}>全选</Checkbox>
              </div>
            )}
          </div>
        )}
      </div>
      {appList.length > 0 && (
        <div className={styles["app-list"]}>
          {appList.map((appItem) => (
            <AppCard
              key={appItem.id}
              app={appItem}
              allTagList={tagList}
              onEditAppInfo={handleEditAppInfo}
              changeMcpStatusEvent={changeMcpStatusEvent}
              updateAppList={searchEvent}
              updatetagList={fetMcpTagList}
              deleteAppHandle={deleteAppHandle}
              checked={selectedKeys.includes(appItem.id)}
              cardOptions={cardOption}
              onCheck={() => mcpCheckEvent(appItem.id)}
              mcpStatus={mcpStatus}
              detailClickEvent={detailClickEvent}
              permission={canCreate}
              isSquare={false}
            />
          ))}
        </div>
      )}
      {appList.length == 0 && (
        <div className={styles["app-list_empty"]}>
          <Empty
            image={"/mcp/mcp_empty.png"}
            styles={{ image: { height: 220, width: 220 } }}
            description={
              <span style={{ color: "#666E82", fontWeight: 500 }}>暂无MCP</span>
            }
          />
        </div>
      )}
      {/* 标签弹框 */}
      <TagModel
        ref={tagModelRef}
        fetMcpTagList={fetMcpTagList}
        fetchMcpList={fetchMcpList}
        canCreate={canCreate}
      ></TagModel>
      {/* 新增修改弹框 */}
      <AddOrEdit ref={addOrEditRef} searchEvent={searchEvent}></AddOrEdit>
      {/* 删除弹框  */}
      <DeleteModal ref={delRef} searchEvent={searchEvent} />
      {/* 上架 */}
      <McpPush ref={mcpPushRef} searchEvent={searchEvent}></McpPush>
      {/* 批量绑定标签 */}
      <BatchTag ref={batchTagRef} searchEvent={searchEvent}></BatchTag>
      {/* 详情 */}
      <McpDetail ref={detailRef} searchEvent={searchEvent}></McpDetail>
    </div>
  );
}
