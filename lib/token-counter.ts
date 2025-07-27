import { encode } from 'gpt-tokenizer';

// This is a basic implementation and may not be perfectly accurate
// for all models, but it's a good approximation.
export function countTokens(text: string): number {
  if (!text) return 0;

  try {
    const tokens = encode(text);
    return tokens.length;
  } catch (error) {
    console.error("Token counting error:", error);
    // Fallback to a rough estimate (4 chars per token)
    return Math.ceil(text.length / 4);
  }
}
