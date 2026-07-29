import { Navigate } from 'react-router-dom';

/** Ancien écran d'arrivée — redirigé vers le formulaire unique de la réception */
export default function AccueilArrivee() {
  return <Navigate to="/accueil/reception" replace />;
}
