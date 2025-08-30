import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, ExternalLink, Terminal, Settings } from 'lucide-react';
import { isContractConfigured, isDevelopmentMode } from '../lib/chainWrapper';

interface SetupGuideProps {
  onClose?: () => void;
}

const SetupGuide: React.FC<SetupGuideProps> = ({ onClose }) => {
  const contractConfigured = isContractConfigured();
  const devMode = isDevelopmentMode();

  const steps = [
    {
      id: 'env',
      title: 'Environment Configuration',
      description: 'Set up your environment variables',
      completed: true, // We created .env files
      instructions: [
        'Edit the .env file in the project root',
        'Add your RPC_URL (Infura/Alchemy endpoint)',
        'Add your PRIVATE_KEY for contract deployment',
        'Set a secure AES_KEY (32+ characters)',
      ]
    },
    {
      id: 'contract',
      title: 'Smart Contract Deployment',
      description: 'Deploy the HydroCred smart contract',
      completed: contractConfigured,
      instructions: [
        'cd blockchain',
        'npm install',
        'npx hardhat compile',
        'npx hardhat run scripts/deploy.ts --network sepolia',
        'npm run update-addresses',
      ]
    },
    {
      id: 'backend',
      title: 'Backend Server',
      description: 'Start the backend API server',
      completed: false, // We can't easily check this
      instructions: [
        'cd backend',
        'npm install',
        'npm run dev',
      ]
    },
  ];

  if (!devMode && contractConfigured) {
    return null; // Everything is set up properly
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <div className="card max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Settings className="h-6 w-6 text-brand" />
            <h2 className="text-xl font-bold">Setup Required</h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ×
            </button>
          )}
        </div>

        <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-700 rounded-xl">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-400">Configuration Needed</p>
              <p className="text-sm text-yellow-200 mt-1">
                The application requires blockchain configuration to function properly.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {steps.map((step, index) => (
            <div key={step.id} className="border border-gray-700 rounded-xl p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step.completed ? 'bg-green-600' : 'bg-gray-600'
                }`}>
                  {step.completed ? (
                    <CheckCircle className="h-5 w-5 text-white" />
                  ) : (
                    <span className="text-white font-bold">{index + 1}</span>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="text-sm text-gray-400">{step.description}</p>
                </div>
              </div>

              {!step.completed && (
                <div className="ml-11 space-y-2">
                  <p className="text-sm font-medium text-gray-300 mb-2">Instructions:</p>
                  <div className="bg-gray-800 rounded-lg p-3">
                    {step.instructions.map((instruction, i) => (
                      <div key={i} className="flex items-center space-x-2 text-sm font-mono">
                        <Terminal className="h-3 w-3 text-gray-400" />
                        <code className="text-gray-300">{instruction}</code>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700 rounded-xl">
          <div className="flex items-start space-x-3">
            <ExternalLink className="h-5 w-5 text-blue-400 mt-0.5" />
            <div>
              <p className="font-medium text-blue-400">Need Help?</p>
              <p className="text-sm text-blue-200 mt-1">
                Check the DEPLOYMENT_GUIDE.md for detailed setup instructions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SetupGuide;