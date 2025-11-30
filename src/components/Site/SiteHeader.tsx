import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Home, ShieldCheck, Menu, X, Moon, Sun, MessageCircle, User, LogOut } from 'lucide-react';
import TransbordeIcon from '../Common/TransbordeIcon';
import AgendaPastoralIcon from '../Common/AgendaPastoralIcon';
import PedidoIcon from '../Common/PedidoIcon';
import { useTheme } from '../../hooks/useTheme';
import InputPromptModal from '../Common/InputPromptModal';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import NewsIcon from '../Common/NewsIcon';
import BibliaIcon from '../Common/BibliaIcon';
import OndeEstamosIcon from '../Common/OndeEstamosIcon';
import CursosIcon from '../Common/CursosIcon';
import JornadaVidaIcon from '../Common/JornadaVidaIcon256';
import FonteVidaIcon from '../Common/FonteVidaIcon';
import LogoFonteAppIcon from '../Common/LogoFonteAppIcon';
import MinistryIcon from '../Common/MinistryIcon';

const SiteHeader: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, firebaseUser, loginWithGoogle, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  // Bounce toggle state/refs
  const [isThemeAnimating, setIsThemeAnimating] = useState(false);
  const sunRef = React.useRef<HTMLSpanElement | null>(null);
  const moonRef = React.useRef<HTMLSpanElement | null>(null);
  const EXIT_DURATION = 300; // ms
  const ENTER_DURATION = 520; // ms
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [pendingAdminRoute, setPendingAdminRoute] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [newRequestsCount, setNewRequestsCount] = useState<number>(0);
  const [newCommentsCount, setNewCommentsCount] = useState<number>(0);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);

  const isActive = (path: string) => location.pathname === path;

  const handleGoGerenciamento = () => {
    if (!user || user.role !== 'admin') return;
    setPendingAdminRoute('/site/gerenciamento');
    setIsPasswordModalOpen(true);
  };




  const handleConfirmPassword = (pwd: string) => {
    if (pwd === '|#Dev7*') {
      setIsUnlocked(true);
      setIsPasswordModalOpen(false);
      navigate(pendingAdminRoute || '/site/gerenciamento');
    }
  };

  const handleBounceToggleTheme = () => {
    if (isThemeAnimating) return;
    setIsThemeAnimating(true);
    const current = isDark ? moonRef.current : sunRef.current;
    const next = isDark ? sunRef.current : moonRef.current;
    if (!current || !next) {
      toggleTheme();
      setIsThemeAnimating(false);
      return;
    }
    current.classList.add('anim-exit');
    window.setTimeout(() => {
      current.classList.add('inactive');
      current.classList.remove('anim-exit');
      next.classList.remove('inactive');
      next.classList.add('anim-enter');
      window.setTimeout(() => {
        next.classList.remove('anim-enter');
        toggleTheme();
        const nowDark = !isDark;
        if (nowDark) {
          sunRef.current?.classList.add('inactive');
          moonRef.current?.classList.remove('inactive');
        } else {
          moonRef.current?.classList.add('inactive');
          sunRef.current?.classList.remove('inactive');
        }
        setIsThemeAnimating(false);
      }, ENTER_DURATION);
    }, EXIT_DURATION);
  };

  useEffect(() => {
    const sun = sunRef.current;
    const moon = moonRef.current;
    if (!sun || !moon || isThemeAnimating) return;
    if (isDark) {
      sun.classList.add('inactive');
      moon.classList.remove('inactive');
    } else {
      moon.classList.add('inactive');
      sun.classList.remove('inactive');
    }
  }, [isDark, isThemeAnimating]);

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleUserMenuToggle = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const handleGoProfile = () => {
    setIsUserMenuOpen(false);
    navigate('/profile');
  };

  // Contadores de novidades (site-wide) em tempo real — apenas para administradores
  useEffect(() => {
    if (user?.role !== 'admin') {
      setNewRequestsCount(0);
      setNewCommentsCount(0);
      return;
    }
    const seenReq = new Set<string>(JSON.parse(localStorage.getItem('site_seen_prayer_ids') || '[]'));
    const seenComm = new Set<string>(JSON.parse(localStorage.getItem('site_seen_comment_ids') || '[]'));
    const unsubPrayers = onSnapshot(query(collection(db, 'prayers'), orderBy('createdAt', 'desc')), (snap) => {
      const ids: string[] = [];
      snap.forEach(d => { const data: any = d.data(); if (['pending','approved','active'].includes(data.status)) ids.push(d.id); });
      setNewRequestsCount(ids.filter(id => !seenReq.has(id)).length);
    });
    const unsubComments = onSnapshot(query(collection(db, 'prayer_comments')), (snap) => {
      const ids: string[] = [];
      snap.forEach(d => ids.push(d.id));
      setNewCommentsCount(ids.filter(id => !seenComm.has(id)).length);
    });
    return () => { unsubPrayers(); unsubComments(); };
  }, [user?.role]);

  const markAllRequestsSeen = () => {
    const seen = new Set<string>(JSON.parse(localStorage.getItem('site_seen_prayer_ids') || '[]'));
    onSnapshot(query(collection(db, 'prayers')), (snap) => {
      snap.forEach(d => seen.add(d.id));
      localStorage.setItem('site_seen_prayer_ids', JSON.stringify(Array.from(seen)));
      setNewRequestsCount(0);
    });
  };

  const markAllCommentsSeen = () => {
    const seen = new Set<string>(JSON.parse(localStorage.getItem('site_seen_comment_ids') || '[]'));
    onSnapshot(query(collection(db, 'prayer_comments')), (snap) => {
      snap.forEach(d => seen.add(d.id));
      localStorage.setItem('site_seen_comment_ids', JSON.stringify(Array.from(seen)));
      setNewCommentsCount(0);
    });
  };

  // Menu desktop: ícones visíveis + rótulo único rotativo (prioriza hover)
  const siteMenuItems = React.useMemo(
    () => [
      { to: '/site', label: 'Início', Icon: FonteVidaIcon },
      { to: '/', label: 'Programações', Icon: NewsIcon },
      { to: '/site/jornada-vida', label: 'Jornada vida', Icon: JornadaVidaIcon },
      { to: '/site/transborde', label: 'Eventos', Icon: TransbordeIcon },
      { to: '/site/cursos', label: 'Cursos', Icon: CursosIcon },
      { to: '/site/pedido-de-oracao', label: 'Pedido de Oração', Icon: PedidoIcon },
      { to: '/site/biblia', label: 'Bíblia', Icon: BibliaIcon },
      { to: '/site/ministerios', label: 'Ministérios', Icon: MinistryIcon },
      { to: '/site/onde-estamos', label: 'Onde estamos', Icon: OndeEstamosIcon },
      { to: '/site/agenda-pastoral', label: 'Agenda Pastoral', Icon: AgendaPastoralIcon },
    ],
    []
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  useEffect(() => {
    if (isHovering) {
      setActiveIndex(-1);
      return;
    }
    const id = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % siteMenuItems.length);
    }, 3000);
    return () => window.clearInterval(id);
  }, [isHovering, siteMenuItems.length]);

  return (
    <header className="bg-jkd-bg-sec border-b border-jkd-border">
      <style>{`
        /* Override local apenas para a logo do Site */
        .site-logo .w-6 { width: 5rem !important; }
        .site-logo .h-6 { height: 5rem !important; }
        /* Override local apenas para a logo do Fonte News */
        .fonte-news-logo .h-8 { height: 3.45rem !important; }
        .fonte-news-logo .w-5 { width: 1.4375rem !important; }
        /* Override local apenas para o ícone de Pedido de Oração */
        .prayer-icon-override .w-12 { width: 3.2rem !important; margin-left: -10px !important; }
        .prayer-icon-override .h-12 { height: 1.2rem !important; }
        /* Override local apenas para a bolha de alerta de novos pedidos */
        .prayer-alert-icon-override .w-5 { width: 2.8rem !important; }
        .prayer-alert-icon-override .h-5 { height: 1.25rem !important; }
      `}</style>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Esquerda: Logo + Navegação Desktop (Site) */}
        <div className="flex items-center space-x-8">
          <Link
            to="/site"
            className="flex items-center text-church-primary site-logo"
            aria-label="Logo Fonte App"
          >
            <LogoFonteAppIcon className="h-6 w-6" />
          </Link>

          <nav
            className="hidden md:flex items-baseline space-x-2"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => { setIsHovering(false); setHoverIndex(null); setActiveIndex(0); }}
          >
            {siteMenuItems.map((item, idx) => {
              const Icon = item.Icon as any;
              const active = isActive(item.to);
              const showLabel = isHovering ? hoverIndex === idx : activeIndex === idx;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onMouseEnter={() => setHoverIndex(idx)}
                  onMouseLeave={() => setHoverIndex(null)}
                  className={`group flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${item.extraClass || ''} ${item.to === '/site/pedido-de-oracao' ? 'prayer-icon-override' : ''} ${
                    active ? 'text-church-primary bg-church-primary/10' : 'text-jkd-text hover:text-church-primary hover:bg-church-primary/5'
                  }`}
                >
                  <Icon className={
                      item.to === '/site/pedido-de-oracao'
                        ? 'h-12 w-12 shrink-0'
                      : item.to === '/site'
                        ? 'h-[26px] w-[26px]'
                      : item.to === '/site/ministerios'
                        ? 'h-[22px] w-[22px]'
                      : item.to === '/'
                        ? 'h-[23px] w-[23px]'
                      : item.to === '/site/biblia'
                        ? 'h-[21px] w-[21px]'
                        : 'h-5 w-5'
                    } />
                  <span
                    className={`${
                      showLabel
                        ? 'max-w-[160px] opacity-100 ml-2'
                        : 'max-w-[0px] opacity-0 ml-0'
                    } font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out text-left`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
            {/* Link "Gerenciamento" removido do menu principal; reposicionado nas ações à direita */}
          </nav>
        </div>

        {/* Ações */}
        <div className="flex items-center space-x-2">
          {/* Ícones-only: novos pedidos e novos comentários não vistos */}
          {user?.role === 'admin' && newRequestsCount > 0 && (
            <button
              onClick={() => { markAllRequestsSeen(); navigate('/site/pedido-de-oracao'); }}
              className="relative p-2 rounded-lg text-jkd-text hover:bg-church-primary/10 hover:text-church-primary transition-colors prayer-alert-icon-override"
              aria-label="Pedidos novos"
            >
              <PedidoIcon className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-orange-500 px-1.5 text-[10px] font-bold text-white">{newRequestsCount}</span>
            </button>
          )}
          {user?.role === 'admin' && newCommentsCount > 0 && (
            <button
              onClick={() => { markAllCommentsSeen(); navigate('/site/pedido-de-oracao'); }}
              className="relative p-2 rounded-lg text-jkd-text hover:bg-church-primary/10 hover:text-church-primary transition-colors"
              aria-label="Comentários novos"
            >
              <MessageCircle size={20} />
              <span className="absolute -top-1 -right-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white">{newCommentsCount}</span>
            </button>
          )}
          {/* Theme toggle with bounce animation */}
          <style>{`
            .theme-toggle{ position:relative; width:32px; height:32px; overflow:hidden; }
            .theme-toggle .icon{ position:absolute; inset:0; display:flex; align-items:center; justify-content:center; will-change: transform, opacity; }
            .theme-toggle .inactive{ opacity:0; transform: translateY(120%) rotate(15deg); }
            @keyframes exitDown { 0%{ transform: translateY(0) rotate(0); opacity:1; } 60%{ transform: translateY(90%) rotate(6deg); opacity:1; } 100%{ transform: translateY(120%) rotate(8deg); opacity:0; } }
            @keyframes inUpBounce { 0%{ transform: translateY(120%) rotate(15deg); opacity:0; } 55%{ transform: translateY(-10%) rotate(-6deg); opacity:1; } 80%{ transform: translateY(6%) rotate(2deg); } 100%{ transform: translateY(0) rotate(0); } }
            .theme-toggle .anim-exit{ animation: exitDown 300ms cubic-bezier(.22,.9,.3,1) forwards; }
            .theme-toggle .anim-enter{ animation: inUpBounce 520ms cubic-bezier(.22,.9,.3,1) forwards; }
          `}</style>
          <button
            onClick={handleBounceToggleTheme}
            className="p-2 rounded-lg text-jkd-text hover:bg-church-primary/10 hover:text-church-primary transition-colors theme-toggle"
            aria-label="Alternar tema"
          >
            <span ref={sunRef} className={`icon ${isDark ? 'inactive' : ''}`}>
              <Sun size={20} />
            </span>
            <span ref={moonRef} className={`icon ${isDark ? '' : 'inactive'}`}>
              <Moon size={20} />
            </span>
          </button>
          {/* Gerenciamento movido para perto da troca de tema (desktop) */}
          {user?.role === 'admin' && (
            <div className="hidden md:block">
              <button
                type="button"
                onClick={handleGoGerenciamento}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === '/site/gerenciamento' ? 'text-church-primary bg-church-primary/10' : 'text-jkd-text hover:text-church-primary hover:bg-church-primary/5'
                }`}
                aria-label="Gerenciamento"
              >
                <ShieldCheck size={20} />
                <span>Gerenciamento</span>
              </button>
            </div>
          )}

          {firebaseUser ? (
            <div className="relative">
              <button
                onClick={handleUserMenuToggle}
                className="flex items-center space-x-2 rounded-full p-1 hover:bg-jkd-border transition-colors"
                aria-label="Menu do usuário"
              >
                <img
                  src={firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.displayName || 'Usuário')}&background=ff652c&color=fff`}
                  alt="Avatar do usuário"
                  className="h-8 w-8 rounded-full object-cover"
                />
              </button>
              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-jkd-bg-sec shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-jkd-border z-50"
                  >
                    <div className="py-1">
                      <div className="px-4 py-2 border-b border-jkd-border">
                        <p className="text-sm font-medium text-jkd-heading truncate">{firebaseUser.displayName || 'Usuário'}</p>
                        <p className="text-xs text-jkd-text truncate">{firebaseUser.email || ''}</p>
                      </div>
                      <button
                        onClick={handleGoProfile}
                        className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-jkd-text hover:bg-jkd-bg"
                      >
                        <User size={16} />
                        <span>Meu Perfil</span>
                      </button>
                      <button
                        onClick={() => { setIsUserMenuOpen(false); logout(); }}
                        className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-jkd-bg"
                      >
                        <LogOut size={16} />
                        <span>Sair</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button
              onClick={() => loginWithGoogle()}
              className="px-3 py-2 rounded-lg bg-church-primary text-white text-sm"
            >
              Entrar
            </button>
          )}
          <button
            onClick={handleMobileMenuToggle}
            className="md:hidden p-2 rounded-lg text-jkd-text hover:bg-church-primary/10 hover:text-church-primary transition-colors"
            aria-label="Menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto', transition: { type: 'spring', stiffness: 300, damping: 30 } }}
            exit={{ opacity: 0, height: 0, transition: { duration: 0.3 } }}
            className="md:hidden bg-jkd-bg-sec border-t border-jkd-border relative shadow-lg overflow-hidden"
          >
            <motion.div
              initial={{ y: -16, opacity: 0 }}
              animate={{ y: 0, opacity: 1, transition: { type: 'spring', stiffness: 250, damping: 32 } }}
              exit={{ y: -16, opacity: 0, transition: { duration: 0.2 } }}
              className="absolute inset-0 bg-gradient-to-b from-church-primary/10 to-transparent"
            />
            <motion.div
              initial="closed"
              animate="open"
              exit="closed"
              variants={{ open: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } } }}
              className="relative px-4 py-2 space-y-1"
            >
            <motion.div variants={{ open: { y: 0, opacity: 1 }, closed: { y: 8, opacity: 0 } }}>
              <Link
              to="/site"
              className={`flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium transition-colors ${
                isActive('/site') ? 'text-church-primary bg-church-primary/10' : 'text-jkd-text hover:text-church-primary hover:bg-church-primary/5'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
              >
                <FonteVidaIcon className="h-[26px] w-[26px]" />
                <span>Início</span>
              </Link>
            </motion.div>

            <motion.div variants={{ open: { y: 0, opacity: 1 }, closed: { y: 8, opacity: 0 } }}>
              <Link
              to="/"
              className={`flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium transition-colors fonte-news-logo ${
                isActive('/') ? 'text-church-primary bg-church-primary/10' : 'text-jkd-text hover:text-church-primary hover:bg-church-primary/5'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
              >
                <NewsIcon className="h-8 w-5" />
                <span>Programações</span>
              </Link>
            </motion.div>

            <motion.div variants={{ open: { y: 0, opacity: 1 }, closed: { y: 8, opacity: 0 } }}>
              <Link
              to="/site/jornada-vida"
              className={`flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium transition-colors ${
                isActive('/site/jornada-vida') ? 'text-church-primary bg-church-primary/10' : 'text-jkd-text hover:text-church-primary hover:bg-church-primary/5'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
              >
                <JornadaVidaIcon className="h-5 w-5" />
                <span>Jornada vida</span>
              </Link>
            </motion.div>


            <motion.div variants={{ open: { y: 0, opacity: 1 }, closed: { y: 8, opacity: 0 } }}>
              <Link
              to="/site/transborde"
              className={`flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium transition-colors ${
                isActive('/site/transborde') ? 'text-church-primary bg-church-primary/10' : 'text-jkd-text hover:text-church-primary hover:bg-church-primary/5'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
              >
                <TransbordeIcon className="h-5 w-5" />
                <span>Eventos</span>
              </Link>
            </motion.div>

            <motion.div variants={{ open: { y: 0, opacity: 1 }, closed: { y: 8, opacity: 0 } }}>
              <Link
              to="/site/cursos"
              className={`flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium transition-colors ${
                isActive('/site/cursos') ? 'text-church-primary bg-church-primary/10' : 'text-jkd-text hover:text-church-primary hover:bg-church-primary/5'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
              >
                <CursosIcon className="h-5 w-5" />
                <span>Cursos</span>
              </Link>
            </motion.div>

            <motion.div variants={{ open: { y: 0, opacity: 1 }, closed: { y: 8, opacity: 0 } }}>
              <Link
              to="/site/pedido-de-oracao"
              className={`flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium transition-colors prayer-icon-override ${
                isActive('/site/pedido-de-oracao') ? 'text-church-primary bg-church-primary/10' : 'text-jkd-text hover:text-church-primary hover:bg-church-primary/5'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
              >
                <PedidoIcon className="h-12 w-12" />
                <span>Pedido de Oração</span>
              </Link>
            </motion.div>

            <motion.div variants={{ open: { y: 0, opacity: 1 }, closed: { y: 8, opacity: 0 } }}>
              <Link
              to="/site/biblia"
              className={`flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium transition-colors ${
                isActive('/site/biblia') ? 'text-church-primary bg-church-primary/10' : 'text-jkd-text hover:text-church-primary hover:bg-church-primary/5'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
              >
                <BibliaIcon className="h-6 w-6" />
                <span>Bíblia</span>
              </Link>
            </motion.div>
            <motion.div variants={{ open: { y: 0, opacity: 1 }, closed: { y: 8, opacity: 0 } }}>
              <Link
              to="/site/ministerios"
              className={`flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium transition-colors ${
                isActive('/site/ministerios') ? 'text-church-primary bg-church-primary/10' : 'text-jkd-text hover:text-church-primary hover:bg-church-primary/5'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
              >
                <MinistryIcon className="h-[22px] w-[22px]" />
                <span>Ministérios</span>
              </Link>
            </motion.div>
            <motion.div variants={{ open: { y: 0, opacity: 1 }, closed: { y: 8, opacity: 0 } }}>
              <Link
              to="/site/onde-estamos"
              className={`flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium transition-colors ${
                isActive('/site/onde-estamos') ? 'text-church-primary bg-church-primary/10' : 'text-jkd-text hover:text-church-primary hover:bg-church-primary/5'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
              >
                <OndeEstamosIcon className="h-5 w-5" />
                <span>Onde estamos</span>
              </Link>
            </motion.div>
            <motion.div variants={{ open: { y: 0, opacity: 1 }, closed: { y: 8, opacity: 0 } }}>
              <Link
              to="/site/agenda-pastoral"
              className={`flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium transition-colors ${
                isActive('/site/agenda-pastoral') ? 'text-church-primary bg-church-primary/10' : 'text-jkd-text hover:text-church-primary hover:bg-church-primary/5'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
              >
                <AgendaPastoralIcon className="h-5 w-5" />
                <span>Agenda Pastoral</span>
              </Link>
            </motion.div>
            
            

            {user?.role === 'admin' && (
              <motion.button
                variants={{ open: { y: 0, opacity: 1 }, closed: { y: 8, opacity: 0 } }}
                type="button"
                onClick={() => { setIsMobileMenuOpen(false); handleGoGerenciamento(); }}
                className={`flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium transition-colors ${
                  location.pathname === '/site/gerenciamento' ? 'text-church-primary bg-church-primary/10' : 'text-jkd-text hover:text-church-primary hover:bg-church-primary/5'
                }`}
              >
                <ShieldCheck size={20} />
                <span>Gerenciamento</span>
              </motion.button>
            )}

            {/* Item "Minist. Config." removido também do menu mobile */}

            {/* Login/Logout no menu mobile */}
            {firebaseUser && (
              <motion.button
                variants={{ open: { y: 0, opacity: 1 }, closed: { y: 8, opacity: 0 } }}
                onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                className="w-full text-left flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium transition-colors text-jkd-text hover:text-red-600 hover:bg-red-500/10"
              >
                <span>Sair</span>
              </motion.button>
            )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    <InputPromptModal
      isOpen={isPasswordModalOpen}
      title="Acesso Restrito"
      message="Informe a senha para acessar Gerenciamento."
      inputLabel="Senha"
      onConfirm={handleConfirmPassword}
      onCancel={() => setIsPasswordModalOpen(false)}
    />
    </header>
  );
};

export default SiteHeader;
  // Novo ícone para "Fonte News" que acompanha tema via currentColor
  const FonteNewsAltIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg
      viewBox="0 0 16 16"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M8 .5A7.76 7.76 0 0 0 0 8a7.76 7.76 0 0 0 8 7.5A7.76 7.76 0 0 0 16 8 7.76 7.76 0 0 0 8 .5zm6.71 6.8L13.48 7c-.25-.07-.27-.09-.29-.12-.15-.2-.32-.47-.48-.73 0-.09-.13-.23-.16-.31s.35-.6.51-.84a2.43 2.43 0 0 1 .59-.45 5.87 5.87 0 0 1 1.06 2.75zM8 1.75l-.09.17a.19.19 0 0 1 0-.1c0 .06-.15.15-.25.25l-.3.29a.85.85 0 0 0-.08 1.08h-.12a1.05 1.05 0 0 0-.81.42 1.27 1.27 0 0 0-.2 1.07V5a3 3 0 0 0-.43.11l-.24.08-.64.21a1.2 1.2 0 0 0-.81.8 1 1 0 0 0 .2.93 5.67 5.67 0 0 0 1.38 1.09 4.17 4.17 0 0 0 1.67.65h1.68a1.2 1.2 0 0 1 1.04.51.49.49 0 0 1 .13.43.77.77 0 0 1-.15.35 2.71 2.71 0 0 0-.95 1.61 11.11 11.11 0 0 1-.48 1.38c-.12.31-.23.61-.31.85a3.32 3.32 0 0 1-1-.08 3.28 3.28 0 0 0-.5-2.12 2.24 2.24 0 0 1-.53-1.42 2.11 2.11 0 0 0-1.47-2.29 10.81 10.81 0 0 1-2.9-2.64A6.79 6.79 0 0 1 8 1.75zM1.25 8a5.64 5.64 0 0 1 .12-1.16 10.29 10.29 0 0 0 2.94 2.42c.6.22.69.45.69 1.12a3.45 3.45 0 0 0 .86 2.27A3.05 3.05 0 0 1 6 14a6.35 6.35 0 0 1-4.75-6zm8.32 6.08c0-.15.12-.32.18-.48a10.2 10.2 0 0 0 .55-1.6 1.55 1.55 0 0 1 .54-.86 1.91 1.91 0 0 0 .57-1.3 1.71 1.71 0 0 0-.47-1.27 2.45 2.45 0 0 0-2-.9H7.35a4.77 4.77 0 0 1-2-1.11l.47-.16.27-.08a.79.79 0 0 1 .38-.07l.09.15a.64.64 0 0 0 .81.29.65.65 0 0 0 .34-.8v-.18c-.11-.3-.24-.72-.32-1A1.42 1.42 0 0 0 8.68 4a1 1 0 0 0-.18-1 3.44 3.44 0 0 0 .33-.34 1 1 0 0 0 .22-.8 6.93 6.93 0 0 1 3.73 1.8 3 3 0 0 0-.79.7 9.14 9.14 0 0 0-.64 1.09 1.46 1.46 0 0 0 .24 1.39c.18.31.38.61.56.86a1.58 1.58 0 0 0 1 .58c.22.06 1 .22 1.55.33a6.44 6.44 0 0 1-5.13 5.47z" />
    </svg>
  );
