import mongoose, { Schema, Document, Model } from 'mongoose';

export type UserRole = 'COUNTRY_ADMIN' | 'STATE_ADMIN' | 'CITY_ADMIN' | 'PRODUCER' | 'BUYER' | 'AUDITOR' | 'PENDING';

export interface IUser extends Document {
	walletAddress: string;
	role: UserRole;
	parentAdmin?: string; // approver wallet
	createdAt: Date;
	updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
	{
		walletAddress: { type: String, required: true, unique: true, index: true },
		role: { type: String, required: true, default: 'PENDING' },
		parentAdmin: { type: String },
	},
	{ timestamps: true }
);

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);