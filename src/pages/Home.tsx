import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Bot, Sparkles, BookOpen, Users } from 'lucide-react';

export default function Home() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-100">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mb-6 md:mb-0 md:mr-8 max-w-lg">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              欢迎回来，{user?.name}
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              这里是您的专属 AI 陪练平台。通过真实的场景模拟，提升您的专业沟通技巧与合规意识。
            </p>
            <div className="flex space-x-4">
              <div className="flex items-center text-sm text-gray-500">
                <Sparkles className="w-5 h-5 text-yellow-500 mr-2" />
                <span>智能 AI 对练</span>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <BookOpen className="w-5 h-5 text-blue-500 mr-2" />
                <span>专业话术库</span>
              </div>
            </div>
          </div>
          <div className="relative">
            {/* Using a placeholder image for AI Trainer visualization */}
            <div className="w-64 h-64 bg-blue-50 rounded-full flex items-center justify-center relative overflow-hidden shadow-inner">
               <img 
                 key={Date.now()}
                 src={`https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=A%203D%20scene%20with%20a%20friendly%20white%20robot%20on%20the%20left%20side%20and%20a%20young%20business%20woman%20on%20the%20right%20side%20looking%20at%20a%20smartphone%2C%20blue%20and%20purple%20gradient%20background%2C%20holographic%20data%20charts%20floating%20in%20the%20air%2C%20high%20detail%2C%208k%20resolution%2C%20cinematic%20lighting%2C%20professional%20medical%20training%20context&image_size=square&v=${Date.now()}`}
                 alt="AI Trainer" 
                 className="w-full h-full object-cover"
               />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition">
          <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <Bot className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">情景演练</h3>
          <p className="text-gray-500 text-sm">
            参与由 AI 驱动的真实医生拜访场景，应对各种突发异议。
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition">
          <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">科室会演练</h3>
          <p className="text-gray-500 text-sm">
            由AI扮演不同科室的医生或药剂师，在科室会上进行提问。
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition">
          <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <BookOpen className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">话术学习</h3>
          <p className="text-gray-500 text-sm">
            学习最新的产品知识和合规话术，随时随地充电。
          </p>
        </div>
      </div>
    </div>
  );
}
