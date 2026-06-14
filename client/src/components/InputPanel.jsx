const PLACEHOLDER_EXAMPLES = [
  '例如：我想做一个 Solana 永续合约的清算模块，用 Rust + Anchor，需要处理坏账和保险基金',
  '例如：帮我写一篇关于 AI 在医疗领域应用的博客文章，面向非技术读者',
  '例如：分析我们公司 Q3 的销售数据，找出下降原因并给出改进建议',
];

export default function InputPanel({ value, onChange }) {
  const placeholder = PLACEHOLDER_EXAMPLES[Math.floor(Math.random() * PLACEHOLDER_EXAMPLES.length)];

  return (
    <>
      <div className="panel-title">📝 原始提示词</div>
      <textarea
        className="prompt-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1,
          width: '100%',
          padding: '12px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          resize: 'none',
          fontSize: '14px',
          lineHeight: '1.6',
          fontFamily: 'inherit',
        }}
      />
    </>
  );
}
