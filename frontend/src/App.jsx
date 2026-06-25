import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
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
import MedecinPatients from './pages/medecin/Patients';
import MedecinPrescriptions from './pages/medecin/Prescriptions';
import InfirmierDashboard from './pages/infirmier/Dashboard';
import InfirmierConstantes from './pages/infirmier/Constantes';
import InfirmierPatients from './pages/infirmier/Patients';
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
import AdminStatistiques from './pages/admin/Statistiques';
import ProfilePage from './pages/shared/Profile';
import PlaceholderDashboard from './pages/shared/PlaceholderDashboard';
import AccueilDashboard from './pages/accueil/Dashboard';
import AccueilDemandes from './pages/accueil/Demandes';
import AccueilRendezVous from './pages/accueil/RendezVous';
import AccueilPatients from './pages/accueil/Patients';
import MaterniteDashboard from './pages/maternite/Dashboard';
import MaterniteSuivis from './pages/maternite/Suivis';
import ChirurgieDashboard from './pages/chirurgie/Dashboard';
import ChirurgieOperations from './pages/chirurgie/Operations';
import EchographieDashboard from './pages/echographie/Dashboard';
import EchographieExamens from './pages/echographie/Examens';
import KinesitherapieDashboard from './pages/kinesitherapie/Dashboard';
import KinesitherapieSeances from './pages/kinesitherapie/Seances';
import DentisterieDashboard from './pages/dentisterie/Dashboard';
import DentisterieSoins from './pages/dentisterie/Soins';
import PrivateRoute from './router/PrivateRoute';

const MEDECIN_ROLES = [
  'medecin_generaliste', 'medecin_interne', 'pediatre',
  'gynecologue', 'ophtalmologue', 'urgentiste',
];

const ALL_ROLES = [
  'patient',
  ...MEDECIN_ROLES,
  'admin',
  'laborantin',
  'pharmacien',
  'caissier',
  'infirmier',
  'receptionniste',
  'sage_femme',
  'chirurgien',
  'anesthesiste',
  'echographiste',
  'kinesitherapeute',
  'dentiste',
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
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/profil" element={
            <PrivateRoute allowedRoles={ALL_ROLES}><ProfilePage /></PrivateRoute>
          } />

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
          <Route path="/medecin/patients" element={
            <PrivateRoute allowedRoles={MEDECIN_ROLES}><MedecinPatients /></PrivateRoute>
          } />
          <Route path="/medecin/prescriptions" element={
            <PrivateRoute allowedRoles={MEDECIN_ROLES}><MedecinPrescriptions /></PrivateRoute>
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
          <Route path="/admin/statistiques" element={
            <PrivateRoute allowedRoles={['admin']}><AdminStatistiques /></PrivateRoute>
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
          <Route path="/infirmier/patients" element={
            <PrivateRoute allowedRoles={['infirmier']}><InfirmierPatients /></PrivateRoute>
          } />
          <Route path="/infirmier/*" element={
            <PrivateRoute allowedRoles={['infirmier']}>
              <PlaceholderDashboard title="Infirmerie" />
            </PrivateRoute>
          } />

          {/* Espaces spécialisés */}
          <Route path="/accueil/dashboard" element={
            <PrivateRoute allowedRoles={['receptionniste']}><AccueilDashboard /></PrivateRoute>
          } />
          <Route path="/accueil/demandes" element={
            <PrivateRoute allowedRoles={['receptionniste']}><AccueilDemandes /></PrivateRoute>
          } />
          <Route path="/accueil/rendez-vous" element={
            <PrivateRoute allowedRoles={['receptionniste']}><AccueilRendezVous /></PrivateRoute>
          } />
          <Route path="/accueil/patients" element={
            <PrivateRoute allowedRoles={['receptionniste']}><AccueilPatients /></PrivateRoute>
          } />
          <Route path="/maternite/dashboard" element={
            <PrivateRoute allowedRoles={['sage_femme']}><MaterniteDashboard /></PrivateRoute>
          } />
          <Route path="/maternite/suivis" element={
            <PrivateRoute allowedRoles={['sage_femme']}><MaterniteSuivis /></PrivateRoute>
          } />
          <Route path="/chirurgie/dashboard" element={
            <PrivateRoute allowedRoles={['chirurgien', 'anesthesiste']}><ChirurgieDashboard /></PrivateRoute>
          } />
          <Route path="/chirurgie/operations" element={
            <PrivateRoute allowedRoles={['chirurgien', 'anesthesiste']}><ChirurgieOperations /></PrivateRoute>
          } />
          <Route path="/echographie/dashboard" element={
            <PrivateRoute allowedRoles={['echographiste']}><EchographieDashboard /></PrivateRoute>
          } />
          <Route path="/echographie/examens" element={
            <PrivateRoute allowedRoles={['echographiste']}><EchographieExamens /></PrivateRoute>
          } />
          <Route path="/kinesitherapie/dashboard" element={
            <PrivateRoute allowedRoles={['kinesitherapeute']}><KinesitherapieDashboard /></PrivateRoute>
          } />
          <Route path="/kinesitherapie/seances" element={
            <PrivateRoute allowedRoles={['kinesitherapeute']}><KinesitherapieSeances /></PrivateRoute>
          } />
          <Route path="/dentisterie/dashboard" element={
            <PrivateRoute allowedRoles={['dentiste']}><DentisterieDashboard /></PrivateRoute>
          } />
          <Route path="/dentisterie/soins" element={
            <PrivateRoute allowedRoles={['dentiste']}><DentisterieSoins /></PrivateRoute>
          } />

          <Route path="/non-autorise" element={<PlaceholderDashboard title="Accès non autorisé" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
