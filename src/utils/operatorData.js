export const operatorData = [
  {
    id: "1",
    type: "aggregation",
    name: "数据聚合",
    icon: "data-aggregation",
    children: [
      {
        id: "11",
        type: "entityAttribute",
        name: "实体属性聚合",
        desc: "从样本中识别与实体相关的内容并根据实体属性进行总结，最后生成结论",
        config: [
          {
            key: "givenEntity",
            type: "input",
            label: "给定实体",
            placeholder: "请输入给定实体",
            value: "",
          },
          {
            key: "entityAttribute",
            type: "input",
            label: "实体属性",
            placeholder: "请输入实体属性",
            value: "",
          },
          {
            key: "sampleInput",
            type: "input",
            label: "样本输入键",
            placeholder: "",
            value: "event_description",
          },
          {
            key: "aggregatedOutput",
            type: "input",
            label: "聚合输出键",
            placeholder: "",
            value: "entity_attribute",
          },
        ],
      },
      {
        id: "12",
        type: "metaTag",
        name: "元标签聚合",
        desc: "从样本中识别元标签，将类似的元标签合并到一个统一的给定标签中",
        config: [
          {
            key: "metaTagInput",
            type: "input",
            label: "元标签输入键",
            placeholder: "",
            value: "query_sentiment_label",
          },
          {
            key: "targetTag",
            type: "input",
            label: "目标标签",
            placeholder: "请输入目标标签，以英文‘,’隔开",
            value: "",
          },
        ],
      },
      {
        id: "13",
        type: "relevantEntities",
        name: "最相关实体聚合",
        desc: "根据实体类型，从提供的文本中提取与给定实体密切相关的实体并对其进行排名",
        config: [
          {
            key: "givenEntity",
            type: "input",
            label: "给定实体",
            placeholder: "请输入给定实体",
            value: "",
          },
          {
            key: "entityType",
            type: "input",
            label: "相关实体类型",
            placeholder: "请输入相关实体类型",
            value: "",
          },
          {
            key: "sampleInput",
            type: "input",
            label: "样本输入键",
            placeholder: "",
            value: "event_description",
          },
          {
            key: "aggregatedOutput",
            type: "input",
            label: "聚合输出键",
            placeholder: "",
            value: "most_relevant_entities",
          },
        ],
      },
      {
        id: "14",
        type: "nestedAggregation",
        name: "嵌套聚合",
        desc: "根据模型token限制分组聚合，得到中间结果，再对若干中间结果聚合处理输出最终结果",
        config: [
          {
            key: "sampleInput",
            type: "input",
            label: "样本输入键",
            placeholder: "",
            value: "event_description",
          },
          {
            key: "aggregatedOutput",
            type: "input",
            label: "聚合输出键",
            placeholder: "",
            value: "event_description",
          },
        ],
      },
    ],
  },
  {
    id: "2",
    type: "deduplication",
    name: "数据去重",
    icon: "data-deduplication",
    children: [
      {
        id: "21",
        type: "textDeduplication",
        name: "文本去重",
        desc: "使用完全匹配在文档级别删除重复的样本",
        config: [
          {
            key: "textConvert",
            type: "radio",
            label: "是否将文本转换成小写",
            placeholder: "",
            value: false,
            options: [
              {
                label: "是",
                value: true,
              },
              {
                label: "否",
                value: false,
              },
            ],
          },
          {
            key: "ignoreNonAlphabetic",
            type: "radio",
            label: "是否忽略非字母字符",
            placeholder: "",
            value: false,
            options: [
              {
                label: "是",
                value: true,
              },
              {
                label: "否",
                value: false,
              },
            ],
          },
        ],
      },
      {
        id: "22",
        type: "minHashDeduplication",
        name: "MinHash 文本去重",
        desc: "MinHash LSH在文档级别删除重复样本",
        config: [
          {
            key: "textWordSegmentation",
            type: "select",
            label: "文本分词方法",
            placeholder: "",
            value: "space",
            options: [
              {
                label: "space",
                value: "space",
              },
              {
                label: "punctuation",
                value: "punctuation",
              },
              {
                label: "character",
                value: "character",
              },
              {
                label: "sentencepiece",
                value: "sentencepiece",
              },
            ],
          },
          {
            key: "textConvert",
            type: "radio",
            label: "是否将文本转换成小写",
            placeholder: "",
            value: true,
            options: [
              {
                label: "是",
                value: true,
              },
              {
                label: "否",
                value: false,
              },
            ],
          },
          //   {
          //     key: "ignoreRegular",
          //     type: "radioExtra",
          //     label: "是否忽略匹配正则模式的子字符串",
          //     placeholder: "",
          //     value: true,
          //     options: [
          //       {
          //         label: "是",
          //         value: true,
          //       },
          //       {
          //         label: "否",
          //         value: false,
          //       },
          //     ],
          //     extra: {
          //       key: "textWordSegmentation",
          //       type: "select",
          //       label: "",
          //       placeholder: "",
          //       value: "url",
          //       options: [
          //         {
          //           label: "space",
          //           value: "space",
          //         },
          //         {
          //           label: "url",
          //           value: "url",
          //         },
          //       ],
          //     },
          //   },
          {
            key: "shingleWindowSize",
            type: "percent",
            label: "shingle的窗口大小（n-gram长度）",
            placeholder: "",
            value: 5,
            scope: {
              min: 1,
              max: 10,
            },
          },
          {
            key: "minHashSignatureLength",
            type: "percent",
            label: "MinHash签名长度",
            placeholder: "",
            value: 256,
            scope: {
              min: 1,
              max: 1024,
            },
          },
          {
            key: "jaccardSimilarity",
            type: "percent",
            label: "Jaccard 相似度",
            placeholder: "",
            value: 0.7,
            scope: {
              min: 0.1,
              max: 1,
            },
          },
        ],
      },
      {
        id: "23",
        type: "simHashDeduplication",
        name: "SimHash 文本去重",
        desc: "SimHash在文档级别删除重复的样本",
        config: [
          {
            key: "textWordSegmentation",
            type: "select",
            label: "文本分词方法",
            placeholder: "",
            value: "space",
            options: [
              {
                label: "space",
                value: "space",
              },
              {
                label: "punctuation",
                value: "punctuation",
              },
              {
                label: "character",
                value: "character",
              },
            ],
          },
          {
            key: "textConvert",
            type: "radio",
            label: "是否将文本转换成小写",
            placeholder: "",
            value: true,
            options: [
              {
                label: "是",
                value: true,
              },
              {
                label: "否",
                value: false,
              },
            ],
          },
          //   {
          //     key: "ignoreRegular",
          //     type: "radioExtra",
          //     label: "是否忽略匹配正则模式的子字符串",
          //     placeholder: "",
          //     value: true,
          //     options: [
          //       {
          //         label: "是",
          //         value: true,
          //       },
          //       {
          //         label: "否",
          //         value: false,
          //       },
          //     ],
          //     extra: {
          //       key: "text-word-segmentation",
          //       type: "select",
          //       label: "",
          //       placeholder: "",
          //       value: "url",
          //       options: [
          //         {
          //           label: "space",
          //           value: "space",
          //         },
          //         {
          //           label: "URL",
          //           value: "url",
          //         },
          //       ],
          //     },
          //   },
          {
            key: "shingleWindowSize",
            type: "percent",
            label: "shingle的窗口大小（n-gram长度）",
            placeholder: "",
            value: 6,
            scope: {
              min: 1,
              max: 10,
            },
          },
          {
            key: "fingerprintSplitBlocks",
            type: "percent",
            label: "SimHash指纹拆分成的块数",
            placeholder: "",
            value: 6,
            scope: {
              min: 1,
              max: 10,
            },
          },
          {
            key: "MaxHanMingDistance",
            type: "percent",
            label: "最大汉明距离",
            placeholder: "",
            value: 4,
            scope: {
              min: 1,
              max: 10,
            },
          },
        ],
      },
      {
        id: "24",
        type: "imageDeduplication",
        name: "图像去重",
        desc: "通过图像的精确匹配在文档级别删除重复的样本",
        config: [
          {
            key: "imageHash",
            type: "select",
            label: "图像哈希方法",
            placeholder: "",
            value: "phash",
            options: [
              {
                label: "phash",
                value: "phash",
              },
              {
                label: "dhash",
                value: "dhash",
              },
              {
                label: "whash",
                value: "whash",
              },
              {
                label: "ahash",
                value: "ahash",
              },
            ],
          },
          {
            key: "considerTextHash",
            type: "radio",
            label: "是否在去重判断中同时考虑文本哈希",
            placeholder: "",
            value: false,
            options: [
              {
                label: "是",
                value: true,
              },
              {
                label: "否",
                value: false,
              },
            ],
          },
        ],
      },
      {
        id: "25",
        type: "videoDeduplication",
        name: "视频去重",
        desc: "使用视频的精确匹配在文档级别删除重复的样本",
        config: [
          {
            key: "considerTextHash",
            type: "radio",
            label: "是否在去重判断中同时考虑文本哈希",
            placeholder: "",
            value: false,
            options: [
              {
                label: "是",
                value: true,
              },
              {
                label: "否",
                value: false,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "3",
    type: "filter",
    name: "数据过滤",
    icon: "data-filter",
    children: [
      {
        id: "31",
        type: "textqualityfilter",
        name: "文本质量过滤",
        desc: "根据文本中字母/数字字符所占比例筛选样本，用于剔除乱码、符号噪声或异常格式文本",
        config: [
          {
            key: "digitalRatio",
            type: "radio",
            label: "是否基于token数量计算字母数字比率",
            placeholder: "",
            value: false,
            options: [
              {
                label: "是",
                value: true,
              },
              {
                label: "否",
                value: false,
              },
            ],
          },
          {
            key: "minProportion",
            type: "percent",
            label: "最小字母/数字占比",
            placeholder: "",
            value: 0,
            scope: {
              min: 0,
              max: 1,
            },
          },
          {
            key: "maxProportion",
            type: "percent",
            label: "最大字母/数字占比",
            placeholder: "",
            value: 0.9,
            scope: {
              min: 0,
              max: 1,
            },
          },
        ],
      },
      {
        id: "32",
        type: "textAverageLength",
        name: "文本行平均长度过滤",
        desc: "根据文本中每一行的平均长度筛选样本，用于过滤格式异常的文本（如碎行、超长行）",
        config: [
          {
            key: "minLength",
            type: "percent",
            label: "最小长度",
            placeholder: "",
            value: 10,
            scope: {
              min: 0,
              max: 20000,
            },
          },
          {
            key: "maxLength",
            type: "percent",
            label: "最大长度",
            placeholder: "",
            value: 10000,
            scope: {
              min: 0,
              max: 20000,
            },
          },
        ],
      },
      {
        id: "33",
        type: "textLineFilter",
        name: "文本行长度过滤",
        desc: "根据文本中最长行的长度进行筛选，用于过滤包含异常超长行或极端碎行结构的文本",
        config: [
          {
            key: "minLength",
            type: "percent",
            label: "最小长度",
            placeholder: "",
            value: 10,
            scope: {
              min: 0,
              max: 20000,
            },
          },
          {
            key: "maxLength",
            type: "percent",
            label: "最大长度",
            placeholder: "",
            value: 10000,
            scope: {
              min: 0,
              max: 20000,
            },
          },
        ],
      },
      {
        id: "34",
        type: "textTotalFilter",
        name: "文本总长度过滤",
        desc: "根据文本总长度进行筛选，用于过滤包含异常超长行或极端碎行结构的文本",
        config: [
          {
            key: "minLength",
            type: "percent",
            label: "最小长度",
            placeholder: "",
            value: 10,
            scope: {
              min: 0,
              max: 20000,
            },
          },
          {
            key: "maxLength",
            type: "percent",
            label: "最大长度",
            placeholder: "",
            value: 10000,
            scope: {
              min: 0,
              max: 20000,
            },
          },
        ],
      },
      {
        id: "35",
        type: "specialCharacterClean",
        name: "特殊字符清理",
        desc: "根据特殊字符的占比进行筛选，用于清理符号噪声、编码残留和异常格式文本",
        config: [
          {
            key: "minSpecial",
            type: "percent",
            label: "最小特殊字符占比",
            placeholder: "",
            value: 0,
            scope: {
              min: 0,
              max: 1,
            },
          },
          {
            key: "maxSpecial",
            type: "percent",
            label: "最大特殊字符占比",
            placeholder: "",
            value: 0.25,
            scope: {
              min: 0,
              max: 1,
            },
          },
        ],
      },
      {
        id: "36",
        type: "fieldFilter",
        name: "字段过滤",
        desc: "从样本目标字段路径中读取字段值，判断此字段值是否命中目标字段值集合，命中则保留此字段数据",
        config: [
          {
            key: "targetField",
            type: "input",
            label: "目标字段",
            placeholder: "请输入目标字段，多级字段用英文‘.’隔开",
            value: "",
          },
          {
            key: "targetValue",
            type: "input",
            label: "目标值",
            placeholder: "请输入目标标签，用英文‘,’隔开",
            value: "",
          },
        ],
      },
      {
        id: "37",
        type: "languageFilter",
        name: "语言过滤",
        desc: "从样本中识别样本语言及计算置信度，判断此语言及置信度是否属于指定语言且大于等于最小语言识别置信度，保留属于的样本（内置语言识别模型）",
        config: [
          {
            key: "specifiedLanguage",
            type: "select",
            label: "指定语言",
            placeholder: "",
            value: "en",
            options: [
              {
                label: "en",
                value: "en",
              },
              {
                label: "zh",
                value: "zh",
              },
            ],
          },
          {
            key: "minConfidenceLevel",
            type: "percent",
            label: "最小语言识别置信度",
            placeholder: "",
            value: 0.8,
            scope: {
              min: 0,
              max: 1,
            },
          },
        ],
      },
      {
        id: "38",
        type: "sensitiveFilter",
        name: "敏感词过滤",
        desc: "根据加载的敏感词，过滤敏感词占比小于等于最大阈值的样本",
        config: [
          {
            key: "specifiedLanguage",
            type: "select",
            label: "指定语言",
            placeholder: "",
            value: "en",
            options: [
              {
                label: "en",
                value: "en",
              },
              {
                label: "zh",
                value: "zh",
              },
            ],
          },
          {
            key: "modelSegmentation",
            type: "radio",
            label: "是否使用模型对文本进行分词",
            placeholder: "",
            value: false,
            options: [
              {
                label: "是",
                value: true,
              },
              {
                label: "否",
                value: false,
              },
            ],
          },
          {
            key: "sensitiveThreshold",
            type: "percent",
            label: "敏感词占比的最大阈值",
            placeholder: "",
            value: 0.0045,
            scope: {
              min: 0,
              max: 1,
            },
          },
          {
            key: "sensitiveList",
            type: "input",
            label: "存储敏感词字典的目录",
            placeholder: "",
            value: "./assets",
          },
        ],
      },
      {
        id: "39",
        type: "stopWordFilter",
        name: "停用词过滤",
        desc: "根据加载的停用词，过滤停用词占比大于等于最小阈值的样本",
        config: [
          {
            key: "specifiedLanguage",
            type: "select",
            label: "指定语言",
            placeholder: "",
            value: "en",
            options: [
              {
                label: "en",
                value: "en",
              },
              {
                label: "zh",
                value: "zh",
              },
            ],
          },
          {
            key: "modelSegmentation",
            type: "radio",
            label: "是否使用模型对文本进行分词",
            placeholder: "",
            value: false,
            options: [
              {
                label: "是",
                value: true,
              },
              {
                label: "否",
                value: false,
              },
            ],
          },
          {
            key: "stopWordThreshold",
            type: "percent",
            label: "停用词占比的最小阈值",
            placeholder: "",
            value: 0.3,
            scope: {
              min: 0,
              max: 1,
            },
          },
          {
            key: "stopWordList",
            type: "input",
            label: "存储停用词字典的目录",
            placeholder: "",
            value: "./assets",
          },
        ],
      },
      {
        id: "310",
        type: "wordControl",
        name: "字数控制",
        desc: "统计样本字数，过滤字数不在指定范围内的样本",
        config: [
          {
            key: "specifiedLanguage",
            type: "select",
            label: "指定语言",
            placeholder: "",
            value: "en",
            options: [
              {
                label: "en",
                value: "en",
              },
              {
                label: "zh",
                value: "zh",
              },
            ],
          },
          {
            key: "modelSegmentation",
            type: "radio",
            label: "是否使用模型对文本进行分词",
            placeholder: "",
            value: false,
            options: [
              {
                label: "是",
                value: true,
              },
              {
                label: "否",
                value: false,
              },
            ],
          },
          {
            key: "minCount",
            type: "percent",
            label: "最小数量",
            placeholder: "",
            value: 10,
            scope: {
              min: 0,
              max: 20000,
            },
          },
          {
            key: "maxCount",
            type: "percent",
            label: "最大数量",
            placeholder: "",
            value: 10000,
            scope: {
              min: 0,
              max: 20000,
            },
          },
        ],
      },
      {
        id: "311",
        type: "wordRepetitionTest",
        name: "单词重复检测",
        desc: "根据文本中单词级n-gram的重复比例筛选样本，用于过滤机械重复、模板化或低信息量文本",
        config: [
          {
            key: "specifiedLanguage",
            type: "select",
            label: "指定语言",
            placeholder: "",
            value: "en",
            options: [
              {
                label: "en",
                value: "en",
              },
              {
                label: "zh",
                value: "zh",
              },
            ],
          },
          {
            key: "modelSegmentation",
            type: "radio",
            label: "是否使用模型对文本进行分词",
            placeholder: "",
            value: false,
            options: [
              {
                label: "是",
                value: true,
              },
              {
                label: "否",
                value: false,
              },
            ],
          },
          {
            key: "nGramLen",
            type: "percent",
            label: "单词级n-gram的长度",
            placeholder: "",
            value: 10,
            scope: {
              min: 0,
              max: 10,
            },
          },
          {
            key: "minRepetRate",
            type: "percent",
            label: "最小重复率",
            placeholder: "",
            value: 0,
            scope: {
              min: 0,
              max: 1,
            },
          },
          {
            key: "maxRepetRate",
            type: "percent",
            label: "最大重复率",
            placeholder: "",
            value: 0.5,
            scope: {
              min: 0,
              max: 1,
            },
          },
        ],
      },
      {
        id: "312",
        type: "characterRepeteTest",
        name: "字符重复检测",
        desc: "根据文本中字符级n-gram的重复比例筛选样本，用于过滤字符层面的机械重复、刷屏文本和生成模型退化输出",
        config: [
          {
            key: "nGramLen",
            type: "percent",
            label: "字符级n-gram的长度",
            placeholder: "",
            value: 10,
            scope: {
              min: 0,
              max: 10,
            },
          },
          {
            key: "minRepetRate",
            type: "percent",
            label: "最小重复率",
            placeholder: "",
            value: 0,
            scope: {
              min: 0,
              max: 1,
            },
          },
          {
            key: "maxRepetRate",
            type: "percent",
            label: "最大重复率",
            placeholder: "",
            value: 0.5,
            scope: {
              min: 0,
              max: 1,
            },
          },
        ],
      },
      {
        id: "313",
        type: "imageAspectRatio",
        name: "图像纵横比过滤",
        desc: "根据样本中图像的”纵横比（Aspect Ratio = 宽 / 高）“过滤异常比例的图片，用于剔除极端拉伸、长条、损坏或不适合训练/展示的图像",
        config: [
          {
            key: "minAspectRatio",
            type: "percent",
            label: "最小纵横比",
            placeholder: "",
            value: 0.333,
            scope: {
              min: 0,
              max: 1,
            },
          },
          {
            key: "maxAspectRatio",
            type: "percent",
            label: "最大纵横比",
            placeholder: "",
            value: 3,
            scope: {
              min: 0,
              max: 10,
            },
          },
          {
            key: "isSatisfied",
            type: "logicalOperation",
            label: null,
            placeholder: "",
            value: true,
            options: [
              {
                label: "或",
                value: true,
                desc: "任一满足",
              },
              {
                label: "且",
                value: false,
                desc: "全部满足",
              },
            ],
          },
        ],
      },
      {
        id: "314",
        type: "imageShape",
        name: "图像形状过滤",
        desc: "根据样本中图像的宽高形状过滤不在指定范围的图片。",
        config: [
          {
            key: "minWidth",
            type: "percent",
            label: "最小宽度",
            placeholder: "",
            value: 200,
            scope: {
              min: 0,
              max: 5000,
            },
          },
          {
            key: "maxWidth",
            type: "percent",
            label: "最大宽度",
            placeholder: "",
            value: 5000,
            scope: {
              min: 0,
              max: 5000,
            },
          },
          {
            key: "minHeight",
            type: "percent",
            label: "最小高度",
            placeholder: "",
            value: 200,
            scope: {
              min: 0,
              max: 5000,
            },
          },
          {
            key: "maxHeight",
            type: "percent",
            label: "最大高度",
            placeholder: "",
            value: 5000,
            scope: {
              min: 0,
              max: 5000,
            },
          },
          {
            key: "isSatisfied",
            type: "logicalOperation",
            label: null,
            placeholder: "",
            value: true,
            options: [
              {
                label: "或",
                value: true,
                desc: "任一满足",
              },
              {
                label: "且",
                value: false,
                desc: "全部满足",
              },
            ],
          },
        ],
      },
      {
        id: "315",
        type: "imageSize",
        name: "图像大小过滤",
        desc: "根据样本中图像的大小（字节）过滤不在指定范围的图片。",
        config: [
          {
            key: "minSize",
            type: "percent",
            label: "最小字节",
            placeholder: "",
            value: 0,
            scope: {
              min: 0,
              max: 1,
            },
            unit: "TB",
          },
          {
            key: "maxSize",
            type: "percent",
            label: "最大字节",
            placeholder: "",
            value: 1,
            scope: {
              min: 0,
              max: 1,
            },
            unit: "TB",
          },
          {
            key: "isSatisfied",
            type: "logicalOperation",
            label: null,
            placeholder: "",
            value: true,
            options: [
              {
                label: "或",
                value: true,
                desc: "任一满足",
              },
              {
                label: "且",
                value: false,
                desc: "全部满足",
              },
            ],
          },
        ],
      },
      {
        id: "316",
        type: "audioDuration",
        name: "音频时长过滤",
        desc: "根据样本中音频时长过滤不符合指定时长范围的样本。",
        config: [
          {
            key: "minDuration",
            type: "percent",
            label: "最小时长",
            placeholder: "",
            value: 0,
            scope: {
              min: 0,
              max: 3600,
            },
            unit: "s",
          },
          {
            key: "maxDuration",
            type: "percent",
            label: "最大时长",
            placeholder: "",
            value: 3600,
            scope: {
              min: 0,
              max: 3600,
            },
            unit: "s",
          },
          {
            key: "isSatisfied",
            type: "logicalOperation",
            label: null,
            placeholder: "",
            value: true,
            options: [
              {
                label: "或",
                value: true,
                desc: "任一满足",
              },
              {
                label: "且",
                value: false,
                desc: "全部满足",
              },
            ],
          },
        ],
      },
      {
        id: "317",
        type: "audioSize",
        name: "音频大小过滤",
        desc: "根据样本中音频文件的大小过滤不符合指定大小范围的样本。",
        config: [
          {
            key: "minSize",
            type: "percent",
            label: "最小音频大小",
            placeholder: "",
            value: 0,
            scope: {
              min: 0,
              max: 1,
            },
            unit: "TB",
          },
          {
            key: "maxSize",
            type: "percent",
            label: "最大音频大小",
            placeholder: "",
            value: 1,
            scope: {
              min: 0,
              max: 1,
            },
            unit: "TB",
          },
          {
            key: "isSatisfied",
            type: "logicalOperation",
            label: null,
            placeholder: "",
            value: true,
            options: [
              {
                label: "或",
                value: true,
                desc: "任一满足",
              },
              {
                label: "且",
                value: false,
                desc: "全部满足",
              },
            ],
          },
        ],
      },
      {
        id: "318",
        type: "videoAspectRatio",
        name: "视频纵横比过滤",
        desc: "根据样本中视频的”纵横比“过滤异常比例的视频。",
        config: [
          {
            key: "minAspectRatio",
            type: "inputNumbers",
            label: "最小纵横比",
            placeholder: "",
            value: 0,
            extras: [
              {
                key: "length",
                type: "inputNumber",
                label: null,
                placeholder: "",
                value: 9,
              },
              {
                key: "width",
                type: "inputNumber",
                label: "",
                placeholder: "",
                value: 21,
              },
            ],
          },
          {
            key: "maxAspectRatio",
            type: "inputNumbers",
            label: "最大纵横比",
            placeholder: "",
            value: 0,
            extras: [
              {
                key: "length",
                type: "inputNumber",
                label: null,
                placeholder: "",
                value: 21,
              },
              {
                key: "width",
                type: "inputNumber",
                label: "",
                placeholder: "",
                value: 9,
              },
            ],
          },
          {
            key: "isSatisfied",
            type: "logicalOperation",
            label: null,
            placeholder: "",
            value: true,
            options: [
              {
                label: "或",
                value: true,
                desc: "任一满足",
              },
              {
                label: "且",
                value: false,
                desc: "全部满足",
              },
            ],
          },
        ],
      },
      {
        id: "319",
        type: "videoDuration",
        name: "视频时长过滤",
        desc: "根据样本中视频的持续时长过滤不符合指定范围的视频。",
        config: [
          {
            key: "minDuration",
            type: "percent",
            label: "最小时长",
            placeholder: "",
            value: 0,
            scope: {
              min: 0,
              max: 60,
            },
            unit: "s",
          },
          {
            key: "maxDuration",
            type: "percent",
            label: "最大时长",
            placeholder: "",
            value: 10,
            scope: {
              min: 0,
              max: 60,
            },
            unit: "s",
          },
          {
            key: "isSatisfied",
            type: "logicalOperation",
            label: null,
            placeholder: "",
            value: true,
            options: [
              {
                label: "或",
                value: true,
                desc: "任一满足",
              },
              {
                label: "且",
                value: false,
                desc: "全部满足",
              },
            ],
          },
        ],
      },
      {
        id: "320",
        type: "videoQuality",
        name: "视频质量过滤",
        desc: "根据样本中视频的运动分数过滤不符合指定范围的视频。",
        config: [
          {
            key: "minSports",
            type: "percent",
            label: "最小运动分数",
            placeholder: "",
            value: 0.25,
            scope: {
              min: 0,
              max: 1,
            },
          },
          {
            key: "maxSports",
            type: "percent",
            label: "最大运动分数",
            placeholder: "",
            value: 10000,
            scope: {
              min: 0,
              max: 10000,
            },
          },
          {
            key: "opticalFlowFrameRate",
            type: "percent",
            label: "光流帧率采样比例",
            placeholder: "",
            value: 2,
            scope: {
              min: 0,
              max: 10,
            },
          },
          {
            key: "isSatisfied",
            type: "logicalOperation",
            label: null,
            placeholder: "",
            value: true,
            options: [
              {
                label: "或",
                value: true,
                desc: "任一满足",
              },
              {
                label: "且",
                value: false,
                desc: "全部满足",
              },
            ],
          },
        ],
      },
      {
        id: "321",
        type: "videoResolution",
        name: "视频分辨率过滤",
        desc: "根据样本中视频的分辨率过滤不符合指定范围的视频。",
        config: [
          {
            key: "minLevel",
            type: "percent",
            label: "最小水平分辨率",
            placeholder: "",
            value: 1280,
            scope: {
              min: 0,
              max: 4096,
            },
          },
          {
            key: "maxLevel",
            type: "percent",
            label: "最大水平分辨率",
            placeholder: "",
            value: 4096,
            scope: {
              min: 0,
              max: 4096,
            },
          },
          {
            key: "minVertical",
            type: "percent",
            label: "最小垂直分辨率",
            placeholder: "",
            value: 480,
            scope: {
              min: 0,
              max: 4096,
            },
          },
          {
            key: "maxVertical",
            type: "percent",
            label: "最大垂直分辨率",
            placeholder: "",
            value: 1080,
            scope: {
              min: 0,
              max: 4096,
            },
          },
          {
            key: "isSatisfied",
            type: "logicalOperation",
            label: null,
            placeholder: "",
            value: true,
            options: [
              {
                label: "或",
                value: true,
                desc: "任一满足",
              },
              {
                label: "且",
                value: false,
                desc: "全部满足",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "4",
    type: "optimization",
    name: "数据优选",
    icon: "data-optimization",
    children: [
      {
        id: "41",
        type: "specifiedFrequency",
        name: "指定频率字段选择",
        desc: "根据样本中指定字段值的出现频率进行统计排序，并仅保留出现频率最高（或最低）的一部分字段值所对应的样本。",
        config: [
          {
            key: "targetField",
            type: "input",
            label: "目标字段",
            placeholder: "请输入目标字段，多级字段用英文‘.’隔开",
            value: "",
          },
          {
            key: "topRadioBtn",
            linkKey: "topRatio",
            type: "radioBtn",
            label: null,
            placeholder: "",
            value: true,
            options: [
              {
                label: "top_ratio",
                value: true,
              },
              {
                label: "topk",
                value: false,
              },
            ],
            extras: [
              {
                key: "topRatio",
                type: "percent",
                label: "top_ratio",
                placeholder: "",
                value: 0.2,
                scope: {
                  min: 0,
                  max: 1,
                },
              },
              {
                key: "topK",
                type: "percent",
                label: "topk",
                placeholder: "",
                value: 5,
                scope: {
                  min: 0,
                  max: 10,
                },
              },
            ],
          },
          {
            key: "reverse",
            type: "radio",
            label: "reverse（降序排序）",
            placeholder: "",
            value: true,
            options: [
              {
                label: "是",
                value: true,
              },
              {
                label: "否",
                value: false,
              },
            ],
          },
        ],
      },
      {
        id: "42",
        type: "randomSelect",
        name: "随机选择",
        desc: "按随机方式从样本集合中抽取指定比例或指定数量的样本",
        config: [
          {
            key: "sampling",
            linkKey: "samplingRatio",
            type: "radioBtn",
            label: null,
            placeholder: "",
            value: true,
            options: [
              {
                label: "采样比例",
                value: true,
              },
              {
                label: "采样数量",
                value: false,
              },
            ],
            extras: [
              {
                key: "Ratio",
                type: "percent",
                label: "采样比例",
                placeholder: "",
                value: 0.2,
                scope: {
                  min: 0,
                  max: 1,
                },
              },
              {
                key: "Quantity",
                type: "percent",
                label: "采样数量",
                placeholder: "",
                value: 5,
                scope: {
                  min: 0,
                  max: 10,
                },
              },
            ],
          },
        ],
      },
      {
        id: "43",
        type: "rangeField",
        name: "指定范围字段选择",
        desc: "按指定字段的值从小到大排序，并选择位于**某个连续区间（百分位区间或排名区间）**内的样本。",
        config: [
          {
            key: "targetField",
            type: "input",
            label: "目标字段",
            placeholder: "请输入目标字段，多级字段用英文‘.’隔开",
            value: "",
          },
          {
            key: "interval",
            linkKey: "samplingRatio",
            type: "radioBtn",
            label: null,
            placeholder: "",
            value: true,
            options: [
              {
                label: "百分位区间",
                value: true,
              },
              {
                label: "排名区间",
                value: false,
              },
            ],
            extras: [
              {
                key: "Percentile",
                type: "interval",
                label: "百分位区间",
                placeholder: "",
                value: [10, 90],
                scope: {
                  min: 0,
                  max: 100,
                },
              },
              {
                key: "Ranking",
                type: "interval",
                label: "排名区间",
                placeholder: "",
                value: [10, 90],
                scope: {
                  min: 0,
                  max: 100,
                },
              },
            ],
          },
        ],
      },
      {
        id: "44",
        type: "labelField",
        name: "指定标签字段选择",
        desc: "根据提供的样本从目标字段的元数据路径中提取标签值，判断是否命中给定目标集合，保留命中给定标签的样本",
        config: [
          {
            key: "targetField",
            type: "input",
            label: "目标字段",
            placeholder: "请输入目标字段，多级字段用英文‘.’隔开",
            value: "",
          },
          {
            key: "givenLabel",
            type: "input",
            label: "给定标签",
            placeholder: "请输入目标标签，用英文‘,’隔开",
            value: "",
          },
        ],
      },
      {
        id: "45",
        type: "topkField",
        name: "topk指定字段选择",
        desc: "按指定字段的值进行排序，仅保留排序结果中的前 K 个样本",
        config: [
          {
            key: "targetField",
            type: "input",
            label: "目标字段",
            placeholder: "请输入目标字段，多级字段用英文‘.’隔开",
            value: "",
          },
          {
            key: "topk",
            type: "percent",
            label: "topk",
            placeholder: "",
            value: 5,
            scope: {
              min: 1,
              max: 10,
            },
          },
          {
            key: "reverse",
            type: "radio",
            label: "reverse（降序排序）",
            placeholder: "",
            value: true,
            options: [
              {
                label: "是",
                value: true,
              },
              {
                label: "否",
                value: false,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "5",
    type: "mapping",
    name: "数据映射转换",
    icon: "data-mapping",
    children: [
      {
        id: "51",
        type: "addGaussianNoise",
        name: "音频高斯噪声添加",
        desc: "以一定概率向音频样本中添加高斯白噪声，用于提升语音模型对环境噪声的鲁棒性与泛化能力。",
        config: [
          {
            key: "minMagnify",
            type: "percent",
            label: "最小放大系数",
            placeholder: "",
            value: 0.001,
            scope: {
              min: 0,
              max: 1,
            },
          },
          {
            key: "maxMagnify",
            type: "percent",
            label: "最大放大系数",
            placeholder: "",
            value: 0.015,
            scope: {
              min: 0,
              max: 1,
            },
          },
          {
            key: "appProbability",
            type: "percent",
            label: "p(应用概率)",
            placeholder: "",
            value: 0.5,
            scope: {
              min: 0,
              max: 1,
            },
          },
        ],
      },
      {
        id: "52",
        type: "ffmpegAudio",
        name: "ffmpeg音频过滤",
        desc: "对数据集中的音频文件封装调用 **FFmpeg 音频滤镜（filter）**进行处理的通用映射器，用于裁剪、重采样、变速、增益等各类音频预处理。",
        config: [
          {
            key: "filterName",
            type: "select",
            label: "filter_name",
            placeholder: "",
            value: "atrim",
            options: [
              {
                label: "atrim",
                value: "atrim",
              },
              {
                label: "aresample",
                value: "aresample",
              },
              {
                label: "atempo",
                value: "atempo",
              },
              {
                label: "volume",
                value: "volume",
              },
              {
                label: "silenceremove",
                value: "silenceremove",
              },
              {
                label: "highpass",
                value: "highpass",
              },
              {
                label: "lowpass",
                value: "lowpass",
              },
            ],
          },
          {
            key: "filterKwargs",
            type: "textArea",
            label: "filter_kwargs",
            placeholder: "",
            value: "{'end': 6}",
          },
        ],
      },
      {
        id: "53",
        type: "languageSwitch",
        name: "语言转换",
        desc: "在简体中文、繁体中文以及日文汉字之间进行字符体系转换的文本映射器",
        config: [
          {
            key: "switchMode",
            type: "select",
            label: "转换模式",
            placeholder: "",
            value: "s2t",
            options: [
              {
                label: "s2t",
                value: "s2t",
              },
              {
                label: "t2s",
                value: "t2s",
              },
              {
                label: "s2tw",
                value: "s2tw",
              },
              {
                label: "tw2s",
                value: "tw2s",
              },
              {
                label: "s2hk",
                value: "s2hk",
              },
              {
                label: "hk2s",
                value: "hk2s",
              },
              {
                label: "s2twp",
                value: "s2twp",
              },
              {
                label: "twp2s",
                value: "twp2s",
              },
              {
                label: "t2tw",
                value: "t2tw",
              },
              {
                label: "tw2t",
                value: "tw2t",
              },
              {
                label: "hk2t",
                value: "hk2t",
              },
              {
                label: "t2hk",
                value: "t2hk",
              },
              {
                label: "t2jp",
                value: "t2jp",
              },
              {
                label: "jp2t",
                value: "jp2t",
              },
            ],
          },
        ],
      },
      {
        id: "54",
        type: "copyrightClean",
        name: "版权清理",
        desc: "清除文本示例开头的版权注释",
        config: [],
      },
      {
        id: "55",
        type: "privacyClean",
        name: "隐私清理",
        desc: "使用正则表达式从文本示例中清除电子邮件地址",
        config: [],
      },
      {
        id: "56",
        type: "HTMLClean",
        name: "HTML清理",
        desc: "从文本中删除HTML代码，将HTML转换为纯文本",
        config: [],
      },
      {
        id: "57",
        type: "IPClean",
        name: "IP清理",
        desc: "从文本中删除IPv4和IPv6地址",
        config: [],
      },
      {
        id: "58",
        type: "linkClean",
        name: "链接清理",
        desc: "从文本中删除网页链接(ftp/http/https等)",
        config: [],
      },
      {
        id: "59",
        type: "tableExtraction",
        name: "表格提取",
        desc: "从HTML内容中提取表并将其存储在指定字段中",
        config: [
          {
            key: "tableField",
            type: "input",
            label: "存储提取表格字段名称",
            placeholder: "",
            value: "html_tables",
          },
          {
            key: "retainHTMLTag",
            type: "radio",
            label: "是否保留HTML标签",
            placeholder: "",
            value: false,
            options: [
              {
                label: "是",
                value: true,
              },
              {
                label: "否",
                value: false,
              },
            ],
          },
          {
            key: "includeTableTitle",
            type: "radio",
            label: "是否包含表格标题",
            placeholder: "",
            value: true,
            options: [
              {
                label: "是",
                value: true,
              },
              {
                label: "否",
                value: false,
              },
            ],
          },
        ],
      },
      {
        id: "510",
        type: "codeRepair",
        name: "编码修复",
        desc: "修复文本中的unicode错误",
        config: [],
      },
      {
        id: "511",
        type: "imgBlurProcess",
        name: "图像模糊处理",
        desc: "使用指定的概率和模糊类型对数据集中的图像进行模糊处理",
        config: [
          {
            key: "appProbability",
            type: "percent",
            label: "p(应用概率)",
            placeholder: "",
            value: 0.2,
            scope: {
              min: 0,
              max: 1,
            },
          },
          {
            key: "fuzzyType",
            type: "select",
            label: "模糊类型",
            placeholder: "",
            value: "gaussian",
            options: [
              {
                label: "gaussian",
                value: "gaussian",
              },
              {
                label: "mean",
                value: "mean",
              },
              {
                label: "box",
                value: "box",
              },
            ],
          },
          {
            key: "radiusFuzzyRadius",
            type: "percent",
            label: "radius（模糊半径）",
            placeholder: "",
            value: 2,
            scope: {
              min: 0,
              max: 10,
            },
          },
        ],
      },
      {
        id: "512",
        type: "enTextEnhancement",
        name: "英文文本增强",
        desc: "基于nlpaug库增强英语文本样本",
        config: [
          {
            key: "combineAsequence",
            type: "radio",
            label: "是否将所有增强方法组合成一个序列",
            placeholder: "",
            value: false,
            options: [
              {
                label: "是",
                value: true,
              },
              {
                label: "否",
                value: false,
              },
            ],
          },
          {
            key: "enhancedSample",
            type: "inputNumber",
            label: "增强的样本数量",
            placeholder: "",
            value: 1,
          },
          {
            key: "saveOriginalSample",
            type: "radio",
            label: "是否保留原始样本",
            placeholder: "",
            value: true,
            options: [
              {
                label: "是",
                value: true,
              },
              {
                label: "否",
                value: false,
              },
            ],
          },
          {
            key: "delRandomWords",
            type: "radio",
            label: "是否删除随机单词",
            placeholder: "",
            value: false,
            options: [
              {
                label: "是",
                value: true,
              },
              {
                label: "否",
                value: false,
              },
            ],
          },
          {
            key: "swapRandomWords",
            type: "radio",
            label: "是否交换随机连续单词",
            placeholder: "",
            value: false,
            options: [
              {
                label: "是",
                value: true,
              },
              {
                label: "否",
                value: false,
              },
            ],
          },
          {
            key: "simulateSpellError",
            type: "radio",
            label: "是否模拟单词拼写错误",
            placeholder: "",
            value: false,
            options: [
              {
                label: "是",
                value: true,
              },
              {
                label: "否",
                value: false,
              },
            ],
          },
          {
            key: "simulateKeyboardError",
            type: "radio",
            label: "是否模拟字符键盘错误",
            placeholder: "",
            value: false,
            options: [
              {
                label: "是",
                value: true,
              },
              {
                label: "否",
                value: false,
              },
            ],
          },
          {
            key: "simulateOCRerror",
            type: "radio",
            label: "是否模拟字符OCR错误",
            placeholder: "",
            value: false,
            options: [
              {
                label: "是",
                value: true,
              },
              {
                label: "否",
                value: false,
              },
            ],
          },
        ],
      },
      {
        id: "513",
        type: "zhTextEnhancement",
        name: "中文文本增强",
        desc: "使用nlpcda库扩充中文文本样本",
        config: [
          {
            key: "combineAsequence",
            type: "radio",
            label: "是否将所有增强方法组合成一个序列",
            placeholder: "",
            value: false,
            options: [
              {
                label: "是",
                value: true,
              },
              {
                label: "否",
                value: false,
              },
            ],
          },
          {
            key: "enhancedSample",
            type: "inputNumber",
            label: "增强的样本数量",
            placeholder: "",
            value: 1,
          },
          {
            key: "saveOriginalSample",
            type: "radio",
            label: "是否保留原始样本",
            placeholder: "",
            value: true,
            options: [
              {
                label: "是",
                value: true,
              },
              {
                label: "否",
                value: false,
              },
            ],
          },
          {
            key: "similarWordsReplace",
            type: "radio",
            label: "是否用相似词替换随机词",
            placeholder: "",
            value: false,
            options: [
              {
                label: "是",
                value: true,
              },
              {
                label: "否",
                value: false,
              },
            ],
          },
          // {
          //   key: "swapRandomWords",
          //   type: "radio",
          //   label: "是否交换随机连续单词",
          //   placeholder: "",
          //   value: false,
          //   options: [
          //     {
          //       label: "是",
          //       value: true,
          //     },
          //     {
          //       label: "否",
          //       value: false,
          //     },
          //   ],
          // },
          {
            key: "homophonesReplace",
            type: "radio",
            label: "是否用同音字替换随机字符",
            placeholder: "",
            value: false,
            options: [
              {
                label: "是",
                value: true,
              },
              {
                label: "否",
                value: false,
              },
            ],
          },
          {
            key: "delRandomWords",
            type: "radio",
            label: "是否删除随机字符",
            placeholder: "",
            value: false,
            options: [
              {
                label: "是",
                value: true,
              },
              {
                label: "否",
                value: false,
              },
            ],
          },
          {
            key: "swapRandomCharacter",
            type: "radio",
            label: "是否交换随机连续字符",
            placeholder: "",
            value: false,
            options: [
              {
                label: "是",
                value: true,
              },
              {
                label: "否",
                value: false,
              },
            ],
          },
          {
            key: "equivalentRepresente",
            type: "radio",
            label: "是否用等效表示替换随机数字",
            placeholder: "",
            value: false,
            options: [
              {
                label: "是",
                value: true,
              },
              {
                label: "否",
                value: false,
              },
            ],
          },
        ],
      },
      {
        id: "514",
        type: "standardPunctuation",
        name: "标点规范化",
        desc: "将unicode标点规范化为文本示例中的英语等效项",
        config: [],
      },
      {
        id: "515",
        type: "delReference",
        name: "删除参考",
        desc: "从LaTeX文档末尾删除参考书目部分",
        config: [],
      },
      {
        id: "516",
        type: "annotationClean",
        name: "注释清理",
        desc: '从文档中删除注释，当前仅支持 "文本" 格式',
        config: [
          {
            key: "annotationType",
            type: "select",
            label: "注释类型",
            placeholder: "",
            value: "tex",
            options: [
              {
                label: "tex",
                value: "tex",
              },
            ],
          },
          {
            key: "delInLineComments",
            type: "radio",
            label: "是否删除行内注释",
            placeholder: "",
            value: true,
            options: [
              {
                label: "是",
                value: true,
              },
              {
                label: "否",
                value: false,
              },
            ],
          },
          {
            key: "delMultiLineComments",
            type: "radio",
            label: "是否删除多行注释",
            placeholder: "",
            value: true,
            options: [
              {
                label: "是",
                value: true,
              },
              {
                label: "否",
                value: false,
              },
            ],
          },
        ],
      },
      {
        id: "517",
        type: "abnormalWordClean",
        name: "异常词清理",
        desc: "删除特定范围内的长词",
        config: [
          {
            key: "minWordLength",
            type: "percent",
            label: "最小单词长度",
            placeholder: "",
            value: 1,
            scope: {
              min: 0,
              max: 256,
            },
          },
          {
            key: "maxWordLength",
            type: "percent",
            label: "最大单词长度",
            placeholder: "",
            value: 128,
            scope: {
              min: 0,
              max: 256,
            },
          },
        ],
      },
      {
        id: "518",
        type: "chineseClean",
        name: "中文清洗",
        desc: "从文本样本中删除非中文字符",
        config: [
          {
            key: "retainLetters",
            type: "radio",
            label: "是否保留字母",
            placeholder: "",
            value: true,
            options: [
              {
                label: "是",
                value: true,
              },
              {
                label: "否",
                value: false,
              },
            ],
          },
          {
            key: "retainNumbers",
            type: "radio",
            label: "是否保留数字",
            placeholder: "",
            value: true,
            options: [
              {
                label: "是",
                value: true,
              },
              {
                label: "否",
                value: false,
              },
            ],
          },
          {
            key: "retainPunctuationMarks",
            type: "radio",
            label: "是否保留标点符号",
            placeholder: "",
            value: true,
            options: [
              {
                label: "是",
                value: true,
              },
              {
                label: "否",
                value: false,
              },
            ],
          },
        ],
      },
      {
        id: "519",
        type: "deDuplicationClean",
        name: "去重清理",
        desc: "删除文本样本中的重复句子",
        config: [
          {
            key: "convertToLowercase",
            type: "radio",
            label: "是否将样本文本转换为小写",
            placeholder: "",
            value: false,
            options: [
              {
                label: "是",
                value: true,
              },
              {
                label: "否",
                value: false,
              },
            ],
          },
          {
            key: "ignoreSpecialCharacters",
            type: "radio",
            label: "判断重复句子时是否忽略特殊字符",
            placeholder: "",
            value: true,
            options: [
              {
                label: "是",
                value: true,
              },
              {
                label: "否",
                value: false,
              },
            ],
          },
          {
            key: "minDeduplicationLen",
            type: "percent",
            label: "最小去重长度",
            placeholder: "",
            value: 2,
            scope: {
              min: 0,
              max: 256,
            },
          },
        ],
      },
      {
        id: "520",
        type: "characterClean",
        name: "字符清理",
        desc: "从文本示例中删除特定字符",
        config: [
          {
            key: "delCharacter",
            type: "input",
            label: "需要删除的字符/字符串/列表",
            placeholder: "",
            value: "◆●■►▼▲▴∆▻▷❖♡□",
          },
        ],
      },
      {
        id: "521",
        type: "delTableText",
        name: "删除表文本",
        desc: "从文本样本中删除表文本",
        config: [
          {
            key: "minColumns",
            type: "percent",
            label: "最小列数",
            placeholder: "",
            value: 2,
            scope: {
              min: 0,
              max: 100,
            },
          },
          {
            key: "maxColumns",
            type: "percent",
            label: "最大列数",
            placeholder: "",
            value: 20,
            scope: {
              min: 0,
              max: 100,
            },
          },
        ],
      },
      {
        id: "522",
        type: "errorWordClean",
        name: "错误词清理",
        desc: "删除包含指定的不正确子字符串的单词",
        config: [
          {
            key: "specifiedLanguage",
            type: "select",
            label: "指定语言",
            placeholder: "",
            value: "en",
            options: [
              {
                label: "en",
                value: "en",
              },
              {
                label: "zh",
                value: "zh",
              },
            ],
          },
          {
            key: "modelSegmentation",
            type: "radio",
            label: "是否使用模型对文档进行分词",
            placeholder: "",
            value: false,
            options: [
              {
                label: "是",
                value: true,
              },
              {
                label: "否",
                value: false,
              },
            ],
          },
          {
            key: "delIncorrectStrings",
            type: "input",
            label: "要删除的不正确子字符串",
            placeholder: "",
            value: "['http', 'www', '.com', 'href', '//']",
          },
        ],
      },
      {
        id: "523",
        type: "contentReplace",
        name: "内容替换",
        desc: "使用正则表达式在文本中查找匹配内容，并用指定的字符串进行替换，用于文本清洗、脱敏、规范化和格式修正",
        config: [
          {
            key: "regularExpression",
            type: "input",
            label: "正则表达式",
            placeholder: "请输入匹配的正则表达式",
            value: "",
          },
          {
            key: "replaceCharacter",
            type: "input",
            label: "替换字符",
            placeholder: "",
            value: "'' ",
          },
        ],
      },
      {
        id: "524",
        type: "sentenceSegmentation",
        name: "句子分割",
        desc: "根据指定的语言将文本样本拆分为单个句子",
        config: [
          {
            key: "specifiedLanguage",
            type: "select",
            label: "指定语言",
            placeholder: "",
            value: "en",
            options: [
              {
                label: "en",
                value: "en",
              },
              {
                label: "zh",
                value: "zh",
              },
            ],
          },
        ],
      },
      {
        id: "525",
        type: "blankNormalization",
        name: "空白规范化",
        desc: "将文本样本中各种类型的空白字符规范化为标准空格",
        config: [],
      },
      {
        id: "526",
        type: "videoFrameExtraction",
        name: "视频帧提取",
        desc: "按指定采样策略从视频文件中提取代表性帧，并将帧信息以路径或字节形式写回样本，用于多模态模型、视频理解和内容分析",
        config: [
          {
            key: "sampleMethod",
            type: "select",
            label: "采样方法",
            placeholder: "",
            value: "all_keyframes",
            options: [
              {
                label: "all_keyframes",
                value: "all_keyframes",
              },
              {
                label: "uniform",
                value: "uniform",
              },
            ],
          },
          {
            key: "frameImgOutputFormat",
            type: "select",
            label: "帧图像输出格式",
            placeholder: "",
            value: "path",
            options: [
              {
                label: "path",
                value: "path",
              },
              {
                label: "bytes",
                value: "bytes",
              },
            ],
          },
          {
            key: "extractFramesEvenly",
            type: "percent",
            label: "均匀提取帧数",
            placeholder: "",
            value: 3,
            scope: {
              min: 0,
              max: 10,
            },
          },
          {
            key: "segmentDuration",
            type: "percent",
            label: "每个片段持续时间",
            placeholder: "",
            value: 0,
            scope: {
              min: 0,
              max: 60,
            },
            unit: "s",
          },
          {
            key: "resultField",
            type: "input",
            label: "提取结果字段名",
            placeholder: "",
            value: "'video_frames'",
          },
        ],
      },
      {
        id: "527",
        type: "ffmpegVideoFilter",
        name: "ffmpeg视频过滤",
        desc: "对数据集中的视频文件应用 FFmpeg 视频滤镜（如缩放、裁剪、帧率调整、转码等），并将处理后的视频写回样本",
        config: [
          {
            key: "filterName",
            type: "select",
            label: "filter_name",
            placeholder: "",
            value: "scale",
            options: [
              {
                label: "scale",
                value: "scale",
              },
              {
                label: "crop",
                value: "crop",
              },
              {
                label: "fps",
                value: "fps",
              },
              {
                label: "hflip",
                value: "hflip",
              },
              {
                label: "vflip",
                value: "vflip",
              },
              {
                label: "rotate",
                value: "rotate",
              },
            ],
          },
          {
            key: "filterKwargs",
            type: "textArea",
            label: "filter_kwargs",
            placeholder: "",
            value: "{'width': 224, 'height': 224}",
          },
        ],
      },
      {
        id: "528",
        type: "videoWatermarkClean",
        name: "视频水印清理",
        desc: "在指定区域（ROI）内，通过多帧统计识别稳定水印像素，并对视频进行去水印处理，生成无水印版本的视频",
        config: [
          {
            key: "watermarkLocated",
            type: "input",
            label: "水印所在区域",
            placeholder: "",
            value: "['0,0,0.1,0.1']",
          },
          {
            key: "roiStringType",
            type: "select",
            label: "roi字符串类型",
            placeholder: "",
            value: "ratio",
            options: [
              {
                label: "pixel",
                value: "pixel",
              },
              {
                label: "ratio",
                value: "ratio",
              },
            ],
          },
          {
            key: "extractFrames",
            type: "percent",
            label: "均匀提取帧数",
            placeholder: "",
            value: 10,
            scope: {
              min: 0,
              max: 10,
            },
          },
          {
            key: "minFrameThreshold",
            type: "percent",
            label: "min_frame_threshold",
            placeholder: "",
            value: 7,
            scope: {
              min: 0,
              max: 10,
            },
          },
        ],
      },
      {
        id: "529",
        type: "aspectRatioProcess",
        name: "视频纵横比处理",
        desc: "将视频的纵横比（Aspect Ratio）调整到指定范围内，通过放大或缩小画面，保证视频比例符合下游模型或平台要求",
        config: [
          {
            key: "minAspectRatio",
            type: "inputNumbers",
            label: "最小纵横比",
            placeholder: "",
            value: 0,
            extras: [
              {
                key: "length",
                type: "inputNumber",
                label: null,
                placeholder: "",
                value: 9,
              },
              {
                key: "width",
                type: "inputNumber",
                label: "",
                placeholder: "",
                value: 21,
              },
            ],
          },
          {
            key: "maxAspectRatio",
            type: "inputNumbers",
            label: "最大纵横比",
            placeholder: "",
            value: 0,
            extras: [
              {
                key: "length",
                type: "inputNumber",
                label: null,
                placeholder: "",
                value: 21,
              },
              {
                key: "width",
                type: "inputNumber",
                label: "",
                placeholder: "",
                value: 9,
              },
            ],
          },
          {
            key: "resizeStrategy",
            type: "select",
            label: "调整大小的策略",
            placeholder: "",
            value: "increase",
            options: [
              {
                label: "decrease",
                value: "decrease",
              },
              {
                label: "increase",
                value: "increase",
              },
            ],
          },
        ],
      },
      {
        id: "530",
        type: "resolutionProcess",
        name: "视频分辨率处理",
        desc: "在保持（或不保持）原始纵横比的前提下，将视频分辨率限制到指定的宽高区间内，确保视频尺寸符合模型、编码或平台要求",
        config: [
          {
            key: "minLevelResolution",
            type: "percent",
            label: "最小水平分辨率",
            placeholder: "",
            value: 640,
            scope: {
              min: 0,
              max: 4096,
            },
          },
          {
            key: "maxLevelResolution",
            type: "percent",
            label: "最大水平分辨率",
            placeholder: "",
            value: 1280,
            scope: {
              min: 0,
              max: 4096,
            },
          },
          {
            key: "minVerticalResolution",
            type: "percent",
            label: "最小垂直分辨率",
            placeholder: "",
            value: 480,
            scope: {
              min: 0,
              max: 4096,
            },
          },
          {
            key: "maxVerticalResolution",
            type: "percent",
            label: "最大垂直分辨率",
            placeholder: "",
            value: 1080,
            scope: {
              min: 0,
              max: 4096,
            },
          },
          {
            key: "resizeStrategy",
            type: "select",
            label: "调整大小的策略",
            placeholder: "",
            value: "increase",
            options: [
              {
                label: "decrease",
                value: "decrease",
              },
              {
                label: "increase",
                value: "increase",
              },
              {
                label: "null",
                value: "null",
              },
            ],
          },
          {
            key: "beDivided",
            type: "select",
            label: "确保输出尺寸可以被给定整数整除",
            placeholder: "",
            value: "4",
            options: [
              {
                label: "2",
                value: "2",
              },
              {
                label: "4",
                value: "4",
              },
              {
                label: "8",
                value: "8",
              },
              {
                label: "16",
                value: "16",
              },
            ],
          },
        ],
      },
      {
        id: "531",
        type: "videoSegmentation",
        name: "视频分割",
        desc: "将视频按照指定持续时间拆分为多个片段，适用于长视频切片、短视频制作或模型输入长度控制",
        config: [
          {
            key: "segmentDuration",
            type: "percent",
            label: "每个拆分片段持续时间",
            placeholder: "",
            value: 10,
            scope: {
              min: 0,
              max: 60,
            },
            unit: "s",
          },
          {
            key: "minSegmentDuration",
            type: "percent",
            label: "最后一个拆分片段最小持续时间",
            placeholder: "",
            value: 0.1,
            scope: {
              min: 0,
              max: 10,
            },
            unit: "s",
          },
          {
            key: "saveOriginalSample",
            type: "radio",
            label: "是否保留原始样本",
            placeholder: "",
            value: true,
            options: [
              {
                label: "是",
                value: true,
              },
              {
                label: "否",
                value: false,
              },
            ],
          },
        ],
      },
      {
        id: "532",
        type: "sceneSegmentation",
        name: "视频场景分割",
        desc: "通过检测视频中场景切换点，将视频拆分为多个场景片段，用于短视频制作、内容分析或多模态模型训练。",
        config: [
          {
            key: "annotationType",
            type: "select",
            label: "场景检测算法",
            placeholder: "",
            value: "ContentDetector",
            options: [
              {
                label: "ContentDetector",
                value: "ContentDetector",
              },
              {
                label: "ThresholdDetector",
                value: "ThresholdDetector",
              },
              {
                label: "AdaptiveDetector",
                value: "AdaptiveDetector",
              },
            ],
          },
          {
            key: "threshold",
            type: "percent",
            label: "阈值",
            placeholder: "",
            value: 27,
            scope: {
              min: 0,
              max: 100,
            },
          },
          {
            key: "minSceneLength",
            type: "percent",
            label: "每个场景的最小长度",
            placeholder: "",
            value: 15,
            scope: {
              min: 0,
              max: 60,
            },
            unit: "s",
          },
        ],
      },
    ],
  },
];
