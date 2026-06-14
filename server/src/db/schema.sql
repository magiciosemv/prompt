CREATE TABLE IF NOT EXISTS optimizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  raw_prompt TEXT NOT NULL,
  optimized_prompt TEXT NOT NULL,
  intent_category TEXT,
  anti_patterns_fixed TEXT,
  dimensions_enhanced TEXT,
  confidence TEXT,
  professionalism TEXT DEFAULT 'intermediate',
  length_pref TEXT DEFAULT 'medium',
  format_pref TEXT DEFAULT 'paragraph',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
