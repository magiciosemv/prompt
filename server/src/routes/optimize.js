import { Router } from 'express';
import { callDeepSeek } from '../services/deepseek.js';
import { getDb } from '../db/index.js';

export const optimizeRouter = Router();

optimizeRouter.post('/optimize', async (req, res) => {
  const { raw_prompt, professionalism, length, format } = req.body;

  // 1. Validate raw_prompt
  if (!raw_prompt || !raw_prompt.trim()) {
    return res.status(400).json({ error: 'raw_prompt is required and must not be empty' });
  }

  // 2. Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  try {
    // 3. Call DeepSeek
    const result = await callDeepSeek(
      raw_prompt.trim(),
      professionalism || 'intermediate',
      length || 'medium',
      format || 'paragraph'
    );

    const { optimized_prompt, analysis } = result;

    // 4. Simulate streaming by splitting into characters
    const chars = [...optimized_prompt];
    for (const char of chars) {
      const tokenData = JSON.stringify({ type: 'token', content: char });
      res.write(`data: ${tokenData}\n\n`);

      // Small delay on spaces and punctuation for realistic streaming feel
      if (/[\s，。！？、；：,.\-!?;:\n]/.test(char)) {
        await new Promise((resolve) => setTimeout(resolve, 30));
      }
    }

    // 5. Send final done event with analysis
    const doneData = JSON.stringify({
      type: 'done',
      analysis: {
        intent_category: analysis.intent_category,
        anti_patterns_fixed: analysis.anti_patterns_fixed,
        dimensions_enhanced: analysis.dimensions_enhanced,
        confidence: analysis.confidence || 'high',
      },
    });
    res.write(`data: ${doneData}\n\n`);

    // 6. Save to database
    try {
      const db = getDb();
      const stmt = db.prepare(`
        INSERT INTO optimizations (raw_prompt, optimized_prompt, intent_category, anti_patterns_fixed, dimensions_enhanced, confidence, professionalism, length_pref, format_pref)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        raw_prompt.trim(),
        optimized_prompt,
        analysis.intent_category,
        JSON.stringify(analysis.anti_patterns_fixed),
        JSON.stringify(analysis.dimensions_enhanced),
        analysis.confidence || 'high',
        professionalism || 'intermediate',
        length || 'medium',
        format || 'paragraph'
      );
    } catch (dbErr) {
      console.error('Database save error:', dbErr);
      // Non-fatal: the SSE stream already succeeded, just log the DB error
    }

    res.end();
  } catch (err) {
    // 7. Handle errors with error event type
    console.error('Optimize error:', err);
    const errorData = JSON.stringify({ type: 'error', error: err.message || 'Internal server error' });
    res.write(`data: ${errorData}\n\n`);
    res.end();
  }
});
