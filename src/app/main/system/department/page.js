'use client'

import { Table, Space, Button, Input, Dropdown,ConfigProvider } from "antd";
import styles from './page.module.css';
import { DashOutlined } from '@ant-design/icons';
import React, { useState, useEffect, useRef } from 'react';
import { getDepartmentTree, deleteDept } from '@/api/department'
import AddOrEdit from './components/AddOrEdit'
import { message } from 'antd';
import DeleteModel from '../../../components/common/Delete';
import {checkPermission } from '@/utils/utils';
import { useStore } from "@/store/index";
export default function DepartmentPage() {
  const { showSecondSide } = useStore((state) => state);
  const addOrEditRef = useRef();
  const deleteRef = useRef();
  const columns = [
    {
      title: '部门名称',
      dataIndex: 'departmentName',
      key: 'departmentName',
    },
    {
      title: '包含成员数',
      dataIndex: 'userNo',
      key: 'userNo',
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 260,
      render: (_, record) => (
        <Space size="small"  style={{ wordWrap: 'break-word', wordBreak: 'break-word' }}>
          {record.remark ? record.remark : '--'}
        </Space>
      ),
    },
    {
      title: '最后修改时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
    },
    {
      title: '修改人',
      dataIndex: 'updateUsername',
      key: 'updateUsername',
    },
    {
      title: '操作',
      dataIndex: 'operation',
      align: 'operation',
      width: 160,
      align: 'center',
      render: (_, record) => (
        <div  className={styles['operation_container']} >
          <div style={{ width: 90 }}>
            {record.level < 4 && (
              <Button
                type="link"
                size="small"
                disabled={!checkPermission('/management/department/operation')}
                onClick={() => {
                  dispatchTaskEvent(record);
                }}
              >
                添加下级
              </Button>
            )}
          </div>
          {record.departmentName !== '总管部门' && (
            <Dropdown menu={{ items: getMenuItems(record) }}   placement="bottomRight" >
         <img src="/user/more.png"  className={styles['more_btn']} />
            </Dropdown>
          )}
        </div>
      ),
    },
  ];
  const getMenuItems = (record) => {
    return [
      {
        key: '1',
        label: '编辑',
        disabled:!checkPermission('/management/department/operation'),
        onClick: () => {
          editEvent(record); // 调用编辑事件并传入 record
        }
      }, {
        key: '2',
        label: '删除',
        disabled:!checkPermission('/management/department/operation'),
        onClick: () => {
          deleteEvent(record); // 调用删除事件并传入 record
        }
      }
    ];
  };
  const [departmentName, setDepartmentName] = useState("");//部门名称
  const [dataSource, setDataSource] = useState([])
  const [loading, setLoading] = useState(false); //loading
  const [tabKey, setTabKey] = useState(0);
  //搜索框
  const inputChange = (e) => {
    setDepartmentName(e.target.value);

  }
  //初始化
  useEffect(() => {
    getDepartmentListEvent();
  }, [departmentName]);
  //添加下一级
  const dispatchTaskEvent = (record) => {
    addOrEditRef.current.showModal(record, 'add');
  }
  //删除
  const deleteEvent = (record) => {
    if (record.userNo > 0) {
      message.warning("该部门（含下级）存在内容，无法删除");
      return;
    }
    let title = "确定要删除该部门吗？";
    let tip = "删除该部门后将不可恢复，是否确认删除?";
    deleteRef.current.showModal(record, title, tip);

  }
  //编辑
  const editEvent = (record) => {
    addOrEditRef.current.showModal(record, 'update');
  }
  //获取部门列表
  const getDepartmentListEvent = () => {
    let data = {
      departmentName: departmentName,
    };
    setLoading(true);
    getDepartmentTree(data).then((res) => {
      console.log(res); // 输入框的值
      setLoading(false);
      setTabKey(tabKey + 1);
      setDataSource(res.data);
    }).catch((err) => {
      setLoading(false);
      console.log(err); // 输入框的值
    });
  }
  //删除回调
  const deleteCallBack = (record) => {
    deleteDept(record.id)
      .then(() => {
        message.success("删除成功！");
        deleteRef.current.hideModal();
        getDepartmentListEvent(); // 刷新表格数据
      })
      .catch(() => {

      });
  }

  const searchEvent = () => {
    getDepartmentListEvent();
  }
  return (
    <div className={`${styles['department_container']} ${showSecondSide ? styles.department_container_border : ""}`}>
                   <ConfigProvider
      theme={{
        components: {
          Table: {
            headerColor:"#666E82",
          },
        },
        token: {
          colorBgContainer:'rgba(255, 255, 255, 0.1)', //背景颜色
        },
      }}
    >
      <div className={styles['department_container_header']}>
      <div className={styles['department_container_title']}>部门管理</div>
      <div className={styles['department_container_top']}>
        <Input          variant="filled"
                  style={{ background: "#F1F2F6",borderRadius: "8px" }} placeholder="部门名称搜索" onChange={inputChange} maxLength={20} />

      </div>
      </div> 
      <div className={styles['department_container_tab']}>
        <Table  key={tabKey} rowKey={(record) => record.id} loading={loading} expandable={{ defaultExpandAllRows: true,expandIcon: ({ expanded, onExpand, record }) =>
        expanded ? (
          <img  className={styles['department_expand']}  src="/user/arrow.png" onClick={e => onExpand(record, e)} />
        ) : (
          <img  className={styles['department_expand']} src="/user/arrow_expand.png" onClick={e => onExpand(record, e)} />
        ) }} dataSource={dataSource} pagination={false} columns={columns} />
      </div>
      </ConfigProvider>
      {/* 新增编辑 */}
      <AddOrEdit ref={addOrEditRef} searchEvent={searchEvent}></AddOrEdit>
      {/* 删除弹框  */}
      <DeleteModel ref={deleteRef} deleteCallBack={deleteCallBack} ></DeleteModel>
    </div>
  );
}
