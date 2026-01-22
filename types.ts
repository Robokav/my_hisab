
export type TransactionType = 'INCOME' | 'EXPENSE';
export type PaymentMode = 'CASH' | 'UPI' | 'CARD' | 'BANK' | 'WALLET' | 'NET_BANKING' | 'OTHER';

export interface Profile {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt: string;
}

export interface OpeningBalanceEntry {
  id: string;
  source: string;
  amount: number;
}

export interface MonthlyOpeningBalance {
  profileId: string;
  year: number;
  month: number;
  entries: OpeningBalanceEntry[];
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
}

export interface Transaction {
  id: string;
  amount: number;
  quantity: number;
  unit: string;
  description: string;
  categoryId: string;
  categoryName: string;
  date: string;
  createdAt: string; 
  type: TransactionType;
  paymentMode: PaymentMode;
}

export type ReportPeriod = 'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH' | 'YEAR';

export interface HisabStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  openingBalance: number;
  incomeCount: number;
  expenseCount: number;
  totalCount: number;
  categoryData: { name: string; value: number; color: string }[];
  timeSeriesData: { label: string; income: number; expense: number }[];
  daySpan: number;
}

export interface AiParsedTransaction {
  amount: number;
  quantity?: number;
  unit?: string;
  description: string;
  category: string;
  type: TransactionType;
  paymentMode: PaymentMode;
}
