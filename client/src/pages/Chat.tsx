import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../contexts/ApiContext';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export const Chat: React.FC = () => {
  const { post } = useApi();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm Kaji, your AI security assistant. I can help you with ChromeOS vulnerabilities, exploits, and security research. What would you like to know?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await post('/ai/chat', {
        message: inputMessage,
        context: 'chromeos_security'
      });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.response || 'I apologize, but I encountered an error. Please try again.',
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'I apologize, but I encountered an error. Please try again later.',
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">🤖 Chat with Kaji</h1>
              <p className="text-gray-600">AI-powered ChromeOS security assistant</p>
            </div>
            <Link
              to="/"
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              ← Back to home
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 h-96 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.isUser
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.isUser ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="animate-pulse">🤔</div>
                    <span className="text-sm">Kaji is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about ChromeOS vulnerabilities..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </form>
        </div>

        {/* Example questions */}
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Try asking:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              "What are the latest ChromeOS vulnerabilities?",
              "How do I check for security updates?",
              "What is the most critical ChromeOS exploit?",
              "How can I secure my ChromeOS device?"
            ].map((question, index) => (
              <button
                key={index}
                onClick={() => setInputMessage(question)}
                className="text-left p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
