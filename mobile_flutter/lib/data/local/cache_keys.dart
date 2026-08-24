/// Clés de cache Drift (resourceType).
class CacheKeys {
  static const user = 'user';
  static const patientDashboard = 'patient_dashboard';
  static const patientRdvs = 'patient_rdvs';
  static const patientFactures = 'patient_factures';
  static const patientDossier = 'patient_dossier';
  static const patientPrescriptions = 'patient_prescriptions';
  static const patientNotifications = 'patient_notifications';
  static const patientTeleconsult = 'patient_teleconsult';
  static const departements = 'departements';
  static const medecins = 'medecins';

  static const medecinDashboard = 'medecin_dashboard';
  static const medecinPlanning = 'medecin_planning';
  static const medecinFile = 'medecin_file';
  static const medecinPatients = 'medecin_patients';
  static const medecinDossiers = 'medecin_dossiers';
  static const medecinTeleconsult = 'medecin_teleconsult';

  static String facture(int id) => 'facture_$id';
  static String patientDetail(int id) => 'patient_$id';
  static String dossier(int id) => 'dossier_$id';
  static String prescription(int id) => 'prescription_$id';
}
