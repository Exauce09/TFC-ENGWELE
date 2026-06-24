import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AdminDashboard from './pages/admin/Dashboard';
import AdminRendezVous from './pages/admin/RendezVous';
import { AdminPatients, AdminMedecins, AdminDepartements, AdminUtilisateurs } from './pages/admin/Gestion';
import MedecinDashboard from './pages/medecin/Dashboard';
import MedecinPlanning from './pages/medecin/Planning';
import MedecinDossiers from './pages/medecin/Dossiers';
import PatientDashboard from './pages/patient/Dashboard';
import PatientRendezVous from './pages/patient/RendezVous';
import PatientDossier from './pages/patient/Dossier';
import PatientTeleconsultation from './pages/patient/Teleconsultation';
import MedecinTeleconsultation from './pages/medecin/Teleconsultation';
import InfirmierDashboard from './pages/infirmier/Dashboard';
import InfirmierConstantes from './pages/infirmier/Constantes';
import LaboratoireDashboard from './pages/laboratoire/Dashboard';
import LaboratoireAnalyses from './pages/laboratoire/Analyses';
import PharmacieDashboard from './pages/pharmacie/Dashboard';
import PharmacieStock from './pages/pharmacie/Stock';
import PharmacieOrdonnances from './pages/pharmacie/Ordonnances';
import CaisseDashboard from './pages/caisse/Dashboard';
import CaisseFactures from './pages/caisse/Factures';
import CaissePaiements from './pages/caisse/Paiements';
import PatientFactures from './pages/patient/Factures';
import AdminFacturation from './pages/admin/Facturation';
import PlaceholderDashboard from './pages/shared/PlaceholderDashboard';
import PrivateRoute from './router/PrivateRoute';

const MEDECIN_ROLES = [
  'medecin_generaliste', 'medecin_interne', 'pediatre',
  'gynecologue', 'ophtalmologue', 'urgentiste',
];

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Patient */}
          <Route path="/patient/dashboard" element={
            <PrivateRoute allowedRoles={['patient']}><PatientDashboard /></PrivateRoute>
          } />
          <Route path="/patient/rendez-vous" element={
            <PrivateRoute allowedRoles={['patient']}><PatientRendezVous /></PrivateRoute>
          } />
          <Route path="/patient/dossier" element={
            <PrivateRoute allowedRoles={['patient']}><PatientDossier /></PrivateRoute>
          } />
          <Route path="/patient/teleconsultation" element={
            <PrivateRoute allowedRoles={['patient']}><PatientTeleconsultation /></PrivateRoute>
          } />
          <Route path="/patient/factures" element={
            <PrivateRoute allowedRoles={['patient']}><PatientFactures /></PrivateRoute>
          } />
          <Route path="/patient/prescriptions" element={
            <PrivateRoute allowedRoles={['patient']}><PatientDossier /></PrivateRoute>
          } />
          <Route path="/patient/*" element={
            <PrivateRoute allowedRoles={['patient']}>
              <PlaceholderDashboard title="Espace Patient" />
            </PrivateRoute>
          } />

          {/* Médecin */}
          <Route path="/medecin/dashboard" element={
            <PrivateRoute allowedRoles={MEDECIN_ROLES}><MedecinDashboard /></PrivateRoute>
          } />
          <Route path="/medecin/planning" element={
            <PrivateRoute allowedRoles={MEDECIN_ROLES}><MedecinPlanning /></PrivateRoute>
          } />
          <Route path="/medecin/dossiers" element={
            <PrivateRoute allowedRoles={MEDECIN_ROLES}><MedecinDossiers /></PrivateRoute>
          } />
          <Route path="/medecin/teleconsultation" element={
            <PrivateRoute allowedRoles={MEDECIN_ROLES}><MedecinTeleconsultation /></PrivateRoute>
          } />
          <Route path="/medecin/*" element={
            <PrivateRoute allowedRoles={MEDECIN_ROLES}>
              <PlaceholderDashboard title="Espace Médecin" />
            </PrivateRoute>
          } />

          {/* Admin */}
          <Route path="/admin/dashboard" element={
            <PrivateRoute allowedRoles={['admin']}><AdminDashboard /></PrivateRoute>
          } />
          <Route path="/admin/rendez-vous" element={
            <PrivateRoute allowedRoles={['admin']}><AdminRendezVous /></PrivateRoute>
          } />
          <Route path="/admin/patients" element={
            <PrivateRoute allowedRoles={['admin']}><AdminPatients /></PrivateRoute>
          } />
          <Route path="/admin/medecins" element={
            <PrivateRoute allowedRoles={['admin']}><AdminMedecins /></PrivateRoute>
          } />
          <Route path="/admin/departements" element={
            <PrivateRoute allowedRoles={['admin']}><AdminDepartements /></PrivateRoute>
          } />
          <Route path="/admin/utilisateurs" element={
            <PrivateRoute allowedRoles={['admin']}><AdminUtilisateurs /></PrivateRoute>
          } />
          <Route path="/admin/facturation" element={
            <PrivateRoute allowedRoles={['admin']}><AdminFacturation /></PrivateRoute>
          } />
          <Route path="/admin/*" element={
            <PrivateRoute allowedRoles={['admin']}>
              <PlaceholderDashboard title="Administration" />
            </PrivateRoute>
          } />

          {/* Autres rôles — dashboards à venir */}
          <Route path="/laboratoire/dashboard" element={
            <PrivateRoute allowedRoles={['laborantin']}><LaboratoireDashboard /></PrivateRoute>
          } />
          <Route path="/laboratoire/analyses" element={
            <PrivateRoute allowedRoles={['laborantin']}><LaboratoireAnalyses /></PrivateRoute>
          } />
          <Route path="/laboratoire/*" element={
            <PrivateRoute allowedRoles={['laborantin']}>
              <PlaceholderDashboard title="Laboratoire" />
            </PrivateRoute>
          } />
          <Route path="/pharmacie/dashboard" element={
            <PrivateRoute allowedRoles={['pharmacien']}><PharmacieDashboard /></PrivateRoute>
          } />
          <Route path="/pharmacie/stock" element={
            <PrivateRoute allowedRoles={['pharmacien']}><PharmacieStock /></PrivateRoute>
          } />
          <Route path="/pharmacie/ordonnances" element={
            <PrivateRoute allowedRoles={['pharmacien']}><PharmacieOrdonnances /></PrivateRoute>
          } />
          <Route path="/pharmacie/*" element={
            <PrivateRoute allowedRoles={['pharmacien']}>
              <PlaceholderDashboard title="Pharmacie" />
            </PrivateRoute>
          } />
          <Route path="/caisse/dashboard" element={
            <PrivateRoute allowedRoles={['caissier']}><CaisseDashboard /></PrivateRoute>
          } />
          <Route path="/caisse/factures" element={
            <PrivateRoute allowedRoles={['caissier']}><CaisseFactures /></PrivateRoute>
          } />
          <Route path="/caisse/paiements" element={
            <PrivateRoute allowedRoles={['caissier']}><CaissePaiements /></PrivateRoute>
          } />
          <Route path="/caisse/*" element={
            <PrivateRoute allowedRoles={['caissier']}>
              <PlaceholderDashboard title="Caisse" />
            </PrivateRoute>
          } />
          <Route path="/infirmier/dashboard" element={
            <PrivateRoute allowedRoles={['infirmier']}><InfirmierDashboard /></PrivateRoute>
          } />
          <Route path="/infirmier/constantes" element={
            <PrivateRoute allowedRoles={['infirmier']}><InfirmierConstantes /></PrivateRoute>
          } />
          <Route path="/infirmier/*" element={
            <PrivateRoute allowedRoles={['infirmier']}>
              <PlaceholderDashboard title="Infirmerie" />
            </PrivateRoute>
          } />

          <Route path="/non-autorise" element={<PlaceholderDashboard title="Accès non autorisé" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
