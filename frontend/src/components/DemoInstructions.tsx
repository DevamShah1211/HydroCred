import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HelpCircle, 
  X, 
  Shield, 
  Building, 
  Users, 
  Eye, 
  ArrowRight, 
  Zap,
  CheckCircle,
  PlayCircle
} from 'lucide-react';

interface DemoInstructionsProps {
  currentRole?: string;
}

const DemoInstructions: React.FC<DemoInstructionsProps> = ({ currentRole }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const demoSteps = [
    {
      id: 'wallet-switch',
      title: 'Switch Between Wallets',
      description: 'Use the wallet selector in the top-right corner to switch between different roles',
      icon: <Zap className="h-6 w-6" />,
      details: [
        'Click the wallet button to see available demo wallets',
        'Each wallet represents a different role in the system',
        'Switch wallets to experience different perspectives',
        'All data persists when switching between wallets'
      ]
    },
    {
      id: 'certifier-role',
      title: 'Issue Credits (Certifier)',
      description: 'Switch to Certifier wallet and issue credits to producers',
      icon: <Shield className="h-6 w-6" />,
      details: [
        'Navigate to the Certifier dashboard',
        'Use the quick buttons to select producer addresses',
        'Issue 1-1000 credits at once',
        'Watch the transaction complete with realistic delays'
      ]
    },
    {
      id: 'producer-role',
      title: 'Transfer Credits (Producer)',
      description: 'Switch to Producer wallet and transfer credits to buyers',
      icon: <Building className="h-6 w-6" />,
      details: [
        'Switch to Producer wallet to see your credits',
        'Select a credit to transfer',
        'Use quick buttons to choose recipient addresses',
        'Complete the transfer and see ownership change'
      ]
    },
    {
      id: 'buyer-role',
      title: 'Retire Credits (Buyer)',
      description: 'Switch to Buyer wallet and retire credits for carbon offsetting',
      icon: <Users className="h-6 w-6" />,
      details: [
        'Switch to Buyer wallet to see purchased credits',
        'Retire credits to prevent further trading',
        'Download retirement certificates',
        'View your environmental impact'
      ]
    },
    {
      id: 'regulator-role',
      title: 'Monitor System (Regulator)',
      description: 'Switch to Regulator wallet to audit all transactions',
      icon: <Eye className="h-6 w-6" />,
      details: [
        'View complete transaction history',
        'Filter by transaction type',
        'Search by wallet addresses',
        'Monitor system statistics and compliance'
      ]
    }
  ];

  const getCurrentStepByRole = () => {
    switch (currentRole) {
      case 'Certifier Wallet':
        return 1;
      case 'Producer Wallet':
        return 2;
      case 'Buyer Wallet':
        return 3;
      case 'Regulator Wallet':
        return 4;
      default:
        return 0;
    }
  };

  const step = demoSteps[currentStep];

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center space-x-2 px-4 py-3 bg-brand-primary text-white rounded-full shadow-lg hover:bg-brand-primary/80 transition-colors"
      >
        <HelpCircle className="h-5 w-5" />
        <span className="hidden sm:inline">Demo Guide</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <PlayCircle className="h-6 w-6 text-brand-primary" />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    HydroCred Demo Guide
                  </h2>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Step Navigation */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex space-x-2">
                    {demoSteps.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentStep(index)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                          index === currentStep
                            ? 'bg-brand-primary text-white'
                            : index < currentStep
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {index < currentStep ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          index + 1
                        )}
                      </button>
                    ))}
                  </div>
                  
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Step {currentStep + 1} of {demoSteps.length}
                  </div>
                </div>

                {/* Step Content */}
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mb-6"
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-3 bg-brand-primary/10 rounded-lg text-brand-primary">
                      {step.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {step.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {step.details.map((detail, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-brand-primary rounded-full mt-2 flex-shrink-0" />
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                    disabled={currentStep === 0}
                    className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  >
                    Previous
                  </button>

                  <div className="flex space-x-2">
                    {currentRole && (
                      <button
                        onClick={() => setCurrentStep(getCurrentStepByRole())}
                        className="px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Go to Current Role
                      </button>
                    )}
                    
                    {currentStep < demoSteps.length - 1 ? (
                      <button
                        onClick={() => setCurrentStep(currentStep + 1)}
                        className="flex items-center space-x-2 px-4 py-2 text-sm font-medium bg-brand-primary text-white rounded-lg hover:bg-brand-primary/80 transition-colors"
                      >
                        <span>Next</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsOpen(false)}
                        className="px-4 py-2 text-sm font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        Start Demo
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DemoInstructions;