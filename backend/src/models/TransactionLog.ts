import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITransactionLog extends Document {
	kind: 'REQUEST' | 'CERTIFY' | 'MINT' | 'LIST' | 'BUY' | 'RETIRE';
	actor: string; // wallet
	meta: Record<string, any>;
	blockNumber?: number;
	transactionHash?: string;
	createdAt: Date;
}

const TransactionLogSchema = new Schema<ITransactionLog>(
	{
		kind: { type: String, required: true },
		actor: { type: String, required: true, index: true },
		meta: { type: Schema.Types.Mixed, default: {} },
		blockNumber: { type: Number },
		transactionHash: { type: String, index: true },
	},
	{ timestamps: { createdAt: true, updatedAt: false } }
);

export const TransactionLog: Model<ITransactionLog> =
	mongoose.models.TransactionLog ||
	mongoose.model<ITransactionLog>('TransactionLog', TransactionLogSchema);