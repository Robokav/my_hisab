
export type TransactionType = 'INCOME' | 'EXPENSE';
export type PaymentMode = 'CASH' | 'UPI' | 'CARD' | 'BANK' | 'WALLET' | 'NET_BANKING' | 'OTHER';

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
  createdAt: string; // ISO timestamp for sorting
  type: TransactionType;
  paymentMode: PaymentMode;
}

export type ReportPeriod = 'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH' | 'YEAR';

export interface HisabStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  categoryData: { name: string; value: number; color: string }[];
  timeSeriesData: { label: string; income: number; expense: number }[];
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
