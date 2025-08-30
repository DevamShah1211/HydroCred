import { Request, Response } from 'express';
import { z } from 'zod';
import { User } from '../models/User';
import { signLoginToken } from '../middleware/auth';
import { connectToDatabase } from '../services/db';

const nonces = new Map<string, string>();

export async function getNonce(req: Request, res: Response) {
	const schema = z.object({ address: z.string() });
	const { address } = schema.parse(req.query);
	const nonce = Math.random().toString(36).slice(2);
	nonces.set(address.toLowerCase(), nonce);
	res.json({ address, nonce, message: `Sign this message to login: ${nonce}` });
}

export async function login(req: Request, res: Response) {
	const schema = z.object({ address: z.string(), signature: z.string(), message: z.string() });
	const { address, signature, message } = schema.parse(req.body);
	const expected = nonces.get(address.toLowerCase());
	if (!expected || !message.endsWith(expected)) {
		return res.status(400).json({ error: 'Invalid nonce' });
	}
	try {
		const recovered = (await import('ethers')).ethers.verifyMessage(message, signature);
		if (recovered.toLowerCase() !== address.toLowerCase()) {
			return res.status(401).json({ error: 'Bad signature' });
		}
		nonces.delete(address.toLowerCase());
		await connectToDatabase();
		const user = await User.findOneAndUpdate(
			{ walletAddress: address.toLowerCase() },
			{ $setOnInsert: { role: 'PENDING' } },
			{ new: true, upsert: true }
		);
		const token = signLoginToken(address.toLowerCase());
		res.json({ token, user });
	} catch (e) {
		res.status(500).json({ error: 'Login failed' });
	}
}

export async function profile(req: Request, res: Response) {
	await connectToDatabase();
	const address = (req as any).walletAddress as string;
	const user = await User.findOne({ walletAddress: address.toLowerCase() });
	res.json({ user });
}

export async function approveRole(req: Request, res: Response) {
	await connectToDatabase();
	const schema = z.object({ target: z.string(), role: z.string(), approver: z.string().optional() });
	const { target, role } = schema.parse(req.body);
	const updated = await User.findOneAndUpdate(
		{ walletAddress: target.toLowerCase() },
		{ $set: { role: role as any, parentAdmin: (req as any).walletAddress } },
		{ new: true }
	);
	if (!updated) return res.status(404).json({ error: 'User not found' });
	res.json({ success: true, user: updated });
}