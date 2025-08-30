import { ethers } from 'ethers';

export type Certification = {
	producer: string;
	amount: bigint;
	requestId: bigint;
	expiry: bigint;
	certifier: string;
};

export const domain = (chainId: number) => ({
	name: 'HydroCred',
	version: '1',
	chainId,
});

export const types = {
	Certification: [
		{ name: 'producer', type: 'address' },
		{ name: 'amount', type: 'uint256' },
		{ name: 'requestId', type: 'uint256' },
		{ name: 'expiry', type: 'uint256' },
		{ name: 'certifier', type: 'address' },
	],
};

export async function signCertification(wallet: ethers.Wallet, chainId: number, c: Certification) {
	return await wallet.signTypedData(domain(chainId), types as any, c as any);
}

export function verifyCertificationSignature(chainId: number, c: Certification, signature: string) {
	return ethers.verifyTypedData(domain(chainId), types as any, c as any, signature);
}