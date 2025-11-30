import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Moon, Sun, Settings, LogIn, LogOut, Calendar, Bell, Church, User as UserIcon, Film, Video, Menu, X, MessageCircle, Megaphone } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useApp } from '../../hooks/useApp';
import { useThrottle } from '../../hooks/useDebounce';
import { motion, AnimatePresence } from 'framer-motion';
import LiveClock from '../Common/LiveClock';
import FonteVidaIcon from '../Common/FonteVidaIcon';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, query, where, getCountFromServer } from 'firebase/firestore';
import { defaultChatBeepUrl, defaultApprovalsBeepUrl, defaultRequestsBeepUrl } from '../../utils/sounds';

// Ícone customizado para "Área do Líder" seguindo a cor principal do App
const LeaderAreaIcon: React.FC<{ size?: number; className?: string }> = ({ size = 16, className }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    stroke="currentColor"
    className={className}
  >
    <path
      d="M5 22V14M5 14V4M5 14L7.47067 13.5059C9.1212 13.1758 10.8321 13.3328 12.3949 13.958C14.0885 14.6354 15.9524 14.7619 17.722 14.3195L17.9364 14.2659C18.5615 14.1096 19 13.548 19 12.9037V5.53669C19 4.75613 18.2665 4.18339 17.5092 4.3727C15.878 4.78051 14.1597 4.66389 12.5986 4.03943L12.3949 3.95797C10.8321 3.33284 9.1212 3.17576 7.47067 3.50587L5 4M5 4V2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const FonteNewsCamIcon: React.FC<{ size?: number; className?: string }> = ({ size = 20, className }) => (
  <span
    className={className}
    style={{
      display: 'inline-block',
      width: size,
      height: size,
      backgroundColor: 'currentColor',
      WebkitMaskImage: "url('/Fonte-News-Cam.svg')",
      maskImage: "url('/Fonte-News-Cam.svg')",
      WebkitMaskRepeat: 'no-repeat',
      maskRepeat: 'no-repeat',
      WebkitMaskSize: 'contain',
      maskSize: 'contain',
      WebkitMaskPosition: 'center',
      maskPosition: 'center',
    }}
  />
);

const Header: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { settings, announcements, leaderRequests } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [unseenChats, setUnseenChats] = useState<number>(0);
  const [showHeaderChatAlert, setShowHeaderChatAlert] = useState<boolean>(false);
  const [headerAlertTimerId, setHeaderAlertTimerId] = useState<number | null>(null);
  const chatAudioRef = useRef<HTMLAudioElement | null>(null);
  const approvalsAudioRef = useRef<HTMLAudioElement | null>(null);
  const requestsAudioRef = useRef<HTMLAudioElement | null>(null);
  const chatIntervalRef = useRef<number | null>(null);
  const approvalsIntervalRef = useRef<number | null>(null);
  const requestsIntervalRef = useRef<number | null>(null);
  const pendingApprovalsCount = announcements.filter(a => a.status === 'pending').length;
  const pendingRequestsCount = leaderRequests.filter(r => r.status === 'pending').length;
  const pendingAdminTotal = pendingApprovalsCount + pendingRequestsCount;

  // Temporarily removing throttle to test click functionality
  // const throttledToggleTheme = useThrottle(toggleTheme, 500);
  // const throttledLogout = useThrottle(logout, 1000);
  // const throttledNavigate = useThrottle((path: string) => navigate(path), 300);

  const isActive = (path: string) => location.pathname === path;

  const isOnChatRoute = location.pathname.startsWith('/chat');

  const handleLogout = () => {
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
    logout();
  };

  const handleNavigate = (path: string) => {
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
    navigate(path);
  };

  // Bounce toggle state/refs
  const [isThemeAnimating, setIsThemeAnimating] = useState(false);
  const sunRef = useRef<HTMLSpanElement | null>(null);
  const moonRef = useRef<HTMLSpanElement | null>(null);
  const EXIT_DURATION = 300; // ms
  const ENTER_DURATION = 520; // ms

  const handleBounceToggleTheme = () => {
    if (isThemeAnimating) return;
    setIsThemeAnimating(true);
    const current = isDark ? moonRef.current : sunRef.current;
    const next = isDark ? sunRef.current : moonRef.current;
    if (!current || !next) {
      // fallback
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
        // toggle theme at end
        toggleTheme();

        // ensure final state matches new theme
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

  // Sync icon states when theme changes externally
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

  const handleUserMenuToggle = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Badge de novas conversas não visualizadas (contagem estável)
  useEffect(() => {
    if (!user?.id) return;
    const chatsRef = collection(db, 'chats');
    const qChats = query(chatsRef, where('participants', 'array-contains', user.id));
    const unsub = onSnapshot(qChats, async (snap) => {
      const tasks: Promise<boolean>[] = [];
      snap.forEach(d => {
        const data: any = d.data();
        const participants: string[] = data.participants || [];
        const otherId = participants.find(p => p !== user.id);
        const rawLastViewed = data.lastViewed?.[user.id];
        const lastViewedAt = rawLastViewed?.toDate ? rawLastViewed.toDate() : (rawLastViewed instanceof Date ? rawLastViewed : undefined);
        if (!otherId) return;
        tasks.push((async () => {
          try {
            const msgsRef = collection(db, 'chats', d.id, 'messages');
            const qCount = lastViewedAt
              ? query(msgsRef, where('senderId', '==', otherId), where('createdAt', '>', lastViewedAt))
              : query(msgsRef, where('senderId', '==', otherId));
            const agg = await getCountFromServer(qCount);
            const cnt = (agg.data() as any).count || 0;
            return cnt > 0;
          } catch {
            return false;
          }
        })());
      });
      try {
        const results = await Promise.all(tasks);
        setUnseenChats(results.filter(Boolean).length);
      } catch {
        setUnseenChats(0);
      }
    });
    return () => { try { unsub(); } catch {} };
  }, [user?.id]);

  // Exibe o alerta do Header somente 2s após detectar conversas não lidas
  useEffect(() => {
    // limpa qualquer timer anterior
    if (headerAlertTimerId) {
      try { clearTimeout(headerAlertTimerId); } catch {}
    }

    // Não exibir alerta quando estiver na rota /chat
    if (isOnChatRoute) {
      setShowHeaderChatAlert(false);
      setHeaderAlertTimerId(null);
      return;
    }

    if (unseenChats > 0) {
      const id = window.setTimeout(() => {
        setShowHeaderChatAlert(true);
      }, 2000);
      setHeaderAlertTimerId(id);
    } else {
      setShowHeaderChatAlert(false);
      setHeaderAlertTimerId(null);
    }
    return () => {
      if (headerAlertTimerId) {
        try { clearTimeout(headerAlertTimerId); } catch {}
      }
    };
  }, [unseenChats, isOnChatRoute]);

  // Inicializa elementos de áudio quando URLs mudam
  useEffect(() => {
    // Stop and reset previous instance before reinitializing
    if (chatAudioRef.current) {
      try { chatAudioRef.current.pause(); chatAudioRef.current.currentTime = 0; } catch {}
    }
    if (settings.audioAlertChatUrl) {
      chatAudioRef.current = new Audio(settings.audioAlertChatUrl);
      chatAudioRef.current.load();
    } else {
      // Fallback: beep embutido
      const url = defaultChatBeepUrl();
      chatAudioRef.current = new Audio(url);
      chatAudioRef.current.load();
    }
  }, [settings.audioAlertChatUrl]);

  useEffect(() => {
    // Stop and reset previous instance before reinitializing
    if (approvalsAudioRef.current) {
      try { approvalsAudioRef.current.pause(); approvalsAudioRef.current.currentTime = 0; } catch {}
    }
    if (settings.audioAlertApprovalsUrl) {
      approvalsAudioRef.current = new Audio(settings.audioAlertApprovalsUrl);
      approvalsAudioRef.current.load();
    } else {
      // Fallback: beep embutido
      const url = defaultApprovalsBeepUrl();
      approvalsAudioRef.current = new Audio(url);
      approvalsAudioRef.current.load();
    }
  }, [settings.audioAlertApprovalsUrl]);

  useEffect(() => {
    // Stop and reset previous instance before reinitializing
    if (requestsAudioRef.current) {
      try { requestsAudioRef.current.pause(); requestsAudioRef.current.currentTime = 0; } catch {}
    }
    if (settings.audioAlertRequestsUrl) {
      requestsAudioRef.current = new Audio(settings.audioAlertRequestsUrl);
      requestsAudioRef.current.load();
    } else {
      // Fallback: beep embutido
      const url = defaultRequestsBeepUrl();
      requestsAudioRef.current = new Audio(url);
      requestsAudioRef.current.load();
    }
  }, [settings.audioAlertRequestsUrl]);

  // Loop 15s: alerta sonoro de Chat (para qualquer usuário)
  useEffect(() => {
    if (chatIntervalRef.current) {
      try { clearInterval(chatIntervalRef.current); } catch {}
      chatIntervalRef.current = null;
    }

    // Suprime áudio quando estiver na rota /chat
    if (unseenChats > 0 && chatAudioRef.current && !isOnChatRoute) {
      const playOnce = () => {
        chatAudioRef.current?.play().catch(() => {});
      };
      playOnce();
      chatIntervalRef.current = window.setInterval(playOnce, 15000);
    } else {
      try { chatAudioRef.current?.pause(); } catch {}
    }

    return () => {
      if (chatIntervalRef.current) {
        try { clearInterval(chatIntervalRef.current); } catch {}
        chatIntervalRef.current = null;
      }
    };
  }, [unseenChats, settings.audioAlertChatUrl, isOnChatRoute]);

  // Loop 15s: alertas sonoros de Aprovações e Solicitações (somente admin)
  useEffect(() => {
    if (approvalsIntervalRef.current) {
      try { clearInterval(approvalsIntervalRef.current); } catch {}
      approvalsIntervalRef.current = null;
    }
    if (requestsIntervalRef.current) {
      try { clearInterval(requestsIntervalRef.current); } catch {}
      requestsIntervalRef.current = null;
    }
    if (user?.role === 'admin') {
      if (pendingApprovalsCount > 0 && approvalsAudioRef.current) {
        const playApprovals = () => {
          approvalsAudioRef.current?.play().catch(() => {});
        };
        playApprovals();
        approvalsIntervalRef.current = window.setInterval(playApprovals, 15000);
      }
      if (pendingRequestsCount > 0 && requestsAudioRef.current) {
        const playRequests = () => {
          requestsAudioRef.current?.play().catch(() => {});
        };
        playRequests();
        requestsIntervalRef.current = window.setInterval(playRequests, 15000);
      }
    }
    return () => {
      if (approvalsIntervalRef.current) {
        try { clearInterval(approvalsIntervalRef.current); } catch {}
        approvalsIntervalRef.current = null;
      }
      if (requestsIntervalRef.current) {
        try { clearInterval(requestsIntervalRef.current); } catch {}
        requestsIntervalRef.current = null;
      }
    };
  }, [user?.role, pendingApprovalsCount, pendingRequestsCount, settings.audioAlertApprovalsUrl, settings.audioAlertRequestsUrl]);

  // Navegação desktop com rótulo rotativo
  const desktopMenuItems = useMemo(() => {
    const items: Array<{
      key: string;
      type: 'link' | 'external';
      to?: string;
      href?: string;
      label: string;
      isActive: boolean;
      Icon: React.ComponentType<{ size?: number; className?: string }> | ((props: { className?: string }) => JSX.Element);
    }> = [];

    items.push({
      key: 'inicio-external',
      type: 'external',
      href: 'https://adfontedevidalaranjeiras.org',
      label: 'Início',
      isActive: false,
      Icon: (props) => <FonteVidaIcon className={props.className || 'h-5 w-5'} />
    });

    items.push({ key: 'news', type: 'link', to: '/', label: 'Fonte News', isActive: isActive('/'), Icon: (p) => <FonteNewsCamIcon size={25} className={p.className || 'h-[1.625rem] w-[1.625rem]'} /> });
    items.push({ key: 'cultos', type: 'link', to: '/cultos', label: 'Cultos', isActive: isActive('/cultos'), Icon: (p) => <Church size={21} className={p.className} /> });
    items.push({ key: 'agenda', type: 'link', to: '/agenda', label: 'Agenda', isActive: isActive('/agenda'), Icon: (p) => <Calendar size={21} className={p.className} /> });

    if (!user || (user && user.role !== 'admin' && user.role !== 'editor' && user.role !== 'leader')) {
      items.push({ key: 'leader-area', type: 'link', to: '/login', label: 'Área do Líder', isActive: false, Icon: (p) => <LeaderAreaIcon size={21} className={p.className} /> });
    }

    if (user && (user.role === 'admin' || user.role === 'editor')) {
      items.push({ key: 'roteiros', type: 'link', to: '/roteiros', label: 'Roteiros', isActive: location.pathname.startsWith('/roteiros'), Icon: (p) => <Film size={21} className={p.className} /> });
    }

    if (user) {
      items.push({ key: 'painel', type: 'link', to: '/dashboard', label: 'Painel', isActive: location.pathname.startsWith('/dashboard'), Icon: (p) => <Megaphone size={21} className={p.className} /> });
    }

    if (user?.role === 'admin') {
      items.push({ key: 'admin', type: 'link', to: '/admin', label: 'Admin', isActive: isActive('/admin'), Icon: (p) => <Settings size={21} className={p.className} /> });
    }

    return items;
  }, [user, location.pathname]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  useEffect(() => {
    if (desktopMenuItems.length === 0) return;
    const interval = setInterval(() => {
      if (hoverIndex === null) {
        setActiveIndex((prev) => (prev + 1) % desktopMenuItems.length);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [hoverIndex, desktopMenuItems.length]);

  return (
    <header className="bg-jkd-bg-sec border-b border-jkd-border shadow-sm sticky top-0 z-40">
      <style>{`
        /* Override local apenas para a logo no menu principal do Fonte News */
        .fonte-news-logo .h-8 { height: 3rem !important; }
      `}</style>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo e Nome */}
          <Link to="/" className="flex items-center space-x-3 fonte-news-logo">
            <img 
              src={settings.logoUrl} 
              alt="Logo Fonte News" 
              className="h-8 w-auto object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://via.placeholder.com/100x50/ff652c/ffffff?text=IGREJA';
              }}
            />
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold text-jkd-heading">
                Fonte News
              </h1>
            </div>
          </Link>

          {/* Navegação com ícones sempre visíveis e rótulo rotativo */}
          <nav className="hidden md:flex items-center space-x-4">
            {desktopMenuItems.map((item, index) => {
              const isDisplayed = (hoverIndex ?? activeIndex) === index;
              const baseClasses = `group flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 ease-in-out ${
                item.isActive ? 'text-church-primary bg-church-primary/10' : 'text-jkd-text hover:text-church-primary hover:bg-church-primary/5'
              }`;
              const labelClasses = `font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out max-w-0 opacity-0 ml-0 ${
                isDisplayed ? 'max-w-xs opacity-100 ml-2' : ''
              }`;

              if (item.type === 'external' && item.href) {
                return (
                  <a
                    key={item.key}
                    href={item.href}
                    target="_self"
                    className={baseClasses}
                    onMouseEnter={() => setHoverIndex(index)}
                    onMouseLeave={() => setHoverIndex(null)}
                  >
                    <item.Icon className="h-[1.625rem] w-[1.625rem]" />
                  <span className={labelClasses}>{item.label}</span>
                </a>
                );
              }

              return (
                <Link
                  key={item.key}
                  to={item.to || '/'}
                  className={baseClasses}
                  onMouseEnter={() => setHoverIndex(index)}
                  onMouseLeave={() => setHoverIndex(null)}
                >
                  <item.Icon className="" />
                  <span className={labelClasses}>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Ações */}
          <div className="flex items-center space-x-3">
            <LiveClock />
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

          {/* Ícone de sino com contagem somada de Aprovações + Solicitações (apenas admin) */}
          {user?.role === 'admin' && pendingAdminTotal > 0 && (
            <button
              onClick={() => handleNavigate('/admin')}
              className="relative p-2 rounded-lg text-jkd-text hover:bg-church-primary/10 hover:text-church-primary transition-colors"
              aria-label="Abrir Aprovações/Solicitações"
            >
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-orange-500 px-1.5 text-[10px] font-bold text-white">
                {pendingAdminTotal}
              </span>
            </button>
          )}

          {/* Ícone de Chat com badge — só aparece se houver mensagens não vistas */}
          {user && unseenChats > 0 && !isOnChatRoute && (
            <button
              onClick={() => handleNavigate('/chat')}
              className="relative p-2 rounded-lg text-jkd-text hover:bg-church-primary/10 hover:text-church-primary transition-colors"
              aria-label="Abrir Chat"
            >
              <MessageCircle size={20} />
              <span className="absolute -top-1 -right-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white">
                {unseenChats}
              </span>
            </button>
          )}

            {/* Botão do Menu Mobile */}
            <button
              onClick={handleMobileMenuToggle}
              className="md:hidden p-2 rounded-lg text-jkd-text hover:bg-church-primary/10 hover:text-church-primary transition-colors"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={handleUserMenuToggle}
                  className="flex items-center space-x-2 rounded-full p-1 hover:bg-jkd-border transition-colors"
                >
                  <img
                    src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name}&background=ff652c&color=fff`}
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
                      className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-jkd-bg-sec shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-jkd-border"
                    >
                      <div className="py-1">
                        <div className="px-4 py-2 border-b border-jkd-border">
                          <p className="text-sm font-medium text-jkd-heading truncate">{user.name}</p>
                          <p className="text-xs text-jkd-text truncate">{user.email}</p>
                        </div>
                        <button
                          onClick={() => handleNavigate('/profile')}
                          className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-jkd-text hover:bg-jkd-bg"
                        >
                          <UserIcon size={16} />
                          <span>Meu Perfil</span>
                        </button>
                        <button
                          onClick={handleLogout}
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
              <Link
                to="/login"
                className="flex items-center space-x-1 px-4 py-2 bg-church-primary text-white rounded-lg hover:bg-church-primary/90 transition-colors"
              >
                <LogIn size={16} />
                <span>Entrar</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Menu Mobile */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-jkd-bg-sec border-b border-jkd-border"
          >
            <motion.div
              initial="closed"
              animate="open"
              exit="closed"
              variants={{ open: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } } }}
              className="px-4 py-2 space-y-1"
            >
              <motion.div variants={{ open: { y: 0, opacity: 1 }, closed: { y: 8, opacity: 0 } }}>
              <a 
                href="https://adfontedevidalaranjeiras.org"
                target="_self"
                className="flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium text-jkd-text hover:text-church-primary hover:bg-church-primary/5 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <FonteVidaIcon className="h-[1.625rem] w-[1.625rem]" />
                <span>Início</span>
              </a>
              </motion.div>

              <motion.div variants={{ open: { y: 0, opacity: 1 }, closed: { y: 8, opacity: 0 } }}>
              <Link 
                to="/" 
                className={`flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium transition-colors ${
                  isActive('/') 
                    ? 'text-church-primary bg-church-primary/10' 
                    : 'text-jkd-text hover:text-church-primary hover:bg-church-primary/5'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <FonteNewsCamIcon size={31} />
                <span>Fonte News</span>
              </Link>
              </motion.div>
              
              <motion.div variants={{ open: { y: 0, opacity: 1 }, closed: { y: 8, opacity: 0 } }}>
              <Link 
                to="/cultos" 
                className={`flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium transition-colors ${
                  isActive('/cultos') 
                    ? 'text-church-primary bg-church-primary/10' 
                    : 'text-jkd-text hover:text-church-primary hover:bg-church-primary/5'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Church size={26} />
                <span>Cultos</span>
              </Link>
              </motion.div>

              <motion.div variants={{ open: { y: 0, opacity: 1 }, closed: { y: 8, opacity: 0 } }}>
              <Link 
                to="/agenda" 
                className={`flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium transition-colors ${
                  isActive('/agenda') 
                    ? 'text-church-primary bg-church-primary/10' 
                    : 'text-jkd-text hover:text-church-primary hover:bg-church-primary/5'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Calendar size={26} />
                <span>Agenda</span>
              </Link>
              </motion.div>

              {/* Área do Líder no menu principal (mobile) */}
              {(!user || (user && user.role !== 'admin' && user.role !== 'editor' && user.role !== 'leader')) && (
                <motion.div variants={{ open: { y: 0, opacity: 1 }, closed: { y: 8, opacity: 0 } }}>
                  <Link 
                    to="/login" 
                    className={`flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium transition-colors text-jkd-text hover:text-church-primary hover:bg-church-primary/5`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <LeaderAreaIcon size={26} />
                    <span>Área do Líder</span>
                  </Link>
                </motion.div>
              )}

              {user && (user.role === 'admin' || user.role === 'editor') && (
                <motion.div variants={{ open: { y: 0, opacity: 1 }, closed: { y: 8, opacity: 0 } }}>
                  <Link 
                    to="/roteiros" 
                    className={`flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium transition-colors ${
                      location.pathname.startsWith('/roteiros')
                        ? 'text-church-primary bg-church-primary/10' 
                        : 'text-jkd-text hover:text-church-primary hover:bg-church-primary/5'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Film size={26} />
                    <span>Roteiros</span>
                  </Link>
                </motion.div>
              )}

              {user && (
                <motion.div variants={{ open: { y: 0, opacity: 1 }, closed: { y: 8, opacity: 0 } }}>
                  <Link 
                    to="/dashboard" 
                    className={`flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium transition-colors ${
                      location.pathname.startsWith('/dashboard')
                        ? 'text-church-primary bg-church-primary/10' 
                        : 'text-jkd-text hover:text-church-primary hover:bg-church-primary/5'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Megaphone size={26} />
                    <span>Painel</span>
                  </Link>
                </motion.div>
              )}

              {user?.role === 'admin' && (
                <motion.div variants={{ open: { y: 0, opacity: 1 }, closed: { y: 8, opacity: 0 } }}>
                  <Link 
                    to="/admin" 
                    className={`flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium transition-colors ${
                      isActive('/admin') 
                        ? 'text-church-primary bg-church-primary/10' 
                        : 'text-jkd-text hover:text-church-primary hover:bg-church-primary/5'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Settings size={26} />
                    <span>Admin</span>
                  </Link>
                </motion.div>
              )}

              {/* Seção do usuário no menu mobile */}
              {user ? (
                <div className="border-t border-jkd-border pt-3 mt-3">
                  <div className="flex items-center space-x-3 px-3 py-2">
                    <img
                      src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name}&background=ff652c&color=fff`}
                      alt="Avatar do usuário"
                      className="h-8 w-8 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm font-medium text-jkd-heading truncate">{user.name}</p>
                      <p className="text-xs text-jkd-text truncate">{user.email}</p>
                    </div>
                  </div>
                  <motion.div variants={{ open: { y: 0, opacity: 1 }, closed: { y: 8, opacity: 0 } }}>
                    <Link
                      to="/profile"
                      className="flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium text-jkd-text hover:text-church-primary hover:bg-church-primary/5 transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <UserIcon size={20} />
                      <span>Meu Perfil</span>
                    </Link>
                  </motion.div>
                  <motion.div variants={{ open: { y: 0, opacity: 1 }, closed: { y: 8, opacity: 0 } }}>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut size={20} />
                      <span>Sair</span>
                    </button>
                  </motion.div>
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
