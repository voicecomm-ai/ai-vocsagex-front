import { useEffect, useRef, useState, forwardRef ,useImperativeHandle} from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";

const ThinkingTypewriter = forwardRef((props,ref) => {  
   const {
    bubbleData,
  id,
  text = "",
  active,
  loading,
  currentId,
  isAllThinking,
} =props;
  const [displayText, setDisplayText] = useState("");

  const indexRef = useRef(0); // 当前显示到哪
  const lastLenRef = useRef(0); // 已确认处理的 text 长度
  const timerRef = useRef(null);

  useEffect(() => {
    if (!text) return;

    const totalLen = text.length;
    const shouldAnimate = active && loading && currentId === id;

    const notifyIfDone = () => {
      if (isAllThinking && indexRef.current >= totalLen) {
        props?.onAllThinkingEnd?.();
      }
    };

    if (shouldAnimate) {
      if (totalLen > lastLenRef.current && !timerRef.current) {
        timerRef.current = setInterval(() => {
          indexRef.current += 1;
          setDisplayText(text.slice(0, indexRef.current));

          if (indexRef.current >= totalLen) {
            lastLenRef.current = totalLen; // ✅ 打完才确认
            clearInterval(timerRef.current);
            timerRef.current = null;
            notifyIfDone();
          }
        }, 10);
      }
    } else {
      clearInterval(timerRef.current);
      timerRef.current = null;
      indexRef.current = totalLen;
      lastLenRef.current = totalLen;
      setDisplayText(text);
      notifyIfDone();
    }
    return () => {
      clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [text, active, loading, currentId, id, isAllThinking]);

  // active=false 时直接停（不补）
  useEffect(() => {
    if (!active && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [active]);

  return (
    <ReactMarkdown rehypePlugins={[rehypeRaw]}>{displayText}</ReactMarkdown>
  );
})
export default ThinkingTypewriter;
