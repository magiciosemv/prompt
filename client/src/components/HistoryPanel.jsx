const CATEGORY_COLORS = {
  '编程类': '#3b82f6',
  '写作类': '#8b5cf6',
  '分析类': '#f59e0b',
  '创意类': '#ec4899',
  '学习类': '#10b981',
  '其他': '#6b7280',
};

export default function HistoryPanel({ history, onClick }) {
  if (history.length === 0) {
    return (
      <>
        <div className="panel-title">📜 历史记录</div>
        <div style={{ color: '#999', textAlign: 'center', marginTop: '20px' }}>
          暂无记录
        </div>
      </>
    );
  }

  return (
    <>
      <div className="panel-title">📜 历史记录</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {history.map((item) => (
          <div
            key={item.id}
            onClick={() => onClick(item)}
            style={{
              padding: '8px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '13px',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {item.raw_prompt.slice(0, 20)}{item.raw_prompt.length > 20 ? '...' : ''}
            </span>
            {item.intent_category && (
              <span style={{
                background: CATEGORY_COLORS[item.intent_category] || '#6b7280',
                color: '#fff',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '11px',
                marginLeft: '8px',
                whiteSpace: 'nowrap',
              }}>
                {item.intent_category}
              </span>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
