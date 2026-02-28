// 变量字段类型枚举
export enum FieldType {
  TEXT = 'text',
  PARAGRAPH = 'paragraph', 
  SELECT = 'select',
  NUMBER = 'number',
  FILE = 'file',
  FILE_LIST = 'file-list'
}

// 变量类型枚举 (基于workflow/types.js中的VarType)
export enum VariableType {
  STRING = 'string',
  NUMBER = 'number', 
  SECRET = 'secret',
  BOOLEAN = 'boolean',
  OBJECT = 'object',
  FILE = 'file',
  ARRAY = 'array',
  ARRAY_STRING = 'array[string]',
  ARRAY_NUMBER = 'array[number]',
  ARRAY_OBJECT = 'array[object]',
  ARRAY_FILE = 'array[file]',
  ANY = 'any',
  TEXT_INPUT = 'text-input',
  PARAGRAPH = 'paragraph',
  SELECT = 'select',
  FILE_LIST = 'file-list'
}

// 字段类型选项接口
export interface FieldTypeOption {
  label: string;
  value: string;
  type?: string;
}

// Agent变量接口
export interface AgentVariable {
  id?: string;
  name: string;
  displayName: string;
  fieldType: FieldType;
  required: boolean;
  maxLength?: number;
  selectOptions?: string;
  selectOptionArr?: string[];
  description?: string;
  defaultValue?: any;
}

// Workflow变量接口
export interface WorkflowVariable {
  variable: string;
  type: VariableType;
  required?: boolean;
  label?: string;
  description?: string;
  defaultValue?: any;
  maxLength?: number;
  selectOptions?: string[];
}

// 变量树节点接口 (用于workflow中的变量选择器)
export interface VariableTreeNode {
  label: string;
  value_selector: string[];
  variable_type: VariableType;
  children?: VariableTreeNode[];
}

// 系统变量接口
export interface SystemVariable {
  label: string;
  selector: string[];
  type: VariableType;
}

// 文件字段常量
export const FILE_FIELDS = ['name', 'size'] as const;

// 系统变量列表
export const SYSTEM_VARIABLES: SystemVariable[] = [
  { label: 'sys.user_id', selector: ['sys', 'user_id'], type: VariableType.TEXT_INPUT },
  { label: 'sys.files', selector: ['sys', 'files'], type: VariableType.FILE_LIST },
  { label: 'sys.app_id', selector: ['sys', 'app_id'], type: VariableType.TEXT_INPUT },
  { label: 'sys.workflow_id', selector: ['sys', 'workflow_id'], type: VariableType.TEXT_INPUT },
  { label: 'sys.workflow_run_id', selector: ['sys', 'workflow_run_id'], type: VariableType.TEXT_INPUT }
];

// 字段类型列表 (Agent)
export const AGENT_FIELD_TYPE_LIST: FieldTypeOption[] = [
  { label: "文本", value: "text" },
  { label: "段落", value: "paragraph" },
  { label: "下拉选项", value: "select" },
  { label: "数字", value: "number" }
];

// 字段类型列表 (Workflow)
export const WORKFLOW_FIELD_TYPE_LIST: FieldTypeOption[] = [
  { label: "文本", value: "text", type: "text-input" },
  { label: "段落", value: "paragraph", type: "paragraph" },
  { label: "下拉选项", value: "select", type: "select" },
  { label: "数字", value: "number", type: "number" },
  { label: "单文件", value: "file", type: "file" },
  { label: "文件列表", value: "file-list", type: "file-list" }
];

// 上传方式选项
export interface UploadTypeOption {
  label: string;
  value: string;
}

export const UPLOAD_TYPE_OPTIONS: UploadTypeOption[] = [
  { label: "本地上传", value: "local_file" },
  { label: "URL上传", value: "remote_url" },
  { label: "俩者皆可", value: "both" }
];

// 变量验证规则类型
export interface VariableValidationRule {
  required?: boolean;
  message?: string;
  trigger?: string;
  pattern?: RegExp;
  min?: number;
  max?: number;
}

// 表单项配置接口
export interface FormItemConfig {
  label: string;
  name: string;
  rules?: VariableValidationRule[];
  required?: boolean;
  placeholder?: string;
  maxLength?: number;
  type: FieldType;
}