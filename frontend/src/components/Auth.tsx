import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Eye, EyeOff, Leaf } from 'lucide-react';

interface AuthProps {
  onLogin: (credentials: { username: string; password: string }) => Promise<void> | void;
  onRegister: (credentials: { username: string; password: string; name: string }) => Promise<void> | void;
}

export function Auth({ onLogin, onRegister }: AuthProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isRegister) {
        await onRegister({ username, password, name });
      } else {
        await onLogin({ username, password });
      }
    } catch (err: any) {
      setError(err.message || (isRegister ? 'Failed to register' : 'Failed to login'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-white dark:from-gray-900 dark:to-gray-950 transition-colors">
      <Card className="w-full max-w-sm shadow-lg border border-green-100 dark:border-gray-800 bg-white/90 dark:bg-gray-900/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center">
            <Leaf className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl font-semibold text-green-800 dark:text-green-200">
            Garden Away
          </CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isRegister ? 'Create your account' : 'Sign in to your dashboard'}
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegister && (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="border-green-200 focus:border-green-500 focus:ring-green-500 dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Email</Label>
              <Input
                id="username"
                type="email"
                placeholder="you@example.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="border-green-200 focus:border-green-500 focus:ring-green-500 dark:bg-gray-800 dark:border-gray-700"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10 border-green-200 focus:border-green-500 focus:ring-green-500 dark:bg-gray-800 dark:border-gray-700"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              disabled={loading}
            >
              {loading
                ? isRegister
                  ? 'Creating account...'
                  : 'Signing in...'
                : isRegister
                  ? 'Register'
                  : 'Log In'}
            </Button>

            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              {isRegister ? (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setIsRegister(false)}
                    className="text-green-600 dark:text-green-400 hover:underline"
                  >
                    Log in
                  </button>
                </>
              ) : (
                <>
                  Don’t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setIsRegister(true)}
                    className="text-green-600 dark:text-green-400 hover:underline"
                  >
                    Sign up
                  </button>
                </>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
