import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Plus, Play, Edit, Trash2, FileInput, X } from 'lucide-react';
import { DEMO_WORKFLOW } from '../data/demoWorkflow';

interface Workflow {
  id: string;
  title: string;
  description: string;
  updated_at: string;
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWorkflowTitle, setNewWorkflowTitle] = useState('');
  const [newWorkflowDesc, setNewWorkflowDesc] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const res = await fetch('/api/workflows');
      if (!res.ok) throw new Error('Failed to fetch workflows');
      const data = await res.json();
      setWorkflows(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const createWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkflowTitle.trim()) return;

    try {
      const res = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newWorkflowTitle,
          description: newWorkflowDesc,
          user_id: user?.id,
          flow_data: {},
        }),
      });

      if (!res.ok) throw new Error('Failed to create workflow');
      const newWorkflow = await res.json();
      setIsModalOpen(false);
      navigate(`/editor/${newWorkflow.id}`);
    } catch (error) {
      console.error(error);
    }
  };

  const createDemoWorkflow = async () => {
    try {
      const res = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: DEMO_WORKFLOW.title,
          description: DEMO_WORKFLOW.description,
          user_id: user?.id,
          flow_data: DEMO_WORKFLOW.flow_data,
        }),
      });

      if (!res.ok) throw new Error('Failed to create demo workflow');
      const newWorkflow = await res.json();
      setWorkflows([newWorkflow, ...workflows]);
    } catch (error) {
      console.error(error);
      alert('创建示例失败');
    }
  };

  const deleteWorkflow = async (id: string) => {
    if (!window.confirm('确定要删除这个工作流吗？')) return;
    try {
      const res = await fetch(`/api/workflows/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete workflow');
      setWorkflows(workflows.filter((w) => w.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  const handleCardClick = (id: string) => {
    // Navigate to detail page instead of preview
    navigate(`/workflows/${id}`);
  };

  if (loading) return <div className="p-8 text-center">加载中...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">工作流列表</h1>
        {user?.role === 'trainer' && (
          <div className="flex space-x-3">
            <button
              onClick={createDemoWorkflow}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
            >
              <FileInput className="h-5 w-5 mr-2" />
              导入示例模板
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              新建工作流
            </button>
          </div>
        )}
      </div>

      {/* Create Workflow Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">新建工作流</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={createWorkflow}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    名称
                  </label>
                  <input
                    type="text"
                    id="title"
                    required
                    value={newWorkflowTitle}
                    onChange={(e) => setNewWorkflowTitle(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="请输入工作流名称"
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    描述
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    value={newWorkflowDesc}
                    onChange={(e) => setNewWorkflowDesc(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="请输入工作流描述（可选）"
                  />
                </div>
              </div>
              <div className="mt-5 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {workflows.map((workflow) => (
          <div
            key={workflow.id}
            className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 hover:shadow-md transition cursor-pointer group"
            onClick={() => handleCardClick(workflow.id)}
          >
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 truncate group-hover:text-blue-600">
                {workflow.title}
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500 line-clamp-2">
                {workflow.description}
              </p>
              <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                <span>
                  更新时间: {new Date(workflow.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-4 sm:px-6 flex justify-end space-x-3" onClick={(e) => e.stopPropagation()}>
              <Link
                to={`/preview/${workflow.id}`}
                className="text-gray-600 hover:text-blue-600"
                title="预览"
              >
                <Play className="h-5 w-5" />
              </Link>
              {user?.role === 'trainer' && (
                <>
                  <Link
                    to={`/editor/${workflow.id}`}
                    className="text-gray-600 hover:text-blue-600"
                    title="编辑"
                  >
                    <Edit className="h-5 w-5" />
                  </Link>
                  <button
                    onClick={() => deleteWorkflow(workflow.id)}
                    className="text-gray-600 hover:text-red-600"
                    title="删除"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {workflows.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500 mb-4">暂无工作流</p>
          {user?.role === 'trainer' && (
             <button
               onClick={createDemoWorkflow}
               className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
             >
               导入示例模板开始
             </button>
          )}
        </div>
      )}
    </div>
  );
}