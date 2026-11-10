export type QuoteLineItem = {
  id: string;
  label: string;
  amount: number;
  category: string;
  isInternal: boolean;
};

export type QuoteResult = {
  subtotal: number;
  taxAmount: number;
  total: number;
  currencyCode: string;
  breakdown: QuoteLineItem[];
  displayTotal: number;
  quotedPricesIncludeTax: boolean;
  quotedTaxRate: number;
};
