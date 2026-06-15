import { useState, useEffect } from 'react';
import InputPanel from './components/InputPanel';
import OutputPanel from './components/OutputPanel';
import ParamsPanel from './components/ParamsPanel';
import HistoryPanel from './components/HistoryPanel';
import LoginPanel from './components/LoginPanel';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [rawPrompt, setRawPrompt] = useState('');
  const [optimizedResult, setOptimizedResult] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [history, setHistory] = useState([]);
  const [params, setParams] = useState({
    intent: 'auto',
    professionalism: 'intermediate',
    length: 'medium',
    format: 'paragraph',
  });

  useEffect(() => {
    const saved = localStorage.getItem('auth_logged_in');
    if (saved === 'true') {
      setLoggedIn(true);
    }
  }, []);

  const handleLogin = () => {
    setLoggedIn(true);
  };

  if (!loggedIn) {
    return <LoginPanel onLogin={handleLogin} />;
  }

  const handleOptimize = async () => {
    if (!rawPrompt.trim() || isStreaming) return;
    setIsStreaming(true);
    setOptimizedResult({ text: '', analysis: null });

    try {
      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_prompt: rawPrompt, ...params }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let streamedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'token') {
                streamedText += data.content;
                setOptimizedResult({ text: streamedText, analysis: null });
              } else if (data.type === 'done') {
                setOptimizedResult({ text: streamedText, analysis: data.analysis });
                setHistory(prev => [
                  { id: Date.now(), raw_prompt: rawPrompt, intent_category: data.analysis?.intent_category },
                  ...prev,
                ]);
              } else if (data.type === 'error') {
                setOptimizedResult({ text: `Error: ${data.error}`, analysis: null });
              }
            } catch (e) {
              // Skip malformed JSON
            }
          }
        }
      }
    } catch (err) {
      setOptimizedResult({ text: `Error: ${err.message}`, analysis: null });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleHistoryClick = (item) => {
    setRawPrompt(item.raw_prompt);
  };

  return (
    <div className="app">
      <div className="panel input-panel">
        <InputPanel value={rawPrompt} onChange={setRawPrompt} />
      </div>
      <div className="panel output-panel">
        <OutputPanel result={optimizedResult} isStreaming={isStreaming} rawPrompt={rawPrompt} />
      </div>
      <div className="panel params-panel">
        <ParamsPanel params={params} onChange={setParams} onOptimize={handleOptimize} isStreaming={isStreaming} />
      </div>
      <div className="panel history-panel">
        <HistoryPanel history={history} onClick={handleHistoryClick} />
      </div>
    </div>
  );
}
