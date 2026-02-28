import React,{useState,useEffect,useRef,forwardRef,useImperativeHandle} from 'react';  
import styles from './index.module.css';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "github-markdown-css/github-markdown-light.css";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
const ApiComponent = forwardRef((props,ref) => {

  const [mdContent, setMdContent] = useState("");
  const [mdUrl, setMdUrl] = useState(""); 
  useEffect(() => {
   
    let agentType = props.agentInfo?.agentType || 'single';
    let url = "";
    if(agentType == 'multiple'){
      url = "/file/apiDocs/MultipleAgentApi.md";
    }
    else{
      url = "/file/apiDocs/AgentApi.md";
    }  
     getMdContent(url);  
  }, [props.agentInfo.agentType]);
  //获取markdown内容
  const getMdContent = async (markdownUrl) => {
    try {
      let url = "";
      if (process.env.NODE_ENV === "production") {
        // 生产环境下用当前域名拼接
        const domain = window.location.origin;
        url = domain + markdownUrl;
      } else {
        // 非生产环境下用环境变量
        url = (process.env.NEXT_PUBLIC_DOC_BASE || "") + markdownUrl;
      }
      const mdRes = await fetch(url);
      const mdText = await mdRes.text();
      setMdContent(mdText);
    } catch (e) {
      console.log(e);
    }
  };
  return (
    <div className={styles.api_container}>
      <div className={styles.api_render_box +" markdown-body"}>
       {mdContent && (
          <ReactMarkdown remarkPlugins={[remarkGfm]}   rehypePlugins={[rehypeRaw, rehypeSanitize]}  
          components={{
            a: ({node, ...props}) => (
              <a
                {...props}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                style={{ pointerEvents: "none", textDecoration: "none" }} // 可选UI提示
              />
            )
          }}>{mdContent}</ReactMarkdown>
       )}
      </div>
    </div>
  );
});
export default ApiComponent;

