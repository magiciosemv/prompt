export default function AnalysisCard({ analysis }) {
  if (!analysis) return null;

  return (
    <div style={{
      background: '#f8f9fa',
      borderRadius: '8px',
      padding: '12px',
      fontSize: '13px',
    }}>
      <div style={{ fontWeight: '600', marginBottom: '8px' }}>📊 优化分析</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
        <span>意图: <strong>{analysis.intent_category}</strong></span>
        <span>反模式修复: <strong>{analysis.anti_patterns_fixed?.length || 0}处</strong></span>
        <span>置信度: <strong>{analysis.confidence || 'high'}</strong></span>
      </div>
      {analysis.dimensions_enhanced?.length > 0 && (
        <div style={{ marginTop: '6px' }}>
          增强维度: {analysis.dimensions_enhanced.join(', ')}
        </div>
      )}
      {analysis.reasoning && (
        <div style={{ marginTop: '6px', color: '#666' }}>
          {analysis.reasoning}
        </div>
      )}
    </div>
  );
}
