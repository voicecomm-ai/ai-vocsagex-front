import React from 'react';
import { checkApplicationStatus } from "@/api/workflow";
export const useTemplate = () => {

  //检查应用是否存在
  const checkApplicationExistEvent = async (appId) => {
    let res = await checkApplicationStatus(appId);
    let status = res.data;
    if (!status) {
      return false;
    }
    return true;
  };

  return {
    checkApplicationExistEvent,
  };
};
