import { useState, useEffect, useRef } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Head from 'next/head';
import { getDailyTip } from '../lib/pregnancy';

export default function Coach() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [inputText, setInputText] = useState('');
  const [imageAttachments, setImageAttachments] = useState([]);
  const [sending, setSending] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [pregnancyContext, setPregnancyContext] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    const saved = localStorage.getItem('dadReadyCoachConversations');
    if (saved) {
      const parsed = JSON.parse(saved);
      setConversations(parsed);
      if (parsed.length > 0) setActiveConversationId(parsed[0].id);
    }
    const settings = JSON.parse(localStorage.getItem('dadReadySettings') || '{}');
    if (settings.trackPregnancy && settings.lmpDate) {
      const info = getDailyTip(settings.lmpDate, settings.cycleLength || 28);
      setPregnancyContext({ weeks: info.weeks, days: info.days, trimester: info.trimester });
    }
  }, []);

  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem('dadReadyCoachConversations', JSON.stringify(conversations));
    }
  }, [conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, activeConversationId]);

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  const createNewConversation = () => {
    const newConvo = {
      id: Date.now().toString(),
      title: 'New conversation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: []
    };
    setConversations(prev => [newConvo, ...prev]);
    setActiveConversationId(newConvo.id);
    setShowSidebar(false);
  };

  const deleteConversation = (id) => {
    setConversations(prev => {
      const updated = prev.filter(c => c.id !== id);
      if (activeConversationId === id) {
        setActiveConversationId(updated.length > 0 ? updated[0].id : null);
      }
      return updated;
    });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setImageAttachments(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeImage = (idx) => {
    setImageAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  const sendMessage = async () => {
    if ((!inputText.trim() && imageAttachments.length === 0) || sending) return;

    let convoId = activeConversationId;

    if (!convoId) {
      const newConvo = {
        id: Date.now().toString(),
        title: 'New conversation',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: []
      };
      setConversations(prev => [newConvo, ...prev]);
      convoId = newConvo.id;
      setActiveConversationId(convoId);
    }

    const userMessage = {
      role: 'user',
      content: inputText,
      images: imageAttachments.length > 0 ? imageAttachments : undefined,
      timestamp: new Date().toISOString()
    };

    setConversations(prev => prev.map(c => {
      if (c.id === convoId) {
        return { ...c, messages: [...c.messages, userMessage], updatedAt: new Date().toISOString() };
      }
      return c;
    }));

    const currentInput = inputText;
    setInputText('');
    setImageAttachments([]);
    setSending(true);

    try {
      const currentConvo = conversations.find(c => c.id === convoId);
      const allMessages = [...(currentConvo?.messages || []), userMessage];
      const recentMessages = allMessages.slice(-20);

      const res = await fetch('/api/coach-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: recentMessages.map(m => ({
            role: m.role,
            content: m.content,
            images: m.images
          })),
          pregnancyContext
        })
      });

      if (res.ok) {
        const { reply } = await res.json();
        const assistantMessage = {
          role: 'assistant',
          content: reply,
          timestamp: new Date().toISOString()
        };

        setConversations(prev => prev.map(c => {
          if (c.id === convoId) {
            const updated = { ...c, messages: [...c.messages, assistantMessage], updatedAt: new Date().toISOString() };
            if (c.messages.length <= 1 && c.title === 'New conversation') {
              updated.title = currentInput.slice(0, 40) + (currentInput.length > 40 ? '...' : '');
            }
            return updated;
          }
          return c;
        }));
      } else {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        alert('Coach error: ' + err.error);
      }
    } catch (err) {
      console.error('Coach chat error:', err);
      alert('Failed to reach the coach. Please try again.');
    }

    setSending(false);
  };

  if (status === "loading") return null;
  if (!session) return null;

  return (
    <>
      <Head>
        <title>Pregnancy Coach | Dad Ready</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#1a1a2e" />
        <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@300;400;500;600&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <div className="coach-app">
        <div className="background" />

        {/* Sidebar */}
        <div className={`sidebar ${showSidebar ? 'open' : ''}`}>
          <div className="sidebar-header">
            <h2>Conversations</h2>
            <button onClick={() => setShowSidebar(false)} className="close-sidebar">&times;</button>
          </div>
          <button onClick={createNewConversation} className="new-chat-btn">+ New Conversation</button>
          <div className="convo-list">
            {conversations.map(c => (
              <div key={c.id}
                className={`convo-item ${c.id === activeConversationId ? 'active' : ''}`}
                onClick={() => { setActiveConversationId(c.id); setShowSidebar(false); }}
              >
                <span className="convo-title">{c.title}</span>
                <div className="convo-meta">
                  <span className="convo-date">{new Date(c.updatedAt).toLocaleDateString()}</span>
                  <button onClick={(e) => { e.stopPropagation(); deleteConversation(c.id); }} className="convo-delete">&times;</button>
                </div>
              </div>
            ))}
            {conversations.length === 0 && (
              <p className="no-convos">No conversations yet. Start one!</p>
            )}
          </div>
        </div>

        {/* Sidebar overlay */}
        {showSidebar && <div className="sidebar-overlay" onClick={() => setShowSidebar(false)} />}

        {/* Main chat area */}
        <div className="chat-main">
          <header className="chat-header">
            <div className="chat-header-left">
              <button onClick={() => router.push('/')} className="back-btn">&larr; Back</button>
            </div>
            <h1 className="chat-title">Pregnancy Coach</h1>
            <button onClick={() => setShowSidebar(true)} className="menu-btn">&#9776;</button>
          </header>

          <div className="messages-area">
            {!activeConversation || activeConversation.messages.length === 0 ? (
              <div className="empty-chat">
                <div className="empty-icon">&#128172;</div>
                <h2>Pregnancy Coach</h2>
                <p>Ask anything about pregnancy, supporting your partner, what to expect, or upload screenshots from pregnancy apps for help understanding them.</p>
                {pregnancyContext && (
                  <p className="context-note">Your partner is {pregnancyContext.weeks}w {pregnancyContext.days}d &mdash; the coach knows this.</p>
                )}
              </div>
            ) : (
              activeConversation.messages.map((msg, i) => (
                <div key={i} className={`message ${msg.role}`}>
                  {msg.images && msg.images.length > 0 && (
                    <div className="message-images">
                      {msg.images.map((img, j) => (
                        <img key={j} src={img} alt="Uploaded" className="message-image" />
                      ))}
                    </div>
                  )}
                  <div className="message-content">{msg.content}</div>
                  <div className="message-time">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            )}
            {sending && (
              <div className="message assistant">
                <div className="typing-indicator">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Image preview strip */}
          {imageAttachments.length > 0 && (
            <div className="image-preview-strip">
              {imageAttachments.map((img, i) => (
                <div key={i} className="preview-thumb">
                  <img src={img} alt="Preview" />
                  <button onClick={() => removeImage(i)} className="preview-remove">&times;</button>
                </div>
              ))}
            </div>
          )}

          {/* Input area */}
          <div className="input-area">
            <button onClick={() => fileInputRef.current?.click()} className="attach-btn">&#128206;</button>
            <input type="file" ref={fileInputRef} accept="image/*" multiple onChange={handleImageUpload} style={{ display: 'none' }} />
            <textarea
              placeholder="Ask the coach anything..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              className="chat-input"
              rows={1}
            />
            <button onClick={sendMessage} disabled={sending || (!inputText.trim() && imageAttachments.length === 0)} className="send-btn">
              {sending ? '...' : '\u2192'}
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', -apple-system, sans-serif; background: #1a1a2e; overflow: hidden; }

        .coach-app { height: 100vh; display: flex; position: relative; color: #fff; }
        .background { position: fixed; inset: 0; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); z-index: -1; }

        /* Sidebar */
        .sidebar {
          position: fixed; left: 0; top: 0; bottom: 0; width: 300px;
          background: rgba(15, 15, 30, 0.98); backdrop-filter: blur(20px);
          border-right: 1px solid rgba(255,255,255,0.1);
          z-index: 100; transform: translateX(-100%); transition: transform 0.3s ease;
          display: flex; flex-direction: column; padding: 20px;
        }
        .sidebar.open { transform: translateX(0); }
        .sidebar-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 99; }
        .sidebar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .sidebar-header h2 { font-family: 'Crimson Pro', serif; font-size: 1.3rem; font-weight: 400; }
        .close-sidebar { background: none; border: none; color: rgba(255,255,255,0.5); font-size: 1.5rem; cursor: pointer; }
        .new-chat-btn {
          width: 100%; padding: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none; border-radius: 10px; color: #fff; font-size: 0.9rem; font-weight: 500; cursor: pointer;
          margin-bottom: 16px;
        }
        .convo-list { flex: 1; overflow-y: auto; }
        .convo-item {
          padding: 14px; border-radius: 10px; cursor: pointer; margin-bottom: 4px;
          transition: background 0.2s;
        }
        .convo-item:hover { background: rgba(255,255,255,0.08); }
        .convo-item.active { background: rgba(102, 126, 234, 0.2); }
        .convo-title { font-size: 0.88rem; color: rgba(255,255,255,0.85); display: block; margin-bottom: 4px; }
        .convo-meta { display: flex; justify-content: space-between; align-items: center; }
        .convo-date { font-size: 0.72rem; color: rgba(255,255,255,0.3); }
        .convo-delete { background: none; border: none; color: rgba(255,255,255,0.2); cursor: pointer; font-size: 1rem; }
        .convo-delete:hover { color: #ef4444; }
        .no-convos { text-align: center; color: rgba(255,255,255,0.3); font-size: 0.85rem; padding: 20px; }

        /* Chat main */
        .chat-main { flex: 1; display: flex; flex-direction: column; height: 100vh; max-width: 780px; margin: 0 auto; width: 100%; }

        .chat-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 16px 24px; border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .chat-title { font-family: 'Crimson Pro', serif; font-size: 1.2rem; font-weight: 400; color: #a78bfa; }
        .back-btn, .menu-btn {
          background: rgba(255,255,255,0.08); border: none; padding: 8px 14px;
          border-radius: 8px; color: rgba(255,255,255,0.7); font-size: 0.85rem; cursor: pointer;
        }
        .back-btn:hover, .menu-btn:hover { background: rgba(255,255,255,0.12); }

        /* Messages */
        .messages-area { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 16px; }

        .empty-chat { text-align: center; margin: auto; max-width: 400px; padding: 40px 20px; }
        .empty-icon { font-size: 3rem; margin-bottom: 16px; }
        .empty-chat h2 { font-family: 'Crimson Pro', serif; font-size: 1.5rem; font-weight: 400; margin-bottom: 12px; color: #a78bfa; }
        .empty-chat p { color: rgba(255,255,255,0.5); font-size: 0.9rem; line-height: 1.6; }
        .context-note { margin-top: 12px; color: #a78bfa; font-size: 0.82rem; }

        .message { max-width: 80%; padding: 14px 18px; border-radius: 16px; }
        .message.user {
          align-self: flex-end; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-bottom-right-radius: 4px;
        }
        .message.assistant {
          align-self: flex-start; background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.1); border-bottom-left-radius: 4px;
        }
        .message-content { font-size: 0.9rem; line-height: 1.6; white-space: pre-wrap; }
        .message-time { font-size: 0.68rem; color: rgba(255,255,255,0.35); margin-top: 6px; }
        .message-images { display: flex; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
        .message-image { max-width: 200px; max-height: 200px; border-radius: 10px; object-fit: cover; }

        .typing-indicator { display: flex; gap: 6px; padding: 4px 0; }
        .typing-indicator span {
          width: 8px; height: 8px; background: rgba(255,255,255,0.4); border-radius: 50%;
          animation: typingBounce 1.4s infinite;
        }
        .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
        .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typingBounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }

        /* Image preview */
        .image-preview-strip {
          display: flex; gap: 8px; padding: 8px 24px;
          border-top: 1px solid rgba(255,255,255,0.08);
        }
        .preview-thumb { position: relative; }
        .preview-thumb img { width: 60px; height: 60px; border-radius: 8px; object-fit: cover; }
        .preview-remove {
          position: absolute; top: -4px; right: -4px; width: 20px; height: 20px;
          background: #ef4444; border: none; border-radius: 50%; color: #fff;
          font-size: 0.7rem; cursor: pointer; display: flex; align-items: center; justify-content: center;
        }

        /* Input */
        .input-area {
          display: flex; align-items: flex-end; gap: 8px;
          padding: 16px 24px; border-top: 1px solid rgba(255,255,255,0.08);
        }
        .attach-btn {
          background: rgba(255,255,255,0.08); border: none; padding: 12px;
          border-radius: 10px; font-size: 1.1rem; cursor: pointer; flex-shrink: 0;
        }
        .attach-btn:hover { background: rgba(255,255,255,0.12); }
        .chat-input {
          flex: 1; padding: 12px 16px; background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12); border-radius: 12px;
          color: #fff; font-family: inherit; font-size: 0.9rem; resize: none;
          max-height: 120px; min-height: 44px;
        }
        .chat-input:focus { outline: none; border-color: rgba(167, 139, 250, 0.5); }
        .chat-input::placeholder { color: rgba(255,255,255,0.25); }
        .send-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none; padding: 12px 18px; border-radius: 10px;
          color: #fff; font-size: 1rem; font-weight: 600; cursor: pointer; flex-shrink: 0;
        }
        .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        @media (max-width: 600px) {
          .chat-header { padding: 12px 16px; }
          .messages-area { padding: 16px; }
          .input-area { padding: 12px 16px; }
          .message { max-width: 90%; }
          .sidebar { width: 85vw; }
        }
      `}</style>
    </>
  );
}
