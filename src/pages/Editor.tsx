import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Connection,
  Edge,
  Node,
  ReactFlowInstance,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Save, Loader2, ArrowLeft, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

import CustomNode from '../components/CustomNode';
import NodeConfigPanel from '../components/NodeConfigPanel';

const nodeTypes = {
  opening: CustomNode,
  info: CustomNode,
  objection: CustomNode,
  compliance: CustomNode,
};

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

let id = 0;
const getId = () => `dndnode_${id++}`;

export default function Editor() {
  const { id: workflowId } = useParams();
  const navigate = useNavigate();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workflow, setWorkflow] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const [workflowTitle, setWorkflowTitle] = useState('');
  const [workflowDesc, setWorkflowDesc] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  useEffect(() => {
    fetchWorkflow();
  }, [workflowId]);

  const fetchWorkflow = async () => {
    try {
      const res = await fetch(`/api/workflows/${workflowId}`);
      if (!res.ok) throw new Error('Failed to fetch workflow');
      const data = await res.json();
      setWorkflow(data);
      setWorkflowTitle(data.title);
      setWorkflowDesc(data.description || '');
      
      if (data.flow_data && data.flow_data.nodes) {
        setNodes(data.flow_data.nodes || []);
        setEdges(data.flow_data.edges || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const updateNode = useCallback((nodeId: string, data: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, ...data } };
        }
        return node;
      })
    );
    // Update selected node to reflect changes immediately
    setSelectedNode((prev) => (prev?.id === nodeId ? { ...prev, data: { ...prev.data, ...data } } : prev));
  }, [setNodes]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) {
        return;
      }

      const type = event.dataTransfer.getData('application/reactflow');

      // check if the dropped element is valid
      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      
      const newNode: Node = {
        id: getId(),
        type,
        position,
        data: { label: `${type} node`, nodeType: type },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const saveWorkflow = async () => {
    if (!reactFlowInstance) return;
    
    // Check if workflow is empty
    const nodes = reactFlowInstance.getNodes();
    if (nodes.length === 0) {
      alert('无法保存空工作流，请至少添加一个节点');
      return;
    }

    setSaving(true);
    
    const flowData = reactFlowInstance.toObject();
    
    try {
      const res = await fetch(`/api/workflows/${workflowId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: workflowTitle,
          description: workflowDesc,
          flow_data: flowData,
        }),
      });
      
      if (!res.ok) throw new Error('Failed to save workflow');
      
      // Directly navigate back to dashboard
      navigate('/dashboard');
      
    } catch (error) {
      console.error(error);
      alert('保存失败，请重试');
      setSaving(false);
    } 
    // finally block removed to avoid setting state after navigation if user chooses to leave
  };

  const handleCancel = async () => {
    // Explicitly navigate away without saving
    // Using window.confirm is synchronous and blocks execution
    if (window.confirm('确定要取消编辑并返回列表吗？未保存的更改将会丢失。')) {
      // Prevent any potential state updates that might trigger effects
      setSaving(false);
      
      // Check if this is a newly created empty workflow (no nodes)
      // If so, delete it to clean up
      if (nodes.length === 0 && workflowId) {
         try {
           await fetch(`/api/workflows/${workflowId}`, { method: 'DELETE' });
         } catch (e) {
           console.error('Failed to cleanup empty workflow', e);
         }
      }

      navigate('/dashboard', { replace: true });
    }
  };

  if (loading) return <div className="p-8 text-center">加载中...</div>;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center">
            <button onClick={handleCancel} className="mr-4 text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col flex-1 max-w-7xl">
              <input 
                type="text" 
                value={workflowTitle} 
                onChange={(e) => setWorkflowTitle(e.target.value)}
                className="text-xl font-bold text-gray-800 border border-transparent focus:border-blue-300 focus:ring-0 px-2 py-1 bg-transparent hover:bg-gray-50 rounded transition-colors w-full"
                placeholder="工作流名称"
              />
              <textarea 
                value={workflowDesc} 
                onChange={(e) => {
                  setWorkflowDesc(e.target.value);
                  // Auto-resize
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                className="text-sm text-gray-500 border border-transparent focus:border-blue-300 focus:ring-0 px-2 py-1 bg-transparent hover:bg-gray-50 rounded resize-none transition-colors mt-1 overflow-hidden w-full"
                placeholder="添加描述..."
                rows={1}
                style={{ minHeight: '1.5em' }}
                onFocus={(e) => {
                   e.target.style.height = 'auto';
                   e.target.style.height = e.target.scrollHeight + 'px';
                }}
              />
            </div>
          </div>
        <div className="flex space-x-3">
          <Link
            to={`/preview/${workflowId}`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
          >
            <Play className="w-4 h-4 mr-2" />
            预览
          </Link>
          <button
            onClick={handleCancel}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={saveWorkflow}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-blue-700 bg-blue-100 hover:bg-blue-200 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 bg-white border-r border-gray-200 p-4 shadow-sm z-10 flex flex-col">
          <h2 className="font-semibold mb-4 text-gray-700">节点库</h2>
          <div className="space-y-3">
            <div
              className="p-3 bg-blue-50 border border-blue-200 rounded shadow-sm cursor-move hover:shadow-md transition text-blue-800 font-medium text-sm flex items-center"
              onDragStart={(event) => onDragStart(event, 'opening')}
              draggable
            >
              <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
              开场节点
            </div>
            <div
              className="p-3 bg-green-50 border border-green-200 rounded shadow-sm cursor-move hover:shadow-md transition text-green-800 font-medium text-sm flex items-center"
              onDragStart={(event) => onDragStart(event, 'info')}
              draggable
            >
              <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
              信息传递
            </div>
            <div
              className="p-3 bg-orange-50 border border-orange-200 rounded shadow-sm cursor-move hover:shadow-md transition text-orange-800 font-medium text-sm flex items-center"
              onDragStart={(event) => onDragStart(event, 'objection')}
              draggable
            >
              <div className="w-2 h-2 rounded-full bg-orange-500 mr-2"></div>
              异议处理
            </div>
            <div
              className="p-3 bg-purple-50 border border-purple-200 rounded shadow-sm cursor-move hover:shadow-md transition text-purple-800 font-medium text-sm flex items-center"
              onDragStart={(event) => onDragStart(event, 'compliance')}
              draggable
            >
              <div className="w-2 h-2 rounded-full bg-purple-500 mr-2"></div>
              合规检测
            </div>
          </div>
          <div className="mt-auto text-xs text-gray-400">
            拖拽节点到画布中以添加
          </div>
        </div>
        
        <div className="flex-1 bg-gray-50 relative" ref={reactFlowWrapper}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              nodeTypes={nodeTypes}
              fitView
            >
              <Controls />
              <Background />
              <Panel position="top-right" className="bg-white p-2 rounded shadow-sm text-xs text-gray-500">
                支持拖拽、缩放、连接节点
              </Panel>
            </ReactFlow>
          </ReactFlowProvider>
        </div>
        
        <div className="w-80 bg-white border-l border-gray-200 p-4 shadow-sm z-10 overflow-y-auto">
          <NodeConfigPanel
            selectedNode={selectedNode}
            onUpdateNode={updateNode}
            onClose={() => setSelectedNode(null)}
          />
        </div>
      </div>
    </div>
  );
}