import { connectWallet } from './mockChain';
import { toast } from '../components/Toast';

export async function initializeDemoMode(): Promise<void> {
  try {
    // Auto-connect to Producer wallet for demo
    await connectWallet(1); // Producer wallet index
    
    // Show welcome message
    setTimeout(() => {
      toast.info('🎉 Demo mode initialized! Switch wallets to explore different roles.');
    }, 1000);
    
  } catch (error) {
    console.error('Failed to initialize demo mode:', error);
  }
}

export function showDemoWelcome(): void {
  // Check if this is the first visit
  const hasSeenWelcome = localStorage.getItem('hydrocred-demo-welcome');
  
  if (!hasSeenWelcome) {
    setTimeout(() => {
      toast.info('Welcome to HydroCred Demo! Click the help button (bottom-right) for a guided tour.', 8000);
      localStorage.setItem('hydrocred-demo-welcome', 'true');
    }, 2000);
  }
}