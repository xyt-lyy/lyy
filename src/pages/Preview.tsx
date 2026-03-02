import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Send, RotateCcw, MessageSquare } from 'lucide-react';
import { Edge, Node } from 'reactflow';

interface WorkflowData {
  nodes: Node[];
  edges: Edge[];
}

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
}

export default function Preview() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [workflowData, setWorkflowData] = useState<WorkflowData | null>(null);
  const [currentNode, setCurrentNode] = useState<Node | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [options, setOptions] = useState<Node[]>([]);
  const [gameOver, setGameOver] = useState(false);
  
  // AI Interaction State
  const [inputText, setInputText] = useState('');
  const [isAiResponding, setIsAiResponding] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchWorkflow();
  }, [id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchWorkflow = async () => {
    try {
      const res = await fetch(`/api/workflows/${id}`);
      if (!res.ok) throw new Error('Failed to fetch workflow');
      const data = await res.json();
      
      if (data.flow_data && data.flow_data.nodes) {
        const nodes = data.flow_data.nodes;
        const edges = data.flow_data.edges;
        setWorkflowData({ nodes, edges });
        
        // Don't auto-start conversation to show empty state first
        // Just set the initial node for context
        const startNode = nodes.find((n: Node) => (n.data?.nodeType === 'opening' || n.type === 'opening')) || nodes[0];
        if (startNode) {
          setCurrentNode(startNode);
          // addAiMessage(startNode); // Removed to prevent auto-start
          // updateOptions(startNode, nodes, edges); // Removed
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const addAiMessage = (node: Node, customText?: string) => {
    // Only show custom AI responses (from chat), not the initial node description
    if (!customText) return;

    const aiRole = node.data?.aiRole || node.data?.aiConfig?.roleName || 'doctor';
    const roleName = getRoleName(aiRole);
    
    // Check if the message starts with [系统] or [场景], if so, keep it as is or handle specially
    if (customText.startsWith('[系统]') || customText.startsWith('[场景]')) {
         setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: 'ai',
            text: customText,
          },
        ]);
        return;
    }

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: 'ai',
        text: `[${roleName}] ${customText}`,
      },
    ]);
  };

  const getRoleName = (role: string) => {
    const roles: Record<string, string> = {
      doctor: '医生',
      nurse: '护士',
      pharmacist: '药剂师',
      patient: '患者',
    };
    return roles[role] || '医生';
  };

  const updateOptions = (current: Node, nodes: Node[], edges: Edge[]) => {
    const outgoingEdges = edges.filter((e) => e.source === current.id);
    const nextNodes = outgoingEdges.map((e) => nodes.find((n) => n.id === e.target)).filter(Boolean) as Node[];
    
    setOptions(nextNodes);
    
    if (nextNodes.length === 0) {
      setGameOver(true);
    } else {
      setGameOver(false);
    }
  };

  const handleOptionClick = (nextNode: Node) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: 'user',
        text: nextNode.data.label || '（用户选择了此路径）',
      },
    ]);

    transitionToNode(nextNode);
  };

  const handleAutoTransition = (nextNode: Node) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: 'ai',
        text: `[系统] 检测到话题转换，自动进入下一环节：${nextNode.data.label}`,
      },
    ]);
    
    transitionToNode(nextNode);
  };

  const transitionToNode = (nextNode: Node) => {
    setTimeout(() => {
      setCurrentNode(nextNode);
      addAiMessage(nextNode);
      if (workflowData) {
        updateOptions(nextNode, workflowData.nodes, workflowData.edges);
      }
    }, 500);
  };

  const handleAiChat = async () => {
    if (!inputText.trim() || !currentNode) return;

    const userMsg = inputText;
    setInputText('');
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), sender: 'user', text: userMsg },
    ]);
    setIsAiResponding(true);

    try {
      const prompt = currentNode.data?.prompt || currentNode.data?.aiConfig?.prompt;
      const role = currentNode.data?.aiRole || currentNode.data?.aiConfig?.roleName || 'doctor';
      const personality = currentNode.data?.aiPersonality || currentNode.data?.aiConfig?.personality || '正常';

      // Prepare next nodes for AI context
      const nextNodes = options.map((n: any) => ({
        id: n.id,
        label: n.data.label,
        description: n.data.description
      }));

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.map(m => ({
            role: m.sender === 'ai' ? 'assistant' : 'user',
            content: m.text.replace(/^\[.*?\] /, '') // Remove role prefix for AI context
          })).concat({ role: 'user', content: userMsg }),
          systemPrompt: prompt || `你现在扮演一位${getRoleName(role)}。你的性格是${personality}。请根据用户的输入进行自然对话。`,
          nextNodes: nextNodes,
        }),
      });

      if (!response.ok) throw new Error('AI request failed');
      const data = await response.json();
      
      addAiMessage(currentNode, data.content);

      // Handle auto-transition if suggested by AI
      if (data.nextNodeId) {
        // Need to use the *current* options from state, or the ones we captured.
        // Actually `options` is from state, so it might be stale in closure?
        // But options are updated when node changes.
        // However, inside this async function, `options` refers to the value at render time.
        // It should be fine as long as options haven't changed during the request (which they shouldn't).
        
        // Find the node in the `options` array we used for the request
        const nextNode = options.find((n: Node) => n.id === data.nextNodeId);
        
        if (nextNode) {
             // Use a timeout to simulate a natural pause before switching
             setTimeout(() => {
                 handleAutoTransition(nextNode);
             }, 1500);
        }
      }

    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), sender: 'ai', text: '[系统] AI 服务暂时不可用，请检查 API Key 配置。' },
      ]);
    } finally {
      setIsAiResponding(false);
    }
  };

  const handleRestart = () => {
    setMessages([]);
    setGameOver(false);
    setInputText('');
    setOptions([]); // Reset options
    
    // Trigger start logic (empty state will show first)
    // If we want to allow "Restart" button to actually restart the flow (skip empty state),
    // we should call startConversation() here?
    // User requested "Start Practice" button fix.
    // If this function is called by "Start Practice" button (which it is currently NOT, startConversation is),
    // then this is for the top-right restart button.
  };

  const startConversation = () => {
    setGameOver(false);
    if (workflowData) {
      const startNode = workflowData.nodes.find((n: Node) => (n.data?.nodeType === 'opening' || n.type === 'opening')) || workflowData.nodes[0];
      if (startNode) {
        setCurrentNode(startNode);
        
        // Add initial AI message ONLY if content is not empty
        // For opening node in pharma scenario, usually the user speaks first.
        // If content is empty, we show a system hint instead of an AI message.
        let text = startNode.data?.content;

        // Compatibility fix: If the content is the old default (Doctor speaking first), treat it as empty
        // so we show the scene description instead.
        if (text === '（抬头看了一眼）请进。你是哪家公司的？这个时候过来找我有什么事吗？') {
          text = '';
        }
        
        if (text) {
          const aiRole = startNode.data?.aiRole || startNode.data?.aiConfig?.roleName || 'doctor';
          const roleName = getRoleName(aiRole);
          setMessages([
            {
              id: Date.now().toString(),
              sender: 'ai',
              text: `[${roleName}] ${text}`,
            },
          ]);
        } else {
          // If no AI content, show a system hint or just let user start
          const description = startNode.data?.description || '请开始您的对话...';
          setMessages([
            {
              id: Date.now().toString(),
              sender: 'ai',
              text: `[场景] ${description}`,
            },
          ]);
        }
        
        updateOptions(startNode, workflowData.nodes, workflowData.edges);
      }
    }
  };

  // Initial load effect - don't auto start anymore to show empty state first?
  // Or if we want empty state only when no messages, we should NOT auto-add message in fetchWorkflow.
  // Let's check fetchWorkflow.

  // Determine if current node supports AI chat (e.g. objection nodes or configured with prompts)
  const nodeType = currentNode?.data?.nodeType || currentNode?.type;
  // const prompt = currentNode?.data?.prompt || currentNode?.data?.aiConfig?.prompt;
  // const isAiChatEnabled = ['opening', 'objection'].includes(nodeType) || (prompt && prompt.length > 0);
  // Simplify: Allow chat in all nodes unless game over, to prevent blocking
  const isAiChatEnabled = true;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!workflowData || !currentNode) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        工作流数据无效或为空
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg overflow-hidden h-[80vh] flex flex-col relative">
        <div className="bg-blue-600 p-4 text-white flex justify-between items-center relative">
          <h1 className="text-lg font-bold">演练预览</h1>
          
          <div className="absolute left-1/2 transform -translate-x-1/2">
             {options.length > 0 && (
              <button 
                onClick={() => handleOptionClick(options[0])}
                className="bg-blue-500 hover:bg-blue-400 text-white text-xs px-4 py-1.5 rounded-full flex items-center transition-colors shadow-sm"
              >
                <span>下一环节: {options[0].data.label}</span>
                <Send className="w-3 h-3 ml-1" />
              </button>
            )}
          </div>

          <button onClick={handleRestart} className="hover:bg-blue-700 p-1 rounded z-10" title="重新开始">
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50" ref={scrollRef}>
          {/* Empty State Overlay */}
          {messages.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 bg-opacity-90 z-10">
              <div className="bg-white p-6 rounded-xl shadow-sm text-center max-w-xs mx-auto">
                 <div className="bg-blue-100 p-4 rounded-full mb-4 inline-block">
                  <MessageSquare className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-800 mb-2">准备开始演练</h2>
                <p className="text-gray-500 mb-6 text-sm">
                  点击下方按钮开始与 AI 角色进行模拟对话。
                </p>
                <button
                  onClick={startConversation}
                  className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  开始演练
                </button>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg text-sm shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isAiResponding && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-500 p-3 rounded-lg rounded-bl-none text-sm border border-gray-200 flex items-center">
                <Loader2 className="w-3 h-3 animate-spin mr-2" />
                正在输入...
              </div>
            </div>
          )}
          {gameOver && (
            <div className="text-center text-gray-500 text-sm my-4">
              —— 演练结束 ——
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-200 bg-white space-y-3">
          {/* AI Chat Input Area */}
          {/* Debug Info: {isAiChatEnabled ? 'Enabled' : 'Disabled'} | GameOver: {gameOver ? 'Yes' : 'No'} | Node: {currentNode?.id} */}
          {isAiChatEnabled && !gameOver ? (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAiChat()}
                placeholder="输入回复与 AI 对话..."
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isAiResponding}
              />
              <button
                onClick={handleAiChat}
                disabled={!inputText.trim() || isAiResponding}
                className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          ) : (
             <div className="text-center text-sm text-gray-500">
                {gameOver ? '演练已结束' : '当前环节不支持对话'}
             </div>
          )}

          {/* Navigation Options - Hidden for cleaner UI */}
          {/* {options.length > 0 ? (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              {options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleOptionClick(option)}
                  className="w-full text-left p-3 border border-gray-300 rounded hover:bg-gray-50 hover:border-blue-400 transition text-sm flex items-center justify-between group"
                >
                  <span>{option.data.label}</span>
                  <MessageSquare className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                </button>
              ))}
            </div>
          ) : (
            <button
              onClick={handleRestart}
              className="w-full py-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 text-sm"
            >
              重新开始
            </button>
          )} */}
          
          {/* Hidden debug options/controls if needed, otherwise this space is clean for input only */}
        </div>
      </div>
    </div>
  );
}