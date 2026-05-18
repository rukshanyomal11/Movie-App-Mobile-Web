import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Send, User, MessageSquare } from 'lucide-react';
import { PageState, SectionPanel } from './UI.jsx';

export function SupportView({ adminProfile, users, movies }) {
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch all chats
  useEffect(() => {
    async function loadChats() {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        setChats(data);
      }
      setIsLoading(false);
    }
    loadChats();
  }, []);

  // Fetch messages for active chat and subscribe
  useEffect(() => {
    if (!activeChat) {
      setMessages([]);
      return;
    }

    async function loadMessages() {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_id', activeChat.id)
        .order('created_at', { ascending: true });
        
      if (!error && data) {
        setMessages(data);
      }
    }
    loadMessages();

    // Subscribe to real-time messages
    const channel = supabase
      .channel(`chat_${activeChat.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_id=eq.${activeChat.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChat]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    const msgText = newMessage.trim();
    setNewMessage('');

    const { error } = await supabase.from('chat_messages').insert([{
      chat_id: activeChat.id,
      sender_id: adminProfile.id,
      message: msgText,
      is_admin_reply: true,
    }]);

    if (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (isLoading) {
    return <PageState title="Loading Chats" body="Fetching support sessions..." />;
  }

  return (
    <div style={{ display: 'flex', gap: '1.5rem', height: 'calc(100vh - 120px)' }}>
      {/* Left Panel: Chat List */}
      <div style={{ flex: '0 0 350px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <SectionPanel title="Active Support Chats">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
            {chats.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '1rem', textAlign: 'center' }}>No active chats.</p>
            ) : (
              chats.map((chat) => {
                const user = users.find(u => u.id === chat.user_id);
                const movie = movies.find(m => m.id === chat.movie_id);
                const isActive = activeChat?.id === chat.id;

                return (
                  <button
                    key={chat.id}
                    onClick={() => setActiveChat(chat)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      padding: '1rem',
                      backgroundColor: isActive ? 'var(--accent-soft)' : 'var(--surface-alt)',
                      border: `1px solid ${isActive ? 'var(--accent)' : 'var(--stroke)'}`,
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', width: '100%' }}>
                      <User size={14} color="var(--accent)" />
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                        {user?.name || 'Unknown User'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Movie: {movie?.title || 'General Question'}
                    </div>
                    {chat.booking_id && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Booking ID: B-{chat.booking_id.substring(0, 8).toUpperCase()}
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </SectionPanel>
      </div>

      {/* Right Panel: Active Chat */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {activeChat ? (
          <SectionPanel 
            title={`Chat with ${users.find(u => u.id === activeChat.user_id)?.name || 'User'}`} 
            style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}
          >
            {/* Messages Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'var(--surface)' }}>
              {messages.length === 0 ? (
                <div style={{ margin: 'auto', color: 'var(--text-muted)', textAlign: 'center' }}>
                  <MessageSquare size={32} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                  <p>No messages yet.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isAdmin = msg.is_admin_reply;
                  return (
                    <div 
                      key={msg.id} 
                      style={{
                        alignSelf: isAdmin ? 'flex-end' : 'flex-start',
                        maxWidth: '75%',
                        backgroundColor: isAdmin ? 'var(--accent)' : 'var(--surface-alt)',
                        border: isAdmin ? 'none' : '1px solid var(--stroke)',
                        padding: '0.75rem 1rem',
                        borderRadius: '12px',
                        borderBottomRightRadius: isAdmin ? '0' : '12px',
                        borderBottomLeftRadius: !isAdmin ? '0' : '12px',
                        color: isAdmin ? '#fff' : 'var(--text-primary)',
                      }}
                    >
                      <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.4' }}>{msg.message}</p>
                      <span style={{ fontSize: '0.7rem', opacity: 0.7, display: 'block', marginTop: '0.25rem', textAlign: isAdmin ? 'right' : 'left' }}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form 
              onSubmit={handleSendMessage} 
              style={{ 
                padding: '1rem 1.5rem', 
                borderTop: '1px solid var(--stroke)', 
                backgroundColor: 'var(--surface)',
                display: 'flex',
                gap: '1rem',
                borderBottomLeftRadius: '16px',
                borderBottomRightRadius: '16px'
              }}
            >
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your reply..."
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  borderRadius: '24px',
                  border: '1px solid var(--stroke)',
                  backgroundColor: 'var(--background)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
              <button 
                type="submit"
                disabled={!newMessage.trim()}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '24px',
                  backgroundColor: newMessage.trim() ? 'var(--accent)' : 'var(--surface-alt)',
                  color: newMessage.trim() ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: '600',
                  transition: 'background-color 0.2s'
                }}
              >
                <span>Send</span>
                <Send size={16} />
              </button>
            </form>
          </SectionPanel>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px dashed var(--stroke)' }}>
            <MessageSquare size={48} color="var(--text-muted)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No Chat Selected</h3>
            <p style={{ color: 'var(--text-muted)' }}>Select a chat from the left panel to view messages and reply.</p>
          </div>
        )}
      </div>
    </div>
  );
}
