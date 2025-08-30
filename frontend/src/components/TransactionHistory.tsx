import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, ExternalLink, ArrowRight, Shield, Trash2 } from 'lucide-react';
import { getCreditEvents } from '../lib/mockChain';
import { getExplorerUrl } from '../lib/chain';

interface Transaction {
  hash: string;
  from: string;
  to: string;
  type: 'issue' | 'transfer' | 'retire';
  tokenId?: number;
  amount?: number;
  fromId?: number;
  toId?: number;
  timestamp: number;
  blockNumber: number;
  status: 1 | 0;
}

interface TransactionHistoryProps {
  walletAddress?: string | null;
  maxItems?: number;
  showTitle?: boolean;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ 
  walletAddress, 
  maxItems = 10,
  showTitle = true 
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, [walletAddress]);

  const loadTransactions = async () => {
    try {
      const events = getCreditEvents();
      
      // Filter by wallet if provided
      let filteredEvents = events;
      if (walletAddress) {
        filteredEvents = events.filter(event => 
          event.from === walletAddress || event.to === walletAddress
        );
      }
      
      // Take only the most recent transactions
      const recentTransactions = filteredEvents.slice(0, maxItems);
      setTransactions(recentTransactions);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'issue':
        return <Shield className="h-4 w-4 text-green-500" />;
      case 'transfer':
        return <ArrowRight className="h-4 w-4 text-blue-500" />;
      case 'retire':
        return <Trash2 className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTransactionDescription = (tx: Transaction) => {
    switch (tx.type) {
      case 'issue':
        return `Issued ${tx.amount} credits (${tx.fromId}-${tx.toId}) to ${formatAddress(tx.to)}`;
      case 'transfer':
        return `Transferred credit #${tx.tokenId} from ${formatAddress(tx.from)} to ${formatAddress(tx.to)}`;
      case 'retire':
        return `Retired credit #${tx.tokenId}`;
      default:
        return 'Unknown transaction';
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 bg-gray-700 rounded-lg"></div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {showTitle && (
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Clock className="h-5 w-5 mr-2 text-brand" />
          Recent Transactions
        </h3>
      )}
      
      <div className="space-y-3">
        {transactions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No transactions found
          </p>
        ) : (
          transactions.map((tx, index) => (
            <motion.div
              key={tx.hash}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:bg-gray-800/70 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {getTransactionIcon(tx.type)}
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">
                      {getTransactionDescription(tx)}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {formatTimestamp(tx.timestamp)} • Block {tx.blockNumber}
                    </div>
                    <div className="text-xs text-gray-500 font-mono mt-1">
                      {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                    </div>
                  </div>
                </div>
                
                <a
                  href={getExplorerUrl(tx.hash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-brand transition-colors ml-2"
                  title="View on explorer"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </motion.div>
          ))
        )}
      </div>
      
      {transactions.length === maxItems && (
        <div className="text-center mt-4">
          <button
            onClick={loadTransactions}
            className="text-sm text-brand hover:text-brand-accent transition-colors"
          >
            Load more transactions
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;