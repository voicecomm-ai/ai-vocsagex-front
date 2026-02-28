import { COLOR } from "../constants";

export const getColor = (index) => {
  const len = COLOR.length;
  // 处理索引未提供或为undefined的情况
  return COLOR[index !== undefined ? index % len : 0] || "#ffffff";
};

// 创建标签集合（用于去重）
const tagSet = new Set();

export const standardGraphData = (result, color = getColor) => {
  const nodeSet = new Set(); // 用于节点去重的集合

  // 处理顶点数据，转换为图谱所需格式
  return result.vertexVOList.reduce(
    (preData, graphData) => {
      const {
        subjectId,
        objectId,
        subjectTagName,
        subjectName,
        objectName,
        objectTagName,
        edgeName,
        rank,
      } = graphData;

      // 收集标签并去重
      if (subjectTagName && Array.isArray(subjectTagName)) {
        subjectTagName.forEach((item) => tagSet.add(item));
      }
      if (objectTagName && Array.isArray(objectTagName)) {
        objectTagName.forEach((item) => tagSet.add(item));
      }

      // 转换标签集合为数组，用于获取索引
      const tagArray = [...tagSet];

      // 处理源节点（subject）
      if (!nodeSet.has(subjectId)) {
        nodeSet.add(subjectId);
        // 获取标签索引用于颜色映射
        const tagIndex = tagArray.indexOf(subjectTagName?.[0]);
        preData.nodes.push({
          data: {
            id: subjectId,
            name: subjectName,
            tag: subjectTagName,
            color: color(tagIndex),
          },
        });
      }

      // 处理目标节点（object）
      if (objectId && !nodeSet.has(objectId)) {
        nodeSet.add(objectId);
        // 获取标签索引用于颜色映射
        const tagIndex = tagArray.indexOf(objectTagName?.[0]);
        preData.nodes.push({
          data: {
            id: objectId,
            name: objectName,
            tag: objectTagName,
            color: color(tagIndex),
          },
        });
      }

      // 处理边数据
      if (objectId) {
        preData.edges.push({
          data: {
            id: `${rank}${subjectId}${edgeName}${objectId}`, // 生成唯一边ID
            source: subjectId,
            target: objectId,
            ...graphData, // 保留原始数据中的其他属性
          },
        });
      }

      return preData;
    },
    { nodes: [], edges: [], tagSet }
  );
};

export const useDestroyTags = () => {
  tagSet.clear();
};
