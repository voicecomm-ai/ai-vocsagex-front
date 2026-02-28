// components/VariableNodeView.jsx
import React from "react";
import { NodeViewWrapper } from "@tiptap/react";
import { useVaiable } from "../../../../../hooks";
import styles from "../variable-editor.module.css";
import { useNodeData } from "../../../../hooks";
export default function VariableNodeView(props) {

  const { node, variables, pannerNodeId } = props;
  const { parseValueSelector, findNodeByValue } = useVaiable();
  const { getUpstreamVariables, getNodeById } = useNodeData();
  const content = node.attrs.content;

  let renderTextByValue = "";
  const value_selector = parseValueSelector(content);

  const getSelectOptions = () => {
    const arr = getUpstreamVariables(pannerNodeId);
    let filterTypes = ["string", "file"];
    arr.length &&
      arr.forEach((first) => {
        const children =
          (first.children.length &&
            first.children.filter((second) => filterTypes.includes(second.variable_type))) ||
          [];
        first.children = children;
      });
    // console.log(arr, 'rrrr')
    return arr;
  };

  if (value_selector.includes("context")) {
    renderTextByValue = {
      nodeType: "context",
      nodeName: null,
      variable: null,
      variable_type: "context",
    };
  } else {
    if (variables.length == 0 && pannerNodeId) {
      renderTextByValue = findNodeByValue(getSelectOptions(), value_selector) || {};
    } else {
      renderTextByValue = findNodeByValue(variables, value_selector) || {};
    }
    // renderTextByValue = value_selector||[];
  }

  console.log(renderTextByValue, "renderTextByValue");
  // const getSelectOptions = () => {
  //   const arr = getUpstreamVariables(pannerNode.id);
  //   let filterTypes = ["string", "file"];
  //   arr.length &&
  //     arr.forEach((first) => {
  //       const children =
  //         (first.children.length &&
  //           first.children.filter((second) => filterTypes.includes(second.variable_type))) ||
  //         [];
  //       first.children = children;
  //     });
  //   console.log(arr, 'rrrr')
  // };

  return (
    <NodeViewWrapper
      as='span'
      className={styles.variableNodeViewWrapper}
      style={{}}
      data-variable={content}
    >
      <div className={styles.variableNodeView}>
        {renderTextByValue.nodeType && (
          <img
            src={`/workflow/${renderTextByValue.nodeType}.png`}
            alt=''
            className={styles.variableNodeView_img}
          />
        )}
        {renderTextByValue.nodeName && (
          <div className={styles.variableNodeView_text}>{renderTextByValue.nodeName}/</div>
        )}
        {renderTextByValue.variable && (
          <div className={styles.variableNodeView_type}>
            <img
              src='/workflow/common/variable.png'
              alt=''
              className={styles.variableNodeView_img}
            />
            {renderTextByValue.variable}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}
