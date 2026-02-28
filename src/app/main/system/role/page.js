'use client'
import styles from './page.module.css';
import { DashOutlined, CheckOutlined, FormOutlined, PlusOutlined } from '@ant-design/icons';
import React, { useState, forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import { Space, Table, Tree, Button, Empty, Pagination, Dropdown, ConfigProvider } from 'antd';
import {
  createRole,
  deleteRole,
  getRoleInfo,
  getRoleList,
  updateRole,
} from "@/api/user";
import { getDepartmentTree } from '@/api/department';
import DeleteModel from '../../../components/common/Delete';
import AddOrEdit from "./components/AddOrEdit";
import { message } from 'antd';
import { checkPermission } from '@/utils/utils';
import { useStore } from "@/store/index"; 
export default function RolePage() {
  const { showSecondSide } = useStore((state) => state);
  const deleteRef = useRef(); //删除弹窗
  const addOrEditRef = useRef(); //新增或编辑弹窗
  const [departmentList, setDepartmentList] = useState([]); //部门列表
  const [tabKey, setTabKey] = useState(0); // 用于刷新树形结构
  const [isMounted, setIsMounted] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState([]); // 用于存储选中的节点的 key
  const [selectDepartment, setSelectDepartment] = useState({}); // 当前选中的部门对象
  const [pageObj, setPageObj] = useState({
    current: 1,
    pageSize: 10,
  }); // 分页对象
  const [pageData, setPageData] = useState([]); // 分页数据
  const [total, setTotal] = useState(0); // 总条数
  //获取部门列表
  const getDepartmentList = () => {
    getDepartmentTree({}).then((res) => {
      setTabKey(tabKey + 1);
      setDepartmentList(res.data);
      let defaultId = res.data ? res.data[0].id : '';
      if (defaultId) {//默认选中第一个
        setSelectedKeys([defaultId]);
        getRoleListEvent(defaultId);
        setSelectDepartment(res.data[0]);
      }

    });
  }
  //初始化
  const init = () => {
    setIsMounted(true);
    getDepartmentList();
  }
  //获取角色列表
  const getRoleListEvent = (id) => {
    let data = {
      current: pageObj.current,
      size: pageObj.pageSize,
      deptId: id,
    };
    getRoleList(data).then((res) => {
      setPageData(res.data.records);
      setTotal(res.data.total);

    });
  }
  useEffect(() => {
    init();
  }, []);
  // 树形结构选中事件
  const onSelect = (keys, info) => {
    setSelectedKeys(keys);
    setPageObj({ ...pageObj, current: 1 });
    getRoleListEvent(keys[0]);
    setSelectDepartment(info.node);// 存储选中的节点的对象
  };
  useEffect(() => {
    getRoleListEvent(selectDepartment.id);
  }, [pageObj])

  //分页change
  const pageChange = (current, pageSize) => {
    console.log(current, pageSize)
    setPageObj({ ...pageObj, current: current, pageSize: pageSize });
  }

  //右侧表格
  const columns = [
    {
      title: '角色名称',
      dataIndex: 'roleName',
      key: 'roleName',
      width: 350,
      render: (_, record) => (
        <div className={styles['roleName_container']} >
          <img src="/user/role.png" className={styles['role_avator']} />
          <span className={styles['role_name']}>{record.roleName}</span>
        </div>
      ),
    },
    {
      title: '角色描述',
      dataIndex: 'description',
      key: 'description',
      width: 210,
      ellipsis: true,
    },
    {
      title: '包含用户数',
      dataIndex: 'userCount',
      key: 'userCount',
    },
    {
      title: "所属部门",
      dataIndex: "deptName",
      key: "deptName",
    },
    {
      title: '最后操作时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
    },
    {
      title: '操作人',
      dataIndex: 'updateByName',
      key: 'updateByName',
    },
    {
      title: '操作',
      dataIndex: 'email',
      align: 'center',
      width: 90,
      render: (_, record) => (
        <div className="operation_column" >
          <Dropdown menu={{ items: getMenuItems(record) }} placement="bottomRight" >
            <img src="/user/more.png" className={styles['user_more']} />
          </Dropdown>
        </div>
      ),
    },
  ];
  const getMenuItems = (record) => {
    ///
    let addOrEditText = record.roleName == '超级管理员' ? '查看' : '编辑';
    const menuItems = [];
    // 添加查看或编辑菜单项
    menuItems.push({
      key: '1',
      label: addOrEditText,
      disabled: !checkPermission('/management/role/operation') && record.roleName != '超级管理员',
      onClick: () => {
        editEvent(record); // 调用编辑事件并传入 record
      }
    });

    // 根据 status 状态添加启用或禁用菜单项
    if (record.roleName != '超级管理员') {
      menuItems.push({
        key: '2',
        label: '删除',
        disabled: !checkPermission('/management/role/operation'),
        onClick: () => {
          deleteEvent(record);
        }
      });
    }
    return menuItems;
  };
  //创建用户点击事件
  const addRoleEvent = () => {
    console.log(selectDepartment)
    addOrEditRef.current.showModal({}, 'add', selectDepartment);
  }
  //编辑用户点击事件
  const editEvent = (record) => {
    let type = 'edit';
    if (record.roleName === '超级管理员') {//管理员账号不能编辑
      type = 'show';
    }
    //如果没有权限，则不显示编辑按钮
    if (!checkPermission('/management/role/operation') && record.roleName != '超级管理员') {
      return false;
    }
    addOrEditRef.current.showModal(record, type, selectDepartment);
  }
  //删除用户点击事件
  const deleteEvent = (record) => {
    if (record.userCount > 0) {
      return message.warning("存在用户，无法删除");
    }
    let title = "确定要删除该角色吗？";
    let tip = "删除该角色后将不可恢复，是否确认删除?";
    deleteRef.current.showModal(record, title, tip);
  }
  //删除回调
  const deleteCallBack = (record) => {
    deleteRole(record.id).then((res) => {
      message.success("删除成功");
      getRoleListEvent(selectedKeys[0]);
      deleteRef.current.hideModal();
    });
  }
  //搜索
  const searchEvent = () => {
    getRoleListEvent(selectedKeys[0]);
  }

  return (
    <div className={`${styles['role_container']} ${showSecondSide ? styles.role_container_border : ""}`}>
      <ConfigProvider
        theme={{
          components: {
            Table: {
              headerColor: "#666E82",
            },
          },
          token: {
            colorBgContainer: 'rgba(255, 255, 255, 0.1)', //背景颜色
          },
        }}
      >
        <div className={styles['role_left']}>
          <div className={styles['left_category_content_title']}>
            <span>部门架构</span>
          </div>
          {departmentList.length > 0 ? (
            <div className={styles['left_category_content_tree']}>
              <Tree
                key={tabKey}
                showLine={false}
                showIcon={false}
                fieldNames={{ title: 'departmentName', key: 'id', children: 'children' }}
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
            <div className={styles['left_category_content_empty']}>
              <Empty />
            </div>
          )}

        </div>
        <div className={styles['role_right']}>
          <div className={styles['role_right_top']}>
            <div className={styles['role_right_top_title']}>
              {selectDepartment.departmentName}
            </div>
            <div className={styles['role_right_top_right']}>
              {isMounted && (
                <Button disabled={!checkPermission('/management/role/operation')} type="primary" icon={<PlusOutlined />} onClick={addRoleEvent}>创建角色</Button>
              )}

            </div>

          </div>
          <div className={styles['role_right_middle']}>
            <div className={styles['role_right_middle_tab']}>
              <Table dataSource={pageData} columns={columns} pagination={false} />
            </div>

            <div className={styles['role_right_page']}>
              <Pagination onChange={pageChange} current={pageObj.current} pageSize={pageObj.pageSize} total={total} /></div>
          </div>
        </div>
      </ConfigProvider>
      {/* 新增修改 */}
      <AddOrEdit ref={addOrEditRef} searchEvent={searchEvent}></AddOrEdit>
      {/* 删除弹框  */}
      <DeleteModel ref={deleteRef} deleteCallBack={deleteCallBack} ></DeleteModel>
    </div>
  );
}
