import DiffMatchPatch from 'diff-match-patch';

const dmp = new DiffMatchPatch();

export default function DiffView({ original, optimized }) {
  const diffs = dmp.diff_main(original, optimized);
  dmp.diff_cleanupSemantic(diffs);

  return (
    <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
      <div style={{ marginBottom: '12px' }}>
        <span style={{ fontSize: '12px', color: '#666' }}>原始提示词</span>
        <div style={{ padding: '8px', background: '#fff3f3', borderRadius: '6px', marginTop: '4px' }}>
          {original}
        </div>
      </div>
      <div>
        <span style={{ fontSize: '12px', color: '#666' }}>优化结果 (差异高亮)</span>
        <div style={{ padding: '8px', background: '#f0fff0', borderRadius: '6px', marginTop: '4px' }}>
          {diffs.map(([op, text], i) => {
            if (op === 0) return <span key={i}>{text}</span>;
            if (op === -1) return <span key={i} style={{ background: '#ffcccc', textDecoration: 'line-through' }}>{text}</span>;
            return <span key={i} style={{ background: '#ccffcc' }}>{text}</span>;
          })}
        </div>
      </div>
    </div>
  );
}
