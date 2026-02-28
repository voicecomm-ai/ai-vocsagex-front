// 微调相关选项数据
// 微调初始化数据
// 基础
export const basicFormData = {
  classification: 1,
  modelId: null,
  finetuning_type: "lora",
  stage: "Supervised Fine-Tuning",
  quantization_bit: "none",
  quantization_method: "bnb",
  template: "qwen2_omni",
  rope_scaling: "none",
  booster: "auto",
  val_size: 0,
  selectDataSource: 0,
  datasetId:null,
  modelDataset:{
    name:"",
    fileNum:null,
    path:"",
  },
  modelName:"",
  cpuCoresNum: 8,
  memorySize: 16384,
  isSelectedGpu: true,
  gpuNum: 1,
  isSupportAdjust:true
};
// 微调
export const fineTuneFormData = {
  learning_rate: "5e-5",
  num_train_epochs: "3.0",
  max_grad_norm: "1.0",
  max_samples: "100000",
  compute_type: "bf16",
  cutoff_len: 2048,
  batch_size: 2,
  gradient_accumulation_steps: 8,
  lr_scheduler_type: "cosine",
  freeze_trainable_layers: 2,
  freeze_trainable_modules: "all",
  freeze_extra_modules: "",
  logging_steps: 5,
  save_steps: 5000,
  warmup_steps: 0,
  neftune_alpha: 0,
  extra_args: '{"optim": "adamw_torch"}',
  report_to: "none",
  packing:false,
  neat_packing:false,
  train_on_prompt:false,
  mask_history:false,
  resize_vocab:false,
  use_llama_pro:false,
  enable_thinking:true
};
//多模态
export const multiModalFormData = {
  freeze_vision_tower: true,
  freeze_multi_modal_projector: true,
  freeze_language_model: false,
  image_max_pixels: "768*768",
  image_min_pixels: "32*32",
  video_max_pixels: "256*256",
  video_min_pixels: "16*16",
};
//高级设置
export const advancedFormData = {
  //LORA
  lora_rank: 8,
  lora_alpha: 16,
  lora_dropout: 0,
  loraplus_lr_ratio: 0,
  create_new_adapter: false,
  use_rslora: false,
  use_dora: false,
  use_pissa: false,
  lora_target: "",
  additional_target: "",
  //RLHF
  pref_beta: 0.1,
  pref_ftx: 0,
  pref_loss: "sigmoid",
  reward_model: null,
  ppo_score_norm: false,
  ppo_whiten_rewards: false,
  //GaLore
  use_galore: false,
  galore_rank: 16,
  galore_update_interval: 200,
  galore_scale: 2,
  galore_target: "all",
  //APOLLO
  use_apollo: false,
  apollo_rank: 16,
  apollo_update_interval: 200,
  apollo_scale: 32,
  apollo_target: "all",
  //BAdam
  use_badam: false,
  badam_mode: "layer",
  badam_switch_mode: "ascending",
  badam_switch_interval: 50,
  badam_update_ratio: 0.05,
  //SwanLab
  use_swanlab: false,
  swanlab_project: "llamafactory",
  swanlab_run_name: "",
  swanlab_workspace: "",
  swanlab_api_key: "",
  swanlab_mode: "cloud",
};
//微调方法
export const tuneFunc = [
  { label: "full", value: "full" },
  { label: "freeze", value: "freeze" },
  { label: "lora", value: "lora" },
];
// 量化等级
export const quantitativeGrade = [
  { label: "none", value: "none" },
  { label: "8", value: "8" },
  { label: "4", value: "4" },
];
//量化方法
export const quantitativeFunc = [
  { label: "bnb", value: "bnb" },
  { label: "hqq", value: "hqq" },
  { label: "eetq", value: "eetq" },
];
//对话模板
export const dialogueTemplate = [
  { label: "llama2_zh", value: "llama2_zh" },
  { label: "llama3", value: "llama3" },
  { label: "llama4", value: "llama4" },
  { label: "mllama", value: "mllama" },
  { label: "moonlight", value: "moonlight" },
  { label: "llava", value: "llava" },
  { label: "llava_next", value: "llava_next" },
  { label: "llava_next_llama3", value: "llava_next_llama3" },
  { label: "llava_next_mistral", value: "llava_next_mistral" },
  { label: "llava_next_qwen", value: "llava_next_qwen" },
  { label: "llava_next_yi", value: "llava_next_yi" },
  { label: "llava_next_video", value: "llava_next_video" },
  { label: "llava_next_video_mistral", value: "llava_next_video_mistral" },
  { label: "llava_next_video_yi", value: "llava_next_video_yi" },
  { label: "marco", value: "marco" },
  { label: "mimo", value: "mimo" },
  { label: "mimo_vl", value: "mimo_vl" },
  { label: "minicpm_v", value: "minicpm_v" },
  { label: "minicpm_o", value: "minicpm_o" },
  { label: "ministral", value: "ministral" },
  { label: "mistral", value: "mistral" },
  { label: "mistral_small", value: "mistral_small" },
  { label: "olmo", value: "olmo" },
  { label: "openchat", value: "openchat" },
  { label: "openchat-3.6", value: "openchat-3.6" },
  { label: "opencoder", value: "opencoder" },
  { label: "orion", value: "orion" },
  { label: "paligemma", value: "paligemma" },
  { label: "paligemma_chat", value: "paligemma_chat" },
  { label: "phi", value: "phi" },
  { label: "phi_small", value: "phi_small" },
  { label: "phi4", value: "phi4" },
  { label: "pixtral", value: "pixtral" },
  { label: "qwen", value: "qwen" },
  { label: "qwen3", value: "qwen3" },
  { label: "qwen2_audio", value: "qwen2_audio" },
  { label: "qwen2_omni", value: "qwen2_omni" },
  { label: "qwen2_vl", value: "qwen2_vl" },
  { label: "sailor", value: "sailor" },
  { label: "seed_coder", value: "seed_coder" },
  { label: "skywork_o1", value: "skywork_o1" },
  { label: "smollm", value: "smollm" },
  { label: "smollm2", value: "smollm2" },
  { label: "solar", value: "solar" },
  { label: "starchat", value: "starchat" },
  { label: "telechat", value: "telechat" },
  { label: "telechat2", value: "telechat2" },
  { label: "vicuna", value: "vicuna" },
  { label: "video_llava", value: "video_llava" },
  { label: "xuanyuan", value: "xuanyuan" },
  { label: "xverse", value: "xverse" },
  { label: "yayi", value: "yayi" },
  { label: "yi", value: "yi" },
  { label: "yi_vl", value: "yi_vl" },
  { label: "yuan", value: "yuan" },
  { label: "zephyr", value: "zephyr" },
  { label: "ziya", value: "ziya" },
  { label: "alpaca", value: "alpaca" },
  { label: "aquila", value: "aquila" },
  { label: "atom", value: "atom" },
  { label: "baichuan", value: "baichuan" },
  { label: "baichuan2", value: "baichuan2" },
  { label: "bailing", value: "bailing" },
  { label: "belle", value: "belle" },
  { label: "bluelm", value: "bluelm" },
  { label: "breeze", value: "breeze" },
  { label: "chatglm2", value: "chatglm2" },
  { label: "chatglm3", value: "chatglm3" },
  { label: "chatml", value: "chatml" },
  { label: "chatml_de", value: "chatml_de" },
  { label: "codegeex2", value: "codegeex2" },
  { label: "codegeex4", value: "codegeex4" },
  { label: "cohere", value: "cohere" },
  { label: "cpm", value: "cpm" },
  { label: "cpm3", value: "cpm3" },
  { label: "cpm4", value: "cpm4" },
  { label: "dbrx", value: "dbrx" },
  { label: "deepseek", value: "deepseek" },
  { label: "deepseek3", value: "deepseek3" },
  { label: "deepseekr1", value: "deepseekr1" },
  { label: "deepseekcoder", value: "deepseekcoder" },
  { label: "default", value: "default" },
  { label: "empty", value: "empty" },
  { label: "exaone", value: "exaone" },
  { label: "falcon", value: "falcon" },
  { label: "fewshot", value: "fewshot" },
  { label: "gemma", value: "gemma" },
  { label: "gemma3", value: "gemma3" },
  { label: "glm4", value: "glm4" },
  { label: "glmz1", value: "glmz1" },
  { label: "granite3", value: "granite3" },
  { label: "granite3_vision", value: "granite3_vision" },
  { label: "index", value: "index" },
  { label: "hunyuan", value: "hunyuan" },
  { label: "intern", value: "intern" },
  { label: "intern2", value: "intern2" },
  { label: "intern_vl", value: "intern_vl" },
  { label: "kimi_vl", value: "kimi_vl" },
  { label: "llama2", value: "llama2" },
];
//ROPE插值方式
export const ropeInterpolation = [
  { label: "none", value: "none" },
  { label: "linear", value: "linear" },
  { label: "dynamic", value: "dynamic" },
  { label: "yarn", value: "yarn" },
  { label: "llama3", value: "llama3" },
];
//加速方式
export const accelerationMethod = [
  { label: "none", value: "none" },
  { label: "flashattn2", value: "flashattn2" },
  { label: "unsloth", value: "unsloth" },
  { label: "liger_kernel", value: "liger_kernel" },
];
//微调方式
export const fineTuneMethod = [
  { label: "Supervised Fine-Tuning", value: "Supervised Fine-Tuning" },
  { label: "Reward Modeling", value: "Reward Modeling" },
  { label: "PPO", value: "PPO" },
  { label: "DPO", value: "DPO" },
  { label: "KTO", value: "KTO" },
  { label: "Pre-Training", value: "Pre-Training" },
];

//计算类型
export const computeType = [
  { label: "bf16", value: "bf16" },
  { label: "fp16", value: "fp16" },
  { label: "fp32", value: "fp32" },
  { label: "pure_bf16", value: "pure_bf16" },
];

//外部记录面板
export const externalRecordPanel = [
  { label: "none", value: "none" },
  { label: "wandb", value: "wandb" },
  { label: "mlflow", value: "mlflow" },
  { label: "neptune", value: "neptune" },
  { label: "tensorboard", value: "tensorboard" },
  { label: "all", value: "all" },
];

//学习率调节器
export const learningRateScheduler = [
  { label: "linear", value: "linear" },
  { label: "cosine", value: "cosine" },
  { label: "cosine_with_restarts", value: "cosine_with_restarts" },
  { label: "polynomial", value: "polynomial" },
  { label: "constant", value: "constant" },
  { label: "constant_with_warmup", value: "constant_with_warmup" },
  { label: "inverse_sqrt", value: "inverse_sqrt" },
  { label: "reduce_lr_on_plateau", value: "reduce_lr_on_plateau" },
  { label: "cosine_with_min_lr", value: "cosine_with_min_lr" },
  { label: "warmup_stable_decay", value: "warmup_stable_decay" },
]
// 损失类型选项数据
export const lossTypeOptions = [
  { label: 'sigmoid', value: 'sigmoid' },
  { label: 'hinge', value: 'hinge' },
  { label: 'ipo', value: 'ipo' },
  { label: 'kto_pair', value: 'kto_pair' },
  { label: 'orpo', value: 'orpo' },
  { label: 'simpo', value: 'simpo' },
];

// 奖励模型选项数据
export const rewardModelOptions = [
  { label: 'train_2025-07-07-08-53-33', value: 'train_2025-07-07-08-53-33' },
  { label: 'train_2025-06-20-09-16-22', value: 'train_2025-06-20-09-16-22' },
  { label: 'train_2025-03-24-17-47-41', value: 'train_2025-03-24-17-47-41' },
  { label: 'train_2025-06-26-19-20-47', value: 'train_2025-06-26-19-20-47' },
  { label: 'train_2025-07-04-17-01-05', value: 'train_2025-07-04-17-01-05' },
  { label: 'train_2025-03-25-13-30-27', value: 'train_2025-03-25-13-30-27' },
];

//BAdam 模式
export const badamMode = [
  { label: "layer", value: "layer" },
  { label: "ratio", value: "ratio" },
];

//切换策略
export const switchStrategy = [
  { label: "ascending", value: "ascending" },
  { label: "descending", value: "descending" },
  { label: "random", value: "random" },
  { label: "fixed", value: "fixed" },
];

//SwanLab模式
export const swanLabMode = [
  { label: "cloud", value: "cloud" },
  { label: "local", value: "local" },
];
