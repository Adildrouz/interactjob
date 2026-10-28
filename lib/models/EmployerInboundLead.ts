import mongoose, { Schema, models, model } from "mongoose";

export interface IEmployerInboundLead {
  company_name: string;
  sector: string;
  sector_other?: string;
  email: string;
  message: string;
  locale?: string;
  status: "new" | "contacted" | "converted" | "closed";
  created_at: Date;
  contacted_at?: Date;
  notes?: string;
  admin_notification?: "pending" | "sent" | "failed";
  acknowledgement?: "pending" | "sent" | "failed" | "skipped";
}

const EmployerInboundLeadSchema = new Schema<IEmployerInboundLead>(
  {
    company_name: { type: String, required: true, trim: true },
    sector: { type: String, default: "" },
    sector_other: { type: String, default: "" },
    email: { type: String, required: true, trim: true, lowercase: true },
    message: { type: String, default: "" },
    locale: { type: String, default: "fr" },
    status: { type: String, enum: ["new", "contacted", "converted", "closed"], default: "new" },
    created_at: { type: Date, default: Date.now },
    contacted_at: Date,
    notes: { type: String, default: "" },
    admin_notification: { type: String, enum: ["pending", "sent", "failed"] },
    acknowledgement: { type: String, enum: ["pending", "sent", "failed", "skipped"] },
  },
  { collection: "employer_inbound_leads" }
);

export const EmployerInboundLead =
  (models.EmployerInboundLead as mongoose.Model<IEmployerInboundLead>) ||
  model<IEmployerInboundLead>("EmployerInboundLead", EmployerInboundLeadSchema);
