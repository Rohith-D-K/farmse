import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, Send, X, Mic, MicOff, Volume2, VolumeOff, Bot, Loader2, Square } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

interface Message {
  id: string;
  text: string;
  sender: 'bot' | 'user';
  timestamp: Date;
  suggestions?: string[];
}

const LANG_MAP: Record<string, string> = {
  en: 'en-US', ta: 'ta-IN', hi: 'hi-IN', te: 'te-IN', kn: 'kn-IN',
};

const INITIAL_SUGGESTIONS: Record<string, string[]> = {
  buyer: ['Available products', 'How to place an order?', 'Delivery options', 'Help'],
  farmer: ['Available products', 'How to add a product?', 'My orders', 'Price suggestions'],
};

export const AIChatbot: React.FC = () => {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const role = user?.role || 'buyer';
  const lang = i18n.language || 'en';
  const speechLang = LANG_MAP[lang] || 'en-US';

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const handleSendRef = useRef<(text?: string) => Promise<void>>();

  // Build welcome message based on role + language
  useEffect(() => {
    const greetings: Record<string, Record<string, string>> = {
      buyer: {
        en: `Hi ${user?.name || 'there'}! I'm your FarmSe shopping assistant. Ask me about crop prices, how to order, or anything about the app!`,
        ta: `வணக்கம் ${user?.name || ''}! நான் உங்கள் FarmSe ஷாப்பிங் உதவியாளர். விலைகள், ஆர்டர் செய்வது பற்றி கேளுங்கள்!`,
        hi: `नमस्ते ${user?.name || ''}! मैं आपका FarmSe शॉपिंग असिस्टेंट हूँ। कीमतों, ऑर्डर करने के बारे में पूछें!`,
        te: `హలో ${user?.name || ''}! నేను మీ FarmSe షాపింగ్ అసిస్టెంట్. ధరలు, ఆర్డర్ గురించి అడగండి!`,
        kn: `ಹಲೋ ${user?.name || ''}! ನಾನು ನಿಮ್ಮ FarmSe ಶಾಪಿಂಗ್ ಸಹಾಯಕ. ಬೆಲೆಗಳು, ಆರ್ಡರ್ ಬಗ್ಗೆ ಕೇಳಿ!`,
      },
      farmer: {
        en: `Hi ${user?.name || 'there'}! I'm your FarmSe selling assistant. Ask me about pricing suggestions, how to list products, or manage orders!`,
        ta: `வணக்கம் ${user?.name || ''}! நான் உங்கள் FarmSe விற்பனை உதவியாளர். விலை ஆலோசனை, பொருள் சேர்ப்பது பற்றி கேளுங்கள்!`,
        hi: `नमस्ते ${user?.name || ''}! मैं आपका FarmSe बेचने का असिस्टेंट हूँ। कीमत सुझाव, प्रोडक्ट जोड़ने के बारे में पूछें!`,
        te: `హలో ${user?.name || ''}! నేను మీ FarmSe అమ్మకపు అసిస్టెంట్. ధర సూచనలు, ఉత్పత్తి జోడించడం గురించి అడగండి!`,
        kn: `ಹಲೋ ${user?.name || ''}! ನಾನು ನಿಮ್ಮ FarmSe ಮಾರಾಟ ಸಹಾಯಕ. ಬೆಲೆ ಸಲಹೆ, ಉತ್ಪನ್ನ ಸೇರಿಸುವ ಬಗ್ಗೆ ಕೇಳಿ!`,
      },
    };
    const roleGreetings = greetings[role] || greetings.buyer;
    setMessages([{
      id: '1',
      text: roleGreetings[lang] || roleGreetings.en,
      sender: 'bot',
      timestamp: new Date(),
    }]);
  }, [user?.name, role, lang]);

  // ── handleSend (stable via ref so speech recognition always calls the latest) ──
  const handleSend = useCallback(async (text?: string) => {
    const msg = (text ?? inputValue).trim();
    if (!msg || isLoading) return;

    setInputValue('');
    setInterimText('');

    const userMessage: Message = {
      id: Date.now().toString(),
      text: msg,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const result = await api.ai.chat(msg, lang, role);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: result.response,
        sender: 'bot',
        timestamp: new Date(),
        suggestions: result.suggestions,
      };
      setMessages(prev => [...prev, botMessage]);
      if (!isMuted) speakText(result.response);
    } catch (error) {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: lang === 'ta' ? 'மன்னிக்கவும், ஏதோ பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.' :
              lang === 'hi' ? 'क्षमा करें, कोई त्रुटि हुई। कृपया फिर से प्रयास करें।' :
              'Sorry, something went wrong. Please try again.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, lang, role, isMuted]);

  // Keep ref in sync so speech callback always has the latest
  useEffect(() => { handleSendRef.current = handleSend; }, [handleSend]);

  // ── Speech Recognition setup ──
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setVoiceSupported(false); return; }
    setVoiceSupported(true);

    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.lang = speechLang;

    rec.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      if (interim) {
        setInterimText(interim);
        setInputValue(interim);
      }
      if (final) {
        setInterimText('');
        setInputValue(final);
        setIsListening(false);
        // Use ref to avoid stale closure
        handleSendRef.current?.(final);
      }
    };

    rec.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      setIsListening(false);
      setInterimText('');
    };

    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;

    return () => {
      try { rec.abort(); } catch { /* ignore */ }
    };
  }, [speechLang]);

  // ── Scroll ──
  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // ── Voice toggle ──
  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInterimText('');
      setInputValue('');
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        // Already started — stop and restart
        recognitionRef.current.stop();
        setTimeout(() => {
          try { recognitionRef.current.start(); setIsListening(true); } catch { /* give up */ }
        }, 200);
      }
    }
  };

  // ── TTS ──
  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const speakText = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const plain = text.replace(/\*\*/g, '').replace(/[•●]/g, ',');
    const utterance = new SpeechSynthesisUtterance(plain);
    utterance.lang = speechLang;
    utterance.rate = 0.95;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  // Get suggestions from the last bot message, or use initial ones
  const lastBotMsg = [...messages].reverse().find(m => m.sender === 'bot');
  const currentSuggestions = lastBotMsg?.suggestions || INITIAL_SUGGESTIONS[role] || INITIAL_SUGGESTIONS.buyer;

  return (
    <div className="fixed bottom-20 right-4 sm:bottom-8 sm:right-8 z-50">
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-[min(340px,calc(100vw-2rem))] sm:w-[400px] h-[min(520px,calc(100vh-10rem))] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">FarmSe Assistant</h3>
                <p className="text-[10px] text-green-100">
                  {role === 'farmer' ? 'Seller Mode' : 'Buyer Mode'} · {isListening ? 'Listening...' : 'Ready'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {isSpeaking && (
                <button
                  onClick={stopSpeaking}
                  title="Stop speaking"
                  className="p-1.5 bg-red-500/80 hover:bg-red-500 rounded-lg transition-colors animate-pulse"
                >
                  <Square className="w-3.5 h-3.5 fill-white text-white" />
                </button>
              )}
              <button
                onClick={() => { setIsMuted(!isMuted); if (!isMuted) stopSpeaking(); }}
                title={isMuted ? 'Unmute Bot' : 'Mute Bot'}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                {isMuted ? <VolumeOff className="w-4 h-4 text-red-200" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 flex flex-col">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${msg.sender === 'user'
                  ? 'bg-green-600 text-white rounded-tr-none shadow-md shadow-green-600/10'
                  : 'bg-white text-gray-800 rounded-tl-none border border-gray-100 shadow-sm'
                  }`}>
                  <div className="flex items-start gap-2">
                    <p className="whitespace-pre-line">{msg.text}</p>
                    {msg.sender === 'bot' && (
                      <button
                        onClick={() => isSpeaking ? stopSpeaking() : speakText(msg.text)}
                        className={`mt-0.5 flex-shrink-0 transition-colors ${isSpeaking ? 'text-red-500 hover:text-red-700' : 'text-gray-400 hover:text-green-600'}`}
                        title={isSpeaking ? 'Stop' : 'Listen'}
                      >
                        {isSpeaking ? <Square className="w-3.5 h-3.5 fill-current" /> : <Volume2 className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                  <span className="text-[9px] mt-1 block opacity-50 text-right">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {/* Suggestion Chips — always visible after bot replies */}
            {!isLoading && currentSuggestions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200/50">
                <p className="w-full text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-1">Tap to ask</p>
                {currentSuggestions.map((s: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => handleSend(s)}
                    className="text-[11px] bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full hover:border-green-500 hover:text-green-600 transition-all shadow-sm active:scale-95 text-left"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-green-600" />
                  <span className="text-xs text-gray-400">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Voice Visualiser */}
          {isListening && (
            <div className="bg-red-50 border-t border-red-100 px-4 py-2 flex items-center gap-3">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="w-1 bg-red-400 rounded-full animate-pulse" style={{
                    height: `${10 + Math.random() * 14}px`,
                    animationDelay: `${i * 0.12}s`,
                    animationDuration: '0.6s',
                  }} />
                ))}
              </div>
              <span className="text-xs font-medium text-red-600 flex-1">
                {interimText || 'Listening — speak now...'}
              </span>
              <button onClick={toggleListening} className="text-red-500 hover:text-red-700">
                <MicOff className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-gray-100">
            <div className="flex items-center gap-2">
              {voiceSupported && (
                <button
                  onClick={toggleListening}
                  title={isListening ? 'Stop listening' : 'Speak to assistant'}
                  className={`p-2.5 rounded-xl transition-all flex-shrink-0 ${
                    isListening
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse'
                      : 'bg-gray-100 text-gray-500 hover:bg-green-50 hover:text-green-600'
                  }`}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
              )}
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={isListening ? 'Listening...' : 'Ask anything...'}
                className="flex-1 px-4 py-2.5 bg-gray-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
                disabled={isListening}
              />
              <button
                onClick={() => handleSend()}
                disabled={!inputValue.trim() || isLoading}
                className="p-2.5 bg-green-600 text-white rounded-xl shadow-lg shadow-green-600/20 active:scale-95 disabled:opacity-30 transition-all flex-shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        id="tour-ai-chatbot"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl transition-all active:scale-90 ${
          isOpen ? 'bg-red-500 rotate-90 shadow-red-500/20' : 'bg-green-600 hover:bg-green-700 shadow-green-600/30'
        }`}
      >
        {isOpen ? <X className="w-7 h-7" /> : <MessageSquare className="w-7 h-7" />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center animate-bounce">
            <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
          </span>
        )}
      </button>
    </div>
  );
};
