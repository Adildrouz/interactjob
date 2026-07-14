import mongoose, { Schema, Document, Model } from 'mongoose';

export type ToolName = 'cv_checker' | 'cv_builder' | 'personality_test' | 'email_alerts';
export type TestType = 'mbti' | 'disc' | 'couleurs' | 'enneagramme' | 'professionnel' | null;

export interface IToolEvent extends Document {
  session_id: string;
  tool: ToolName;
  test_type?: TestType;
  event: string;
  metadata?: Record<string, unknown>;
  country?: string | null;
  currency?: string | null;
  referrer?: string | null;
  created_at: Date;
}

const ToolEventSchema = new Schema<IToolEvent>({
  session_id: { type: String, required: true },
  tool:       { type: String, enum: ['cv_checker', 'cv_builder', 'personality_test', 'email_alerts'], required: true },
  test_type:  { type: String, enum: ['mbti', 'disc', 'couleurs', 'enneagramme', 'professionnel', null], default: null },
  event:      { type: String, required: true },
  metadata:   { type: Schema.Types.Mixed, default: {} },
  country:    { type: String, default: null },
  currency:   { type: String, default: null },
  referrer:   { type: String, default: null },
  created_at: { type: Date, default: Date.now },
});

// No PII is ever stored on this collection — session_id is an anonymous,
// client-generated identifier (see lib/trackToolEvent.ts). Never add name/
// email/CV-content fields here.
ToolEventSchema.index({ tool: 1, event: 1, created_at: -1 });
ToolEventSchema.index({ session_id: 1 });
ToolEventSchema.index({ created_at: -1 });

export const ToolEvent: Model<IToolEvent> =
  mongoose.models.ToolEvent ||
  mongoose.model<IToolEvent>('ToolEvent', ToolEventSchema);
