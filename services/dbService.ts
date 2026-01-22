
import { Transaction, Category, Profile } from '../types';

// Standardized keys for long-term persistence
const STORAGE_VERSION = 'v5';
const PROFILES_KEY = 'hisab_pro_profiles_v4';
const ACTIVE_PROFILE_ID_KEY = 'hisab_pro_active_profile_id_v4';
const SCHEMA_VERSION_KEY = 'hisab_pro_schema_version';

export const dbService = {
   // Migration logic to handle updates from previous versions
  migrate: () => {
    const currentVersion = localStorage.getItem(SCHEMA_VERSION_KEY);
    
    // Example migration: If moving from v4 to v5
    if (!currentVersion || currentVersion === 'v4') {
      const oldProfiles = localStorage.getItem('hisab_pro_profiles_v4');
      const oldActiveId = localStorage.getItem('hisab_pro_active_profile_id_v4');
      
      if (oldProfiles) localStorage.setItem(PROFILES_KEY, oldProfiles);
      if (oldActiveId) localStorage.setItem(ACTIVE_PROFILE_ID_KEY, oldActiveId);
      
      localStorage.setItem(SCHEMA_VERSION_KEY, STORAGE_VERSION);
      console.log('Migration to v5 complete.');
    }
  },
  // Profiles Registry
  getProfiles: (): Profile[] => {
    const saved = localStorage.getItem(PROFILES_KEY);
    return saved ? JSON.parse(saved) : [];
  },

  saveProfiles: (profiles: Profile[]) => {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  },

  getActiveProfileId: (): string | null => {
    return localStorage.getItem(ACTIVE_PROFILE_ID_KEY);
  },

  setActiveProfileId: (id: string) => {
    localStorage.setItem(ACTIVE_PROFILE_ID_KEY, id);
  },

  // Partitioned Storage by Profile ID
  getTransactions: (profileId: string): Transaction[] => {
    const saved = localStorage.getItem(`profile_${profileId}_transactions`);
    return saved ? JSON.parse(saved) : [];
  },

  saveTransactions: (profileId: string, transactions: Transaction[]) => {
    localStorage.setItem(`profile_${profileId}_transactions`, JSON.stringify(transactions));
  },

  getCategories: (profileId: string): Category[] => {
    const saved = localStorage.getItem(`profile_${profileId}_categories`);
    return saved ? JSON.parse(saved) : [];
  },

  saveCategories: (profileId: string, categories: Category[]) => {
    localStorage.setItem(`profile_${profileId}_categories`, JSON.stringify(categories));
  },

  deleteProfileData: (profileId: string) => {
    localStorage.removeItem(`profile_${profileId}_transactions`);
    localStorage.removeItem(`profile_${profileId}_categories`);
  },
    // NEW: Full System Backup (Profiles + Data)
  exportFullBackup: () => {
    const profiles = dbService.getProfiles();
    const fullData: any = {
      version: STORAGE_VERSION,
      exportDate: new Date().toISOString(),
      profiles: profiles,
      activeProfileId: dbService.getActiveProfileId(),
      data: {}
    };

    profiles.forEach(p => {
      fullData.data[p.id] = {
        transactions: dbService.getTransactions(p.id),
        categories: dbService.getCategories(p.id)
      };
    });

    return JSON.stringify(fullData);
  },

  // NEW: Full System Restore
  importFullBackup: (jsonString: string) => {
    try {
      const fullData = JSON.parse(jsonString);
      if (!fullData.profiles || !fullData.data) throw new Error("Invalid Backup File");

      // Save Profiles
      dbService.saveProfiles(fullData.profiles);
      if (fullData.activeProfileId) dbService.setActiveProfileId(fullData.activeProfileId);

      // Save Profile Data
      Object.keys(fullData.data).forEach(pId => {
        dbService.saveTransactions(pId, fullData.data[pId].transactions);
        dbService.saveCategories(pId, fullData.data[pId].categories);
      });

      return true;
    } catch (e) {
      console.error("Restore failed:", e);
      return false;
    }
  },


  clearAll: () => {
    localStorage.clear();
  }
};
