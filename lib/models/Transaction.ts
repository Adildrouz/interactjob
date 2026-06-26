import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type TransactionMethod = 'paypal' | 'bank_transfer';
export type TransactionPlan = 'pack_sponsoring' | 'pro' | 'business';

export interface ITransaction extends Document {
  employer_id: Types.ObjectId;
  plan: TransactionPlan;
  amount: number;
  currency: string;
  method: TransactionMethod;
  paypal_order_id?: string;
  proof_url?: string;
  status: TransactionStatus;
  admin_note?: string;
  is_seed?: boolean;
  created_at: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    employer_id: { type: Schema.Types.ObjectId, ref: 'Employer', required: true },
    plan: { type: String, enum: ['pack_sponsoring', 'pro', 'business'], required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'MAD' },
    method: { type: String, enum: ['paypal', 'bank_transfer'], required: true },
    paypal_order_id: String,
    proof_url: String,
    status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
    admin_note: String,
    is_seed: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

TransactionSchema.index({ employer_id: 1, created_at: -1 });
TransactionSchema.index({ status: 1 });

export const Transaction: Model<ITransaction> =
  mongoose.models.Transaction ?? mongoose.model<ITransaction>('Transaction', TransactionSchema);
