
import StartNodeDefault from './nodes/start/default'
import EndNodeDefault from './nodes/end/default'

export const BlockEnum = {
  Start: 'start',
  End: 'end',
  Answer: 'answer',
  LLM: 'llm',
  KnowledgeRetrieval: 'knowledge-retrieval',
  QuestionClassifier: 'question-classifier',
  IfElse: 'if-else',
  Code: 'code',
  TemplateTransform: 'template-transform',
  HttpRequest: 'http-request',
  VariableAssigner: 'variable-assigner',
  VariableAggregator: 'variable-aggregator',
  Tool: 'tool',
  ParameterExtractor: 'parameter-extractor',
  Iteration: 'iteration',
  DocExtractor: 'document-extractor',
  ListFilter: 'list-operator',
  IterationStart: 'iteration-start',
  // Assigner 已重命名为 VariableAssigner，此处移除
  Agent: 'agent',
  Loop: 'loop',
  LoopStart: 'loop-start',
  LoopEnd: 'loop-end',
};
export const CUSTOM_ITERATION_START_NODE = 'custom-iteration-start'


// 节点初始数据
export const NODES_INITIAL_DATA = {
  [BlockEnum.Start]: {
    type: BlockEnum.Start,
    title: '',
    desc: '',
    ...StartNodeDefault.defaultValue,
  },
  [BlockEnum.End]: {
    type: BlockEnum.End,
    title: '',
    desc: '',
    ...EndNodeDefault.defaultValue,
  },
};

// 变量类型
export const VarType = {
  string: 'string',
  number: 'number',
  secret: 'secret',
  boolean: 'boolean',
  object: 'object',
  file: 'file',
  array: 'array',
  arrayString: 'array[string]',
  arrayNumber: 'array[number]',
  arrayObject: 'array[object]',
  arrayFile: 'array[file]',
  any: 'any',
};
