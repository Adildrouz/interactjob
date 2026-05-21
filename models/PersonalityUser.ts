import mongoose, { Schema, type Document, type Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IPersonalityUser extends Document {
  email: string;
  password: string;
  name: string;
  role: 'user' | 'admin';
  assessments: mongoose.Types.ObjectId[];
  createdAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const Schema_ = new Schema<IPersonalityUser>(
  {
    email:       { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:    { type: String, required: true, minlength: 8, select: false },
    name:        { type: String, required: true, trim: true },
    role:        { type: String, enum: ['user', 'admin'], default: 'user' },
    assessments: [{ type: Schema.Types.ObjectId, ref: 'PersonalityAssessment' }],
  },
  { timestamps: true, collection: 'personality_users' },
);

Schema_.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

Schema_.methods.comparePassword = function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

const PersonalityUserModel: Model<IPersonalityUser> =
  (mongoose.models.PersonalityUser as Model<IPersonalityUser>) ||
  mongoose.model<IPersonalityUser>('PersonalityUser', Schema_);

export default PersonalityUserModel;
