import { mockBlockchain, MockEvent, MockTransaction } from './mockBlockchain';

export interface CreditEvent {
  type: 'issued' | 'transferred' | 'retired';
  from?: string;
  to?: string;
  amount?: number;
  fromId?: number;
  toId?: number;
  tokenId?: number;
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
  logIndex: number;
}

export interface TransactionResponse {
  hash: string;
  from: string;
  to: string;
  blockNumber: number;
  timestamp: number;
  gasUsed: string;
  status: number;
}

export class MockChainService {
  /**
   * Get all credit events from the mock blockchain
   */
  static async getCreditEvents(fromBlock: number = 0): Promise<CreditEvent[]> {
    try {
      const events = await mockBlockchain.getEvents(fromBlock);
      return events.map(event => ({
        type: event.type,
        from: event.from,
        to: event.to,
        amount: event.amount,
        fromId: event.fromId,
        toId: event.toId,
        tokenId: event.tokenId,
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber,
        timestamp: event.timestamp,
        logIndex: event.logIndex
      }));
    } catch (error) {
      console.error('Error fetching credit events:', error);
      throw new Error('Failed to fetch credit events');
    }
  }

  /**
   * Batch issue credits to a producer
   */
  static async batchIssueCredits(to: string, amount: number, issuedBy: string): Promise<TransactionResponse> {
    try {
      const transaction = await mockBlockchain.batchIssue(to, amount, issuedBy);
      return {
        hash: transaction.hash,
        from: transaction.from,
        to: transaction.to,
        blockNumber: transaction.blockNumber,
        timestamp: transaction.timestamp,
        gasUsed: transaction.gasUsed,
        status: transaction.status
      };
    } catch (error) {
      console.error('Error issuing credits:', error);
      throw error;
    }
  }

  /**
   * Transfer a credit from one address to another
   */
  static async transferCredit(from: string, to: string, tokenId: number): Promise<TransactionResponse> {
    try {
      const transaction = await mockBlockchain.transferCredit(from, to, tokenId);
      return {
        hash: transaction.hash,
        from: transaction.from,
        to: transaction.to,
        blockNumber: transaction.blockNumber,
        timestamp: transaction.timestamp,
        gasUsed: transaction.gasUsed,
        status: transaction.status
      };
    } catch (error) {
      console.error('Error transferring credit:', error);
      throw error;
    }
  }

  /**
   * Retire a credit (make it non-transferable)
   */
  static async retireCredit(tokenId: number, retiredBy: string): Promise<TransactionResponse> {
    try {
      const transaction = await mockBlockchain.retireCredit(tokenId, retiredBy);
      return {
        hash: transaction.hash,
        from: transaction.from,
        to: transaction.to,
        blockNumber: transaction.blockNumber,
        timestamp: transaction.timestamp,
        gasUsed: transaction.gasUsed,
        status: transaction.status
      };
    } catch (error) {
      console.error('Error retiring credit:', error);
      throw error;
    }
  }

  /**
   * Get all tokens owned by an address
   */
  static async getOwnedTokens(owner: string): Promise<number[]> {
    try {
      return await mockBlockchain.getOwnedTokens(owner);
    } catch (error) {
      console.error('Error fetching owned tokens:', error);
      throw new Error('Failed to fetch owned tokens');
    }
  }

  /**
   * Get the owner of a specific token
   */
  static async getTokenOwner(tokenId: number): Promise<string> {
    try {
      return await mockBlockchain.getTokenOwner(tokenId);
    } catch (error) {
      console.error('Error fetching token owner:', error);
      throw new Error('Failed to fetch token owner');
    }
  }

  /**
   * Check if a token is retired
   */
  static async isTokenRetired(tokenId: number): Promise<boolean> {
    try {
      return await mockBlockchain.isTokenRetired(tokenId);
    } catch (error) {
      console.error('Error checking token retirement status:', error);
      throw new Error('Failed to check token retirement status');
    }
  }

  /**
   * Check if an address has a specific role
   */
  static async hasRole(role: string, address: string): Promise<boolean> {
    try {
      return await mockBlockchain.hasRole(role, address);
    } catch (error) {
      console.error('Error checking role:', error);
      throw new Error('Failed to check role');
    }
  }

  /**
   * Get the balance of credits for an address
   */
  static async getBalance(address: string): Promise<number> {
    try {
      return await mockBlockchain.getBalance(address);
    } catch (error) {
      console.error('Error fetching balance:', error);
      throw new Error('Failed to fetch balance');
    }
  }

  /**
   * Get transaction details by hash
   */
  static async getTransaction(hash: string): Promise<TransactionResponse | null> {
    try {
      const transaction = await mockBlockchain.getTransaction(hash);
      if (!transaction) return null;
      
      return {
        hash: transaction.hash,
        from: transaction.from,
        to: transaction.to,
        blockNumber: transaction.blockNumber,
        timestamp: transaction.timestamp,
        gasUsed: transaction.gasUsed,
        status: transaction.status
      };
    } catch (error) {
      console.error('Error fetching transaction:', error);
      throw new Error('Failed to fetch transaction');
    }
  }

  /**
   * Check if an address is a certifier
   */
  static async isCertifier(address: string): Promise<boolean> {
    try {
      return await mockBlockchain.hasRole('CERTIFIER_ROLE', address);
    } catch (error) {
      console.error('Error checking certifier status:', error);
      return false;
    }
  }

  /**
   * Check if an address is an admin
   */
  static async isAdmin(address: string): Promise<boolean> {
    try {
      return await mockBlockchain.hasRole('DEFAULT_ADMIN_ROLE', address);
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  /**
   * Add a new certifier (admin only)
   */
  static async addCertifier(address: string): Promise<void> {
    try {
      mockBlockchain.addCertifier(address);
    } catch (error) {
      console.error('Error adding certifier:', error);
      throw new Error('Failed to add certifier');
    }
  }

  /**
   * Remove a certifier (admin only)
   */
  static async removeCertifier(address: string): Promise<void> {
    try {
      mockBlockchain.removeCertifier(address);
    } catch (error) {
      console.error('Error removing certifier:', error);
      throw new Error('Failed to remove certifier');
    }
  }

  /**
   * Add a new admin
   */
  static async addAdmin(address: string): Promise<void> {
    try {
      mockBlockchain.addAdmin(address);
    } catch (error) {
      console.error('Error adding admin:', error);
      throw new Error('Failed to add admin');
    }
  }

  /**
   * Reset the mock blockchain to initial state
   */
  static async reset(): Promise<void> {
    try {
      mockBlockchain.reset();
    } catch (error) {
      console.error('Error resetting mock blockchain:', error);
      throw new Error('Failed to reset mock blockchain');
    }
  }

  /**
   * Get mock blockchain data for debugging
   */
  static async getMockData(): Promise<any> {
    try {
      return mockBlockchain.getMockData();
    } catch (error) {
      console.error('Error fetching mock data:', error);
      throw new Error('Failed to fetch mock data');
    }
  }
}