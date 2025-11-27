import { useState, useRef, useEffect } from 'react';
import { messagesApi } from '../api/messages';
import { MessageCircle, X, Send, Sparkles, List } from 'lucide-react';

interface ChatMessage {
  type: 'user' | 'bot';
  text: string;
  questionNumber?: number;
  suggestions?: Array<{ id: string; name: string; priceLabel: string }>;
  timestamp: Date;
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [showQuestionList, setShowQuestionList] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    const newQuestionNumber = questionCount + 1;
    
    setMessages((prev) => [...prev, { 
      type: 'user', 
      text: userMessage,
      questionNumber: newQuestionNumber,
      timestamp: new Date()
    }]);
    setInput('');
    setLoading(true);
    setQuestionCount(newQuestionNumber);

    try {
      const response = await messagesApi.chatbot(userMessage);
      const botReply = response.data.reply || 'I found some services for you!';
      const suggestions = response.data.suggestions || [];
      
      setMessages((prev) => [...prev, { 
        type: 'bot', 
        text: botReply,
        suggestions: suggestions,
        timestamp: new Date()
      }]);
    } catch {
      setMessages((prev) => [...prev, { 
        type: 'bot', 
        text: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const userQuestions = messages.filter(m => m.type === 'user');

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-blue-600 text-white rounded-full shadow-2xl hover:bg-blue-700 transition-all transform hover:scale-110 flex items-center justify-center z-50 animate-bounce"
        >
          <MessageCircle className="w-8 h-8" />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[28rem] bg-white rounded-3xl shadow-2xl overflow-hidden z-50 border border-gray-100">
          {/* Header */}
          <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 text-white p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg">AI Assistant</h3>
                <p className="text-xs text-white/80">Ask me anything!</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {userQuestions.length > 0 && (
                <button 
                  onClick={() => setShowQuestionList(!showQuestionList)}
                  className="hover:bg-white/20 rounded-full p-2 transition"
                  title="View all questions"
                >
                  <List className="w-5 h-5" />
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 rounded-full p-2 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Question List Sidebar */}
          {showQuestionList && userQuestions.length > 0 && (
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-4 border-b">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <List className="w-4 h-4" />
                Your Questions ({userQuestions.length})
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {userQuestions.map((q, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-2 shadow-sm">
                    <span className="text-xs font-bold text-purple-600">Q{q.questionNumber}:</span>
                    <p className="text-xs text-gray-700 line-clamp-2">{q.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="h-96 overflow-y-auto p-4 space-y-4 bg-gradient-to-br from-gray-50 to-blue-50/30">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-12 px-4">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-10 h-10 text-purple-600" />
                </div>
                <p className="text-lg font-bold text-gray-800 mb-2">👋 Hello! I'm your LocalSewa AI Assistant</p>
                <p className="text-sm text-gray-600 mb-4">I can help you find the perfect service provider in Kathmandu!</p>
                <div className="bg-white rounded-xl p-4 text-left space-y-2 max-w-xs mx-auto border border-purple-100">
                  <p className="text-xs font-semibold text-purple-600 mb-2">Try asking:</p>
                  <p className="text-xs text-gray-700">💡 "I need a plumber"</p>
                  <p className="text-xs text-gray-700">💰 "Electrician under 2000"</p>
                  <p className="text-xs text-gray-700">📍 "Cleaning service in Tinkune"</p>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                    {message.type === 'user' && message.questionNumber && (
                      <div className="text-xs text-purple-600 font-bold mb-1 text-right">
                        Question #{message.questionNumber}
                      </div>
                    )}
                    <div
                      className={`px-4 py-3 rounded-2xl shadow-md ${
                        message.type === 'user'
                          ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-tr-sm'
                          : 'bg-white text-gray-800 rounded-tl-sm border border-gray-100'
                      }`}
                    >
                      <div className="text-sm leading-relaxed whitespace-pre-line">
                        {message.text.split('**').map((part, idx) => 
                          idx % 2 === 0 ? part : <strong key={idx} className="font-bold text-purple-600">{part}</strong>
                        )}
                      </div>
                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs font-semibold text-gray-600 mb-2">Suggested Services:</p>
                          {message.suggestions.map((sug, idx) => (
                            <div key={idx} className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-2 border border-purple-100">
                              <p className="text-xs font-semibold text-gray-800">{sug.name}</p>
                              <p className="text-xs text-purple-600">{sug.priceLabel}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-1 px-2">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white px-4 py-3 rounded-2xl shadow-md border border-gray-100">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                placeholder="Type your question..."
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="px-5 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            {questionCount > 0 && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                {questionCount} question{questionCount > 1 ? 's' : ''} asked
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
