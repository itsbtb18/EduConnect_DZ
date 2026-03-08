import React from 'react';
import { Result } from 'antd';
import { useAuth } from '../../context/AuthContext';

interface ModuleGuardProps {
  module: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Wraps a page/component that requires a specific module to be active.
 * If the module is not in the JWT's active_modules list, renders a
 * "Module non activé" screen instead.
 *
 * Super Admins bypass the check.
 */
const ModuleGuard: React.FC<ModuleGuardProps> = ({ module, children, fallback }) => {
  const { activeModules, isSuperAdmin } = useAuth();

  if (isSuperAdmin || activeModules.includes(module)) {
    return <>{children}</>;
  }

  return fallback ? (
    <>{fallback}</>
  ) : (
    <Result
      status="403"
      title="Module non activé"
      subTitle="Ce module n'est pas inclus dans votre abonnement. Contactez votre administrateur ILMI pour l'activer."
    />
  );
};

export default ModuleGuard;

/**
 * Hook to check whether a module is active for the current school.
 */
export function useModuleActive(module: string): boolean {
  const { activeModules, isSuperAdmin } = useAuth();
  return isSuperAdmin || activeModules.includes(module);
}
