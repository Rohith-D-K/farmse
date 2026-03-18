import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, User, Package, ChevronRight, Loader2, Search } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

export const ChatList: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [chats, setChats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user) return;

    const fetchChats = async () => {
      try {
        const userChats = await api.chats.getUserChats(user.id);
        setChats(userChats);
      } catch (error) {
        console.error('Failed to fetch user chats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChats();
  }, [user]);

  const filteredChats = chats.filter(chat =>
    chat.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.farmerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.buyerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('chat.messages')}</h1>
          <p className="text-sm text-gray-500">Chat with farmers and buyers</p>
        </div>
        <div className="bg-green-100 p-2 rounded-xl">
          <MessageSquare className="w-6 h-6 text-green-700" />
        </div>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder={t('chat.search_chats')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all shadow-sm"
        />
      </div>

      <div className="space-y-3">
        {filteredChats.length > 0 ? (
          filteredChats.map((chat) => {
            const isFarmer = user?.id === chat.farmerId;
            const otherName = isFarmer ? chat.buyerName : chat.farmerName;

            return (
              <button
                key={chat.id}
                onClick={() => navigate(`/chat/${chat.id}`)}
                className="w-full bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4 hover:border-green-300 hover:shadow-md transition-all group text-left"
              >
                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-700 group-hover:bg-green-600 group-hover:text-white transition-colors">
                  <User className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className="font-bold text-gray-900 truncate">{otherName}</h3>
                    <span className="text-[10px] text-gray-400">
                      {new Date(chat.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <Package className="w-3.5 h-3.5" />
                    <span className="truncate">{chat.productName}</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-green-600 transition-colors" />
              </button>
            );
          })
        ) : (
          <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200">
            <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">{t('chat.no_chats')}</h3>
            <p className="text-sm text-gray-500 max-w-xs mx-auto mt-1">
              {t('chat.start_chatting')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
