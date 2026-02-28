// extensions/VariableNode.js
import { Node, mergeAttributes, nodeInputRule    } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import VariableNodeView from '../components/VariableNodeView'


 const HighlightNode = Node.create({
  name: 'HighlightNode',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      content: {
        default: '',
      },
    }
  },
  addOptions() {
    return {
      variables: [], // 默认变量列表
    }
  },
  parseHTML() {
    return [
      {
        tag: 'span[data-variable]',
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-variable': node.attrs.content,
        
      }),
      `开始节点/${node.attrs.content}/test`,
    ]
  },

  addInputRules() {
   
    return [
      nodeInputRule({
        find: /\{\{#([^#]+)#\}\}$/,
        type: this.type,
        getAttributes: match => ({
      
          content: match[1],
        }),
      }),
    
    ]
  },
 
  addNodeView() {
    // 这里用闭包把 options.variables 传给你的 React 组件
    return ReactNodeViewRenderer(props => <VariableNodeView {...props} variables={this.options.variables} />)
  }
  
})

export default HighlightNode;