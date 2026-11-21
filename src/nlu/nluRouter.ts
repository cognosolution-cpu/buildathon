import type { LangCode, ParsedIntent, RouteName } from '../types';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { ruleParse } from './ruleParser';
import { validateParsedIntent } from './intentValidator';

export interface NluContext {
  screen: RouteName;
  lang: LangCode;
  cartCount: number;
  visibleProducts: Array<{ index: number; id: string; title: string; price: number }>;
}

export interface NluResult {
  parsed: ParsedIntent;
  source: 'rules' | 'supabase-llm-proxy' | 'server-gemini' | 'fallback';
  replyHint?: string;
}

export async function understand(transcript: string, context: NluContext): Promise<NluResult> {
  // 1. Deterministic zero-latency rule engine first
  const ruleResult = ruleParse(transcript);
  if (ruleResult.confidence >= 0.75) {
    return { parsed: ruleResult, source: 'rules' };
  }

  // 2. If Supabase is configured, try the Supabase Edge Function llm-proxy first
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.functions.invoke('llm-proxy', {
        body: { transcript, context },
      });
      if (!error && data) {
        const validated = validateParsedIntent(data);
        if (validated.parsed.intent !== 'UNKNOWN') {
          return {
            parsed: validated.parsed,
            source: 'supabase-llm-proxy',
            replyHint: validated.replyHint,
          };
        }
      }
    } catch {
      // Fall through to local/Express server route
    }
  }

  // 3. Call server-side Gemini NLU endpoint (/api/nlu)
  let nluStatusHint: string | undefined;
  try {
    const res = await fetch('/api/nlu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript, context }),
    });
    if (res.ok) {
      const data = await res.json();
      const validated = validateParsedIntent(data);
      return {
        parsed: validated.parsed,
        source: 'server-gemini',
        replyHint: validated.replyHint,
      };
    }
    if (res.status === 429) {
      nluStatusHint =
        'Gemini quota limit reached. Using local shopping commands or update GEMINI_API_KEY in Settings > Secrets.';
    } else if (res.status === 401 || res.status === 403) {
      nluStatusHint =
        'Gemini API key was rejected. Please verify GEMINI_API_KEY in Settings > Secrets.';
    }
  } catch {
    // Graceful fallback when offline or GEMINI_API_KEY not provided
  }

  return {
    parsed: ruleResult,
    source: 'fallback',
    ...(nluStatusHint ? { replyHint: nluStatusHint } : {}),
  };
}
