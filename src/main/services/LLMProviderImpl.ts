import { injectable, inject } from 'inversify';
import { LLMProvider, RewriteResult } from '../../core/ports/LLMProvider';
import { ApiClient } from '../../core/ports/ApiClient';
import { Profile } from '../../core/types/Profile';
import { TYPES } from '../../di/symbols';

/**
 * Implementation of LLMProvider using the ApiClient
 */
@injectable()
export class LLMProviderImpl implements LLMProvider {
  constructor(
    @inject(TYPES.ApiClient) private apiClient: ApiClient
  ) {}

  /**
   * Rewrite text according to a profile
   * @param text The original text to rewrite
   * @param profile The profile to use for rewriting
   * @returns Promise resolving to rewrite result
   */
  async rewrite(text: string, profile: Profile): Promise<RewriteResult> {
    const response = await this.apiClient.rewrite({
      text,
      profile,
    });

    if (!response.success) {
      return {
        success: false,
        error: response.error?.message || 'Rewrite failed',
      };
    }

    return {
      success: true,
      original: text,
      rewritten: response.data.rewritten,
      profile: profile,
    };
  }
}
