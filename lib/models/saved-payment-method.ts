/** Saved card mirror — `users/{uid}/payment_methods/{id}`. */
export type SavedPaymentMethod = {
  id: string;
  stripePaymentMethodId: string;
  type: "card";
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
  displayLabel: string;
  createdAt: Date;
  updatedAt: Date;
};
