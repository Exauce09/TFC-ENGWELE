import { Navigate } from 'react-router-dom';

/** Ancien écran d'arrivée — redirigé vers le formulaire unique /parcours */
export default function AccueilArrivee() {
  return <Navigate to="/parcours" replace />;
}
