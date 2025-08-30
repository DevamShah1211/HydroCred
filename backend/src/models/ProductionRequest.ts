import mongoose, { Schema, Document, Model } from 'mongoose';

export type RequestStatus = 'PENDING' | 'CERTIFIED' | 'REJECTED' | 'MINTED';

export interface IProductionRequest extends Document {
	requestId: number; // monotonic per DB
	producer: string; // wallet
	cityAdmin?: string; // assigned certifier wallet
	amountKg: number; // equals tokens to mint
	dataHash: string; // hash of uploaded docs and metadata to prevent double cert
	status: RequestStatus;
	certSignature?: string; // EIP712 signature by city admin
	expiry?: number; // unix seconds
	createdAt: Date;
	updatedAt: Date;
}

const ProductionRequestSchema = new Schema<IProductionRequest>(
	{
		requestId: { type: Number, required: true, unique: true, index: true },
		producer: { type: String, required: true, index: true },
		cityAdmin: { type: String },
		amountKg: { type: Number, required: true },
		dataHash: { type: String, required: true, index: true },
		status: { type: String, required: true, default: 'PENDING' },
		certSignature: { type: String },
		expiry: { type: Number },
	},
	{ timestamps: true }
);

export const ProductionRequest: Model<IProductionRequest> =
	mongoose.models.ProductionRequest ||
	mongoose.model<IProductionRequest>('ProductionRequest', ProductionRequestSchema);