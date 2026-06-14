import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import AnalysisCard from './AnalysisCard';
import DiffView from './DiffView';

export default function OutputPanel({ result, isStreaming, rawPrompt }) {
  const [showDiff, setShowDiff] = useState(false);

  const handleCopy = () => {
    if (result?.text) {
      navigator.clipboard.writeText(result.text);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div className="panel-title" style={{ margin: 0 }}>✨ 优化结果</div>
        {result?.text && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleCopy} style={btnStyle}>📋 复制</button>
            <button onClick={() => setShowDiff(!showDiff)} style={btnStyle}>
              {showDiff ? '查看结果' : '查看对比'}
            </button>
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {showDiff && result?.text ? (
          <DiffView original={rawPrompt} optimized={result.text} />
        ) : result?.text ? (
          <div style={{ lineHeight: '1.8' }}>
            <ReactMarkdown>{result.text}</ReactMarkdown>
          </div>
        ) : (
          <div style={{ color: '#999', textAlign: 'center', marginTop: '40px' }}>
            {isStreaming ? '优化中...' : '输入提示词并点击"开始优化"'}
          </div>
        )}
      </div>

      {result?.analysis && <AnalysisCard analysis={result.analysis} />}
    </>
  );
}

const btnStyle = {
  padding: '6px 12px',
  border: '1px solid #ddd',
  borderRadius: '6px',
  background: '#fff',
  cursor: 'pointer',
  fontSize: '13px',
};
