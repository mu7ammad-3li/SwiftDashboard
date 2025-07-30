// src/context/AuthContext.tsx
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase"; // Import your auth instance

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
}

// Provide a default value matching the context type
const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
});

export const useAuth = () => {
  return useContext(AuthContext);
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false); // Set loading to false once the check is complete
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
  };

  // Don't render children until the loading state is resolved
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
