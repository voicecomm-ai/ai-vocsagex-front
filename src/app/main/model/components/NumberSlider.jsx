import React from "react";
import { InputNumber, Slider } from "antd";

/**
 * 适配 AntD Form 的数字输入框+滑动条联动组件
 * 支持两种模式：
 * 1. 范围限制模式（默认）：输入/滑动值自动限制在 min-max 范围内
 * 2. 失焦重置模式：输入不限制范围，超出 max 失焦后重置为 0（需手动启用）
 * @param {Object} props - 组件属性
 * @param {number} props.min - 最小值（必传）
 * @param {number} props.max - 最大值（必传）
 * @param {number} props.step - 步长（默认1）
 * @param {number} props.precision - 精度（默认自动计算）
 * @param {function} props.onChange - Form 自动传递的变更回调
 * @param {number} props.value - Form 自动传递的当前值
 * @param {boolean} props.resetOnExceedMax - 是否启用「超max失焦重置为0」（默认false）
 * @param {boolean} props.enableRangeLimit - 是否启用「值自动限制在min-max」（默认true）
 */
const NumberSlider = ({ 
  min, 
  max, 
  step = 1, 
  precision,
  value, 
  onChange,
  resetOnExceedMax = false,
  enableRangeLimit = true  // 新增：默认启用范围限制（还原原逻辑）
}) => {
  // 自动计算精度：根据 step 中小数点后的位数
  const getAutoPrecision = () => {
    if (precision !== undefined) return precision;
    if (Number.isInteger(step)) return 0;
    const stepStr = step.toString();
    const decimalIndex = stepStr.indexOf('.');
    return decimalIndex === -1 ? 0 : stepStr.length - decimalIndex - 1;
  };

  const autoPrecision = getAutoPrecision();

  // 统一的数值处理逻辑：根据模式决定是否限制范围
  const handleValueChange = (newValue, isSlider = false) => {
    if (newValue === null) return;

    // 步骤1：处理精度（四舍五入）
    let processedValue = Number(newValue.toFixed(autoPrecision));

    // 步骤2：根据模式决定是否限制范围
    if (enableRangeLimit || isSlider) {
      // 范围限制模式 或 滑动条变更：强制限制在 min-max 内
      processedValue = Math.max(min, Math.min(max, processedValue));
    }

    onChange?.(processedValue);
  };

  // 失焦事件：仅在「失焦重置模式」下生效
  const handleBlur = () => {
    if (!resetOnExceedMax || enableRangeLimit) return; // 启用范围限制时，不会出现超范围值，直接跳过
    if (value > max || value < min) {
      onChange?.(0); // 超出范围则重置为0
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, paddingRight: 12 }}>
      <InputNumber
        value={value}
        onChange={(val) => handleValueChange(val, false)} // 输入框变更（传isSlider=false）
        onBlur={handleBlur}
        step={step}
        precision={autoPrecision}
        style={{ width: 140, height: 36,marginRight:4 }}
        placeholder='请输入'
        // 范围限制模式下，显示 min/max 提示（输入时会有原生限制提示）
        min={enableRangeLimit ? min : undefined}
        max={enableRangeLimit ? max : undefined}
      />
      <div style={{ color: "#8D96A7", fontSize: "11px" }}>{min}</div>
      <Slider
        value={enableRangeLimit ? Math.max(min, Math.min(max, value)) : value}
        onChange={(val) => handleValueChange(val, true)} // 滑动条变更（传isSlider=true）
        min={min}
        max={max}
        step={step}
        style={{ flex: 1 }}
      />
      <div style={{ color: "#8D96A7", fontSize: "11px" }}>{max}</div>
    </div>
  );
};

export default NumberSlider;