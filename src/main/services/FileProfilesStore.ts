import { injectable } from 'inversify';
import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { ProfilesStore } from '../../core/ports/ProfilesStore';
import { Profile } from '../../core/types/Profile';

/**
 * Implementation of ProfilesStore using file system
 */
@injectable()
export class FileProfilesStore implements ProfilesStore {
  private profiles: Profile[];
  private profilesPath: string;

  constructor() {
    // Default profiles
    this.profiles = [
      {
        id: 'formal',
        name: 'Formal',
        tone: 'Professional',
        constraints: ['Use formal language', 'Avoid contractions'],
      },
      {
        id: 'casual',
        name: 'Casual',
        tone: 'Friendly',
        constraints: ['Use conversational language'],
      },
      {
        id: 'concise',
        name: 'Concise',
        tone: 'Direct',
        constraints: ['Be brief', 'Use short sentences'],
        max_words: 100,
      },
    ];

    // Set up profiles file path
    this.profilesPath = path.join(
      app.getPath('userData'),
      'profiles.json'
    );

    // Load profiles from file if exists
    this.loadProfiles();
  }

  /**
   * Get all profiles
   * @returns Array of all profiles
   */
  getProfiles(): Profile[] {
    return [...this.profiles];
  }

  /**
   * Get a profile by ID
   * @param id The profile ID
   * @returns The profile or null if not found
   */
  getProfile(id: string): Profile | null {
    const profile = this.profiles.find(p => p.id === id);
    return profile ? { ...profile } : null;
  }

  /**
   * Add a new profile
   * @param profile The profile to add
   * @returns True if successful
   */
  addProfile(profile: Profile): boolean {
    // Check if ID already exists
    if (this.profiles.some(p => p.id === profile.id)) {
      return false;
    }

    this.profiles.push({ ...profile });
    this.saveProfiles();
    return true;
  }

  /**
   * Update an existing profile
   * @param id The profile ID to update
   * @param profile The updated profile data
   * @returns True if successful
   */
  updateProfile(id: string, profile: Profile): boolean {
    const index = this.profiles.findIndex(p => p.id === id);
    if (index === -1) {
      return false;
    }

    // Update profile but keep the original ID
    this.profiles[index] = { 
      ...profile,
      id: id, // Ensure ID doesn't change
    };
    
    this.saveProfiles();
    return true;
  }

  /**
   * Delete a profile
   * @param id The profile ID to delete
   * @returns True if successful
   */
  deleteProfile(id: string): boolean {
    const initialLength = this.profiles.length;
    this.profiles = this.profiles.filter(p => p.id !== id);
    
    if (this.profiles.length !== initialLength) {
      this.saveProfiles();
      return true;
    }
    
    return false;
  }

  /**
   * Load profiles from file
   */
  private loadProfiles(): void {
    try {
      if (fs.existsSync(this.profilesPath)) {
        const data = fs.readFileSync(this.profilesPath, 'utf8');
        const loadedProfiles = JSON.parse(data);
        
        if (Array.isArray(loadedProfiles) && loadedProfiles.length > 0) {
          this.profiles = loadedProfiles;
        }
      }
    } catch (error) {
      console.error('Failed to load profiles:', error);
      // Continue with default profiles
    }
  }

  /**
   * Save profiles to file
   */
  private saveProfiles(): void {
    try {
      // Create directory if it doesn't exist
      const dir = path.dirname(this.profilesPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write profiles to file
      fs.writeFileSync(
        this.profilesPath,
        JSON.stringify(this.profiles, null, 2),
        'utf8'
      );
    } catch (error) {
      console.error('Failed to save profiles:', error);
    }
  }
}
