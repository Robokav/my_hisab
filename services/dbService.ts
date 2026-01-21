
import { Transaction, Category, Profile } from '../types';

const PROFILES_KEY = 'hisab_pro_profiles_v4';
const ACTIVE_PROFILE_ID_KEY = 'hisab_pro_active_profile_id_v4';

export const dbService = {
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

  clearAll: () => {
    localStorage.clear();
  }
};
