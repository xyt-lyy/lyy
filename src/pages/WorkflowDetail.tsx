import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Edit, Calendar, User, FileText } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

interface Workflow {
  id: string;
  title: string;
  description: string;
  updated_at: string;
  user_id: string;
  // Add other fields as needed
}

export default function WorkflowDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkflow();
  }, [id]);

  const fetchWorkflow = async () => {
    try {
      const res = await fetch(`/api/workflows/${id}`);
      if (!res.ok) throw new Error('Failed to fetch workflow');
      const data = await res.json();
      setWorkflow(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">加载中...</div>;

  if (!workflow) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">工作流未找到</p>
        <Link to="/dashboard" className="text-blue-600 hover:underline mt-4 inline-block">
          返回列表
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4 mb-6">
        <button 
          onClick={() => navigate('/dashboard')} 
          className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">工作流详情</h1>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        <div className="px-6 py-8">
          <div className="flex justify-between items-start">
            <div className="space-y-4 flex-1 mr-8">
              <h2 className="text-3xl font-bold text-gray-900">{workflow.title}</h2>
              <div className="flex items-center text-sm text-gray-500 space-x-6">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  <span>创建者ID: {workflow.user_id}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>更新时间: {new Date(workflow.updated_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col space-y-3">
              <Link
                to={`/preview/${workflow.id}`}
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                <Play className="w-5 h-5 mr-2" />
                开始演练
              </Link>
              {user?.role === 'trainer' && (
                <Link
                  to={`/editor/${workflow.id}`}
                  className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Edit className="w-5 h-5 mr-2" />
                  编辑工作流
                </Link>
              )}
            </div>
          </div>

          <div className="mt-8 border-t border-gray-100 pt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-gray-400" />
              工作流描述
            </h3>
            <div className="bg-gray-50 rounded-lg p-6 text-gray-700 leading-relaxed whitespace-pre-wrap">
              {workflow.description || '暂无描述'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
