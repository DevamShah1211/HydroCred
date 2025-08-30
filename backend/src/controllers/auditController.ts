import { Request, Response } from 'express';
import { stringify } from 'csv-stringify/sync';
import { connectToDatabase } from '../services/db';
import { TransactionLog } from '../models/TransactionLog';

export async function exportAudit(req: Request, res: Response) {
	await connectToDatabase();
	const logs = await TransactionLog.find().sort({ _id: -1 }).lean();
	const format = (req.query.format as string) || 'json';
	if (format === 'csv') {
		const csv = stringify(logs.map(l => ({
			kind: l.kind,
			actor: l.actor,
			blockNumber: l.blockNumber || '',
			transactionHash: l.transactionHash || '',
			meta: JSON.stringify(l.meta || {}),
			createdAt: l.createdAt?.toISOString?.() || '',
		})), { header: true });
		res.setHeader('Content-Type', 'text/csv');
		res.send(csv);
		return;
	}
	res.json({ logs });
}