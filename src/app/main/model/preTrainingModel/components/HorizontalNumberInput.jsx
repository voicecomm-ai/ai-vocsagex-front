"use client";
import { InputNumber, Button, Space } from "antd";
import { MinusOutlined, PlusOutlined } from "@ant-design/icons";
import styles from "../page.module.css"; // 可选样式增强

const HorizontalNumberInput = ({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  supportDecimal = false, // 支持小数点控制
  ...restProps // 👈 接收额外的 props
}) => {
  // 显示值处理：undefined/null 时显示 min（由使用方通过 min 控制默认值）
  const displayValue = value === undefined || value === null ? min : value;
  const handleChange = (newValue) => {
    if (newValue === null || newValue === undefined) {
      onChange?.(undefined);
      return;
    }
    const finalValue = supportDecimal
      ? parseFloat(newValue.toFixed(10))
      : Math.round(newValue);
    onChange?.(finalValue);
  };

  const handleKeyDown = (e) => {
    // 如果不支持小数，阻止小数点输入
    if (!supportDecimal && [".", ","].includes(e.key)) {
      e.preventDefault();
    }
  };
  // 修正浮点数精度

  const handleDecrease = () => {
    if (displayValue > min) {
      const newValue = supportDecimal
        ? parseFloat((displayValue - step).toFixed(10))
        : Math.round(displayValue - step);
      onChange?.(newValue);
    }
  };

  const handleIncrease = () => {
    if (displayValue < max) {
      const newValue = supportDecimal
        ? parseFloat((displayValue + step).toFixed(10))
        : Math.round(displayValue + step);
      onChange?.(newValue);
    }
  };

  return (
    <div className={styles["horizontal-number-input"]}>
      <Button
        onClick={handleDecrease}
        style={{
          border: "none",
          boxShadow: "none",
          height: 32,
          padding: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MinusOutlined
          style={{ color: value <= min ? "#ccc" : "#000", margin: "0 8px" }}
        />
      </Button>
      <InputNumber
        controls={false}
        value={value}
        min={min}
        max={max}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        precision={supportDecimal ? undefined : 0}
        {...restProps} //让 Form.Item 传来的 onChange 接管
        className={`${styles["custom-input-number"]}`}
      />
      <Button
        onClick={handleIncrease}
        style={{
          border: "none",
          boxShadow: "none",
          height: 32,
          padding: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      > <PlusOutlined
          style={{ color: value >= max ? "#ccc" : "#000", margin: "0 8px" }}
        /></Button>
    </div>
  );
};

export default HorizontalNumberInput;
