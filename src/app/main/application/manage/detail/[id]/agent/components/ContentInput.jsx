'use client'

import React, {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
} from 'react';
import {
  Editor,
  EditorState,
  CompositeDecorator,
  ContentState,
  convertToRaw,
  Modifier,
} from 'draft-js';
import 'draft-js/dist/Draft.css';
import { stateFromHTML } from 'draft-js-import-html';
import { stateToHTML } from 'draft-js-export-html';
// 变量高亮组件
const BracedSpan = (props) => {
  return (
    <span style={{ color: 'blue', fontWeight: 500 }}>{props.children}</span>
  );
};

// 匹配 {{变量}} 的策略
const bracedTextStrategy = (contentBlock, callback) => {
  const text = contentBlock.getText();
  // 新正则，符合你的规则
  const regex = /{{([a-zA-Z_][a-zA-Z0-9_]{0,19})}}/g;
  let matchArr;
  while ((matchArr = regex.exec(text)) !== null) {
    callback(matchArr.index, matchArr.index + matchArr[0].length);
  }
};

// 富文本装饰器
const decorator = new CompositeDecorator([
  {
    strategy: bracedTextStrategy,
    component: BracedSpan,
  },
]);

const KeywordHighlighter = forwardRef(
  ({updateTextByChange, handlePopupVisible, onEditorBlur, onCaretPosition, setTextLengthEvent,canCreate}, ref) => {
    const containerRef = useRef(null);
    const editorDomRef = useRef(null);
    const skipHandleChangeRef = useRef(false);
    const [isComposing, setIsComposing] = useState(false);

    const [editorState, setEditorState] = useState(() =>
      EditorState.createEmpty(decorator)
    );

    useImperativeHandle(ref, () => ({
      setValue,
      getRaw: () => convertToRaw(editorState.getCurrentContent()),
      getText,
      insertVariableAtCursor,
      insertVariable,
      removeVariable
    }));

    const getText = () => {
      return editorState.getCurrentContent().getPlainText();
    };

    // 回车添加新变量
    const insertVariableAtCursor = () => {
      const contentState = editorState.getCurrentContent();
      const selection = editorState.getSelection();

      const bracesText = '{{}}';

      let newContentState;
      let newSelection;

      const blockKey = selection.getStartKey();
      const block = contentState.getBlockForKey(blockKey);
      const offset = selection.getStartOffset();
      const textBefore = block.getText().slice(0, offset);
      const lastChar = textBefore.slice(-1);

      if (lastChar === '{' || lastChar === '/') {
        const targetRange = selection.merge({
          anchorOffset: offset - 1,
          focusOffset: offset,
        });

        newContentState = Modifier.replaceText(contentState, targetRange, bracesText);

        newSelection = newContentState.getSelectionAfter().merge({
          anchorOffset: newContentState.getSelectionAfter().getAnchorOffset() - 2,
          focusOffset: newContentState.getSelectionAfter().getAnchorOffset() - 2,
        });
      } else {
        newContentState = Modifier.insertText(contentState, selection, bracesText);

        newSelection = newContentState.getSelectionAfter().merge({
          anchorOffset: newContentState.getSelectionAfter().getAnchorOffset() - 2,
          focusOffset: newContentState.getSelectionAfter().getAnchorOffset() - 2,
        });
      }

      const newEditorState = EditorState.push(editorState, newContentState, 'insert-characters');

      setEditorState(EditorState.forceSelection(newEditorState, newSelection));
    };

    // 设置值
    const setValue = (value) => {
      skipHandleChangeRef.current = true; // 标记跳过一次 change 逻辑
      let contentState;
      if (value) {
        contentState = ContentState.createFromText(value);
      } else {
        contentState = ContentState.createFromText('');
      }

      const newEditorState = EditorState.createWithContent(contentState, decorator);
      setEditorState(newEditorState);
      setEditorLengthEvent(newEditorState);
      skipHandleChangeRef.current = false; // 标记跳过一次 change 逻辑
    };

    const setEditorLengthEvent = (state) => {
      const text = state.getCurrentContent().getPlainText();
      setTextLengthEvent(text.length);
    };

    const handleEditorChange = (state) => {
      if (!skipHandleChangeRef.current) {
      setEditorState(state);
  
     }
  
    };
    //监听编辑器值变化
    useEffect(() => {
      const text = editorState.getCurrentContent().getPlainText();
      setTextLengthEvent(text.length);
      handleUpdateVal(editorState);
      detectTriggerCharacter(editorState)
    }, [editorState]);
    //实时更新值
    const handleUpdateVal=(state)=>{
      const text = state.getCurrentContent().getPlainText();
      if (text === '') {
        updateTextByChange('')
        return;
        }
     
      
      const html = stateToHTML(state.getCurrentContent());
      updateTextByChange(text);
    }

    // 删除变量功能
    const removeVariable = (variableName) => {
      const contentState = editorState.getCurrentContent();
      const blockMap = contentState.getBlockMap();

      const newBlockMap = blockMap.map((block) => {
        const blockText = block.getText();
        const regex = new RegExp(`{{\\s*${variableName}\\s*}}`, 'g');
        const newText = blockText.replace(regex, '');
        return block.set('text', newText);
      });

      const newContentState = contentState.merge({
        blockMap: newBlockMap,
      });

      const newEditorState = EditorState.push(
        editorState,
        newContentState,
        'remove-range'
      );

      setEditorState(newEditorState);
      setValueToDatabase(newEditorState,1);
    };

    const insertVariable = (variable) => {
      const contentState = editorState.getCurrentContent();
      const selection = editorState.getSelection();
      const blockKey = selection.getStartKey();
      const block = contentState.getBlockForKey(blockKey);
      const offset = selection.getStartOffset();
      const blockText = block.getText();
    
      const variableText = `{{${variable}}}`;
      let newContentState = contentState;
      let newSelection = selection;
    
      // 1️⃣ 光标前一个字符是 '/' 或 '{'，就替换它
      if (offset > 0 && /[\/{]/.test(blockText[offset - 1])) {
        const targetRange = selection.merge({
          anchorOffset: offset - 1,
          focusOffset: offset,
        });
    
        newContentState = Modifier.replaceText(contentState, targetRange, variableText);
        newSelection = newContentState.getSelectionAfter();
    
      } else {
        // 2️⃣ 检查光标是否在一个变量中间，插入到变量末尾
        const regex = /{{([a-zA-Z_][a-zA-Z0-9_]{0,19})}}/g;
        let match;
        let insertAfterIndex = offset;
        let insideVariable = false;
    
        while ((match = regex.exec(blockText)) !== null) {
          const start = match.index;
          const end = start + match[0].length;
          if (offset > start && offset <= end) {
            insideVariable = true;
            insertAfterIndex = end;
            break;
          }
        }
    
        const targetSelection = selection.merge({
          anchorOffset: insertAfterIndex,
          focusOffset: insertAfterIndex,
        });
    
        newContentState = Modifier.insertText(contentState, targetSelection, variableText);
        newSelection = newContentState.getSelectionAfter();
      }
    
      const newEditorState = EditorState.push(
        editorState,
        newContentState,
        'insert-characters'
      );
    
      setEditorState(EditorState.forceSelection(newEditorState, newSelection));
    };
    
    

    const extractVariables = (state) => {
      const text = state.getCurrentContent().getPlainText();
  const regex = /{{([a-zA-Z_][a-zA-Z0-9_]{0,19})}}/g;
  const matches = [...text.matchAll(regex)];
  return matches.map((m) => m[1].trim()).filter(Boolean);
    };

    const handleBlur = () => {
 
      setValueToDatabase(editorState,2);
    };

    // 设置值到数据库（或外部）
    const setValueToDatabase = (state,type) => { //type 1为删除 2为失去焦点
      const text = state.getCurrentContent().getPlainText();
      if (text === '') {
        // 内容为空，直接传空，避免空行换行符
        if (typeof onEditorBlur === 'function') {
          onEditorBlur([], '',type);
        }
        return;
      }
      const html = stateToHTML(state.getCurrentContent());
      if (typeof onEditorBlur === 'function') {
        const variables = extractVariables(state);
        onEditorBlur(variables, text,type);
      }
    };

    //获取当前光标位置
    const getCaretPosition = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return null;
      const range = selection.getRangeAt(0);
      let rect = null;
      const rects = range.getClientRects();
      if (rects && rects.length > 0) {
        rect = rects[0];
      } else {  
        rect = range.getBoundingClientRect();
      }
  //处理输入框边界值问题
  if (!rect || (rect.top === 0 && rect.left === 0 && rect.bottom === 0 && rect.right === 0)) {
    // 创建一个零宽透明 span 用于测位置
    const tempSpan = document.createElement('span');
    tempSpan.textContent = '\u200b'; // 零宽空格字符
    tempSpan.style.position = 'absolute';
    tempSpan.style.padding = '0';
    tempSpan.style.margin = '0';
    tempSpan.style.border = '0';
    tempSpan.style.height = '1px';
    tempSpan.style.width = '1px';
    tempSpan.style.opacity = '0';
    range.insertNode(tempSpan);
    rect = tempSpan.getBoundingClientRect();
    // 恢复光标位置
    range.setStartAfter(tempSpan);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
     // 清理
     tempSpan.remove();
    }
      const container = document.getElementById('prompt-section');
      const containerRect = container?.getBoundingClientRect();
      if (!rect || !containerRect) return null;
      const DEFAULT_TOP_OFFSET = 20;
      const DEFAULT_LEFT_OFFSET = 8;

      const top = Math.max(
        rect.top - containerRect.top + DEFAULT_TOP_OFFSET,
        DEFAULT_TOP_OFFSET
      );
      const left = Math.max(
        rect.left - containerRect.left + DEFAULT_LEFT_OFFSET,
        DEFAULT_LEFT_OFFSET
      );
   
      return { top, left };
    };
    
    //处理变量弹框
    const detectTriggerCharacter = (state) => {
      const selection = state.getSelection();
      const content = state.getCurrentContent();
      const blockKey = selection.getStartKey();
      const offset = selection.getStartOffset();
      if (offset === 0) return;
   
      const block = content.getBlockForKey(blockKey);
      const text = block.getText();
      const lastChar = text.charAt(offset - 1);
  
      if (lastChar == '/' || lastChar == '{') {
        const pos = getCaretPosition();
        if (pos) {
          if (pos) handlePopupVisible(pos, true);
        }
      }
    };

    useEffect(() => {
      const editorElem = editorDomRef.current;
      if (!editorElem) return;
      const handleKeyDown = (e) => {
        handlePopupVisible('',false)
        // Add other key logic here
      };
      editorElem.addEventListener('keydown', handleKeyDown);
   
      return () => {
   
        editorElem.removeEventListener('keydown', handleKeyDown);

      };
    }, [editorDomRef]);

    const handleBeforeInput = (chars, editorState) => {
      if (chars === '/' || chars === '{') {
        const pos = getCaretPosition();
        if (pos) {
          if (pos) handlePopupVisible(pos, true);
        }
      }
      return 'not-handled';
    };
    
    return (
        <div
          ref={editorDomRef}
       
          onBlur={handleBlur}
          className="tiptap"
        >
          <Editor 
            readOnly={!canCreate}
            editorState={editorState}
            onChange={handleEditorChange}
            placeholder='在这里写你的提示词，输入“{”或“/”插入变量'
          />
        </div>
    );
  }
);

export default KeywordHighlighter;
