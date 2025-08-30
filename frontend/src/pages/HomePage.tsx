import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Shield, 
  TrendingUp, 
  Users, 
  CheckCircle, 
  ArrowRight,
  Leaf,
  Globe,
  BarChart3
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: Shield,
      title: 'Blockchain Security',
      description: 'Immutable records and transparent transactions ensure trust and prevent fraud.',
      color: 'text-blue-600'
    },
    {
      icon: Leaf,
      title: 'Green Certification',
      description: 'Rigorous certification process ensures only genuine green hydrogen credits.',
      color: 'text-green-600'
    },
    {
      icon: TrendingUp,
      title: 'Dynamic Trading',
      description: 'Real-time marketplace for buying, selling, and retiring hydrogen credits.',
      color: 'text-purple-600'
    },
    {
      icon: Users,
      title: 'Role-Based Access',
      description: 'Hierarchical system with producers, certifiers, buyers, and auditors.',
      color: 'text-orange-600'
    },
    {
      icon: BarChart3,
      title: 'Analytics & Reporting',
      description: 'Comprehensive dashboards and audit trails for compliance and insights.',
      color: 'text-indigo-600'
    },
    {
      icon: Globe,
      title: 'Global Standards',
      description: 'Compliant with international green hydrogen certification standards.',
      color: 'text-teal-600'
    }
  ];

  const stats = [
    { label: 'H2 Credits Issued', value: '2.4M+', suffix: 'kg' },
    { label: 'Verified Producers', value: '150+', suffix: '' },
    { label: 'Total Transactions', value: '$12M+', suffix: '' },
    { label: 'Countries Active', value: '25+', suffix: '' }
  ];

  const roles = [
    {
      title: 'Producers',
      description: 'Submit production data and mint certified green hydrogen credits',
      features: ['Production tracking', 'Document upload', 'Credit minting', 'Sales management']
    },
    {
      title: 'Certifiers',
      description: 'Verify and certify hydrogen production for credit issuance',
      features: ['Production verification', 'Quality assessment', 'Certification issuance', 'Fraud prevention']
    },
    {
      title: 'Buyers',
      description: 'Purchase and retire credits for compliance and sustainability goals',
      features: ['Credit marketplace', 'Bulk purchasing', 'Retirement tracking', 'Compliance reporting']
    },
    {
      title: 'Auditors',
      description: 'Monitor system integrity and provide independent verification',
      features: ['Transaction monitoring', 'Audit trail access', 'Compliance reporting', 'System analytics']
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-hydrogen-600/10 to-green-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge variant="hydrogen" className="mb-4">
                Powered by Blockchain Technology
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                The Future of{' '}
                <span className="bg-gradient-to-r from-hydrogen-600 to-green-600 bg-clip-text text-transparent">
                  Green Hydrogen
                </span>{' '}
                Credits
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
                HydroCred is a blockchain-based platform that enables transparent tracking, 
                certification, and trading of green hydrogen credits. Join the renewable energy revolution.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {isAuthenticated ? (
                  <Link to="/dashboard">
                    <Button size="lg" variant="hydrogen" className="w-full sm:w-auto">
                      Go to Dashboard
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/register">
                      <Button size="lg" variant="hydrogen" className="w-full sm:w-auto">
                        Get Started
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </Button>
                    </Link>
                    <Link to="/login">
                      <Button size="lg" variant="outline" className="w-full sm:w-auto">
                        Sign In
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl lg:text-4xl font-bold text-hydrogen-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 dark:text-gray-400 text-sm lg:text-base">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose HydroCred?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Our platform combines cutting-edge blockchain technology with rigorous 
              certification processes to create a trusted ecosystem for green hydrogen credits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4`}>
                      <feature.icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-400">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="py-20 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Built for Every Stakeholder
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              HydroCred serves the entire green hydrogen ecosystem with role-based 
              access and specialized tools for each participant.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {roles.map((role, index) => (
              <motion.div
                key={role.title}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-2xl text-hydrogen-600 mb-2">
                      {role.title}
                    </CardTitle>
                    <p className="text-gray-600 dark:text-gray-400">
                      {role.description}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {role.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center">
                          <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-hydrogen-600 to-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              Ready to Join the Green Hydrogen Revolution?
            </h2>
            <p className="text-xl text-hydrogen-100 mb-8 max-w-3xl mx-auto">
              Start tracking, certifying, and trading green hydrogen credits today. 
              Join thousands of producers, buyers, and certifiers already on the platform.
            </p>
            {!isAuthenticated && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                    Create Account
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto bg-white/10 border-white/20 text-white hover:bg-white/20">
                    Sign In
                  </Button>
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;