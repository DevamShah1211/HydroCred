import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useWallet } from '../contexts/WalletContext';
import { authAPI } from '../services/api';
import { UserRole } from '../types/user';
import toast from 'react-hot-toast';

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { account, isConnected } = useWallet();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: 'PRODUCER' as UserRole,
    country: '',
    state: '',
    city: '',
    organization: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const roles: { value: UserRole; label: string; description: string }[] = [
    {
      value: 'PRODUCER',
      label: 'Hydrogen Producer',
      description: 'Submit production requests for certification',
    },
    {
      value: 'BUYER',
      label: 'Credit Buyer',
      description: 'Purchase verified hydrogen credits',
    },
    {
      value: 'AUDITOR',
      label: 'Auditor',
      description: 'View and audit system activities',
    },
  ];

  const countries = [
    'United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Japan', 'Australia', 'India', 'China', 'Brazil'
  ];

  const states = {
    'United States': ['California', 'Texas', 'New York', 'Florida', 'Illinois'],
    'Canada': ['Ontario', 'Quebec', 'British Columbia', 'Alberta'],
    'Germany': ['Bavaria', 'North Rhine-Westphalia', 'Baden-Württemberg'],
    'Australia': ['New South Wales', 'Victoria', 'Queensland'],
  };

  const cities = {
    'California': ['Los Angeles', 'San Francisco', 'San Diego'],
    'Texas': ['Houston', 'Dallas', 'Austin'],
    'New York': ['New York City', 'Buffalo', 'Rochester'],
    'Ontario': ['Toronto', 'Ottawa', 'Mississauga'],
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Reset dependent fields when parent field changes
    if (field === 'country') {
      setFormData(prev => ({ ...prev, state: '', city: '' }));
    } else if (field === 'state') {
      setFormData(prev => ({ ...prev, city: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected || !account) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!formData.username.trim()) {
      toast.error('Username is required');
      return;
    }

    // Validate location requirements based on role
    if (['COUNTRY_ADMIN', 'STATE_ADMIN', 'CITY_ADMIN'].includes(formData.role)) {
      if (!formData.country) {
        toast.error('Country is required for admin roles');
        return;
      }
      if (['STATE_ADMIN', 'CITY_ADMIN'].includes(formData.role) && !formData.state) {
        toast.error('State is required for state and city admin roles');
        return;
      }
      if (formData.role === 'CITY_ADMIN' && !formData.city) {
        toast.error('City is required for city admin role');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      
      const response = await authAPI.onboard({
        walletAddress: account,
        ...formData,
      });

      if (response.data.success) {
        toast.success('Account created successfully! Pending admin verification.');
        navigate('/');
      } else {
        throw new Error(response.data.error || 'Failed to create account');
      }
    } catch (error: any) {
      console.error('Onboarding error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create account';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Wallet Connection Required
          </h1>
          <p className="text-gray-600 mb-6">
            Please connect your wallet to continue with onboarding.
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to HydroCred
            </h1>
            <p className="text-gray-600">
              Complete your profile to start using the platform
            </p>
            <div className="mt-4 text-sm text-gray-500">
              Connected: {account?.slice(0, 6)}...{account?.slice(-4)}
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`flex items-center ${
                  step < 3 ? 'flex-1' : ''
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= currentStep
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      step < currentStep ? 'bg-teal-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Basic Information
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Enter your username"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.organization}
                    onChange={(e) => handleInputChange('organization', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Enter your organization name"
                  />
                </div>
              </motion.div>
            )}

            {/* Step 2: Role Selection */}
            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Select Your Role
                </h3>
                
                <div className="space-y-3">
                  {roles.map((role) => (
                    <label
                      key={role.value}
                      className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                        formData.role === role.value
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={role.value}
                        checked={formData.role === role.value}
                        onChange={(e) => handleInputChange('role', e.target.value)}
                        className="mt-1 h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300"
                      />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {role.label}
                        </div>
                        <div className="text-sm text-gray-500">
                          {role.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3: Location Information */}
            {currentStep === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Location Information
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <select
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="">Select a country</option>
                    {countries.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.country && states[formData.country as keyof typeof states] && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State/Province
                    </label>
                    <select
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option value="">Select a state</option>
                      {states[formData.country as keyof typeof states]?.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.state && cities[formData.state as keyof typeof cities] && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <select
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option value="">Select a city</option>
                      {cities[formData.state as keyof typeof cities]?.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </motion.div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white rounded-lg transition-colors"
                >
                  {isSubmitting ? 'Creating Account...' : 'Create Account'}
                </button>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default OnboardingPage;