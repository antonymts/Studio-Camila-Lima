import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  loginAdmin: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const tokenResult = await firebaseUser.getIdTokenResult();
          const hasAdminClaim = tokenResult.claims.admin === true;
          const isExactAdminEmail = firebaseUser.email?.toLowerCase() === 'camilalima@studio.com';

          setIsAdmin(hasAdminClaim || isExactAdminEmail);
        } catch {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginAdmin = async (email: string, pass: string) => {
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, pass);
      const tokenResult = await userCred.user.getIdTokenResult();
      const hasAdminClaim = tokenResult.claims.admin === true;
      const isExactAdminEmail = email.toLowerCase() === 'camilalima@studio.com';

      if (!hasAdminClaim && !isExactAdminEmail) {
        await signOut(auth);
        return {
          success: false,
          error: 'Esta conta não possui privilégios de administrador.',
        };
      }

      return { success: true };
    } catch (err: any) {
      let friendlyMessage = 'E-mail ou senha incorretos.';
      if (
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/invalid-credential'
      ) {
        friendlyMessage = 'Credenciais de acesso incorretas ou conta não cadastrada.';
      } else if (err.code === 'auth/too-many-requests') {
        friendlyMessage = 'Muitas tentativas malsucedidas. Tente novamente mais tarde.';
      }
      return {
        success: false,
        error: friendlyMessage,
      };
    }
  };

  const logout = async () => {
    setIsAdmin(false);
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, loginAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);


