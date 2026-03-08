import React, { createContext, useContext, useMemo } from 'react';
import { useAuth, OperationalRole } from '../../context/AuthContext';
import { isReadOnlyRole } from '../guards/RoleGuard';

interface ReadOnlyContextType {
  readOnly: boolean;
  role: OperationalRole;
}

const ReadOnlyContext = createContext<ReadOnlyContextType>({
  readOnly: false,
  role: 'ADMIN',
});

export const useReadOnly = () => useContext(ReadOnlyContext);

export const ReadOnlyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { operationalRole } = useAuth();

  const value = useMemo(() => ({
    readOnly: isReadOnlyRole(operationalRole),
    role: operationalRole,
  }), [operationalRole]);

  return (
    <ReadOnlyContext.Provider value={value}>
      {children}
    </ReadOnlyContext.Provider>
  );
};
