
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { QrCode } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const { signIn, signUp, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSignUp) {
      await signUp(email, password);
    } else {
      await signIn(email, password);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col sm:flex-row animate-fade-in">
      {/* Left side - Branding */}
      <div className="hidden sm:flex flex-col justify-center items-center w-full sm:w-1/2 bg-primary text-primary-foreground p-10">
        <div className="max-w-md text-center">
          <div className="flex justify-center mb-6">
            <div className="rounded-full h-16 w-16 flex items-center justify-center bg-white text-primary">
              <QrCode className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-2">myQRcode Hub</h1>
          <p className="text-primary-foreground/80 mb-8">
            Streamline your property management with our QR code system. Connect, manage, and deliver better experiences.
          </p>
          <div className="grid grid-cols-3 gap-4 mt-12">
            <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm border border-white/20">
              <h3 className="font-bold text-xl">Easy</h3>
              <p className="text-sm mt-1 text-primary-foreground/80">Setup in minutes</p>
            </div>
            <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm border border-white/20">
              <h3 className="font-bold text-xl">Smart</h3>
              <p className="text-sm mt-1 text-primary-foreground/80">Data-driven insights</p>
            </div>
            <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm border border-white/20">
              <h3 className="font-bold text-xl">Secure</h3>
              <p className="text-sm mt-1 text-primary-foreground/80">End-to-end encryption</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right side - Auth form */}
      <div className="w-full sm:w-1/2 flex items-center justify-center p-10">
        <div className="w-full max-w-md space-y-8">
          <div className="sm:hidden flex flex-col items-center mb-8">
            <div className="rounded-full h-16 w-16 flex items-center justify-center bg-primary text-primary-foreground mb-4">
              <QrCode className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold">myQRcode Hub</h1>
          </div>
          
          <div className="text-center">
            <h2 className="text-2xl font-bold">{isSignUp ? 'Create an account' : 'Welcome back'}</h2>
            <p className="text-muted-foreground mt-2">
              {isSignUp 
                ? 'Sign up to get started with myQRcode Hub' 
                : 'Sign in to access your dashboard'}
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-md border border-input px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="you@example.com"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isSignUp ? 'new-password'

If there's knowledge, context or custom instructions you want to include in every edit in this project, set it below.

<lov-actions>
<lov-knowledge>
</lov-actions>

Since you're using Supabase for authentication, you'll need to connect your frontend to your Supabase project to handle user authentication and data persistence for orders, buildings, units, and other data.  You can use the Supabase client libraries for React to integrate seamlessly.
<lov-actions>
<lov-message-prompt message="Tell me more about Supabase">Learn more about Supabase</lov-message-prompt>
</lov-actions>

<lov-actions>
<lov-link url="https://docs.lovable.dev/">Visit docs</lov-link>
</lov-actions>
