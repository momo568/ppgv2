import React, { useEffect, useRef, useState } from 'react';
import Layout from '../components/Layout';
import { chatService } from '../services/api';

const SUGGESTIONS = [
  'Comment jouer ?',
  'Système de points',
  'Composer un roster',
  'Les ligues',
  'Pronostics',
  'LEC / LCK',
  'Faker',
];

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const bottomRef               = useRef(null);

  useEffect(() => {
    chatService.history().then(r => {
      // history comes reversed (most recent first), display oldest first
      const hist = [...r.data].reverse();
      const msgs = [];
      hist.forEach(m => {
        msgs.push({ from: 'user', text: m.message, time: m.created_at });
        msgs.push({ from: 'bot',  text: m.response, time: m.created_at });
      });
      setMessages(msgs);
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { from: 'user', text: msg }]);
    setLoading(true);
    try {
      const res = await chatService.send(msg);
      setMessages(prev => [...prev, { from: 'bot', text: res.data.response }]);
    } catch {
      setMessages(prev => [...prev, { from: 'bot', text: 'Erreur de connexion. Réessaie.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">🤖 Chatbot</h1>
        <span style={{ fontSize: 12, color: 'var(--lol-grey-1)' }}>Assistant LoL Fantasy</span>
      </div>

      <div className="chatbot-wrap">
        <div className="chat-messages">
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--lol-grey-1)', fontSize: 14, padding: '40px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🤖</div>
              Bonjour ! Je suis ton assistant LoL Fantasy.<br />
              Pose-moi une question ou clique sur une suggestion ci-dessous.
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`chat-bubble ${m.from}`}>
              {m.text}
            </div>
          ))}
          {loading && (
            <div className="chat-bubble bot" style={{ opacity: 0.6 }}>
              <span className="spinner" /> En train de répondre...
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="chat-suggestions">
          {SUGGESTIONS.map(s => (
            <button key={s} className="chat-suggestion" onClick={() => send(s)}>{s}</button>
          ))}
        </div>

        <div className="chat-input-row">
          <input
            className="chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pose ta question... (Entrée pour envoyer)"
            disabled={loading}
          />
          <button className="btn-gold" onClick={() => send()} disabled={!input.trim() || loading}>
            {loading ? <span className="spinner" /> : 'Envoyer'}
          </button>
        </div>
      </div>
    </Layout>
  );
}
