export const DEMO_WORKFLOW = {
  title: '示例：新药推广演练',
  description: '这是一个预置的演示模板，包含开场、信息传递、异议处理和合规检测的完整流程。',
  flow_data: {
    nodes: [
      {
        id: 'node-1',
        type: 'opening',
        position: { x: 250, y: 50 },
        data: { 
          label: '开场白', 
          content: '您好，李主任。我是XX药业的小王。今天特意来拜访您，想向您介绍一下我们在心血管领域的新进展。' 
        },
      },
      {
        id: 'node-2',
        type: 'info',
        position: { x: 250, y: 200 },
        data: { 
          label: '产品介绍', 
          content: '这是最新的《柳叶刀》研究报告，数据显示我们的新药在降低心血管风险方面比传统药物高出15%。' 
        },
      },
      {
        id: 'node-3',
        type: 'objection',
        position: { x: 250, y: 350 },
        data: { 
          label: '医生异议', 
          content: '但是我看这个药的价格比较高，患者的依从性可能会有问题。',
          aiConfig: {
            roleName: '李主任',
            personality: '专业、严谨、关注患者负担',
            prompt: '你是一位资深的心血管科主任，非常关注药物的性价比和患者的经济负担。当医药代表介绍高价新药时，你会质疑其性价比和医保覆盖情况。'
          }
        },
      },
      {
        id: 'node-4',
        type: 'compliance',
        position: { x: 250, y: 500 },
        data: { 
          label: '合规检测', 
          content: '系统将自动检测对话中是否包含违规承诺或误导性信息。' 
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
