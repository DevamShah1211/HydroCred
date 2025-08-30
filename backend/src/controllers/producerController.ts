import { Request, Response } from 'express';
import { z } from 'zod';
import { connectToDatabase } from '../services/db';
import { ProductionRequest } from '../models/ProductionRequest';
import { TransactionLog } from '../models/TransactionLog';
import { ethers } from 'ethers';
import HydroCredToken from '../abi/HydroCredToken.json';
import { config } from '../config/env';

export async function createProductionRequest(req: Request, res: Response) {
	await connectToDatabase();
	const schema = z.object({ amountKg: z.number().positive(), dataHash: z.string() });
	const { amountKg, dataHash } = schema.parse(req.body);
	const walletAddress = (req as any).walletAddress as string;

	const last = await ProductionRequest.findOne().sort({ requestId: -1 });
	const nextId = (last?.requestId || 0) + 1;
	const pr = await ProductionRequest.create({
		requestId: nextId,
		producer: walletAddress,
		amountKg,
		dataHash,
		status: 'PENDING',
	});
	await TransactionLog.create({ kind: 'REQUEST', actor: walletAddress, meta: { requestId: nextId, amountKg, dataHash } });
	res.json({ success: true, request: pr });
}

export async function claimMint(req: Request, res: Response) {
	await connectToDatabase();
	const schema = z.object({ requestId: z.number(), signature: z.string() });
	const { requestId, signature } = schema.parse(req.body);
	const walletAddress = (req as any).walletAddress as string;
	const pr = await ProductionRequest.findOne({ requestId });
	if (!pr) return res.status(404).json({ error: 'Request not found' });
	if (pr.producer.toLowerCase() !== walletAddress.toLowerCase()) return res.status(403).json({ error: 'Not your request' });
	if (pr.status !== 'CERTIFIED') return res.status(400).json({ error: 'Not certified yet' });

	const provider = new ethers.JsonRpcProvider(config.rpcUrl);
	const pk = process.env.RELAYER_PRIVATE_KEY || '';
	if (!pk) return res.status(500).json({ error: 'Relayer not configured' });
	const wallet = new ethers.Wallet(pk, provider);
	const token = new ethers.Contract(config.contractAddress, HydroCredToken as any, wallet);

	try {
		const expiry = BigInt(pr.expiry || Math.floor(Date.now() / 1000) + 3600);
		const certification = {
			producer: walletAddress,
			amount: BigInt(pr.amountKg),
			requestId: BigInt(pr.requestId),
			expiry,
			certifier: pr.cityAdmin!,
		};
		const tx = await token.claimMint(certification, signature);
		const receipt = await tx.wait();
		await ProductionRequest.updateOne({ _id: pr._id }, { $set: { status: 'MINTED' } });
		await TransactionLog.create({ kind: 'MINT', actor: walletAddress, meta: { requestId }, blockNumber: receipt?.blockNumber, transactionHash: receipt?.hash });
		res.json({ success: true, txHash: receipt?.hash });
	} catch (e: any) {
		res.status(500).json({ error: 'Mint failed', details: e?.message });
	}
}