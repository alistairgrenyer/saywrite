import { Profile } from '../types/Profile';

/**
 * Rewrite options interface
 */
export interface RewriteOptions {
  temperature?: number;
  provider?: string;
}

/**
 * Rewrite result interface
 */
export interface RewriteResult {
  success: boolean;
  original?: string;
  rewritten?: string;
  profile?: Profile;
  error?: string;
}

/**
 * Interface for Language Model providers
 */
export interface LLMProvider {
  /**
   * Rewrite text according to a profile
   * @param text The original text to rewrite
   * @param profile The profile to use for rewriting
   * @param options Optional rewrite options
   * @returns Promise resolving to rewrite result
   */
  rewrite(text: string, profile: Profile, options?: RewriteOptions): Promise<RewriteResult>;
}
