import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

// ─── DATA ──────────────────────────────────────────────────────────────────────

const SERVICES = [
  {
    id: 1,
    nom: 'Maternité',
    icon: '🤱',
    desc: "Accompagnement prénatal, accouchement et soins postnatal dans un cadre bienveillant et sécurisé.",
    img: 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=800&q=80',
    color: 'from-pink-500 to-rose-400',
    bg: 'bg-pink-50',
  },
  {
    id: 2,
    nom: 'Laboratoire',
    icon: '🔬',
    desc: "Analyses biologiques de précision avec des équipements de dernière génération pour des diagnostics fiables.",
    img: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&w=800&q=80',
    color: 'from-violet-500 to-purple-400',
    bg: 'bg-violet-50',
  },
  {
    id: 3,
    nom: 'Échographie',
    icon: '📡',
    desc: "Imagerie médicale de haute résolution pour un suivi précis de votre état de santé et de vos grossesses.",
    img: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?auto=format&fit=crop&w=800&q=80',
    color: 'from-cyan-500 to-sky-400',
    bg: 'bg-cyan-50',
  },
  {
    id: 4,
    nom: 'Kinésithérapie',
    icon: '💪',
    desc: "Rééducation fonctionnelle et thérapie par le mouvement pour récupérer mobilité et qualité de vie.",
    img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80',
    color: 'from-amber-500 to-yellow-400',
    bg: 'bg-amber-50',
  },
  {
    id: 5,
    nom: 'Médecine Interne',
    icon: '🩺',
    desc: "Prise en charge des maladies complexes par des internistes expérimentés avec approche globale du patient.",
    img: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80',
    color: 'from-blue-600 to-blue-400',
    bg: 'bg-blue-50',
  },
  {
    id: 6,
    nom: 'Médecine Générale',
    icon: '👨‍⚕️',
    desc: "Consultations générales, bilans de santé et suivi médical continu pour toute la famille.",
    img: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=800&q=80',
    color: 'from-teal-500 to-emerald-400',
    bg: 'bg-teal-50',
  },
  {
    id: 7,
    nom: 'Gynécologie',
    icon: '🌸',
    desc: "Suivi gynécologique complet, consultation prénatale et prise en charge des pathologies féminines.",
    img: 'https://images.unsplash.com/photo-1631815588090-d1bcbe9b4b97?auto=format&fit=crop&w=800&q=80',
    color: 'from-rose-500 to-pink-400',
    bg: 'bg-rose-50',
  },
  {
    id: 8,
    nom: 'Pharmacie Interne',
    icon: '💊',
    desc: "Dispensation sécurisée des médicaments sur prescription, conseil pharmaceutique et gestion des traitements.",
    img: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&w=800&q=80',
    color: 'from-green-600 to-emerald-400',
    bg: 'bg-green-50',
  },
  {
    id: 9,
    nom: 'Pédiatrie',
    icon: '👶',
    desc: "Soins médicaux dédiés aux enfants de la naissance à l'adolescence avec expertise et douceur.",
    img: 'https://images.unsplash.com/photo-1579684453423-f84349ef60b0?auto=format&fit=crop&w=800&q=80',
    color: 'from-sky-500 to-cyan-400',
    bg: 'bg-sky-50',
  },
  {
    id: 10,
    nom: 'Chirurgie',
    icon: '⚕️',
    desc: "Interventions chirurgicales réalisées par des spécialistes dans un bloc opératoire entièrement équipé.",
    img: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=800&q=80',
    color: 'from-orange-500 to-amber-400',
    bg: 'bg-orange-50',
  },
  {
    id: 11,
    nom: 'Ophtalmologie',
    icon: '👁️',
    desc: "Examens de la vue, traitements des pathologies oculaires et suivi ophtalmologique avec équipements modernes.",
    img: 'https://images.unsplash.com/photo-1516117172878-fd2c41f4a759?auto=format&fit=crop&w=800&q=80',
    color: 'from-indigo-500 to-blue-400',
    bg: 'bg-indigo-50',
  },
  {
    id: 12,
    nom: 'Dentisterie',
    icon: '🦷',
    desc: "Soins dentaires complets : détartrage, caries, extractions et chirurgie buccale dans un cabinet moderne.",
    img: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=800&q=80',
    color: 'from-sky-600 to-blue-400',
    bg: 'bg-sky-50',
  },
  {
    id: 13,
    nom: 'Urgence Médicale',
    icon: '🚨',
    desc: "Prise en charge immédiate 24h/24, 7j/7 des situations d'urgence avec une équipe médicale d'intervention rapide.",
    img: 'https://images.unsplash.com/photo-1611689342806-0863700ce1e4?auto=format&fit=crop&w=800&q=80',
    color: 'from-red-600 to-rose-400',
    bg: 'bg-red-50',
  },
];

const DOCTORS = [
  {
    name: 'Dr. Esperance Mbuyi',
    specialite: 'Gynécologie Obstétrique',
    exp: '14 ans',
    dispo: 'Lun – Ven',
    img: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Dr. Jean-Pierre Kabila',
    specialite: 'Médecine Interne',
    exp: '18 ans',
    dispo: 'Lun – Sam',
    img: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Dr. Celestine Nkosi',
    specialite: 'Pédiatrie',
    exp: '11 ans',
    dispo: 'Mar – Sam',
    img: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Dr. François Mutombo',
    specialite: 'Chirurgie Générale',
    exp: '20 ans',
    dispo: 'Lun – Ven',
    img: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=400&q=80',
  },
];

const STATS = [
  { label: 'Patients soignés', value: '12 000+', icon: '❤️' },
  { label: 'Médecins spécialistes', value: '35+', icon: '👨‍⚕️' },
  { label: 'Services médicaux', value: '13', icon: '🏥' },
  { label: "Années d'expérience", value: '10+', icon: '⭐' },
];

const TESTIMONIALS = [
  {
    name: 'Angélique Tshimanga',
    role: 'Patiente – Maternité',
    text: "Le Centre Médical AMEN m'a accompagnée tout au long de ma grossesse avec un suivi exceptionnel. L'équipe est à la fois professionnelle et bienveillante. Je recommande sans hésitation !",
    img: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=100&q=80',
    stars: 5,
  },
  {
    name: 'Marcel Nkolo',
    role: 'Patient – Chirurgie',
    text: "J'ai été opéré ici et tout s'est déroulé dans les meilleures conditions. Le Dr Mutombo et son équipe sont remarquables. Équipements modernes, personnel soignant, infrastructure soignée.",
    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
    stars: 5,
  },
  {
    name: 'Sandrine Mbuyamba',
    role: 'Patiente – Pédiatrie',
    text: "Ma fille a reçu des soins d'une qualité rare ici. La Dr Nkosi est une pédiatre extraordinaire, patiente et très à l'écoute. Un vrai centre de référence à Kinshasa.",
    img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80',
    stars: 5,
  },
];

const NEWS = [
  {
    titre: 'Campagne de vaccination contre le paludisme',
    date: '15 Juin 2026',
    cat: 'Campagne',
    img: 'https://images.unsplash.com/photo-1584036561584-b03c19da874c?auto=format&fit=crop&w=600&q=80',
    resume: 'AMEN lance une campagne gratuite de prévention et de vaccination dans les communes de Gombe et Lingwala.',
  },
  {
    titre: 'Journée mondiale de la Santé Maternelle',
    date: '8 Juin 2026',
    cat: 'Événement',
    img: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80',
    resume: 'Séance de sensibilisation gratuite, consultations prénatales offertes et distribution de kits de maternité.',
  },
  {
    titre: '5 conseils pour renforcer votre immunité',
    date: '2 Juin 2026',
    cat: 'Conseil santé',
    img: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=600&q=80',
    resume: 'Nos médecins partagent des astuces quotidiennes pour booster votre système immunitaire naturellement.',
  },
];

const NAV_LINKS = [
  { label: 'Accueil', href: '#accueil' },
  { label: 'À propos', href: '#apropos' },
  { label: 'Nos Services', href: '#services' },
  { label: 'Nos Médecins', href: '#medecins' },
  { label: 'Actualités', href: '#actualites' },
  { label: 'Contact', href: '#contact' },
];

// ─── HOOK : SCROLL ANIMATION ───────────────────────────────────────────────────
function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

// ─── SUB-COMPONENTS ─────────────────────────────────────────────────────────────

function StarRating({ n }) {
  return (
    <div className="flex gap-0.5 text-amber-400">
      {Array.from({ length: n }).map((_, i) => <span key={i}>★</span>)}
    </div>
  );
}

function SectionTitle({ tag, title, subtitle }) {
  return (
    <div className="text-center">
      <span className="inline-block rounded-full bg-blue-50 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-medical-primary">
        {tag}
      </span>
      <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">{title}</h2>
      {subtitle && <p className="mx-auto mt-3 max-w-2xl text-slate-500">{subtitle}</p>}
    </div>
  );
}

// ─── MAIN LANDING ──────────────────────────────────────────────────────────────

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (href) => {
    setMenuOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="font-sans text-slate-800 antialiased">
      {/* ── NAVBAR ── */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/95 shadow-md backdrop-blur-sm' : 'bg-transparent'
        }`}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
          <a href="#accueil" onClick={() => scrollTo('#accueil')} className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-medical-primary text-white font-bold text-lg shadow">A</div>
            <div>
              <p className={`text-sm font-bold leading-tight ${scrolled ? 'text-medical-primary' : 'text-white'}`}>Centre Médical</p>
              <p className={`text-xs font-semibold ${scrolled ? 'text-medical-secondary' : 'text-emerald-300'}`}>AMEN</p>
            </div>
          </a>

          <ul className="hidden items-center gap-6 lg:flex">
            {NAV_LINKS.map((l) => (
              <li key={l.label}>
                <button
                  onClick={() => scrollTo(l.href)}
                  className={`text-sm font-medium transition-colors hover:text-medical-primary ${
                    scrolled ? 'text-slate-700' : 'text-white'
                  }`}
                >
                  {l.label}
                </button>
              </li>
            ))}
          </ul>

          {/* Boutons toujours visibles */}
          <div className="flex items-center gap-2">
            <a href="tel:+243000000000" className={`hidden text-sm font-medium lg:block mr-1 ${scrolled ? 'text-slate-600' : 'text-white/80'}`}>
              📞 +243 000 000 000
            </a>
            <Link
              to="/login"
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5 ${
                scrolled
                  ? 'border-medical-primary text-medical-primary hover:bg-blue-50'
                  : 'border-white text-white hover:bg-white/10'
              }`}
            >
              Se connecter
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-medical-primary px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:-translate-y-0.5 hover:bg-blue-700"
            >
              S'inscrire
            </Link>
            {/* Hamburger — menu nav uniquement sur mobile */}
            <button
              className={`rounded-lg p-2 lg:hidden ${scrolled ? 'text-slate-700' : 'text-white'}`}
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Menu"
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </nav>

        {menuOpen && (
          <div className="border-t bg-white px-5 pb-5 shadow-xl lg:hidden">
            {NAV_LINKS.map((l) => (
              <button
                key={l.label}
                onClick={() => scrollTo(l.href)}
                className="block w-full py-3 text-left text-sm font-medium text-slate-700 hover:text-medical-primary"
              >
                {l.label}
              </button>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="rounded-full border-2 border-medical-primary py-2.5 text-center text-sm font-bold text-medical-primary"
              >
                Se connecter
              </Link>
              <Link
                to="/register"
                onClick={() => setMenuOpen(false)}
                className="rounded-full bg-medical-primary py-2.5 text-center text-sm font-bold text-white"
              >
                S'inscrire
              </Link>
            </div>
            <button
              onClick={() => scrollTo('#rdv')}
              className="mt-2 w-full rounded-full border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:text-medical-primary"
            >
              📅 Prendre rendez-vous
            </button>
          </div>
        )}
      </header>

      {/* ── HERO ── */}
      <section id="accueil" className="relative min-h-screen overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1800&q=90"
          alt="Equipe médicale Centre AMEN"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-blue-900/60 to-slate-900/70" />

        {/* animated orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-float-slow absolute left-1/4 top-1/4 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl" />
          <div className="animate-float-slow absolute right-1/4 top-1/3 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl [animation-delay:2s]" />
        </div>

        <div className="relative flex min-h-screen flex-col items-center justify-center px-5 text-center text-white pt-20">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest backdrop-blur-sm">
            🏥 FOSPHA ONGD/ASBL — Kinshasa, RDC
          </span>
          <h1 className="max-w-4xl text-4xl font-extrabold leading-tight sm:text-6xl lg:text-7xl">
            Votre santé,{' '}
            <span className="bg-gradient-to-r from-cyan-300 to-emerald-300 bg-clip-text text-transparent">
              notre priorité absolue
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-200">
            Le Centre Médical AMEN vous offre des soins de qualité supérieure avec des médecins spécialistes, des équipements modernes et une prise en charge globale de votre santé.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => scrollTo('#rdv')}
              className="rounded-full bg-medical-primary px-8 py-4 text-base font-semibold text-white shadow-2xl shadow-blue-500/40 transition hover:-translate-y-1 hover:bg-blue-700"
            >
              📅 Prendre rendez-vous
            </button>
            <button
              onClick={() => scrollTo('#services')}
              className="rounded-full border border-white/30 bg-white/10 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition hover:-translate-y-1 hover:bg-white/20"
            >
              🏥 Nos services
            </button>
            <a
              href="tel:+243000000000"
              className="rounded-full bg-red-600 px-8 py-4 text-base font-semibold text-white shadow-lg transition hover:-translate-y-1 hover:bg-red-700"
            >
              🚨 Urgences 24h/24
            </a>
          </div>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-white/60 text-2xl">↓</div>
        </div>
      </section>

      {/* ── A PROPOS ── */}
      <APropos />

      {/* ── SERVICES ── */}
      <ServicesSection />

      {/* ── MEDECINS ── */}
      <MedecinsSection />

      {/* ── STATS ── */}
      <StatsSection />

      {/* ── TEMOIGNAGES ── */}
      <TestimonialsSection />

      {/* ── RDV ── */}
      <RdvSection />

      {/* ── ACTUALITES ── */}
      <ActualitesSection />

      {/* ── CONTACT ── */}
      <ContactSection />

      {/* ── FOOTER ── */}
      <Footer scrollTo={scrollTo} />

      {/* Floating urgency button */}
      <a
        href="tel:+243000000000"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-2xl shadow-2xl shadow-red-500/50 transition hover:scale-110 animate-pulse"
        title="Urgences"
      >
        🚨
      </a>
    </div>
  );
}

// ─── SECTIONS ─────────────────────────────────────────────────────────────────

function APropos() {
  const [ref, visible] = useReveal();
  return (
    <section id="apropos" className="bg-white py-24 px-5" ref={ref}>
      <div className={`mx-auto max-w-7xl transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="inline-block rounded-full bg-blue-50 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-medical-primary">
              À propos de nous
            </span>
            <h2 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">
              Un centre médical au cœur de{' '}
              <span className="text-medical-primary">Kinshasa</span>
            </h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              Le Centre Médical AMEN est une institution sanitaire de référence de FOSPHA ONGD/ASBL. Fondé avec la mission de fournir des soins médicaux accessibles et de qualité à toutes les couches de la population de Kinshasa, notre centre réunit des spécialistes reconnus et des équipements modernes.
            </p>
            <p className="mt-3 text-slate-600 leading-relaxed">
              Nous croyons que chaque patient mérite une prise en charge digne, humanisée et efficace. Notre approche intègre le soin du corps, du mental et du social pour une santé globale et durable.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-4">
              {[
                { icon: '✅', text: 'Personnel qualifié & certifié' },
                { icon: '✅', text: 'Équipements de dernière génération' },
                { icon: '✅', text: 'Soins accessibles & humanisés' },
                { icon: '✅', text: 'Urgences 24h/24 – 7j/7' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2 text-sm text-slate-700">
                  <span>{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80"
              alt="Salle médicale AMEN"
              className="rounded-2xl shadow-2xl w-full object-cover h-[420px]"
            />
            <div className="absolute -bottom-5 -left-5 rounded-xl bg-medical-primary p-5 text-white shadow-xl">
              <p className="text-3xl font-extrabold">10+</p>
              <p className="text-xs font-medium uppercase tracking-wide">Années d'excellence</p>
            </div>
            <div className="absolute -top-5 -right-5 rounded-xl bg-emerald-500 p-5 text-white shadow-xl">
              <p className="text-3xl font-extrabold">13</p>
              <p className="text-xs font-medium uppercase tracking-wide">Départements</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ServicesSection() {
  const [ref, visible] = useReveal();
  return (
    <section id="services" className="bg-slate-50 py-24 px-5" ref={ref}>
      <div className={`mx-auto max-w-7xl transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <SectionTitle
          tag="Nos Services"
          title="Une prise en charge complète"
          subtitle="13 départements spécialisés pour répondre à tous vos besoins de santé avec excellence et bienveillance."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {SERVICES.map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ServiceCard({ service: s }) {
  const [hovered, setHovered] = useState(false);
  return (
    <article
      className={`group relative overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 ${hovered ? '-translate-y-2 shadow-xl' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative h-44 overflow-hidden">
        <img src={s.img} alt={s.nom} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
        <div className={`absolute inset-0 bg-gradient-to-t ${s.color} opacity-40`} />
        <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xl shadow">{s.icon}</span>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-slate-900">{s.nom}</h3>
        <p className="mt-1 text-xs text-slate-500 leading-relaxed line-clamp-3">{s.desc}</p>
        <button className="mt-3 text-xs font-semibold text-medical-primary hover:underline">
          En savoir plus →
        </button>
      </div>
    </article>
  );
}

function MedecinsSection() {
  const [ref, visible] = useReveal();
  return (
    <section id="medecins" className="bg-white py-24 px-5" ref={ref}>
      <div className={`mx-auto max-w-7xl transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <SectionTitle
          tag="Nos Médecins"
          title="Une équipe de spécialistes dévoués"
          subtitle="Rencontrez nos professionnels de santé expérimentés, à l'écoute et engagés pour votre bien-être."
        />
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {DOCTORS.map((doc) => (
            <article key={doc.name} className="group relative overflow-hidden rounded-2xl bg-slate-50 p-5 text-center shadow transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
              <div className="relative mx-auto h-28 w-28 overflow-hidden rounded-full ring-4 ring-white shadow-lg">
                <img src={doc.img} alt={doc.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="mt-4">
                <h3 className="font-bold text-slate-900">{doc.name}</h3>
                <p className="mt-0.5 text-xs font-semibold text-medical-primary">{doc.specialite}</p>
                <div className="mt-3 flex justify-center gap-4 text-xs text-slate-500">
                  <span>🎓 {doc.exp}</span>
                  <span>📅 {doc.dispo}</span>
                </div>
                <button className="mt-4 w-full rounded-full bg-medical-primary py-2 text-xs font-semibold text-white transition hover:bg-blue-700">
                  Prendre rendez-vous
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatsSection() {
  const [ref, visible] = useReveal();
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-medical-primary via-blue-700 to-blue-900 py-20 px-5" ref={ref}>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-0 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />
      </div>
      <div className={`relative mx-auto max-w-5xl transition-all duration-700 ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        <div className="grid grid-cols-2 gap-8 text-center text-white lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm border border-white/10">
              <div className="text-4xl">{s.icon}</div>
              <p className="mt-2 text-4xl font-extrabold">{s.value}</p>
              <p className="mt-1 text-sm font-medium text-blue-100">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const [ref, visible] = useReveal();
  return (
    <section className="bg-slate-50 py-24 px-5" ref={ref}>
      <div className={`mx-auto max-w-6xl transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <SectionTitle
          tag="Témoignages"
          title="Ce que disent nos patients"
          subtitle="La confiance de nos patients est notre plus grande récompense."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <article key={t.name} className="rounded-2xl bg-white p-6 shadow transition hover:-translate-y-1 hover:shadow-lg">
              <StarRating n={t.stars} />
              <p className="mt-3 text-sm text-slate-600 leading-relaxed italic">"{t.text}"</p>
              <div className="mt-5 flex items-center gap-3">
                <img src={t.img} alt={t.name} className="h-12 w-12 rounded-full object-cover ring-2 ring-blue-100" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                  <p className="text-xs text-medical-primary">{t.role}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function RdvSection() {
  const [ref, visible] = useReveal();
  const [form, setForm] = useState({ nom: '', tel: '', service: '', date: '', message: '' });
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/rendez-vous/demande', {
        nom: form.nom,
        telephone: form.tel,
        service: form.service,
        date_souhaitee: form.date,
        message: form.message,
      });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Envoi impossible. Réessayez plus tard.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="rdv" className="bg-white py-24 px-5" ref={ref}>
      <div className={`mx-auto max-w-5xl transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <SectionTitle
          tag="Rendez-vous"
          title="Réservez votre consultation"
          subtitle="Remplissez le formulaire ci-dessous. Notre équipe vous confirmera votre rendez-vous dans les plus brefs délais."
        />
        {sent ? (
          <div className="mt-10 rounded-2xl bg-emerald-50 border border-emerald-200 p-10 text-center">
            <div className="text-5xl">✅</div>
            <h3 className="mt-4 text-xl font-bold text-emerald-700">Demande envoyée avec succès !</h3>
            <p className="mt-2 text-sm text-emerald-600">Notre équipe vous contactera très prochainement pour confirmer votre rendez-vous.</p>
            <button onClick={() => setSent(false)} className="mt-6 rounded-full bg-medical-primary px-6 py-2 text-sm font-semibold text-white">
              Nouvelle demande
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-10 grid gap-5 rounded-2xl bg-slate-50 p-8 shadow-inner sm:grid-cols-2">
            {error && (
              <div className="col-span-full rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Nom complet *</span>
              <input required value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-medical-primary focus:ring-2 focus:ring-blue-100" placeholder="Jean Dupont" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Téléphone *</span>
              <input required value={form.tel} onChange={e => setForm(f => ({ ...f, tel: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-medical-primary focus:ring-2 focus:ring-blue-100" placeholder="+243 8X XXX XXXX" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Service souhaité *</span>
              <select required value={form.service} onChange={e => setForm(f => ({ ...f, service: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-medical-primary focus:ring-2 focus:ring-blue-100 bg-white">
                <option value="">Choisir un service...</option>
                {SERVICES.map(s => <option key={s.id} value={s.nom}>{s.nom}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Date souhaitée *</span>
              <input type="date" required value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-medical-primary focus:ring-2 focus:ring-blue-100" />
            </label>
            <label className="col-span-full block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Message (facultatif)</span>
              <textarea rows={3} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-medical-primary focus:ring-2 focus:ring-blue-100" placeholder="Décrivez brièvement votre motif de consultation..." />
            </label>
            <div className="col-span-full">
              <button type="submit" disabled={submitting} className="w-full rounded-full bg-gradient-to-r from-medical-primary to-cyan-500 py-3.5 font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:-translate-y-0.5 disabled:opacity-60">
                {submitting ? 'Envoi en cours...' : 'Envoyer ma demande de rendez-vous'}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}

function ActualitesSection() {
  const [ref, visible] = useReveal();
  const CAT_COLORS = { Campagne: 'bg-rose-100 text-rose-700', Événement: 'bg-blue-100 text-blue-700', 'Conseil santé': 'bg-emerald-100 text-emerald-700' };
  return (
    <section id="actualites" className="bg-slate-50 py-24 px-5" ref={ref}>
      <div className={`mx-auto max-w-6xl transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <SectionTitle tag="Actualités" title="Conseils et événements" subtitle="Restez informé des dernières actualités médicales du Centre AMEN." />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {NEWS.map((n) => (
            <article key={n.titre} className="group overflow-hidden rounded-2xl bg-white shadow transition hover:-translate-y-1 hover:shadow-lg">
              <div className="relative h-48 overflow-hidden">
                <img src={n.img} alt={n.titre} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${CAT_COLORS[n.cat] ?? 'bg-slate-100 text-slate-600'}`}>{n.cat}</span>
                  <span className="text-xs text-slate-400">{n.date}</span>
                </div>
                <h3 className="mt-2 font-bold text-slate-900">{n.titre}</h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed line-clamp-3">{n.resume}</p>
                <button className="mt-3 text-xs font-semibold text-medical-primary hover:underline">Lire la suite →</button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  const [ref, visible] = useReveal();
  return (
    <section id="contact" className="bg-white py-24 px-5" ref={ref}>
      <div className={`mx-auto max-w-6xl transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <SectionTitle tag="Contact" title="Nous trouver" subtitle="Notre équipe est à votre disposition pour toute question ou prise en charge." />
        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          <div className="space-y-5">
            {[
              { icon: '📍', titre: 'Adresse', val: 'Avenue de la Clinique, Commune de Gombe, Kinshasa, RDC' },
              { icon: '📞', titre: 'Téléphone', val: '+243 000 000 000 / +243 000 000 001' },
              { icon: '📧', titre: 'Email', val: 'contact@amen-hopital.cd' },
              { icon: '🕐', titre: "Heures d'ouverture", val: 'Lun – Sam : 7h00 – 20h00 | Urgences : 24h/24' },
            ].map((c) => (
              <div key={c.titre} className="flex items-start gap-4 rounded-xl bg-slate-50 p-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-2xl">{c.icon}</div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{c.titre}</p>
                  <p className="text-sm text-slate-600">{c.val}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="overflow-hidden rounded-2xl shadow-lg border border-slate-100 min-h-[320px] bg-slate-100 flex items-center justify-center">
            <iframe
              title="Centre Médical AMEN — Kinshasa"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d63738.27876551225!2d15.266667!3d-4.316667!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1a6a33c14b4b3b4d%3A0x0!2sGombe%2C%20Kinshasa!5e0!3m2!1sfr!2scd!4v1700000000000"
              className="h-80 w-full border-0"
              allowFullScreen
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer({ scrollTo }) {
  return (
    <footer className="bg-slate-900 text-slate-300 py-16 px-5">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-medical-primary font-bold text-white">A</div>
              <div>
                <p className="font-bold text-white">Centre Médical AMEN</p>
                <p className="text-xs text-emerald-400">FOSPHA ONGD/ASBL</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              Votre santé, notre priorité absolue. Des soins de qualité au cœur de Kinshasa depuis plus de 10 ans.
            </p>
            <div className="mt-4 flex gap-3">
              {['📘', '📸', '🐦', '▶️'].map((icon, i) => (
                <button key={i} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-sm hover:bg-medical-primary transition">{icon}</button>
              ))}
            </div>
          </div>

          <div>
            <p className="font-semibold text-white">Liens rapides</p>
            <ul className="mt-3 space-y-2">
              {NAV_LINKS.map((l) => (
                <li key={l.label}>
                  <button onClick={() => scrollTo(l.href)} className="text-sm text-slate-400 hover:text-medical-primary transition">
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-semibold text-white">Nos Services</p>
            <ul className="mt-3 space-y-2">
              {SERVICES.slice(0, 6).map((s) => (
                <li key={s.id} className="text-sm text-slate-400">{s.nom}</li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-semibold text-white">Contact d'urgence</p>
            <div className="mt-3 space-y-3">
              <a href="tel:+243000000000" className="flex items-center gap-2 rounded-xl bg-red-900/40 p-3 text-sm font-semibold text-red-300 hover:bg-red-800/40 transition">
                🚨 +243 000 000 000
              </a>
              <p className="text-xs text-slate-500">Disponible 24h/24, 7j/7</p>
              <div className="mt-4 rounded-xl bg-white/5 p-3 text-xs text-slate-400">
                <p className="font-semibold text-white">Horaires</p>
                <p className="mt-1">Lun – Sam : 7h00 – 20h00</p>
                <p>Urgences : 24h/24</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-between">
          <p className="text-xs text-slate-500">© 2026 Centre Médical AMEN — FOSPHA ONGD/ASBL. Tous droits réservés.</p>
          <p className="text-xs text-slate-600">Développé par ENGWELE • <a href="https://github.com/Exauce09/TFC-ENGWELE" target="_blank" rel="noreferrer" className="text-medical-primary hover:underline">GitHub TFC</a></p>
        </div>
      </div>
    </footer>
  );
}
