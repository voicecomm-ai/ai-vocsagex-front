// components/CustomToolbar.tsx
'use client';

import {useState,useEffect} from 'react';
import { useReactFlow } from '@xyflow/react';
import styles from '../../workflow.module.css';
import { Divider } from 'antd';
import { useStore } from "@/store/index";

const CustomToolbar = () => {
    const { panelVisible, setPanelVisible, pannerNode, setPannerNode,setUpdateTime,viewportZoom,setViewportZoom } = useStore(

    (state) => state
  );
   const { zoomIn, zoomOut, fitView, setViewport, getZoom  } = useReactFlow();
 


  // 处理缩放
  const handleZoomChange = (type) => {
    if(type === 'in'){
      zoomIn();
    }else{
      zoomOut();
    }
   
  };

  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbar_item_img}  onClick={() => handleZoomChange('out')}>
        <img src="/workflow/zoomOut.png" alt="" />
         </div>
          <div className={styles.toolbar_item}>
            {(viewportZoom  * 100).toFixed(0)}% 
         </div>
        <div className={styles.toolbar_item_img} onClick={() => handleZoomChange('in')}>
         <img src="/workflow/zoomIn.png" alt="" />
        </div>
           {/* <Divider type="vertical" /> */}
        {/* <div className={styles.toolbar_item}>
         <img src="/workflow/pre.png" alt="" />
        </div>
        <div className={styles.toolbar_item}>
         <img src="/workflow/next.png" alt="" />
        </div> */}
      
     
    </div>
  );
};

export default CustomToolbar;
