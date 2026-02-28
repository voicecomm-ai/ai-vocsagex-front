// components/VariableNodeView.jsx
import React from 'react'
import { NodeViewWrapper } from '@tiptap/react'
import { useVaiable } from '../../hooks'
import styles from '../variable-editor.module.css'
export default function VariableNodeView(props) {

  const { node,variables } = props;
  const { parseValueSelector,findNodeByValue } = useVaiable();
  const content = node.attrs.content;
  let renderTextByValue = '';
  const value_selector = parseValueSelector(content);
  
  if(value_selector.includes('context')&&value_selector.length<=1){
    renderTextByValue ={
      nodeType:'context',
      nodeName:null,
      variable:null,
      variable_type:'context',
      icon:'/workflow/common/context.png',
    }
  }
  else{
    renderTextByValue = findNodeByValue(variables, value_selector) ||'';
  }

  return (
    <NodeViewWrapper
      as="span"
      className={renderTextByValue?styles.variableNodeViewWrapper:styles.variableNodeViewWrapperEmpty}
      style={{
      
      }}
      data-variable={content}
    >
    <div className={styles.variableNodeView}>
      {renderTextByValue.nodeType&&<img src={renderTextByValue.icon} alt="" className={styles.variableNodeView_img} />}
      {renderTextByValue.nodeName&&<div className={styles.variableNodeView_text}>
        {renderTextByValue.nodeName}/
      </div>}
      {renderTextByValue.variable&&<div className={styles.variableNodeView_type}>
     {`{{${renderTextByValue.
variable_name}}}`}
      </div>}
      {renderTextByValue.variable_type=='context'&&(<div className={styles.variableNodeView_text}>
        上下文
      </div>)}
    </div>
    </NodeViewWrapper>
  )
}
