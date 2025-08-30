import { Request, Response } from 'express';
import { z } from 'zod';
import { connectToDatabase } from '../services/db';
import { TransactionLog } from '../models/TransactionLog';
import { ethers } from 'ethers';
import Marketplace from '../abi/Marketplace.json';
import { config } from '../config/env';

export async function createListing(req: Request, res: Response) {
	const schema = z.object({ amount: z.number().positive(), pricePerTokenWei: z.string() });
	const { amount, pricePerTokenWei } = schema.parse(req.body);
	const wallet = (req as any).walletAddress as string;
	try {
		const provider = new ethers.JsonRpcProvider(config.rpcUrl);
		const relayerPk = process.env.RELAYER_PRIVATE_KEY || '';
		const relayer = new ethers.Wallet(relayerPk, provider);
		const market = new ethers.Contract(process.env.MARKETPLACE_ADDRESS || '', Marketplace as any, relayer);
		const tx = await market.createListing(BigInt(amount), BigInt(pricePerTokenWei), { gasLimit: 2_000_000 });
		const receipt = await tx.wait();
		await connectToDatabase();
		await TransactionLog.create({ kind: 'LIST', actor: wallet, meta: { amount, pricePerTokenWei }, blockNumber: receipt?.blockNumber, transactionHash: receipt?.hash });
		res.json({ success: true, txHash: receipt?.hash });
	} catch (e: any) {
		res.status(500).json({ error: 'Listing failed', details: e?.message });
	}
}

export async function buy(req: Request, res: Response) {
	const schema = z.object({ listingId: z.number(), amount: z.number() });
	const { listingId, amount } = schema.parse(req.body);
	const buyer = (req as any).walletAddress as string;
	try {
		const provider = new ethers.JsonRpcProvider(config.rpcUrl);
		const relayerPk = process.env.RELAYER_PRIVATE_KEY || '';
		const relayer = new ethers.Wallet(relayerPk, provider);
		const market = new ethers.Contract(process.env.MARKETPLACE_ADDRESS || '', Marketplace as any, relayer);
		// For demo, price is fetched off-chain; in production would read listing
		const pricePerTokenWei = BigInt(req.body.pricePerTokenWei || '0');
		const value = BigInt(amount) * pricePerTokenWei;
		const tx = await market.buy(BigInt(listingId), BigInt(amount), { value });
		const receipt = await tx.wait();
		await connectToDatabase();
		await TransactionLog.create({ kind: 'BUY', actor: buyer, meta: { listingId, amount }, blockNumber: receipt?.blockNumber, transactionHash: receipt?.hash });
		res.json({ success: true, txHash: receipt?.hash });
	} catch (e: any) {
		res.status(500).json({ error: 'Buy failed', details: e?.message });
	}
}