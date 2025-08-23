import { Profile } from '../types/Profile';

/**
 * Interface for profile storage operations
 */
export interface ProfilesStore {
  /**
   * Get all profiles
   * @returns Array of all profiles
   */
  getProfiles(): Profile[];
  
  /**
   * Get a profile by ID
   * @param id The profile ID
   * @returns The profile or null if not found
   */
  getProfile(id: string): Profile | null;
  
  /**
   * Add a new profile
   * @param profile The profile to add
   * @returns True if successful
   */
  addProfile(profile: Profile): boolean;
  
  /**
   * Update an existing profile
   * @param id The profile ID to update
   * @param profile The updated profile data
   * @returns True if successful
   */
  updateProfile(id: string, profile: Profile): boolean;
  
  /**
   * Delete a profile
   * @param id The profile ID to delete
   * @returns True if successful
   */
  deleteProfile(id: string): boolean;
}
