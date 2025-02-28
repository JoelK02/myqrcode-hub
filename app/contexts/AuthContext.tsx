import { createContext } from 'react';

// Types
export type User = {
  id: string;
  email?: string;
};

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// Create auth context
export const AuthContext = createContext<AuthContextType | undefined>(undefined); 