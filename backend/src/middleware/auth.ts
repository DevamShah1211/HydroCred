import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_dev_secret';

export function signLoginToken(walletAddress: string) {
	return jwt.sign({ walletAddress }, JWT_SECRET, { expiresIn: '7d' });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
	const authHeader = req.headers.authorization;
	if (!authHeader) return res.status(401).json({ error: 'Missing auth header' });
	const token = authHeader.split(' ')[1];
	try {
		const payload = jwt.verify(token, JWT_SECRET) as { walletAddress: string };
		(req as any).walletAddress = payload.walletAddress;
		return next();
	} catch {
		return res.status(401).json({ error: 'Invalid token' });
	}
}

export function requireRole(roles: string[]) {
	return (req: Request, res: Response, next: NextFunction) => {
		const role = (req as any).role as string | undefined;
		if (!role || !roles.includes(role)) return res.status(403).json({ error: 'Forbidden' });
		next();
	};
}