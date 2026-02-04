'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Send, User, Clock, Search, Plus } from 'lucide-react';

interface Conversation {
  id: string;
  customer_phone: string;
  customer?: { full_name: string };
  status: string;
  unread_count: number;
  last_message_at: string;
  messages: { id: string; content: string; direction: string; created_at: string }[];
}

export default function SMSPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sms');
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!message.trim() || !selected) return;
    await fetch('/api/sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: selected.id, content: message })
    });
    setMessage('');
    fetchData();
  };

  const formatTime = (d: string) => new Date(d).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="h-[calc(100vh-80px)] flex">
      {/* Conversations List */}
      <div className="w-80 border-r bg-white flex flex-col">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center mb-3">
            <h1 className="text-lg font-bold flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-600" /> SMS
            </h1>
            <button className="p-2 bg-indigo-600 text-white rounded-lg"><Plus className="w-4 h-4" /></button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="ค้นหา..." className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">กำลังโหลด...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">ไม่มีการสนทนา</div>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => setSelected(conv)}
                className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${selected?.id === conv.id ? 'bg-indigo-50' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{conv.customer?.full_name || conv.customer_phone}</p>
                    <p className="text-sm text-gray-500 truncate">
                      {conv.messages?.[0]?.content || 'ไม่มีข้อความ'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">{conv.last_message_at ? formatTime(conv.last_message_at) : ''}</p>
                    {conv.unread_count > 0 && (
                      <span className="inline-block mt-1 w-5 h-5 bg-indigo-600 text-white text-xs rounded-full flex items-center justify-center">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {selected ? (
          <>
            <div className="p-4 bg-white border-b">
              <p className="font-bold">{selected.customer?.full_name || selected.customer_phone}</p>
              <p className="text-sm text-gray-500">{selected.customer_phone}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {selected.messages?.map(msg => (
                <div key={msg.id} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs px-4 py-2 rounded-2xl ${msg.direction === 'outbound' ? 'bg-indigo-600 text-white' : 'bg-white border'}`}>
                    <p>{msg.content}</p>
                    <p className={`text-xs mt-1 ${msg.direction === 'outbound' ? 'text-indigo-200' : 'text-gray-400'}`}>
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-white border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="พิมพ์ข้อความ..."
                  className="flex-1 px-4 py-2 border rounded-lg"
                />
                <button onClick={sendMessage} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>เลือกการสนทนาเพื่อเริ่มแชท</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
