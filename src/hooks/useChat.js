import { useEffect, useCallback, useRef, useState } from "react";

export const useChat = () => {

  /**
   * 处理多智能体思考过程
   * @param {Array} thinkData - 思考数据数组
   * @param {Object} additional_kwargs - 附加参数
   * @param {string} additional_kwargs.task_name - 任务名称
   * @param {string} additional_kwargs.agent_content - 智能体思考内容
   * @param {string} additional_kwargs.agent_name - 智能体名称
   * @param {string} additional_kwargs.agent_status - 智能体状态
   * @returns {Array} 更新后的思考数据数组
   */
  const handleMultiAgentThinking = (thinkData, additional_kwargs) => {
    // 确保思考数据是数组
    let arr = Array.isArray(thinkData) ? [...thinkData] : [];

    // 提取附加参数
    let taskName = additional_kwargs?.task_name;
    let agent_content = additional_kwargs?.agent_content;
    let agent_name = additional_kwargs?.agent_name;
    let agent_status = additional_kwargs?.agent_status;
    let is_subtask_done = additional_kwargs?.is_subtask_done;

    // 检查必要参数
    if (!taskName || !agent_name) {
      return arr;
    }

    // 查找当前任务
    let taskIndex = arr.findIndex((item) => item.task_name === taskName);

    if (taskIndex !== -1) {
      // 当前任务已经存在时
      let task = arr[taskIndex];
      let agentList = Array.isArray(task.agentList) ? [...task.agentList] : [];

      // 查找当前智能体
      let agentIndex = agentList.findIndex(
        (item) => item.agent_name === agent_name,
      );

      if (agentIndex !== -1) {
        // 当前智能体已经存在时，更新智能体信息
        agentList[agentIndex] = {
          ...agentList[agentIndex],
          agent_status: agent_status,
          agent_content:
            (agentList[agentIndex].agent_content || "") + (agent_content || ""),
        };
      } else {
        // 当前智能体不存在时，添加新智能体
        agentList.push({
          agent_name: agent_name,
          agent_status: agent_status,
          agent_content: agent_content || "",
          is_subtask_done: is_subtask_done,
        });
      }

      // 更新任务的智能体列表
      arr[taskIndex] = {
        ...task,
        agentList: agentList,
      };
    } else {
      // 当前任务不存在时，创建新任务
      arr.push({
        task_name: taskName,
        agentList: [
          {
            agent_name: agent_name,
            agent_status: agent_status,
            agent_content: agent_content || "",
            is_subtask_done: is_subtask_done,
          },
        ],
      });
    }

    return arr;
  };
  /**
  * 将 handleMultiAgentThinking 生成的数据转换为 Markdown
  * @param {Array} thinkData
  * @returns {string} markdown
  */
 const thinkDataToMarkdown = (thinkData) => {
   if (!Array.isArray(thinkData)) return "";
 
   let md = "";
 
   for (const task of thinkData) {
     if (!task?.task_name) continue;
 
     // 任务标题
     md += `## ${task.task_name}：\n`;
 
     const agentList = Array.isArray(task.agentList) ? task.agentList : [];
 
     for (const agent of agentList) {
       if (!agent?.agent_name) continue;
 
       // Agent 标题
       md += `### ${agent.agent_name}:\n`;
 
       // 内容
       const content = agent.agent_content || "";
 
       // 保持原始换行，并转成 Markdown 换行
       const lines = content.split("\n");
       for (const line of lines) {
         md += line + "\n"; // 两个空格 + 换行 = Markdown 强制换行
       }
 
       md += "\n";
     }
   }
 
   return md;
 }
 

  return {
    handleMultiAgentThinking,
    thinkDataToMarkdown,
  };
};
