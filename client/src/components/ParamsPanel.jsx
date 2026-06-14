const PROFESSIONALISM_OPTIONS = [
  { label: '入门', value: 'beginner' },
  { label: '进阶', value: 'intermediate' },
  { label: '专家', value: 'expert' },
];

const LENGTH_OPTIONS = [
  { label: '简短', value: 'short' },
  { label: '中等', value: 'medium' },
  { label: '详细', value: 'detailed' },
];

const FORMAT_OPTIONS = [
  { label: '列表', value: 'list' },
  { label: '段落', value: 'paragraph' },
  { label: '代码', value: 'code' },
];

function RadioGroup({ label, options, value, onChange }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ fontSize: '13px', color: '#666', marginBottom: '6px' }}>{label}</div>
      <div style={{ display: 'flex', gap: '8px' }}>
        {options.map((opt) => (
          <label
            key={opt.value}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            <input
              type="radio"
              name={label}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
            />
            {opt.label}
          </label>
        ))}
      </div>
    </div>
  );
}

export default function ParamsPanel({ params, onChange, onOptimize, isStreaming }) {
  const update = (key) => (value) => onChange({ ...params, [key]: value });

  return (
    <>
      <div>
        <div className="panel-title">🎛️ 优化参数</div>
        <RadioGroup label="专业度" options={PROFESSIONALISM_OPTIONS} value={params.professionalism} onChange={update('professionalism')} />
        <RadioGroup label="长度" options={LENGTH_OPTIONS} value={params.length} onChange={update('length')} />
        <RadioGroup label="格式" options={FORMAT_OPTIONS} value={params.format} onChange={update('format')} />
      </div>
      <button
        onClick={onOptimize}
        disabled={isStreaming}
        style={{
          width: '100%',
          padding: '12px',
          background: isStreaming ? '#ccc' : '#4f46e5',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '15px',
          fontWeight: '600',
          cursor: isStreaming ? 'not-allowed' : 'pointer',
        }}
      >
        {isStreaming ? '优化中...' : '🚀 开始优化'}
      </button>
    </>
  );
}
