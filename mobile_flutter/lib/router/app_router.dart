import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../data/sync/sync_engine.dart';
import '../providers/auth_provider.dart';
import '../theme/amen_theme.dart';
import '../screens/accueil/accueil_home_screen.dart';
import '../screens/accueil/accueil_patients_screen.dart';
import '../screens/accueil/accueil_rdv_screen.dart';
import '../screens/login_screen.dart';
import '../screens/medecin/medecin_dossiers_screen.dart';
import '../screens/medecin/medecin_file_screen.dart';
import '../screens/medecin/medecin_home_screen.dart';
import '../screens/medecin/medecin_patient_detail_screen.dart';
import '../screens/medecin/medecin_patients_screen.dart';
import '../screens/medecin/medecin_planning_screen.dart';
import '../screens/medecin/medecin_prescription_form_screen.dart';
import '../screens/medecin/medecin_teleconsult_screen.dart';
import '../screens/patient/dossier_screen.dart';
import '../screens/patient/factures_screen.dart';
import '../screens/patient/home_screen.dart';
import '../screens/patient/notifications_screen.dart';
import '../screens/patient/onboarding_screen.dart';
import '../screens/patient/patient_shell.dart';
import '../screens/patient/profil_screen.dart';
import '../screens/patient/rdv_screen.dart';
import '../screens/patient/teleconsult_screen.dart';
import '../screens/pending_sync_screen.dart';
import '../screens/splash_screen.dart';
import '../screens/staff/staff_profil_screen.dart';
import '../screens/staff/staff_shell.dart';
import '../screens/staff_placeholder_screen.dart';

GoRouter createRouter(AuthProvider auth) {
  return GoRouter(
    initialLocation: '/splash',
    refreshListenable: auth,
    redirect: (context, state) {
      final loc = state.matchedLocation;
      if (auth.loading) {
        return loc == '/splash' ? null : '/splash';
      }
      final loggedIn = auth.isAuthenticated;
      final onLogin = loc == '/login';
      final onSplash = loc == '/splash';
      final user = auth.user;

      if (!loggedIn) {
        return onLogin ? null : '/login';
      }
      if (onLogin || onSplash) {
        if (user!.isPatient && user.needsOnboarding) {
          return '/patient/onboarding';
        }
        return user.homePath;
      }

      if (user!.isPatient && user.needsOnboarding && loc != '/patient/onboarding') {
        return '/patient/onboarding';
      }
      if (user.isPatient && !user.needsOnboarding && loc == '/patient/onboarding') {
        return '/patient';
      }

      if (user.isPatient &&
          !loc.startsWith('/patient') &&
          loc != '/sync/pending') {
        return '/patient';
      }
      if (user.isMedecin &&
          !loc.startsWith('/medecin') &&
          loc != '/sync/pending') {
        return '/medecin/accueil';
      }
      if (user.isReceptionniste && !loc.startsWith('/accueil')) {
        return '/accueil';
      }
      if (!user.isPatient &&
          !user.isMedecin &&
          !user.isReceptionniste &&
          loc != '/staff') {
        return '/staff';
      }
      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (_, __) => const SplashScreen()),
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/staff', builder: (_, __) => const StaffPlaceholderScreen()),
      GoRoute(path: '/sync/pending', builder: (_, __) => const PendingSyncScreen()),
      GoRoute(
        path: '/patient/onboarding',
        builder: (_, __) => const PatientOnboardingScreen(),
      ),
      GoRoute(
        path: '/patient/notifications',
        builder: (_, __) => const PatientNotificationsScreen(),
      ),
      GoRoute(
        path: '/patient/teleconsultation',
        builder: (_, __) => const PatientTeleconsultScreen(),
      ),
      StatefulShellRoute(
        builder: (context, state, navigationShell) {
          return PatientShell(navigationShell: navigationShell);
        },
        navigatorContainerBuilder: (context, navigationShell, children) {
          return SizedBox.expand(
            child: children[navigationShell.currentIndex],
          );
        },
        branches: [
          StatefulShellBranch(routes: [
            GoRoute(path: '/patient', builder: (_, __) => const PatientHomeScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/patient/rdv', builder: (_, __) => const PatientRdvScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/patient/factures', builder: (_, __) => const PatientFacturesScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/patient/dossier',
              builder: (_, state) {
                final tab = PatientDossierScreen.tabIndexFromQuery(state.uri.queryParameters['tab']);
                return PatientDossierScreen(
                  key: ValueKey('patient-dossier-$tab'),
                  initialTab: tab,
                );
              },
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/patient/profil', builder: (_, __) => const PatientProfilScreen()),
          ]),
        ],
      ),
      GoRoute(
        path: '/medecin/patients/:id',
        builder: (_, state) => MedecinPatientDetailScreen(
          patientId: int.parse(state.pathParameters['id']!),
        ),
      ),
      GoRoute(
        path: '/medecin/dossiers/new',
        builder: (_, state) {
          final pid = int.tryParse(state.uri.queryParameters['patient_id'] ?? '');
          return MedecinDossierFormScreen(patientId: pid);
        },
      ),
      GoRoute(
        path: '/medecin/dossiers/:id',
        builder: (_, state) {
          final id = int.parse(state.pathParameters['id']!);
          return MedecinDossierFormScreen(dossierId: id);
        },
      ),
      GoRoute(
        path: '/medecin/prescriptions/new',
        builder: (_, state) {
          final pid = int.tryParse(state.uri.queryParameters['patient_id'] ?? '');
          return MedecinPrescriptionFormScreen(patientId: pid);
        },
      ),
      GoRoute(
        path: '/medecin/teleconsultation',
        builder: (_, __) => const MedecinTeleconsultScreen(),
      ),
      GoRoute(
        path: '/medecin/profil',
        builder: (_, __) => const StaffProfilScreen(title: 'Profil médecin'),
      ),
      StatefulShellRoute(
        builder: (context, state, navigationShell) {
          return MedecinShell(navigationShell: navigationShell);
        },
        navigatorContainerBuilder: (context, navigationShell, children) {
          return SizedBox.expand(
            child: children[navigationShell.currentIndex],
          );
        },
        branches: [
          StatefulShellBranch(routes: [
            GoRoute(path: '/medecin/accueil', builder: (_, __) => const MedecinHomeScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/medecin/planning', builder: (_, __) => const MedecinPlanningScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/medecin/file', builder: (_, __) => const MedecinFileScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/medecin/patients', builder: (_, __) => const MedecinPatientsScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/medecin/dossiers', builder: (_, __) => const MedecinDossiersScreen()),
          ]),
        ],
      ),
      StatefulShellRoute(
        builder: (context, state, navigationShell) {
          return AccueilShell(navigationShell: navigationShell);
        },
        navigatorContainerBuilder: (context, navigationShell, children) {
          return SizedBox.expand(
            child: children[navigationShell.currentIndex],
          );
        },
        branches: [
          StatefulShellBranch(routes: [
            GoRoute(path: '/accueil', builder: (_, __) => const AccueilHomeScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/accueil/rdv', builder: (_, __) => const AccueilRdvScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/accueil/patients', builder: (_, __) => const AccueilPatientsScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/accueil/profil',
              builder: (_, __) => const StaffProfilScreen(title: 'Profil réception'),
            ),
          ]),
        ],
      ),
    ],
  );
}

class AmenApp extends StatefulWidget {
  const AmenApp({super.key});

  @override
  State<AmenApp> createState() => _AmenAppState();
}

class _AmenAppState extends State<AmenApp> {
  late final AuthProvider _auth;
  late final GoRouter _router;

  @override
  void initState() {
    super.initState();
    _auth = AuthProvider();
    _router = createRouter(_auth);
  }

  @override
  void dispose() {
    _auth.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: _auth),
        ChangeNotifierProvider<SyncEngine>.value(value: _auth.sync),
      ],
      child: MaterialApp.router(
        title: 'AMEN',
        debugShowCheckedModeBanner: false,
        theme: buildAmenTheme(),
        routerConfig: _router,
      ),
    );
  }
}
