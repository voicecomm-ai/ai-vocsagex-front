"use client";
import React, { useEffect, useState, useRef } from "react";
import styles from "./index.module.css";
import { InputNumber, Slider, Button } from "antd";
import { monitoring } from "@/api/model";

// 按需引入 ECharts 核心模块 + 折线图相关依赖（仅加载需要的部分）
import { init, use } from "echarts/core";
// 引入折线图图表类型
import { LineChart } from "echarts/charts";
// 引入需要的组件（提示框、直角坐标系、网格）
import { TooltipComponent, GridComponent, AxisPointerComponent } from "echarts/components";
// 引入渲染器（Canvas 渲染，性能更好）
import { CanvasRenderer } from "echarts/renderers";

// 注册所需模块（核心：只注册用到的，不注册的功能无法使用）
use([LineChart, TooltipComponent, GridComponent, AxisPointerComponent, CanvasRenderer]);
const chartsTitle = {
  eval: { title: "Accuracy", tips: ["Accuracy/eval", "tag.Accuracy/eval"] },
  fine_tuning: { title: "loss", tips: ["Loss/eval", "tag.Loss/eval"] },
  train: { title: "loss", tips: ["Loss/train", "tag.Loss/train"] },
};

export default function TrainMonitor(props) {
  // 接收 loadingMode 参数（根据你的函数参数）
  const { loadingMode = "ollama", taskType = "eval" } = props;
  const [smoothness, setSmoothness] = useState(0.416); // 默认最大平滑
  const [chartsData, setChartsData] = useState({});
  // key => echarts instance
  const chartRefs = useRef({});

  // key => dom element
  const domRefs = useRef({});

  useEffect(() => {
    Object.keys(chartsData).forEach(updateChartByKey);
  }, [chartsData, smoothness]);
  const updateChartByKey = (key) => {
    const chart = chartRefs.current[key];
    const dom = domRefs.current[key];
    const data = chartsData[key];
    if (!dom || !data) return;

    if (!chart) {
      chartRefs.current[key] = init(dom);
    }

    const tbSmoothness = Math.min(0.99, smoothness);
    const smoothedY = smoothTensorBoard(data.yData, tbSmoothness);

    chartRefs.current[key].setOption({
      tooltip: { trigger: "axis" },
      grid: {
        left: 20,
        top: 20,
        right: 20,
        bottom: 0,
        containLabel: true,
      },
      xAxis: {
        type: "value",
        axisLabel: { formatter: "{value}", color: "#666E82" },
        splitLine: { show: false },
        axisLine: {
          lineStyle: { color: "#DBE2EA", width: 1 },
        },
        axisTick: {
          show: false,
        },
      },
      yAxis: {
        type: "value",
        axisLabel: { formatter: "{value}", color: "#666E82" },
        splitLine: {
          lineStyle: {
            color: "#F5F9FC",
            width: 1,
          },
        },
        axisLine: {
          lineStyle: { color: "#DBE2EA", width: 1 },
        },
      },

      series: [
        {
          type: "line",
          smooth: true,
          symbol: "circle",
          showSymbol: false,
          data: data.xData.map((x, i) => [x, smoothedY[i]]),
          lineStyle: {
            width:1,
          },
          itemStyle: { color: "#4794FF" },
        },
      ],
    });

    chartRefs.current[key].resize();
  };

  const getMonitorData = async () => {
    try {
      const res = await monitoring({
        id: props.id,
        taskType: taskType,
        loadingMode: loadingMode,
      });
      // console.log(res.data, "res");

      // 格式化接口数据：拆分 xaxis/yaxis 数组
      if (res?.data && typeof res.data === "object") {
        const nextChartsData = {};

        Object.entries(res.data).forEach(([key, list]) => {
          if (Array.isArray(list)) {
            nextChartsData[key] = {
              xData: list.map((item) => item.xaxis),
              yData: list.map((item) => item.yaxis),
            };
          }
        });
        // console.log(nextChartsData, "nextChartsData");

        setChartsData(nextChartsData);
      }
    } catch (error) {
      console.error("获取监控数据失败：", error);
    }
  };

  // 平滑数据
  const smoothTensorBoard = (yData, smoothing) => {
    if (!yData.length || smoothing <= 0) {
      return yData;
    }

    let last = yData[0];
    const result = [last];

    for (let i = 1; i < yData.length; i++) {
      last = last * smoothing + yData[i] * (1 - smoothing);
      result.push(Number(last.toFixed(6)));
    }

    return result;
  };

  useEffect(() => {
    const handleWindowResize = () => {
      Object.values(chartRefs.current).forEach((chart) => {
        chart?.resize();
      });
    };

    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, []);

  // 监听 props.id 变化，重新获取数据
  useEffect(() => {
    if (props.id) {
      getMonitorData();
    }
  }, [props.id, loadingMode]);

  return (
    <div className={styles["train_monitor"]}>
        <div className={styles["train_monitor_slider"]}>
          <div className={styles.monitor_slider_title}>
            <span style={{ fontWeight: 500 }}>Smoothing:</span>
            <InputNumber
              min={0}
              max={1}
              step={0.001}
              value={smoothness}
              onChange={setSmoothness}
              style={{
                width: 80,
                borderRadius: 8,
                border: "1px solid #DBE2EA",
                width: 140,
                height: 36,
                margin:"0 8px 0 16px"
              }}
              className={styles.smooth_input_number}
            />
            <div className={styles.slider_container}>
              <span>0</span>
              <Slider
                min={0}
                max={1}
                step={0.001}
                value={smoothness}
                onChange={setSmoothness}
                style={{ width: 200 }}
              />
              <span>1</span>
            </div>
          </div>

          <Button className={styles.refresh_button} onClick={getMonitorData}>
            <img src='/model/refresh.png' alt='refresh' width={14} height={14}></img>刷新
          </Button>
        </div>
      <div className={styles.chart_container}>
        {Object.keys(chartsData).map((key) => (
          <div key={key} className={styles.chart_item}>
            <div className={styles.common_title}>
              {/* {key} */}
              <div className={styles.chart_title}>
                <span>{key}</span>
              </div>
              <div className={styles.chart_title}>
                <span>tag.{key}</span>
              </div>
            </div>

            <div
              ref={(el) => (domRefs.current[key] = el)}
              style={{
                width: "100%",
                height: 300,
                minWidth: 300,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
