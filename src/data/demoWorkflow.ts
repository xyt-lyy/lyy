export const DEMO_WORKFLOW = {
  title: '示例：新药推广演练',
  description: '这是一个预置的演示模板，模拟医药代表拜访医生的完整流程。',
  flow_data: {
    nodes: [
      {
        id: 'node-1',
        type: 'opening',
        position: { x: 250, y: 50 },
        data: { 
          label: '开场白', 
          nodeType: 'opening',
          aiRole: 'doctor',
          aiPersonality: '忙碌、稍显冷淡',
          content: '',
          description: '场景：医生正在看病历，你需要主动打招呼并进行自我介绍。'
        },
      },
      {
        id: 'node-2',
        type: 'info',
        position: { x: 250, y: 200 },
        data: { 
          label: '产品介绍', 
          nodeType: 'info',
          aiRole: 'doctor',
          aiPersonality: '专业、审慎',
          content: '哦？心血管领域的新进展？那你简单说说，你们这个药和现在的标准治疗相比，到底有什么具体的优势？',
          description: '目标：向医生介绍产品核心优势（如疗效、安全性数据）。'
        },
      },
      {
        id: 'node-3',
        type: 'objection',
        position: { x: 250, y: 350 },
        data: { 
          label: '医生异议', 
          nodeType: 'objection',
          content: '数据看着是不错。但是我看这个药的价格比较高，而且还不在医保目录里，患者的经济负担太重了，依从性肯定会有问题。',
          description: '目标：妥善处理医生关于价格和依从性的异议。',
          aiRole: 'doctor',
          aiPersonality: '专业、严谨、关注患者负担',
          prompt: '你是一位资深的心血管科主任，非常关注药物的性价比和患者的经济负担。当医药代表介绍高价新药时，你会质疑其性价比和医保覆盖情况。'
        },
      },
      {
        id: 'node-4',
        type: 'compliance',
        position: { x: 250, y: 500 },
        data: { 
          label: '结束/合规', 
          nodeType: 'compliance',
          aiRole: 'doctor',
          content: '行吧，情况我大概了解了。你把资料放在这儿，我有空再细看。外面还有病人等着，先这样吧。',
          description: '演练结束，系统将自动检测对话合规性。'
        },
      },
    ],
    edges: [
      { id: 'edge-1-2', source: 'node-1', target: 'node-2' },
      { id: 'edge-2-3', source: 'node-2', target: 'node-3' },
      { id: 'edge-3-4', source: 'node-3', target: 'node-4' },
    ],
  },
};
