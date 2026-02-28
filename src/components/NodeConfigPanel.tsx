import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { Save, X } from 'lucide-react';

interface NodeConfigPanelProps {
  selectedNode: Node | null;
  onUpdateNode: (nodeId: string, data: any) => void;
  onClose: () => void;
}

export default function NodeConfigPanel({
  selectedNode,
  onUpdateNode,
  onClose,
}: NodeConfigPanelProps) {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [aiRole, setAiRole] = useState('doctor');
  const [aiPersonality, setAiPersonality] = useState('');
  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    if (selectedNode) {
      setLabel(selectedNode.data.label || '');
      setDescription(selectedNode.data.description || '');
      setAiRole(selectedNode.data.aiRole || 'doctor');
      setAiPersonality(selectedNode.data.aiPersonality || '');
      setPrompt(selectedNode.data.prompt || '');
    }
  }, [selectedNode]);

  const handleSave = () => {
    if (selectedNode) {
      onUpdateNode(selectedNode.id, {
        ...selectedNode.data,
        label,
        description,
        aiRole,
        aiPersonality,
        prompt,
      });
    }
  };

  if (!selectedNode) {
    return (
      <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded border border-gray-100 text-center h-full flex items-center justify-center">
        选中画布中的节点以配置其属性
      </div>
    );
  }

  return (
    <div className="bg-white h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-bold text-lg text-gray-800">节点配置</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto pr-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            节点名称
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="输入节点名称"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            描述
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="输入节点描述"
          />
        </div>

        <div className="border-t border-gray-200 pt-4 mt-4">
          <h3 className="font-medium text-gray-900 mb-3">AI 角色配置</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              角色类型
            </label>
            <select
              value={aiRole}
              onChange={(e) => setAiRole(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="doctor">医生</option>
              <option value="nurse">护士</option>
              <option value="pharmacist">药剂师</option>
              <option value="patient">患者</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              性格特征
            </label>
            <input
              type="text"
              value={aiPersonality}
              onChange={(e) => setAiPersonality(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例如：严肃、专业、随和"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              对话提示词 (Prompt)
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={5}
              placeholder="输入给 AI 的指令，例如：'当医药代表提到价格时，表示关注但不要立即拒绝...'"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <button
          onClick={handleSave}
          className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Save className="w-4 h-4 mr-2" />
          保存配置
        </button>
      </div>
    </div>
  );
}