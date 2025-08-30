import { Request, Response } from 'express';
import { z } from 'zod';
import { connectToDatabase } from '../services/db';
import { ProductionRequest } from '../models/ProductionRequest';
import { TransactionLog } from '../models/TransactionLog';
import { ethers } from 'ethers';
import { signCertification } from '../services/signing';
import { config } from '../config/env';

export async function certifyRequest(req: Request, res: Response) {
	await connectToDatabase();
	const schema = z.object({ requestId: z.number(), expiry: z.number().int().positive().optional() });
	const { requestId, expiry } = schema.parse(req.body);
	const admin = (req as any).walletAddress as string;
	const pr = await ProductionRequest.findOne({ requestId });
	if (!pr) return res.status(404).json({ error: 'Request not found' });
	if (pr.status !== 'PENDING') return res.status(400).json({ error: 'Already processed' });

	// Basic fraud prevention: ensure no other certified record with same dataHash
	const dup = await ProductionRequest.findOne({ dataHash: pr.dataHash, status: { $in: ['CERTIFIED', 'MINTED'] } });
	if (dup) return res.status(409).json({ error: 'Duplicate certification detected' });

	// Create a signer from admin private key (relayer-based demo)
	const pk = process.env.CERTIFIER_PRIVATE_KEY || process.env.RELAYER_PRIVATE_KEY || '';
	if (!pk) return res.status(500).json({ error: 'Certifier key not configured' });
	const provider = new ethers.JsonRpcProvider(config.rpcUrl);
	const wallet = new ethers.Wallet(pk, provider);
	const network = await provider.getNetwork();
	const chainId = Number(network.chainId);

	const exp = BigInt(expiry || Math.floor(Date.now() / 1000) + 3600);
	const certification = {
		producer: pr.producer,
		amount: BigInt(pr.amountKg),
		requestId: BigInt(pr.requestId),
		expiry: exp,
		certifier: admin,
	};
	const signature = await signCertification(wallet, chainId, certification as any);
	await ProductionRequest.updateOne({ _id: pr._id }, { $set: { status: 'CERTIFIED', cityAdmin: admin, certSignature: signature, expiry: Number(exp) } });
	await TransactionLog.create({ kind: 'CERTIFY', actor: admin, meta: { requestId, signature } });
	res.json({ success: true, signature, certification });
}