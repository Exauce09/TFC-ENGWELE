import { useAuth } from '../../context/AuthContext';
import { resolveShellKind } from '../../constants/roleThemes';
import MedecinLayout from './MedecinLayout';
import InfirmierLayout from './InfirmierLayout';
import RoleShell from './RoleShell';

/**
 * Layout applicatif : choisit automatiquement le design du rôle connecté.
 */
export default function Layout({ children, title = 'Centre Médical AMEN' }) {
  const { user } = useAuth();
  const kind = resolveShellKind(user?.role);

  if (kind === 'medecin') {
    return <MedecinLayout title={title}>{children}</MedecinLayout>;
  }
  if (kind === 'infirmier') {
    return <InfirmierLayout title={title}>{children}</InfirmierLayout>;
  }

  return <RoleShell title={title}>{children}</RoleShell>;
}
