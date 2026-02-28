"use client";

import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import {
  Button,
  Drawer,
  Form,
  Cascader,
  Radio,
  Input,
  Tree,
  ConfigProvider,
} from "antd";
import { message } from "antd";
import styles from "../page.module.css";
import { useRouter } from "next/navigation";
import { getCurUserInfo, getAllMenuList } from "@/api/login";
import { getDepartmentTree, getParentDeptIdsById } from "@/api/department";
import { createRole, updateRole, getRoleInfo } from "@/api/user";
const { TextArea } = Input;

const AddOrEdit = forwardRef((props, ref) => {
  useImperativeHandle(ref, () => ({
    showModal,
    hideModal,
  }));
  const [open, setOpen] = useState(false);
  const formRef = useRef(null);
  const [title, setTitle] = useState("创建角色"); //标题
  const [data, setData] = useState({}); //数据
  const [loading, setLoading] = useState(false); //加载中
  const [action, setAction] = useState("add"); //操作类型 add 新增 edit 编辑
  const [departmentObj, setDepartmentObj] = useState({}); //用户信息
  const [departmentList, setDepartmentList] = useState([]); //部门列表
  const [treeData, setTreeData] = useState([]); //树状结构
  const [treeKey, setTreeKey] = useState(1); //选中的树状结构
  const [checkedKeys, setCheckedKeys] = useState({
    checked: [],
    halfChecked: [],
  }); //选中的树状结构
  const showModal = async (obj, type, selectDepartment) => {
    setLoading(true);
    setOpen(true);
    setAction(type);
    setDepartmentObj(selectDepartment);

    await getDepartmentList();
    let modelTitle =
      type === "add" ? "创建角色" : type === "show" ? "查看" : "编辑";
    setTitle(modelTitle); //标题
    if (type === "edit" || type === "show") {
      await getRoleInfo(obj.id).then((res) => {
        setData(res.data);
        console.log(res.data.menuIds, "res.data.menuIds");
        getAllMenuListEvent(type, res.data.menuIds);
        formRef.current.setFieldsValue({
          deptIdList: res.data.deptIdList,
          dataPermission: res.data.dataPermission,
          roleName: res.data.roleName,
          description: res.data.description,
          menuIds: res.data.menuIds,
        });
        setLoading(false);
      });
    }
    if (type === "add") {
      //设置默认值
      getParentDeptIdsById(selectDepartment.id).then((res) => {
        let deptIdList = res.data;
        console.log(deptIdList, "deptIdList");

        formRef.current.setFieldsValue({
          deptIdList: deptIdList,
          dataPermission: 1,
        });
      });
      // add模式下也需要加载菜单列表
      getAllMenuListEvent(type, []);
    }
    setLoading(false);
  };
  //获取部门列表
  const getDepartmentList = async () => {
    await getDepartmentTree({}).then((res) => {
      setDepartmentList(res.data);
    });
  };
  //获取所有菜单
  const getAllMenuListEvent = async (type, menuIds) => {
    await getAllMenuList().then((res) => {
      setTreeData(res.data);
      setTreeKey((prev) => prev + 1);
      if (type === "add") {
        checkAllMenu(res.data);
      } else {
        // 编辑或查看模式，使用传入的menuIds构建选中状态
        let checkedKeys = buildCheckedKeys(res.data, menuIds || []);
        console.log(checkedKeys, "checkedKeys");
        setCheckedKeys(checkedKeys);
      }
    });
  };
  //勾选除系统管理外的所有菜单
  const checkAllMenu = (data) => {
    console.log(data, "data");
    let allMenu = filterMenuByNames(data, ["系统管理",'基础协作体']);
    let allMenuId = getTreeData(allMenu);
    // 构建checkedKeys对象格式
    let checkedKeys = buildCheckedKeys(data, allMenuId);
    setCheckedKeys(checkedKeys);
    formRef.current.setFieldsValue({ menuIds: allMenuId });
  };
/**
 * 根据多个 menuName 过滤掉对应节点及其所有下级
 * @param {Array} menuTree 原始菜单树
 * @param {String|Array<String>} targetMenuNames 需要过滤的 menuName（单个或数组）
 * @returns {Array} 过滤后的新菜单树
 */
function filterMenuByNames(menuTree, targetMenuNames) {
  if (!Array.isArray(menuTree)) return [];

  // 统一转为 Set，提升查找效率
  const nameSet = new Set(
    Array.isArray(targetMenuNames) ? targetMenuNames : [targetMenuNames]
  );

  function dfs(list) {
    return list
      // 过滤掉当前层级命中的节点
      .filter(item => !nameSet.has(item.menuName))
      // 递归处理 children
      .map(item => {
        const newItem = { ...item };
        if (Array.isArray(newItem.children) && newItem.children.length > 0) {
          newItem.children = dfs(newItem.children);
        }
        return newItem;
      });
  }

  return dfs(menuTree);
}

  /**
   * 根据菜单树和选中ID列表生成符合Tree checkStrictly模式的选中数据
   * @param menuTree 完整菜单树
   * @param checkedIds 已选中节点id数组
   * @returns { checked: number[], halfChecked: number[] }
   */
  function buildCheckedKeys(treeData, checkedIds) {
    const checked = new Set();
    const halfChecked = new Set();

    // 确保checkedIds是数组
    const checkedIdsArray = Array.isArray(checkedIds) ? checkedIds : [];

    function dfs(node) {
      const children = node.children || [];

      // 没子节点 = 叶子节点
      if (children.length === 0) {
        if (checkedIdsArray.includes(node.id)) {
          checked.add(node.id);
          return true; // 表示该节点选中
        }
        return false; // 未选中
      }

      // 有子节点 → 判断子节点选中状态
      let childCheckedCount = 0;

      children.forEach((child) => {
        if (dfs(child)) childCheckedCount++;
      });

      if (childCheckedCount === children.length && childCheckedCount > 0) {
        // 子节点全部被选中 → 父节点选中
        checked.add(node.id);
        return true;
      }

      if (childCheckedCount > 0) {
        // 子节点部分选中 → 父节点半选
        halfChecked.add(node.id);
      }

      return false;
    }

    treeData.forEach((root) => dfs(root));

    return {
      checked: Array.from(checked),
      halfChecked: Array.from(halfChecked),
    };
  }

  const getTreeData = (allMenu) => {
    const allIds = [];
    const traverseTree = (nodes) => {
      if (!nodes) return;
      for (const node of nodes) {
        allIds.push(node.id);
        if (node.children && node.children.length > 0) {
          traverseTree(node.children);
        }
      }
    };
    traverseTree(allMenu);
    return allIds;
  };
  //弹框 className
  const classNames = {
    footer: styles["role-drawer-footer"],
    content: styles["role-drawer-content"],
    header: styles["role-drawer-header"],
    body: styles["role-drawer-body"],
  };
  //关闭事件
  const hideModal = () => {
    setOpen(false);
    // 重置表单和状态
    formRef.current?.resetFields();
    setCheckedKeys({ checked: [], halfChecked: [] });
    setTreeData([]);
    setData({});
    setLoading(false);
  };
  //提交事件
  const submitEvent = async (e) => {
    e.preventDefault();
    const values = await formRef.current.validateFields();
    if (action === "add") {
      addSubmitEvent(values);
    } else {
      editSubmitEvent(values);
    }
  };

  //新增提交事件
  const addSubmitEvent = async (values) => {
    if (!values.deptIdList || values.deptIdList.length === 0) {
      message.error("请选择所属部门");
      return;
    }
    let addData = {
      deptId: values.deptIdList[values.deptIdList.length - 1],
      ...values,
    };
    createRole(addData)
      .then((res) => {
        console.log(res);
        submitSuccessEvent();
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
        message.error("创建角色失败");
      });
  };
  //编辑提交事件
  const editSubmitEvent = async (values) => {
    console.log(values);
    if (!values.deptIdList || values.deptIdList.length === 0) {
      message.error("请选择所属部门");
      return;
    }
    let editData = {
      deptId: values.deptIdList[values.deptIdList.length - 1],
      ...values,
      id: data.id,
    };
    updateRole(editData)
      .then((res) => {
        console.log(res);
        submitSuccessEvent();
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
        message.error("更新角色失败");
      });
  };
  //提交成功事件
  const submitSuccessEvent = () => {
    setLoading(false); // 加载结束
    hideModal();
    message.success("操作成功");
    //调用父元素方法
    props?.searchEvent();
  };
  //部门选择事件
  const cascaderChange = (value, selectedOptions) => {
    console.log(value, selectedOptions);
  };
  // 复选框变化事件
  const handleCheckEvent = (checkedKeys, e) => {
    // Antd Tree的onCheck回调：当checkStrictly为false时，checkedKeys可能是数组或对象
    // 当checkStrictly为true时，checkedKeys是数组，e.halfCheckedKeys包含半选节点
    let checked = new Set();
    let halfChecked = new Set();

    // 处理checkedKeys可能是数组或对象的情况
    if (Array.isArray(checkedKeys)) {
      checked = new Set(checkedKeys);
      halfChecked = new Set(e?.halfCheckedKeys || []);
    } else if (checkedKeys && typeof checkedKeys === "object") {
      checked = new Set(checkedKeys.checked || []);
      halfChecked = new Set(checkedKeys.halfChecked || []);
    }

    // 获取当前操作的节点
    const currentNode = e?.node;
    if (!currentNode) {
      // 如果没有节点信息，直接更新状态
      let checkedKeyArr = Array.from(checked);
      let halfCheckedKeyArr = Array.from(halfChecked);
      setCheckedKeys({
        checked: checkedKeyArr,
        halfChecked: halfCheckedKeyArr,
      });
      let menuIdArr = [...checkedKeyArr, ...halfCheckedKeyArr];
      formRef.current.setFieldsValue({ menuIds: menuIdArr });
      return;
    }

    // 如果当前点击的是"操作"节点且它被勾选，勾选对应的"查看"节点
    if (currentNode.menuName === "操作" && checked.has(currentNode.id)) {
      // 找到同一父节点下的"查看"节点并勾选
      let parent = findParentNode(treeData, currentNode.id);
      if (parent && parent.children) {
        let view = parent.children.find((item) => item.menuName === "查看");
        if (view) {
          // 勾选对应的"查看"节点
          checked.add(view.id);
        }
      }
    }
    // 如果当前点击的是"查看"节点且它被取消勾选，取消对应的"操作"节点
    if (currentNode.menuName === "查看" && !checked.has(currentNode.id)) {
      // 找到同一父节点下的"操作"节点并取消勾选
      let parent = findParentNode(treeData, currentNode.id);
      if (parent && parent.children) {
        let operation = parent.children.find(
          (item) => item.menuName === "操作"
        );
        if (operation) {
          // 取消勾选对应的"操作"节点
          checked.delete(operation.id);
        }
      }
    }
    // 将更新后的 checkedKeys 赋值给 formState.menuIds
    let checkedKeyArr = Array.from(checked);
    let halfCheckedKeyArr = Array.from(halfChecked);
    let menuIdArr = [...checkedKeyArr, ...halfCheckedKeyArr];
    setCheckedKeys({ checked: checkedKeyArr, halfChecked: halfCheckedKeyArr });
    formRef.current.setFieldsValue({ menuIds: menuIdArr });
  };

  const findParentNode = (treeData, targetId, parent = null) => {
    for (const node of treeData) {
      // 检查当前节点是否为目标节点
      if (node.id === targetId) {
        return parent;
      }

      // 如果当前节点有子节点，则递归查找
      if (node.children && node.children.length > 0) {
        const result = findParentNode(node.children, targetId, node);
        if (result) {
          return result; // 找到目标节点时返回父节点
        }
      }
    }

    return null; // 未找到目标节点时返回 null
  };

  return (
    <div>
      <Drawer
        closable={false}
        destroyOnHidden
        title={null}
        placement="right"
        open={open}
        rootStyle={{ boxShadow: "none" }}
        style={{ borderRadius: "24px 0px 0px 24px" }}
        width={656}
        onClose={hideModal}
        classNames={classNames}
        footer={[
          <Button
            key="back"
            className={styles["role_cancel_btn"]}
            onClick={hideModal}
          >
            取消
          </Button>,
          <Button
            key="submit"
            className={styles["role_save_btn"]}
            disabled={action === "show" || loading}
            type="primary"
            onClick={submitEvent}
          >
            确定
          </Button>,
        ]}
      >
        <div className={styles["addRole_container"]}>
          <div className={styles["addRole_container_header"]}>
            <div className={styles["addRole_container_header_title"]}>
              {title}
            </div>
            <div className={styles["addRole_container_header_close"]}>
              <img src="/close.png" alt="" onClick={hideModal} />
            </div>
          </div>
          <div className={styles["addRole_container_content"]}>
            <ConfigProvider
              theme={{
                components: {
                  Form: {
                    labelColor: " #666E82",
                  },
                },
              }}
            >
              <Form
                ref={formRef}
                name="basic"
                layout={"horizontal"}
                labelCol={{
                  span: 5,
                }}
                wrapperCol={{
                  span: 19,
                }}
                disabled={action === "show" || loading} // 禁用表单
                autoComplete="off"
              >
                {/* 修正重复的表单项和错误的 name 属性 */}
                <Form.Item
                  label="所属部门"
                  name="deptIdList"
                  rules={[
                    {
                      required: true,
                      message: "请选择所属部门",
                      trigger: "blur",
                      type: "array",
                    },
                  ]}
                >
                  <Cascader
                    onChange={cascaderChange}
                    fieldNames={{
                      label: "departmentName",
                      value: "id",
                      children: "children",
                    }}
                    changeOnSelect
                    options={departmentList}
                    placeholder="所属部门"
                  />
                </Form.Item>
                <Form.Item
                  label="角色名称"
                  name="roleName"
                  rules={[
                    {
                      required: true,
                      message: "请输入角色名称",
                      trigger: "blur",
                    },
                    {
                      // 正则修改为不能全为空格
                      pattern: /^(?!\s+$).+$/,
                      message: "格式错误",
                      trigger: "blur",
                    },
                  ]}
                >
                  <Input
                    maxLength={20}
                    placeholder="请输入角色名称，不超过20个字"
                  />
                </Form.Item>
                <Form.Item label="角色描述" name="description">
                  <TextArea
                    showCount
                    autoSize={{ minRows: 2, maxRows: 3 }}
                    maxLength={50}
                    placeholder="输入不超过50个字"
                  />
                </Form.Item>
                <Form.Item
                  label="数据权限范围"
                  name="dataPermission"
                  rules={[{ required: true, message: "数据权限范围" }]}
                >
                  <Radio.Group>
                    <Radio value={1}>本部门（含下级）</Radio>
                    <Radio value={2}>本部门</Radio>
                    <Radio value={3}>仅本人</Radio>
                  </Radio.Group>
                </Form.Item>
                <Form.Item
                  label="功能权限范围"
                  name="menuIds"
                  rules={[
                    {
                      required: true,
                      message: "请选择功能权限范围",
                      type: "array",
                    },
                  ]}
                >
                  <Tree
                    className={styles["addRole_container_content_tree"]}
                    disabled={action === "show" || loading}
                    key={treeKey}
                    // checkStrictly={true}
                    defaultExpandAll={true}
                    checkable
                    selectable={false}
                    height={500}
                    checkedKeys={checkedKeys}
                    onCheck={handleCheckEvent}
                    multiple={true}
                    fieldNames={{
                      children: "children",
                      title: "menuName",
                      key: "id",
                    }}
                    treeData={treeData}
                  />
                </Form.Item>
              </Form>
            </ConfigProvider>
          </div>
        </div>
      </Drawer>
    </div>
  );
});

export default AddOrEdit;
