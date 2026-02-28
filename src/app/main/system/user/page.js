"use client";
import React, { useEffect, useState, useRef } from "react";
import styles from "./page.module.css";
import {
  DashOutlined,
  CheckOutlined,
  FormOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  Space,
  Table,
  Tree,
  Button,
  Select,
  Input,
  Empty,
  Pagination,
  Dropdown,
  ConfigProvider,
  Badge,
  message,
  Radio,
} from "antd";
import { getDepartmentTree } from "@/api/department";
import AddOrEdit from "./components/AddOrEdit";
import { getRoleList, getUserList, enableUser, disableUser } from "@/api/user";
import DeleteModel from "../../../components/common/Delete";
import UpdatePwd from "../../../components/User/UpdatePwd";
import { checkPermission } from "@/utils/utils";
import { useStore } from "@/store/index";
export default function UserPage() {
  const deleteRef = useRef(); // 删除弹框
  const [departmentList, setDepartmentList] = useState([]); //部门列表
  const [tabKey, setTabKey] = useState(0); // 用于刷新树形结构
  const [selectedKeys, setSelectedKeys] = useState([]); // 用于存储选中的节点的 key
  const { showSecondSide, setShowSecondSide } = useStore((state) => state);
  //获取部门列表
  const [pageObj, setPageObj] = useState({
    current: 1, // 当前页码
    pageSize: 10, // 每页显示条数
  });
  const [pageData, setPageData] = useState([]); // 分页数据
  const [total, setTotal] = useState(0); // 总条数
  const [roleList, setRoleList] = useState([]); // 角色列表
  const [isMounted, setIsMounted] = useState(false);
  const [selectDepartment, setSelectDepartment] = useState({}); // 当前选中的部门对象
  const addOrEditRef = useRef(); // 新增修改弹框
  const resetPwdRef = useRef(); // 重置密码弹框
  const [search, setSearch] = useState({
    accountOrName: "", // 搜索关键字
    roleId: null, // 角色ID
    status: null, // 状态
  }); // 初始化状态
  const [filterStatus, setFilterStatus] = useState(null); // 筛选状态 0：全部 1：正常 2：禁用
  const options = [
    { label: "正常", value: 0 },
    { label: "禁用", value: 1 },
  ];
  const getDepartmentList = () => {
    getDepartmentTree({}).then((res) => {
      setTabKey(tabKey + 1);
      setDepartmentList(res.data);
      let defaultId = res.data ? res.data[0].id : "";
      if (defaultId) {
        //默认选中第一个
        handleSelectEvent(res.data);
      }
    });
  };
  //处理部门选择事件
  const handleSelectEvent = (data) => {
    setSelectedKeys([data[0].id]);
    setSelectDepartment(data[0]);
    getRoleListEvent(data[0].id);
    getUserListEvent(data[0].id);
  };
  //根据部门获取角色列表
  const getRoleListEvent = (departmentId) => {
    let data = {
      current: 1,
      size: 1000,
      deptId: departmentId,
    };
    getRoleList(data).then((res) => {
      setRoleList(res.data.records);
    });
  };
  //初始化
  const init = () => {
    setIsMounted(true);
    getDepartmentList();
  };

  useEffect(() => {
    init();
  }, []);

  // 树形结构选中事件
  const onSelect = (keys, info) => {
    setFilterStatus(null);
    setSelectedKeys(keys); // 存储选中的节点的 key
    setPageObj({ ...pageObj, current: 1 }); // 重置页码为 1
    getRoleListEvent(keys[0]); // 根据选中的节点的 key 获取角色列表
    setSelectDepartment(info.node); // 存储选中的节点的 dataRef
    clearSearch(); // 清空搜索输入框
  };
  //清空搜索输入框
  const clearSearch = () => {
    setSearch({
      accountOrName: "", // 搜索关键字
      roleId: null, // 角色ID
      status: null, // 状态
    }); // 初始化状态
  };

  //右侧表格
  const columns = [
    {
      title: "登录账号",
      dataIndex: "account",
      key: "account",
      render: (_, record) => (
        <div className={styles["roleName_container"]}>
          <img src="/user/user.png" className={styles["role_avator"]} />
          <span className={styles["role_name"]}>{record.account}</span>
        </div>
      ),
      width: 220,
    },
    {
      title: "用户名",
      dataIndex: "username",
      key: "username",
      width: 220,
    },
    {
      title: "角色",
      dataIndex: "roleName",
      key: "roleName",
      width: 160,
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 100,
      key: "status",
      // 自定义筛选下拉框
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
        close,
      }) => {
        return (
          <div className={styles["filter_dropdown"]}>
            <Radio.Group
              onChange={filterChange}
              value={filterStatus}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
              options={[
                { value: 0, label: "正常" },
                { value: 1, label: "禁用" },
              ]}
            ></Radio.Group>
            <div className={styles["filter_dropdown_btn"]}>
              <Button
                size="small"
                onClick={() => {
                  cancelFilter(confirm, close);
                }}
              >
                取消
              </Button>
              <Button
                type="primary"
                size="small"
                onClick={() => {
                  customFilter(confirm, close);
                }}
              >
                确定
              </Button>
            </div>
          </div>
        );
      },
      render: (status) => {
        let text = status === 0 ? "正常" : "禁用";
        let color = "#32BB7B";
        let backgroundColor = "rgba(50,187,123,0.1)";
        if (status === 0) {
          color = "#32BB7B"; // 正常状态设置为绿色
          backgroundColor = "rgba(50,187,123,0.1)";
        } else if (status === 1) {
          color = "#FF7C37";
          backgroundColor = "rgba(255,124,55,0.1)";
        }
        return (
          <div
            className={styles["user_tab_status"]}
            style={{ color: color, backgroundColor: backgroundColor }}
          >
            {" "}
            <Badge color={color} />
            <div>{text}</div>
          </div>
        );
      },
    },
    {
      title: "所属部门",
      dataIndex: "deptName",
      key: "deptName",
      width: 160,
    },
    {
      title: "最后操作时间",
      dataIndex: "updateTime",
      key: "updateTime",
      width: 210,
    },
    {
      title: "操作人",
      width: 220,
      dataIndex: "updateByName",
      key: "updateByName",
    },
    {
      title: "操作",
      dataIndex: "operation",
      key: "operation",
      align: "center",
      width: 90,
      render: (_, record) => (
        <div className="operation_column">
          <Dropdown
            menu={{ items: getMenuItems(record) }}
            placement="bottomRight"
          >
            <img src="/user/more.png" className={styles["user_more"]} />
          </Dropdown>
        </div>
      ),
    },
  ];

  //取消筛选
  const cancelFilter = (confirm) => {
    confirm();
    setFilterStatus(null);

    setSearch({
      ...search,
      status: null,
    });
  };
  //
  const filterChange = (e) => {
    setFilterStatus(e.target.value); // 设置筛选状态为选中的值
  };
  // 自定义筛选函数
  const customFilter = (confirm, close) => {
    close(); // 关闭筛选框
    confirm(true); // 关闭筛选框
    setSearch({
      ...search,
      status: filterStatus,
    }); // 设置搜索条件为筛选条件
  };
  const getMenuItems = (record) => {
    let addOrEditText = record.account === "admin" ? "查看" : "编辑";
    let statusText = record.status == 0 ? "禁用" : "启用";
    const menuItems = [];
    // 添加查看或编辑菜单项
    menuItems.push({
      key: "1",
      label: addOrEditText,
      disabled:
        !checkPermission("/management/account/operation") &&
        record.account != "admin",
      onClick: () => {
        editEvent(record); // 调用编辑事件并传入 record
      },
    });

    // 根据 status 状态添加启用或禁用菜单项
    if (record.roleName != "超级管理员") {
      menuItems.push({
        key: "2",
        disabled: !checkPermission("/management/account/operation"),
        label: statusText,
        onClick: () => {
          statusChangeEvent(record);
        },
      });
    }
    if (record.status === 0) {
      // 当 status 为 0 时添加重置密码按钮
      menuItems.push({
        key: "3",
        label: "重置密码",
        disabled: !checkPermission("/management/account/operation"),
        onClick: () => {
          resetPwdEvent(record);
        },
      });
    }
    return menuItems;
  };
  //状态变更事件
  const statusChangeEvent = (record) => {
    if (record.status === 0) {
      let title = "确定要禁用该用户吗？";
      let tip = "禁用会导致该账号无法使用，是否确定禁用?";
      deleteRef.current.showModal(record, title, tip);
    } else {
      //启用
      enableUser(record.id)
        .then((res) => {
          message.success("启用成功");
          getUserListEvent(selectDepartment.id);
        })
        .catch((err) => {});
    }
  };
  const resetPwdEvent = (record) => {
    resetPwdRef.current.showModal(record, 2); // 打开重置密码弹框
  };
  //禁用回调
  const callBackEvent = (record) => {
    disableUser(record.id)
      .then(() => {
        message.success("禁用成功");
        getUserListEvent(selectDepartment.id); // 刷新用户列表
        deleteRef.current.hideModal();
      })
      .catch((err) => {
        console.log(err);
      });
  };
  //输入框change事件
  const onInputChange = (e) => {
    setSearch({ ...search, accountOrName: e.target.value });
  };
  // 下拉框角色change事件
  const onRoleSelectChange = (value) => {
    setSearch({ ...search, roleId: value });
  };
  // 下拉框状态change事件
  const onChange = (value) => {
    setSearch({ ...search, status: value });
  };
  //监听搜索数据变化
  useEffect(() => {
    if (selectDepartment.id) {
      getUserListEvent(selectDepartment.id);
    }
  }, [search]);
  //新增用户
  const addEvent = () => {
    addOrEditRef.current.showModal("", "add", selectDepartment); // 打开新增弹框
  };
  //编辑用户
  const editEvent = (record) => {
    let type = "edit";
    if (record.account === "admin") {
      //管理员账号不能编辑
      type = "show";
    }
    //如果没有权限，则不显示编辑按钮
    if (
      !checkPermission("/management/account/operation") &&
      record.account != "admin"
    ) {
      return false;
    }
    addOrEditRef.current.showModal(record, type, selectDepartment); // 打开编辑弹框
  };
  const searchEvent = () => {
    getUserListEvent(selectDepartment.id);
  };

  //分页change事件
  const pageChange = (current, pageSize) => {
    setPageObj({ ...pageObj, current: current, pageSize: pageSize });
  };
  useEffect(() => {
    getUserListEvent(selectDepartment.id);
  }, [pageObj]);
  //获取用户列表
  const getUserListEvent = async (departmentId) => {
    console.log("获取用户列表", selectDepartment);
    let data = {
      current: pageObj.current,
      size: pageObj.pageSize,
      deptId: departmentId,
      accountOrName: search.accountOrName,
      roleId: search.roleId,
      status: search.status,
    };
    getUserList(data)
      .then((res) => {
        setPageData(res.data.records);
        setTotal(res.data.total);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  return (
    <div className={`${styles["user_container"]} ${showSecondSide ? styles.user_container_border : ""}`}>
      <ConfigProvider
        theme={{
          components: {
            Table: {
              headerColor: "#666E82",
            },
          },
          token: {
            colorBgContainer: "rgba(255, 255, 255, 0.1)", //背景颜色
          },
        }}
      >
        <div className={styles["user_left"]}>
          <div className={styles["left_category_content_title"]}>
            <span>部门架构</span>
          </div>
          {departmentList.length > 0 ? (
            <div className={styles["left_category_content_tree"]}>
              <Tree
                key={tabKey}
                showLine={false}
                showIcon={false}
                fieldNames={{
                  title: "departmentName",
                  key: "id",
                  children: "children",
                }}
                defaultExpandAll={true}
                onSelect={onSelect}
                defaultSelectedKeys={selectedKeys}
                checkedKeys={selectedKeys}
                treeData={departmentList}
                titleRender={(data) => {
                  return (
                    <div>
                      <span>{data.departmentName}</span>
                    </div>
                  );
                }}
              />
            </div>
          ) : (
            <div className={styles["left_category_content_empty"]}>
              <Empty />
            </div>
          )}
        </div>
        <div className={styles["user_right"]}>
          <div className={styles["user_right_top"]}>
            <div className={styles["user_right_top_left"]}>
              {selectDepartment.departmentName}
            </div>
            <div className={styles["user_right_top_right"]}>
              <Space>
                {" "}
                <Input
                  maxLength={20}
                  value={search.accountOrName}
                  onChange={onInputChange}
                        variant="filled"
                  style={{ background: "#F1F2F6",borderRadius: "8px" }}
                  placeholder="请输入账号/用户名搜索"
                />
              </Space>
              <ConfigProvider
  theme={{
    components: {
      Select: {
        selectorBg: "#F1F2F6",
       
      },
    },
  }}
>
              <Select
                allowClear
                showSearch
                onChange={onRoleSelectChange}
                value={search.roleId}
                classNames={{
                  root: styles["role_select"]
                }}
                 variant="borderless"
                style={{ width: "210px",borderRadius: "8px",background:"#F1F2F6", }}
                placeholder="搜索角色"
              
                options={roleList}
                fieldNames={{ label: "roleName", value: "id" }}
                // 自定义搜索函数，确保搜索生效
                filterOption={(input, option) =>
                  option?.roleName?.toLowerCase().includes(input.toLowerCase())
                }
              ></Select>
              </ConfigProvider>
              {isMounted && (
                <Button
                  disabled={!checkPermission("/management/account/operation")}
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={addEvent}
                >
                  创建账号
                </Button>
              )}
            </div>
          </div>
          <div className={styles["user_right_middle"]}>
            <div className={styles["user_right_middle_tab"]}>
              <Table
                onRow={(record, rowIndex) => {
                  return {
                    onClick: (event) => {
                      // 获取点击的单元格所在列的索引
                      const targetCell = event.target.closest("td");
                      const tableRow = targetCell?.closest("tr");
                      if (tableRow) {
                        const cells = Array.from(tableRow.cells);
                        const columnIndex = cells.indexOf(targetCell);
                        // 最后一列的索引是 columns.length - 1，不触发点击事件
                        if (columnIndex !== columns.length - 1) {
                          event.preventDefault(); // 阻止默认行为
                          editEvent(record); // 调用编辑事件并传入 record
                        }
                      }
                    }, // 点击行
                  };
                }}
                dataSource={pageData}
                columns={columns}
                pagination={false}
              />
            </div>
            <div className={styles["user_right_middle_page"]}>
              <Pagination
                onChange={pageChange}
                current={pageObj.current}
                pageSize={pageObj.pageSize}
                total={total}
              />
            </div>
          </div>
        </div>
      </ConfigProvider>
      {/* 新增修改弹框 */}
      <AddOrEdit ref={addOrEditRef} searchEvent={searchEvent} />
      {/* 重置密码弹框 */}
      <UpdatePwd ref={resetPwdRef} searchEvent={searchEvent} />
      {/* 禁用弹框 */}
      <DeleteModel ref={deleteRef} deleteCallBack={callBackEvent} />
    </div>
  );
}
