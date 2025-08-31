import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, CheckCircle, Search, Filter, Globe, Building2, Send } from 'lucide-react';
import CreditRequestForm, { CreditRequest } from './CreditRequestForm';

interface ProducerInfo {
  address: string;
  state: string;
  city: string;
  isVerified: boolean;
}

const ProducerDirectory: React.FC = () => {
  const [producers, setProducers] = useState<ProducerInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [states, setStates] = useState<string[]>([]);
  const [selectedProducer, setSelectedProducer] = useState<ProducerInfo | null>(null);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  useEffect(() => {
    loadProducers();
  }, []);

  const loadProducers = async () => {
    try {
      setIsLoading(true);
      
      // Fetch producers from backend API
      const response = await fetch('http://localhost:5005/api/producers');
      if (!response.ok) {
        throw new Error('Failed to fetch producers');
      }
      
      const data = await response.json();
      if (data.success) {
        setProducers(data.producers);
        
        // Extract unique states
        const uniqueStates = [...new Set(data.producers.map((p: ProducerInfo) => p.state))];
        setStates(uniqueStates);
      } else {
        throw new Error(data.error || 'Failed to load producers');
      }
      
    } catch (error) {
      console.error('Failed to load producers:', error);
      // Fallback to sample data if API fails
      const fallbackProducers: ProducerInfo[] = [
        {
          address: '0x34a0eF8AC40f455C76cE7332844a55442F6e71c9',
          state: 'Maharashtra',
          city: 'Mumbai',
          isVerified: true
        },
        {
          address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
          state: 'Karnataka',
          city: 'Bangalore',
          isVerified: true
        }
      ];
      
      setProducers(fallbackProducers);
      setStates(['Maharashtra', 'Karnataka']);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducers = producers.filter(producer => {
    const matchesSearch = producer.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         producer.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         producer.city.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesState = !selectedState || producer.state === selectedState;
    
    return matchesSearch && matchesState;
  });

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    // You could add a toast notification here
  };

  const handleCreditRequest = async (request: CreditRequest) => {
    try {
      setIsSubmittingRequest(true);
      
      // Send request to backend API
      const response = await fetch('http://localhost:5005/api/credit-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit request');
      }
      
      const data = await response.json();
      
      alert(`Credit request submitted successfully to ${request.producerAddress.slice(0, 6)}...${request.producerAddress.slice(-4)}!\n\nRequest ID: ${data.requestId}\nStatus: ${data.status}\n\nYour request has been sent to the producer. They will review and respond with pricing and terms.`);
      
      // Close the request form
      setSelectedProducer(null);
      
    } catch (error) {
      console.error('Failed to submit credit request:', error);
      alert(`Failed to submit credit request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <Building2 className="h-16 w-16 text-brand mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2">Verified Producer Directory</h1>
        <p className="text-gray-400">
          Discover verified green hydrogen producers in your region
        </p>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center space-x-2 flex-1">
            <Search className="h-4 w-4 text-brand" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by address, state, or city..."
              className="input flex-1"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-brand" />
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="input"
            >
              <option value="">All States</option>
              {states.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Producers List */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-6 flex items-center">
          <Globe className="h-5 w-5 mr-2 text-brand" />
          Available Producers ({filteredProducers.length})
        </h2>
        
        <div className="space-y-4">
          {filteredProducers.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No producers found matching your criteria</p>
            </div>
          ) : (
            filteredProducers.map((producer, index) => (
              <motion.div
                key={producer.address}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="p-6 rounded-xl border border-gray-600 bg-gray-800/50 hover:border-brand/50 transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <div>
                      <h3 className="font-semibold text-lg">Producer</h3>
                      <p className="text-sm text-gray-400">
                        {producer.city}, {producer.state}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span className="text-sm text-green-400 font-medium">Verified</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Wallet Address
                    </label>
                    <div className="flex items-center space-x-2">
                      <code className="bg-gray-900 px-3 py-2 rounded-lg text-sm font-mono flex-1">
                        {producer.address}
                      </code>
                      <button
                        onClick={() => copyAddress(producer.address)}
                        className="btn-secondary px-3 py-2 text-sm"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  
                                     <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
                     <h4 className="font-semibold text-blue-400 mb-2">How to Purchase</h4>
                     <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
                       <li>Click "Request Credits" below</li>
                       <li>Fill out the request form with your details</li>
                       <li>Producer will review and respond with pricing</li>
                       <li>Negotiate terms and complete the purchase</li>
                       <li>Producer transfers credits to your wallet</li>
                     </ol>
                   </div>
                   
                   <div className="flex space-x-3">
                     <button
                       onClick={() => copyAddress(producer.address)}
                       className="btn-secondary flex-1 flex items-center justify-center space-x-2"
                     >
                       <MapPin className="h-4 w-4" />
                       <span>Copy Address</span>
                     </button>
                     
                     <button
                       onClick={() => setSelectedProducer(producer)}
                       className="btn-primary flex-1 flex items-center justify-center space-x-2"
                     >
                       <Send className="h-4 w-4" />
                       <span>Request Credits</span>
                     </button>
                   </div>
                 </div>
               </motion.div>
             ))
           )}
         </div>
       </div>

       {/* Credit Request Form Modal */}
       {selectedProducer && (
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
           <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
           >
             <div className="bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl">
               <div className="flex justify-between items-center p-6 border-b border-gray-700">
                 <h2 className="text-2xl font-bold">Request Credits from Producer</h2>
                 <button
                   onClick={() => setSelectedProducer(null)}
                   className="text-gray-400 hover:text-white transition-colors"
                 >
                   ✕
                 </button>
               </div>
               
               <div className="p-6">
                 <CreditRequestForm
                   producerAddress={selectedProducer.address}
                   producerState={selectedProducer.state}
                   producerCity={selectedProducer.city}
                   onSubmit={handleCreditRequest}
                   isSubmitting={isSubmittingRequest}
                 />
               </div>
             </div>
           </motion.div>
         </div>
       )}

      {/* Information Panel */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">About Verified Producers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-green-900/20 border border-green-700/50 rounded-lg">
            <h3 className="font-semibold text-green-400 mb-2">Verification Process</h3>
            <p className="text-sm text-gray-300">
              All producers in this directory have been verified by State Admins. 
              They have demonstrated legitimate green hydrogen production capabilities.
            </p>
          </div>
          
          <div className="p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
            <h3 className="font-semibold text-blue-400 mb-2">Direct Purchase</h3>
            <p className="text-sm text-gray-300">
              This is a peer-to-peer marketplace. Buyers and producers negotiate 
              directly. The platform only verifies producer legitimacy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProducerDirectory;
