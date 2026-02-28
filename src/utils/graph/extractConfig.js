// 数字转中文
export function convertNumberToChinese(num) {
  const chineseNums = [
    "零",
    "一",
    "二",
    "三",
    "四",
    "五",
    "六",
    "七",
    "八",
    "九",
  ];
  const units = ["", "十", "百", "千"];
  const bigUnits = ["", "万", "亿"];

  if (num === 0) return "零";

  let result = "";
  let bigUnitIndex = 0;

  while (num > 0) {
    let section = num % 10000;
    let sectionStr = "";
    let zero = false;

    for (let i = 0; section > 0; i++) {
      const digit = section % 10;
      if (digit !== 0) {
        sectionStr = chineseNums[digit] + units[i] + sectionStr;
        zero = false;
      } else {
        if (!zero && sectionStr !== "") {
          sectionStr = chineseNums[0] + sectionStr;
          zero = true;
        }
      }
      section = Math.floor(section / 10);
    }

    if (sectionStr !== "") {
      sectionStr += bigUnits[bigUnitIndex];
    }

    result = sectionStr + result;
    num = Math.floor(num / 10000);
    bigUnitIndex++;
  }

  // 处理特殊情况
  result = result.replace(/^一十/, "十"); // 10 应该是"十"而不是"一十"

  return result;
}

/**
 * 校验是否存在table标签
 *
 */
export function hasTableXML(str) {
  const reg = /<table[^>]*>[^]+<\/table>/;
  return reg.test(str);
}
