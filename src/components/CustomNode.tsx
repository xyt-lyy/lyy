import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { MessageSquare, FileText, AlertTriangle, ShieldCheck } from 'lucide-react';

const NodeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'opening':
      return <MessageSquare className="w-4 h-4 text-blue-500" />;
    case 'info':
      return <FileText className="w-4 h-4 text-green-500" />;
    case 'objection':
      return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    case 'compliance':
      return <ShieldCheck className="w-4 h-4 text-purple-500" />;
    default:
      return <MessageSquare className="w-4 h-4 text-gray-500" />;
  }
};

const NodeLabel = ({ type }: { type: string }) => {
  switch (type) {
    case 'opening':
      return '开场节点';
    case 'info':
      return '信息传递';
    case 'objection':
      return '异议处理';
    case 'compliance':
      return '合规检测';
    default:
      return '未知节点';
  }
};

const CustomNode = ({ data, type, selected }: NodeProps) => {
  return (
    <div
      className={`px-4 py-2 shadow-md rounded-md bg-white border-2 w-48 ${
        selected ? 'border-blue-500' : 'border-gray-200'
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-gray-400" />
      
      <div className="flex items-center">
        <div className="rounded-full bg-gray-100 p-2 mr-3">
          <NodeIcon type={data.nodeType || type} />
        </div>
        <div>
          <div className="text-sm font-bold text-gray-700">
            {data.label || <NodeLabel type={data.nodeType || type} />}
          </div>
          <div className="text-xs text-gray-500 line-clamp-3 break-words whitespace-pre-wrap">
            {data.description || '配置节点详情'}
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-gray-400" />
    </div>
  );
};

export default memo(CustomNode);