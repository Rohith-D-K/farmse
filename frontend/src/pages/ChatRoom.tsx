import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { Send, ArrowLeft, User, Package, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const API_URL = import.meta.env.VITE_API_URL === undefined ? 'http://localhost:3000' : import.meta.env.VITE_API_URL;

interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  createdAt: string;
}

export const ChatRoom: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);
  const [otherUser, setOtherUser] = useState<any>(null);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!chatId || !user) return;

    const fetchData = async () => {
      try {
        const allChats = await api.chats.getUserChats(user.id);
        const currentChat = allChats.find((c: any) => c.id === chatId);

        if (currentChat) {
          const prod = await api.products.getById(currentChat.productId);
          setProduct(prod);

          const otherId = user.id === currentChat.buyerId ? currentChat.farmerId : currentChat.buyerId;
          setOtherUser({
            id: otherId,
            name: user.id === currentChat.buyerId ? currentChat.farmerName : currentChat.buyerName
          });
        }

        const msgs = await api.chats.getMessages(chatId);
        setMessages(msgs);
      } catch (error) {
        console.error('Failed to fetch chat data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    socketRef.current = io(API_URL, {
      withCredentials: true
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to socket server');
      socketRef.current?.emit('join_chat', chatId);
    });

    socketRef.current.on('new_message', (message: Message) => {
      if (message.chatId === chatId) {
        setMessages(prev => {
          // Deduplicate: skip if we already have this message (from optimistic update or prior event)
          if (prev.some(m => m.id === message.id)) return prev;
          return [...prev, message];
        });
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [chatId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || !chatId || !user) return;

    const text = inputValue.trim();
    setInputValue('');

    // Optimistic update: show the message immediately
    const tempId = 'temp-' + Date.now();
    const optimisticMsg: Message = {
      id: tempId,
      chatId,
      senderId: user.id,
      text,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const sentMessage = await api.chats.sendMessage(chatId, {
        senderId: user.id,
        text: text
      });
      // Replace temp message with the real one from server
      setMessages(prev => prev.map(m => m.id === tempId ? sentMessage : m));
    } catch (error) {
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(m => m.id !== tempId));
      console.error('Failed to send message:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] md:h-[calc(100vh-8rem)] bg-gray-50 -mx-4 -mt-4 md:mx-0 md:mt-0 md:rounded-2xl md:border md:border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 leading-tight">{otherUser?.name || 'Chat'}</h2>
            {product && (
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                <Package className="w-3 h-3" />
                <span>Re: {t(`crops.${product.cropName}`, {defaultValue: product.cropName})}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isOwn = msg.senderId === user?.id;
          return (
            <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] p-3 rounded-2xl shadow-sm ${isOwn
                ? 'bg-green-600 text-white rounded-tr-none'
                : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                }`}>
                <p className="text-sm leading-relaxed">{msg.text}</p>
                <span className="text-[10px] mt-1 block opacity-60 text-right">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-3 md:p-4">
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t('chat.type_message')}
            className="flex-1 p-3 bg-gray-100 border-none rounded-2xl text-sm focus:ring-2 focus:ring-green-500 focus:bg-white transition-all shadow-inner"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="p-3 bg-green-600 text-white rounded-2xl shadow-lg shadow-green-600/20 active:scale-95 disabled:opacity-50 transition-all hover:bg-green-700"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
