import React, { createContext, useState, useEffect, ReactNode, useRef } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, User as FirebaseUser, updateProfile } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { isFirebaseEnabled } from '../lib/env';
import { api } from '../lib/api';
import { useApp } from '../hooks/useApp';
import { User } from '../types';
import { sessionManager } from '../utils/sessionManager';

export interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  loginEmailExclusive: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateUser: (updatedFields: Partial<User>) => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { authorizedUsers, settings, setOnlineStatus, addLeaderRequest } = useApp();

  // Manter sempre a versão mais recente de authorizedUsers acessível dentro de callbacks assíncronos
  const authorizedUsersRef = useRef<any[]>([]);
  useEffect(() => {
    authorizedUsersRef.current = authorizedUsers;
  }, [authorizedUsers]);

  // Função para mapear FirebaseUser -> AuthorizedUser após authorizedUsers estar disponível
  const mapFromFirebaseUser = async (fbUser: FirebaseUser) => {
    try {
      // Procurar usuário autorizado pelo firebaseUid; se não existir, tentar vincular pelo email
      let authorizedUser = authorizedUsersRef.current.find((u: any) => u.firebaseUid === fbUser.uid);
      if (!authorizedUser && fbUser.email) {
        const matchByEmail = authorizedUsersRef.current.find((u: any) => (u.email || '').toLowerCase() === fbUser.email!.toLowerCase());
        if (matchByEmail) {
          try {
            await setDoc(doc(db, 'authorizedUsers', matchByEmail.id), { firebaseUid: fbUser.uid }, { merge: true });
            console.log('🔗 Vinculado firebaseUid ao authorizedUser via email:', matchByEmail.email);
            authorizedUser = { ...matchByEmail, firebaseUid: fbUser.uid } as any;
          } catch (err) {
            console.error('❌ Falha ao vincular firebaseUid no authorizedUsers:', err);
          }
        }
      }

      if (authorizedUser && authorizedUser.status === 'active') {
        // Criar/atualizar sessão desta aba específica
        sessionManager.setSession(authorizedUser.id, authorizedUser.email);

        const userData: User = {
          id: authorizedUser.id,
          name: authorizedUser.name,
          email: authorizedUser.email,
          role: authorizedUser.role,
          ministry: authorizedUser.ministry,
          avatarUrl: authorizedUser.avatarUrl || fbUser.photoURL || ''
        };

        setUser(userData);

        // Inicializar presença
        try {
          const { presenceManager } = await import('../utils/presenceManager');
          await presenceManager.setOnline(authorizedUser.id);
        } catch (error) {
          console.error('❌ Erro ao inicializar sistema de presença:', error);
        }

        // Mapear segurança em /users
        try {
          await setDoc(doc(db, 'users', fbUser.uid), {
            authorizedUserId: authorizedUser.id,
            role: authorizedUser.role,
            email: authorizedUser.email,
            name: authorizedUser.name,
            status: authorizedUser.status,
            updatedAt: new Date()
          }, { merge: true });
          console.log('✅ Mapeamento de segurança atualizado em /users:', fbUser.uid);
        } catch (error) {
          console.error('❌ Falha ao atualizar mapeamento de segurança do usuário:', error);
        }

        setOnlineStatus(authorizedUser.id, true);
        console.log('✅ Usuário autenticado:', userData.name, 'Tab ID:', sessionManager.getTabId());
      } else {
        console.warn('⚠️ FirebaseUser não mapeado em authorizedUsers ou inativo. Aguardando lista carregar.');
        // Limpar apenas dados de usuário desta aba; manter firebaseUser para remapeamento quando authorizedUsers carregar
        sessionManager.clearSession();
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isFirebaseEnabled()) {
      setIsLoading(true);
      try {
        const token = typeof window !== 'undefined' ? sessionStorage.getItem('fonte:token') : null;
        if (token) {
          api.get('/me').then(res => {
            const u = res.data?.user;
            if (u) setUser({ id: u.id, name: u.name, email: u.email, role: u.role } as any);
            setIsLoading(false);
          }).catch(() => setIsLoading(false));
        } else {
          setIsLoading(false);
        }
      } catch {
        setIsLoading(false);
      }
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setIsLoading(true);
      
      if (fbUser) {
        setFirebaseUser(fbUser);
        // Usar função dedicada para mapear, considerando que authorizedUsers pode não ter carregado ainda
        await mapFromFirebaseUser(fbUser);
      } else {
        setFirebaseUser(null);
        setUser(null);
        // Só limpar sessão desta aba específica
        sessionManager.clearSession();
        console.log('🚪 Usuário deslogado da aba:', sessionManager.getTabId());
      }
      
      // setIsLoading(false) é tratado dentro de mapFromFirebaseUser ou no fluxo de deslogado
      if (!fbUser) setIsLoading(false);
    });

    // Em ambiente nativo, garantir processamento de redirect de provedores (Google)
    if (Capacitor.isNativePlatform()) {
      getRedirectResult(auth).catch(() => {});
    }

    return () => unsubscribe();
  }, [setOnlineStatus]);

  // Remapear quando authorizedUsers carregar após o Firebase já ter autenticado
  useEffect(() => {
    if (firebaseUser && !user) {
      setIsLoading(true);
      mapFromFirebaseUser(firebaseUser);
    }
  }, [authorizedUsers, firebaseUser, user]);

  // Efeito separado para monitorar mudanças de status do usuário atual
  useEffect(() => {
    if (firebaseUser && user) {
      const currentAuthorizedUser = authorizedUsers.find(u => u.firebaseUid === firebaseUser.uid);
      
      // Só fazer logout se o usuário ATUAL teve seu status alterado para inativo/bloqueado
      if (currentAuthorizedUser && currentAuthorizedUser.status !== 'active') {
        console.warn('⚠️ Status do usuário atual alterado para:', currentAuthorizedUser.status);
        console.log('🚪 Fazendo logout devido à mudança de status');
        
        // Limpar sessão desta aba específica
        sessionManager.clearSession();
        setUser(null);
        setFirebaseUser(null);
        
        // Fazer signOut do Firebase para esta sessão
        signOut(auth).catch(error => {
          console.error('❌ Erro ao fazer signOut:', error);
        });
      }
    }
  }, [authorizedUsers, firebaseUser, user]);

  const unauthorizedMessage = `Seu acesso não foi autorizado. Por gentileza, entre em contato com a secretaria (${settings.contactInfo.email}) para regularizar sua situação, ou envie uma solicitação on-line.`;

  const login = async (email: string, password: string): Promise<{ success: boolean, message?: string }> => {
    if (!isFirebaseEnabled()) {
      try {
        setIsLoading(true);
        const res = await api.post('/auth/login', { email, password });
        const token = res.data?.token;
        const u = res.data?.user;
        if (token) sessionStorage.setItem('fonte:token', token);
        if (u) setUser({ id: u.id, name: u.name, email: u.email, role: u.role } as any);
        setIsLoading(false);
        return { success: true };
      } catch {
        setIsLoading(false);
        return { success: false, message: 'E-mail ou senha inválidos.' };
      }
    }
    try {
      setIsLoading(true);

      // 1) Autenticar primeiro no Firebase Auth
      await signInWithEmailAndPassword(auth, email.trim(), password);

      const fbUser = auth.currentUser;
      if (!fbUser) {
        setIsLoading(false);
        return { success: false, message: 'Falha ao autenticar. Tente novamente.' };
      }

      // 2) Encontrar usuário autorizado por firebaseUid; se não existir, tentar vincular por email
      let authorizedUser = authorizedUsers.find(u => u.firebaseUid === fbUser.uid);
      if (!authorizedUser && fbUser.email) {
        const matchByEmail = authorizedUsers.find(u => (u.email || '').toLowerCase() === fbUser.email!.toLowerCase());
        if (matchByEmail) {
          try {
            await setDoc(doc(db, 'authorizedUsers', matchByEmail.id), { firebaseUid: fbUser.uid }, { merge: true });
            authorizedUser = { ...matchByEmail, firebaseUid: fbUser.uid } as any;
          } catch (err) {
            console.error('❌ Falha ao vincular firebaseUid no authorizedUsers:', err);
          }
        }
      }

      // 3) Bloquear acesso caso não esteja autorizado ou esteja bloqueado/inativo
      if (!authorizedUser) {
        await signOut(auth);
        setIsLoading(false);
        return { success: false, message: unauthorizedMessage };
      }

      if (authorizedUser.status === 'blocked') {
        await signOut(auth);
        setIsLoading(false);
        return { success: false, message: 'Sua conta está bloqueada. Entre em contato com a secretaria.' };
      }

      if (authorizedUser.status === 'inactive') {
        await signOut(auth);
        setIsLoading(false);
        return { success: false, message: 'Sua conta está inativa. Entre em contato com a secretaria.' };
      }

      setIsLoading(false);
      return { success: true };
    } catch (error: any) {
      setIsLoading(false);
      console.error('Erro no login:', error);

      if (error.code === 'auth/operation-not-allowed') {
        // Provider Email/Password desabilitado no Firebase Auth
        return { success: false, message: 'Login por e-mail/senha está desabilitado. Peça ao administrador para ativar "Email/Password" em Firebase Authentication.' };
      }

      if (error.code === 'auth/user-not-found') {
        // Se não encontrou no Auth, verificar se existe em authorizedUsers. Se existir e estiver ativo, criar a conta automaticamente.
        const normalizedEmail = (email || '').trim().toLowerCase();
        const match = authorizedUsers.find(u => (u.email || '').toLowerCase() === normalizedEmail);

        if (match) {
          if (match.status === 'blocked') {
            return { success: false, message: 'Sua conta está bloqueada. Entre em contato com a secretaria.' };
          }
          if (match.status === 'inactive') {
            return { success: false, message: 'Sua conta está inativa. Entre em contato com a secretaria.' };
          }

          // Se há uma senha definida no menu Líderes, exigir que a senha digitada coincida
          const leaderPassword = (match as any).password ? String((match as any).password) : '';
          if (leaderPassword.trim().length > 0) {
            if (leaderPassword !== password) {
              return { success: false, message: 'Senha incorreta. Utilize a senha definida pela secretaria no menu Líderes.' };
            }
          }

          // Usuário autorizado e ativo: criar conta no Firebase Auth com a senha informada
          try {
            await createUserWithEmailAndPassword(auth, email.trim(), password);
            const fbNew = auth.currentUser;
            if (fbNew) {
              // Definir displayName do perfil Auth com o nome do autorizado
              try { await updateProfile(fbNew, { displayName: match.name || '' }); } catch {}
              try {
                await setDoc(doc(db, 'authorizedUsers', match.id), { firebaseUid: fbNew.uid }, { merge: true });
                await setDoc(doc(db, 'users', fbNew.uid), {
                  authorizedUserId: match.id,
                  role: match.role,
                  email: match.email,
                  name: match.name,
                  status: match.status,
                  updatedAt: new Date()
                }, { merge: true });
              } catch (linkErr) {
                console.error('❌ Falha ao vincular novo usuário criado:', linkErr);
              }
              return { success: true };
            } else {
              return { success: false, message: 'Conta criada, mas falha ao autenticar. Tente novamente.' };
            }
          } catch (createErr: any) {
            console.error('❌ Erro ao criar usuário no Firebase Auth:', createErr);
            if (createErr.code === 'auth/operation-not-allowed') {
              return { success: false, message: 'Cadastro por e-mail/senha está desabilitado. Ative "Email/Password" no Firebase Authentication.' };
            }
            if (createErr.code === 'auth/email-already-in-use') {
              return { success: false, message: 'Este e-mail já possui uma conta. Tente novamente.' };
            }
            return { success: false, message: 'Não foi possível criar sua conta. Tente novamente.' };
          }
        }

        // Não existe em authorizedUsers: exibir mensagem e disparar solicitação automática
        try {
          await addLeaderRequest({ name: '', email: email.trim(), phone: '', ministry: '' });
        } catch {}
        return { success: false, message: unauthorizedMessage };
      } else if (error.code === 'auth/wrong-password') {
        // Opcional: se a senha digitada coincide com a senha definida no menu Líderes,
        // mas diverge da senha atual do Firebase Auth, orientar a redefinição de senha.
        const normalizedEmail = (email || '').trim().toLowerCase();
        const match = authorizedUsers.find(u => (u.email || '').toLowerCase() === normalizedEmail);
        const leaderPassword = match && (match as any).password ? String((match as any).password) : '';
        if (leaderPassword && leaderPassword === password) {
          return { success: false, message: 'A senha definida pela secretaria difere da senha atual. Clique em "Esqueci minha senha" para receber o e-mail de redefinição.' };
        }
        return { success: false, message: 'Senha incorreta.' };
      } else if (error.code === 'auth/invalid-email') {
        return { success: false, message: 'Email inválido.' };
      } else if (error.code === 'auth/too-many-requests') {
        return { success: false, message: 'Muitas tentativas de login. Tente novamente mais tarde.' };
      } else if (error.code === 'auth/invalid-credential') {
        return { success: false, message: 'E-mail ou senha inválidos.' };
      }

      return { success: false, message: 'Erro no login. Tente novamente.' };
    }
  };

  // Fluxo exclusivo de login por e-mail/senha (sem Google), com criação automática de solicitação
  const loginEmailExclusive = async (email: string, password: string): Promise<{ success: boolean, message?: string }> => {
    if (!isFirebaseEnabled()) {
      return login(email, password);
    }
    // Reusa o mesmo fluxo do login padrão, mas reforça a criação de solicitação para qualquer e-mail não mapeado
    const result = await login(email, password);
    if (!result.success && (result.message || '').includes('Seu acesso não foi autorizado')) {
      try { await addLeaderRequest({ name: '', email: email.trim(), phone: '', ministry: '' }); } catch {}
    }
    return result;
  };

  const loginWithGoogle = async (): Promise<{ success: boolean, message?: string }> => {
    if (!isFirebaseEnabled()) {
      return { success: false, message: 'Login via Google desativado.' };
    }
    try {
      setIsLoading(true);
      const provider = new GoogleAuthProvider();
      const isNative = Capacitor.isNativePlatform();

      if (isNative) {
        // Em ambiente nativo (Capacitor), preferir redirect ao invés de popup
        await signInWithRedirect(auth, provider);
        try { await getRedirectResult(auth); } catch {}
        setIsLoading(false);
        return { success: true };
      } else {
        await signInWithPopup(auth, provider);
        setIsLoading(false);
        return { success: true };
      }
    } catch (error: any) {
      setIsLoading(false);
      console.error('Erro no login com Google:', error);
      
      if (error.code === 'auth/popup-closed-by-user') {
        return { success: false, message: 'Login cancelado pelo usuário.' };
      } else if (error.code === 'auth/popup-blocked') {
        return { success: false, message: 'Popup bloqueado pelo navegador. Permita popups para este site.' };
      }
      
      return { success: false, message: 'Erro no login com Google. Tente novamente.' };
    }
  };

  const logout = async () => {
    try {
      if (user?.id) {
        // Usar o novo sistema de presença para logout instantâneo
        const { presenceManager } = await import('../utils/presenceManager');
        await presenceManager.setOffline();
      }
      
      // Limpar sessão
      sessionManager.clearSession();
      try { sessionStorage.removeItem('fonte:token'); } catch {}
      
      // Fazer logout do Firebase
      if (isFirebaseEnabled()) {
        await signOut(auth);
      }
      
      console.log('✅ Logout realizado com sucesso');
    } catch (error) {
      console.error('❌ Erro durante logout:', error);
      
      // Mesmo com erro, limpar estado local
      sessionManager.clearSession();
      try { sessionStorage.removeItem('fonte:token'); } catch {}
      
      if (isFirebaseEnabled()) {
        try { await signOut(auth); } catch (signOutError) { console.error('❌ Erro ao fazer signOut do Firebase:', signOutError); }
      }
    }
  };

  const updateUser = (updatedFields: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updatedFields };
      setUser(updatedUser);
    }
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, login, loginEmailExclusive, loginWithGoogle, logout, updateUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
