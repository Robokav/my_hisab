
import { Transaction, Category, Profile, MonthlyOpeningBalance, OpeningBalanceEntry } from '../types';

// Standardized keys for long-term persistence
const STORAGE_VERSION = 'v5';
const PROFILES_KEY = `hisab_pro_profiles_${STORAGE_VERSION}`;
const ACTIVE_PROFILE_ID_KEY = `hisab_pro_active_profile_id_${STORAGE_VERSION}`;
const SCHEMA_VERSION_KEY = 'hisab_pro_schema_version';
const MONTHLY_OPENING_BALANCES_KEY = `hisab_pro_monthly_opening_${STORAGE_VERSION}`;

export const dbService = {
  migrate: () => {
    const currentVersion = localStorage.getItem(SCHEMA_VERSION_KEY);
    if (!currentVersion || currentVersion === 'v4') {
      const oldProfiles = localStorage.getItem('hisab_pro_profiles_v4');
      const oldActiveId = localStorage.getItem('hisab_pro_active_profile_id_v4');
      if (oldProfiles) localStorage.setItem(PROFILES_KEY, oldProfiles);
      if (oldActiveId) localStorage.setItem(ACTIVE_PROFILE_ID_KEY, oldActiveId);
      localStorage.setItem(SCHEMA_VERSION_KEY, STORAGE_VERSION);
    }
  },

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

  getMonthlyOpeningBalances: (): MonthlyOpeningBalance[] => {
    const saved = localStorage.getItem(MONTHLY_OPENING_BALANCES_KEY);
    return saved ? JSON.parse(saved) : [];
  },

  saveMonthlyOpeningBalance: (profileId: string, year: number, month: number, entries: OpeningBalanceEntry[]) => {
    const all = dbService.getMonthlyOpeningBalances();
    const filtered = all.filter(b => !(b.profileId === profileId && b.year === year && b.month === month));
    filtered.push({ profileId, year, month, entries });
    localStorage.setItem(MONTHLY_OPENING_BALANCES_KEY, JSON.stringify(filtered));
  },

  getMonthlyOpeningBalanceObj: (profileId: string, year: number, month: number): MonthlyOpeningBalance | null => {
    const all = dbService.getMonthlyOpeningBalances();
    return all.find(b => b.profileId === profileId && b.year === year && b.month === month) || null;
  },

  getMonthlyOpeningBalanceTotal: (profileId: string, year: number, month: number): number => {
    const found = dbService.getMonthlyOpeningBalanceObj(profileId, year, month);
    if (!found) return 0;
    return found.entries.reduce((sum, entry) => sum + entry.amount, 0);
  },

  deleteProfileData: (profileId: string) => {
    localStorage.removeItem(`profile_${profileId}_transactions`);
    localStorage.removeItem(`profile_${profileId}_categories`);
    const allBal = dbService.getMonthlyOpeningBalances();
    localStorage.setItem(MONTHLY_OPENING_BALANCES_KEY, JSON.stringify(allBal.filter(b => b.profileId !== profileId)));
  },

  exportFullBackup: () => {
    const profiles = dbService.getProfiles();
    const fullData: any = {
      version: STORAGE_VERSION,
      exportDate: new Date().toISOString(),
      profiles: profiles,
      activeProfileId: dbService.getActiveProfileId(),
      monthlyOpeningBalances: dbService.getMonthlyOpeningBalances(),
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

  importFullBackup: (jsonString: string) => {
    try {
      const fullData = JSON.parse(jsonString);
      if (!fullData.profiles || !fullData.data) throw new Error("Invalid Backup File");
      dbService.saveProfiles(fullData.profiles);
      if (fullData.activeProfileId) dbService.setActiveProfileId(fullData.activeProfileId);
      if (fullData.monthlyOpeningBalances) localStorage.setItem(MONTHLY_OPENING_BALANCES_KEY, JSON.stringify(fullData.monthlyOpeningBalances));
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
