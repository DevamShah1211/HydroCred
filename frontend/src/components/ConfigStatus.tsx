import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Settings } from 'lucide-react';
import { checkHealth } from '../lib/api';

interface ConfigStatusProps {
  className?: string;
}

interface HealthStatus {
  status: string;
  configuration: {
    rpcUrl: string;
    contractAddress: string;
  };
  blockchain: {
    connected: boolean;
    contractDeployed: boolean;
  };
}

export default function ConfigStatus({ className = '' }: ConfigStatusProps) {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkConfigStatus();
  }, []);

  const checkConfigStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const status = await checkHealth();
      setHealthStatus(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check configuration');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-gray-800 border border-gray-700 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-2">
          <Settings className="h-5 w-5 text-gray-400 animate-spin" />
          <span className="text-gray-400">Checking configuration...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-900/20 border border-red-700 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-2">
          <XCircle className="h-5 w-5 text-red-400" />
          <span className="text-red-400">Configuration check failed: {error}</span>
        </div>
      </div>
    );
  }

  if (!healthStatus) {
    return null;
  }

  const hasIssues = !healthStatus.blockchain.connected || !healthStatus.blockchain.contractDeployed;

  if (!hasIssues) {
    return (
      <div className={`bg-green-900/20 border border-green-700 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-green-400" />
          <span className="text-green-400">Configuration is valid</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-amber-900/20 border border-amber-700 rounded-lg p-4 ${className}`}>
      <div className="flex items-start space-x-2">
        <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-amber-400 font-medium mb-2">Configuration Issues Detected</h3>
          <div className="space-y-1 text-sm text-amber-300">
            {!healthStatus.blockchain.connected && (
              <div>• RPC URL not configured - blockchain connection unavailable</div>
            )}
            {!healthStatus.blockchain.contractDeployed && (
              <div>• Smart contract not deployed - contract address missing or invalid</div>
            )}
          </div>
          <div className="mt-3 text-xs text-amber-400">
            Please check your .env file and ensure all required variables are set correctly.
          </div>
        </div>
      </div>
    </div>
  );
}