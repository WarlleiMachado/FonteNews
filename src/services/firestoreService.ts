import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  setDoc,
  query,
  orderBy,
  where,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage, auth } from '../lib/firebase';
import { Announcement, Culto, Script, ChurchSettings, User, Message, LeaderRequest, MinistryDepartment, AuthorizedUser } from '../types';

// Announcements
export const saveAnnouncement = async (announcement: Omit<Announcement, 'id'>): Promise<string> => {
  try {
    console.log('💾 [FirestoreService] Salvando anúncio no Firestore:', announcement);
    console.log('🔍 [FirestoreService] Auth object:', auth);
    console.log('🔍 [FirestoreService] Auth currentUser:', auth.currentUser);
    console.log('🔍 [FirestoreService] Auth currentUser UID:', auth.currentUser?.uid);
    
    // Verificar se o usuário está autenticado
    if (!auth.currentUser) {
      const errorMsg = 'Usuário não autenticado. Faça login novamente.';
      console.error('❌ [FirestoreService]', errorMsg);
      throw new Error(errorMsg);
    }
    
    console.log('👤 [FirestoreService] Usuário autenticado:', auth.currentUser.uid);
    
    const announcementData = {
      ...announcement,
      createdAt: serverTimestamp(),
      authorFirebaseUid: auth.currentUser.uid
    };
    
    console.log('📦 [FirestoreService] Dados preparados para salvamento:', announcementData);
    console.log('🔍 [FirestoreService] DB object:', db);
    console.log('🔍 [FirestoreService] Collection reference:', collection(db, 'announcements'));
    
    const docRef = await addDoc(collection(db, 'announcements'), announcementData);
    console.log('✅ [FirestoreService] Anúncio salvo com ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ [FirestoreService] Erro ao salvar anúncio:', error);
    console.error('❌ [FirestoreService] Error message:', (error as any).message);
    console.error('❌ [FirestoreService] Error stack:', (error as any).stack);
    throw error;
  }
};

export const updateAnnouncement = async (id: string, updates: Partial<Announcement>): Promise<void> => {
  try {
    const docRef = doc(db, 'announcements', id);
    // Evitar sobrescrever createdAt e garantir updatedAt de servidor
    const { createdAt, ...rest } = updates as any;
    await updateDoc(docRef, { ...rest, updatedAt: serverTimestamp() });
  } catch (error) {
    console.error('Erro ao atualizar anúncio:', error);
    throw error;
  }
};

/**
 * Verifica se o usuário atual tem permissões de administrador
 * @returns Promise<boolean> - true se for admin, false caso contrário
 */
export const isUserAdmin = async (): Promise<boolean> => {
  try {
    if (!auth.currentUser) {
      console.log('❌ [Auth Check] Usuário não autenticado');
      return false;
    }

    const userEmail = auth.currentUser.email || '';
    const userUid = auth.currentUser.uid;
    
    console.log('🔍 [Auth Check] Verificando permissões para:', userEmail, 'UID:', userUid);

    // Verificar emails administrativos específicos (prioridade máxima)
    const adminEmails = [
      'fontedevidalaranjeiras@gmail.com',
      'secretaria.adfdevidalaranjeiras@gmail.com'
    ];

    if (adminEmails.includes(userEmail)) {
      console.log('✅ [Auth Check] Usuário é admin por email autorizado:', userEmail);
      return true;
    }

    // Verificar custom claims E validar contra authorizedUsers
    const tokenResult = await auth.currentUser.getIdTokenResult();
    const hasAdminClaim = tokenResult.claims.admin === true;
    
    console.log('🔍 [Auth Check] Custom claims:', tokenResult.claims);
    console.log('🔍 [Auth Check] Tem admin claim:', hasAdminClaim);

    // 🔧 CORREÇÃO: Verificar também no Firestore se o usuário é realmente admin
    try {
      const authorizedUsersSnapshot = await getDocs(
        query(collection(db, 'authorizedUsers'), where('firebaseUid', '==', userUid))
      );
      
      if (authorizedUsersSnapshot.empty) {
        console.log('❌ [Auth Check] Usuário não encontrado em authorizedUsers');
        // Se não encontrado, conceder apenas se tiver claim admin
        return hasAdminClaim;
      }
      
      const authorizedUser = authorizedUsersSnapshot.docs[0].data();
      const isActiveAdmin = authorizedUser.role === 'admin' && authorizedUser.status === 'active';
      
      console.log('🔍 [Auth Check] Dados do authorizedUser:', {
        role: authorizedUser.role,
        status: authorizedUser.status,
        email: authorizedUser.email
      });
      
      // Além de authorizedUsers, checar o espelho em /users/{uid}
      let usersDocIsAdmin = false;
      try {
        const userDocSnap = await getDoc(doc(db, 'users', userUid));
        if (userDocSnap.exists()) {
          const userDocData = userDocSnap.data() as any;
          usersDocIsAdmin = userDocData?.role === 'admin';
          console.log('🔍 [Auth Check] /users mapeado:', { role: userDocData?.role, usersDocIsAdmin });
        }
      } catch (err) {
        console.warn('⚠️ [Auth Check] Falha ao ler /users para checagem de role:', err);
      }

      const finalIsAdmin = Boolean(hasAdminClaim || isActiveAdmin || usersDocIsAdmin);
      if (!finalIsAdmin) {
        console.log('❌ [Auth Check] Usuário sem privilégios admin após checagens combinadas');
      } else {
        console.log('✅ [Auth Check] Usuário confirmado como admin (claim/authorizedUsers/users)');
      }
      return finalIsAdmin;
      
    } catch (firestoreError) {
      console.error('❌ [Auth Check] Erro ao verificar authorizedUsers:', firestoreError);
      // Em caso de erro no Firestore, usar apenas claims como fallback (email já foi checado)
      return hasAdminClaim;
    }
    
  } catch (error) {
    console.error('❌ [Auth Check] Erro ao verificar permissões:', error);
    return false;
  }
};

/**
 * Deleta um anúncio/programação do Firestore
 * Apenas administradores podem excluir programações
 */
export const deleteAnnouncement = async (id: string): Promise<void> => {
  try {
    console.log('🗑️ [DELETE ANNOUNCEMENT] Iniciando exclusão:', id);
    
    // Verificar autenticação
    if (!auth.currentUser) {
      throw new Error('Você precisa estar logado para excluir programações.');
    }

    console.log('👤 [DELETE ANNOUNCEMENT] Usuário:', auth.currentUser.email);

    // Verificar se é administrador
    const isAdmin = await isUserAdmin();
    if (!isAdmin) {
      throw new Error('Apenas administradores podem excluir programações. Entre em contato com a secretaria se você deveria ter essa permissão.');
    }

    console.log('✅ [DELETE ANNOUNCEMENT] Permissões verificadas, prosseguindo com exclusão');

    // 🔧 CORREÇÃO: Verificar se o documento existe antes de tentar excluir
    const docRef = doc(db, 'announcements', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      console.log('⚠️ [DELETE ANNOUNCEMENT] Documento não existe:', id);
      throw new Error('Programação não encontrada. Pode ter sido excluída por outro usuário.');
    }
    
    console.log('📄 [DELETE ANNOUNCEMENT] Documento encontrado, executando exclusão...');
    
    // Executar exclusão
    await deleteDoc(docRef);
    
    console.log('🔥 [DELETE ANNOUNCEMENT] deleteDoc executado');
    
    // 🔧 CORREÇÃO: Aguardar um pouco e verificar se realmente foi excluído
    await new Promise(resolve => setTimeout(resolve, 500)); // Aguardar 500ms
    
    const checkDoc = await getDoc(docRef);
    if (!checkDoc.exists()) {
      console.log('✅ [DELETE ANNOUNCEMENT] CONFIRMADO: Documento foi excluído do Firestore');
    } else {
      console.log('❌ [DELETE ANNOUNCEMENT] PROBLEMA: Documento ainda existe após deleteDoc');
      console.log('📄 [DELETE ANNOUNCEMENT] Dados do documento:', checkDoc.data());
      throw new Error('Falha na exclusão: documento ainda existe no Firestore');
    }
    
    console.log('✅ [DELETE ANNOUNCEMENT] Programação excluída com sucesso:', id);
  } catch (error: any) {
    console.error('❌ [DELETE ANNOUNCEMENT] Erro:', error);
    
    // Tratar erros específicos do Firestore
    if (error.code === 'permission-denied') {
      throw new Error('Permissão negada pelo servidor. Apenas administradores podem excluir programações.');
    } else if (error.code === 'not-found') {
      throw new Error('Programação não encontrada. Pode ter sido excluída por outro usuário.');
    } else if (error.code === 'unauthenticated') {
      throw new Error('Sua sessão expirou. Faça login novamente.');
    } else if (error.message) {
      // Erro customizado já tratado
      throw error;
    } else {
      throw new Error('Erro inesperado ao excluir programação. Tente novamente.');
    }
  }
};

export const getAnnouncements = async (): Promise<Announcement[]> => {
  try {
    console.log('🔍 Buscando anúncios no Firestore...');
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    console.log('📊 Documentos encontrados:', querySnapshot.size);
    
    const announcements = querySnapshot.docs.map(doc => {
      const data = doc.data();
      console.log('📄 Documento anúncio:', doc.id, data);
      return {
        // Garantir que o ID do Firestore prevaleça sobre qualquer campo 'id' salvo no documento
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt
      };
    }) as Announcement[];
    
    console.log('✅ Anúncios processados:', announcements.length);
    return announcements;
  } catch (error) {
    console.error('❌ Erro ao buscar anúncios:', error);
    throw error;
  }
};

// Cultos
export const saveCulto = async (culto: Omit<Culto, 'id'>): Promise<string> => {
  try {
    console.log('💾 Salvando culto no Firestore:', culto);
    
    // Verificar se o usuário está autenticado
    if (!auth.currentUser) {
      throw new Error('Usuário não autenticado. Faça login novamente.');
    }
    
    console.log('👤 Usuário autenticado:', auth.currentUser.uid);
    
    // Garantir que createdAt seja uma data válida
    const createdAt = culto.createdAt instanceof Date ? culto.createdAt : new Date();
    console.log('📅 Data de criação:', createdAt);
    
    const cultoData = {
      ...culto,
      createdAt: Timestamp.fromDate(createdAt),
      authorFirebaseUid: auth.currentUser.uid
    };
    
    console.log('📦 Dados preparados para salvamento:', cultoData);
    
    const docRef = await addDoc(collection(db, 'cultos'), cultoData);
    console.log('✅ Culto salvo com ID:', docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error('❌ Erro ao salvar culto:', error);
    console.error('❌ Detalhes do erro:', error.message);
    console.error('❌ Stack trace:', error.stack);
    throw error;
  }
};

export const updateCulto = async (id: string, updates: Partial<Culto>): Promise<void> => {
  try {
    const docRef = doc(db, 'cultos', id);
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error('Erro ao atualizar culto:', error);
    throw error;
  }
};

export const deleteCulto = async (id: string): Promise<void> => {
  try {
    console.log('🗑️ [DELETE CULTO] Iniciando exclusão:', id);
    
    // Verificar autenticação
    if (!auth.currentUser) {
      throw new Error('Você precisa estar logado para excluir cultos.');
    }

    console.log('👤 [DELETE CULTO] Usuário:', auth.currentUser.email);

    // Verificar se é administrador
    const isAdmin = await isUserAdmin();
    if (!isAdmin) {
      throw new Error('Apenas administradores podem excluir cultos. Entre em contato com a secretaria se você deveria ter essa permissão.');
    }

    console.log('✅ [DELETE CULTO] Permissões verificadas, prosseguindo com exclusão');

    // Executar exclusão
    const docRef = doc(db, 'cultos', id);
    await deleteDoc(docRef);
    
    console.log('✅ [DELETE CULTO] Culto excluído com sucesso:', id);
  } catch (error: any) {
    console.error('❌ [DELETE CULTO] Erro:', error);
    
    // Tratar erros específicos do Firestore
    if (error.code === 'permission-denied') {
      throw new Error('Permissão negada pelo servidor. Apenas administradores podem excluir cultos.');
    } else if (error.code === 'not-found') {
      throw new Error('Culto não encontrado. Pode ter sido excluído por outro usuário.');
    } else if (error.code === 'unauthenticated') {
      throw new Error('Sua sessão expirou. Faça login novamente.');
    } else if (error.message) {
      // Erro customizado já tratado
      throw error;
    } else {
      throw new Error('Erro inesperado ao excluir culto. Tente novamente.');
    }
  }
};

export const getCultos = async (): Promise<Culto[]> => {
  try {
    console.log('🔍 Buscando cultos no Firestore...');
    const q = query(collection(db, 'cultos'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    console.log('📊 Documentos de cultos encontrados:', querySnapshot.size);
    
    const cultos = querySnapshot.docs.map(doc => {
      const data = doc.data();
      console.log('📄 Documento culto:', doc.id, data);
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate()
      };
    }) as Culto[];
    
    console.log('✅ Cultos processados:', cultos.length);
    return cultos;
  } catch (error) {
    console.error('❌ Erro ao buscar cultos:', error);
    throw error;
  }
};

// Roteiros (Scripts)
export const saveScript = async (script: Omit<Script, 'id'>): Promise<string> => {
  try {
    console.log('💾 Salvando roteiro no Firestore:', script);
    
    // Verificar se o usuário está autenticado
    if (!auth.currentUser) {
      throw new Error('Usuário não autenticado. Faça login novamente.');
    }
    
    console.log('👤 Usuário autenticado:', auth.currentUser.uid);
    
    const scriptData = {
      ...script,
      createdAt: Timestamp.fromDate(script.createdAt),
      updatedAt: Timestamp.fromDate(script.updatedAt),
      authorFirebaseUid: auth.currentUser.uid
    };
    
    console.log('📦 Dados preparados para salvamento:', scriptData);
    
    const docRef = await addDoc(collection(db, 'roteiros'), scriptData);
    console.log('✅ Roteiro salvo com ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Erro ao salvar roteiro:', error);
    throw error;
  }
};

export const updateScript = async (id: string, updates: Partial<Script>): Promise<void> => {
  try {
    console.log('📝 Atualizando roteiro:', id, updates);
    
    // Adicionar updatedAt automaticamente
    const updateData = {
      ...updates,
      updatedAt: Timestamp.now()
    };
    
    const docRef = doc(db, 'roteiros', id);
    await updateDoc(docRef, updateData);
    console.log('✅ Roteiro atualizado com sucesso:', id);
  } catch (error) {
    console.error('❌ Erro ao atualizar roteiro:', error);
    throw error;
  }
};

export const deleteScript = async (id: string): Promise<void> => {
  try {
    console.log('🗑️ [FirestoreService] Iniciando exclusão de roteiro:', id);
    console.log('👤 [FirestoreService] Usuário autenticado:', auth.currentUser?.uid);
    console.log('📧 [FirestoreService] Email do usuário:', auth.currentUser?.email);
    
    // Verificar se o usuário está autenticado
    if (!auth.currentUser) {
      const errorMsg = 'Usuário não autenticado. Faça login novamente.';
      console.error('❌ [FirestoreService]', errorMsg);
      throw new Error(errorMsg);
    }
    
    // Verificar se o ID é válido
    if (!id || id.trim() === '') {
      const errorMsg = 'ID do roteiro é inválido ou vazio.';
      console.error('❌ [FirestoreService]', errorMsg);
      throw new Error(errorMsg);
    }
    
    // Obter token para verificar claims
    const idTokenResult = await auth.currentUser.getIdTokenResult();
    console.log('🔐 [FirestoreService] Claims do usuário:', idTokenResult.claims);
    
    const docRef = doc(db, 'roteiros', id);
    console.log('📄 [FirestoreService] Referência do documento criada:', docRef.path);
    
    // Verificar se o documento existe antes de tentar excluir
    console.log('🔍 [FirestoreService] Verificando se o documento existe...');
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      console.log('⚠️ [FirestoreService] Documento não existe:', id);
      throw new Error('Roteiro não encontrado. Pode ter sido excluído por outro usuário.');
    }
    
    console.log('📄 [FirestoreService] Documento encontrado, dados:', docSnap.data());
    console.log('📄 [FirestoreService] Executando exclusão...');
    
    console.log('🔥 [FirestoreService] Executando deleteDoc...');
    await deleteDoc(docRef);
    console.log('✅ [FirestoreService] deleteDoc executado sem erro');
    
    // 🔧 CORREÇÃO: Aguardar um pouco e verificar se realmente foi excluído
    await new Promise(resolve => setTimeout(resolve, 500)); // Aguardar 500ms
    
    console.log('🔍 [FirestoreService] Verificando se a exclusão foi bem-sucedida...');
    const checkDoc = await getDoc(docRef);
    if (!checkDoc.exists()) {
      console.log('✅ [FirestoreService] CONFIRMADO: Documento foi excluído do Firestore');
    } else {
      console.log('❌ [FirestoreService] PROBLEMA: Documento ainda existe após deleteDoc');
      console.log('📄 [FirestoreService] Dados do documento:', checkDoc.data());
      throw new Error('Falha na exclusão: roteiro ainda existe no Firestore');
    }
    
    console.log('✅ [FirestoreService] Roteiro deletado com sucesso:', id);
  } catch (error: any) {
    console.error('❌ [FirestoreService] Erro ao deletar roteiro:', error);
    console.error('❌ [FirestoreService] Error code:', error.code);
    console.error('❌ [FirestoreService] Error message:', error.message);
    console.error('❌ [FirestoreService] Error stack:', error.stack);
    
    // Tratar erros específicos do Firestore
    if (error.code === 'permission-denied') {
      throw new Error('Você não tem permissão para excluir este roteiro. Apenas administradores podem excluir roteiros.');
    } else if (error.code === 'not-found') {
      throw new Error('Roteiro não encontrado. Pode ter sido excluído por outro usuário.');
    } else if (error.code === 'unauthenticated') {
      throw new Error('Sessão expirada. Faça login novamente.');
    } else if (error.message && error.message.includes('Falha na exclusão')) {
      // Erro customizado já tratado
      throw error;
    } else if (error.message && error.message.includes('ID do roteiro é inválido')) {
      // Erro de ID inválido já tratado
      throw error;
    } else {
      throw new Error(`Erro ao excluir roteiro: ${error.message}`);
    }
  }
};

export const getScripts = async (): Promise<Script[]> => {
  try {
    console.log('📋 Buscando roteiros da coleção "roteiros"...');
    const q = query(collection(db, 'roteiros'), orderBy('updatedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const scripts = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        history: data.history?.map((entry: any) => ({
          ...entry,
          date: entry.date?.toDate() || new Date()
        })) || []
      };
    }) as Script[];
    
    console.log(`✅ ${scripts.length} roteiros encontrados`);
    return scripts;
  } catch (error) {
    console.error('❌ Erro ao buscar roteiros:', error);
    throw error;
  }
};

// Settings
export const saveSettings = async (settings: ChurchSettings): Promise<void> => {
  try {
    const docRef = doc(db, 'settings', 'church-settings');
    await setDoc(docRef, settings);
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    throw error;
  }
};

export const getSettings = async (): Promise<ChurchSettings | null> => {
  try {
    const docRef = doc(db, 'settings', 'church-settings');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as ChurchSettings;
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    throw error;
  }
};

// Authorized Users
export const saveAuthorizedUser = async (user: Omit<AuthorizedUser, 'id'>): Promise<string> => {
  try {
    console.log('💾 Salvando usuário autorizado no Firestore:', user);
    const docRef = await addDoc(collection(db, 'authorizedUsers'), {
      ...user,
      createdAt: Timestamp.now()
    });
    console.log('✅ Usuário autorizado salvo com ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Erro ao salvar usuário autorizado:', error);
    throw error;
  }
};

export const updateAuthorizedUser = async (id: string, updates: Partial<AuthorizedUser>): Promise<void> => {
  try {
    console.log('🔄 Atualizando usuário autorizado no Firestore:', id, updates);
    const docRef = doc(db, 'authorizedUsers', id);
    
    // Verificar se o documento existe antes de tentar atualizar
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      console.warn('⚠️ Documento não encontrado para atualização (ignorado):', id);
      // Documento não existe no servidor (p.ex. placeholder local). Não lançar erro para evitar mensagens confusas ao usuário.
      return;
    }
    
    console.log('📄 Dados atuais do documento:', docSnap.data());
    
    // Validar o status se estiver sendo atualizado
    let validatedUpdates = { ...updates };
    if (updates.status) {
      const validStatuses = ['active', 'blocked', 'inactive'];
      if (!validStatuses.includes(updates.status)) {
        console.warn('⚠️ Tentativa de salvar status inválido:', updates.status, '- Ignorando atualização de status');
        delete validatedUpdates.status;
      } else {
        console.log('✅ Status válido sendo salvo:', updates.status);
      }
    }
    
    // Se o documento existe, atualizar normalmente
    const updateData = {
      ...validatedUpdates,
      updatedAt: Timestamp.now()
    };
    
    console.log('💾 Dados que serão salvos no Firestore:', updateData);
    // Checar se usuário autenticado antes de enviar (melhora UX para clientes)
    if (!auth.currentUser) {
      throw new Error('Usuário não autenticado');
    }

    await updateDoc(docRef, updateData);
    
    // Verificar se a atualização foi bem-sucedida
    const updatedDocSnap = await getDoc(docRef);
    console.log('✅ Dados após atualização:', updatedDocSnap.data());
    console.log('✅ Usuário autorizado atualizado:', id);
  } catch (error) {
    console.error('❌ Erro ao atualizar usuário autorizado:', error);
    throw error;
  }
};

export const deleteAuthorizedUser = async (id: string): Promise<void> => {
  try {
    console.log('🗑️ Deletando usuário autorizado do Firestore:', id);
    const docRef = doc(db, 'authorizedUsers', id);
    await deleteDoc(docRef);
    console.log('✅ Usuário autorizado deletado:', id);
  } catch (error) {
    console.error('❌ Erro ao deletar usuário autorizado:', error);
    throw error;
  }
};

export const getAuthorizedUsers = async (): Promise<AuthorizedUser[]> => {
  try {
    console.log('🔍 Buscando usuários autorizados no Firestore...');
    const querySnapshot = await getDocs(collection(db, 'authorizedUsers'));
    console.log('📊 Documentos de usuários encontrados:', querySnapshot.size);
    
    const users = querySnapshot.docs.map(doc => {
      const data = doc.data();
      console.log('📄 Documento usuário RAW:', doc.id, JSON.stringify(data, null, 2));
      
      // Validar e garantir que o status seja um dos valores válidos
      const validStatuses = ['active', 'blocked', 'inactive'];
      let status = data.status;
      
      // Se o status não existe ou não é válido, definir como 'active'
      if (!status || !validStatuses.includes(status)) {
        console.warn('⚠️ Status inválido ou ausente para usuário', doc.id, '- Status original:', data.status, '- Definindo como "active"');
        status = 'active';
      }
      
      // Garantir que o status seja definido corretamente
      const user = {
        id: doc.id,
        name: data.name,
        email: data.email,
        role: data.role,
        phone: data.phone,
        password: data.password,
        avatarUrl: data.avatarUrl,
        status: status as 'active' | 'blocked' | 'inactive', // Forçar o tipo correto
        createdAt: data.createdAt?.toDate() || new Date(),
        isProtected: data.isProtected || false
      };
      
      console.log('👤 Usuário processado:', {
        id: user.id,
        name: user.name,
        status: user.status,
        statusType: typeof user.status,
        originalStatus: data.status,
        originalStatusType: typeof data.status
      });
      return user;
    }) as AuthorizedUser[];
    
    console.log('✅ Usuários autorizados processados:', users.length);
    return users;
  } catch (error) {
    console.error('❌ Erro ao buscar usuários autorizados:', error);
    throw error;
  }
};

// Messages
export const saveMessage = async (message: Omit<Message, 'id'> & Record<string, any>): Promise<string> => {
  try {
    console.log('💾 Salvando mensagem no Firestore:', message);
    
    // Verificar se o usuário está autenticado
    if (!auth.currentUser) {
      throw new Error('Usuário não autenticado. Faça login novamente.');
    }
    
    console.log('👤 Usuário autenticado:', auth.currentUser.uid);
    
    const messageData = {
      ...message,
      createdAt: Timestamp.fromDate(message.createdAt),
      authorFirebaseUid: auth.currentUser.uid,
      senderFirebaseUid: auth.currentUser.uid,
      recipientFirebaseUids: Array.isArray(message.recipientFirebaseUids) ? message.recipientFirebaseUids : []
    };
    
    console.log('📦 Dados preparados para salvamento:', messageData);
    
    const docRef = await addDoc(collection(db, 'messages'), messageData);
    console.log('✅ Mensagem salva com ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Erro ao salvar mensagem:', error);
    throw error;
  }
};

export const getMessages = async (): Promise<Message[]> => {
  try {
    const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(d => {
      const data: any = d.data();
      return {
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date()
      } as Message;
    });
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    throw error;
  }
};

// Leader Requests
export const saveLeaderRequest = async (request: Omit<LeaderRequest, 'id'>): Promise<string> => {
  try {
    // Evitar salvar campo 'id' dentro do documento
    const { /* remove id if present */ id: _ignored, createdAt, ...rest } = request as any;
    const docRef = await addDoc(collection(db, 'leaderRequests'), {
      ...rest,
      createdAt: Timestamp.fromDate(createdAt)
    });
    return docRef.id;
  } catch (error) {
    console.error('Erro ao salvar solicitação de liderança:', error);
    throw error;
  }
};

export const updateLeaderRequest = async (id: string, updates: Partial<LeaderRequest>): Promise<void> => {
  try {
    console.log('🔄 Atualizando solicitação de liderança no Firestore:', id, updates);
    const docRef = doc(db, 'leaderRequests', id);
    await updateDoc(docRef, updates);
    console.log('✅ Solicitação de liderança atualizada:', id);
  } catch (error) {
    console.error('❌ Erro ao atualizar solicitação de liderança:', error);
    throw error;
  }
};

export const getLeaderRequests = async (): Promise<LeaderRequest[]> => {
  try {
    const q = query(collection(db, 'leaderRequests'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(d => {
      const data: any = d.data();
      const { id: _ignored, createdAt, ...rest } = data || {};
      return {
        ...rest,
        id: d.id,
        createdAt: createdAt?.toDate ? createdAt.toDate() : createdAt
      } as LeaderRequest;
    });
  } catch (error) {
    console.error('Erro ao buscar solicitações de liderança:', error);
    throw error;
  }
};

// Ministry Departments
export const saveMinistryDepartment = async (department: Omit<MinistryDepartment, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'ministryDepartments'), department);
    console.log('Departamento ministerial salvo com ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Erro ao salvar departamento ministerial:', error);
    throw error;
  }
};

export const updateMinistryDepartment = async (id: string, updates: Partial<MinistryDepartment>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'ministryDepartments', id), updates);
    console.log('Departamento ministerial atualizado:', id);
  } catch (error) {
    console.error('Erro ao atualizar departamento ministerial:', error);
    throw error;
  }
};

export const deleteMinistryDepartment = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'ministryDepartments', id));
    console.log('Departamento ministerial deletado:', id);
  } catch (error) {
    console.error('Erro ao deletar departamento ministerial:', error);
    throw error;
  }
};

export const getMinistryDepartments = async (): Promise<MinistryDepartment[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'ministryDepartments'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MinistryDepartment[];
  } catch (error) {
    console.error('Erro ao buscar departamentos ministeriais:', error);
    throw error;
  }
};

export const updateMessage = async (id: string, updates: Record<string, any>): Promise<void> => {
  try {
    const docRef = doc(db, 'messages', id);
    await updateDoc(docRef, updates);
    console.log('✅ Mensagem atualizada:', id, updates);
  } catch (error) {
    console.error('❌ Erro ao atualizar mensagem:', error);
    throw error;
  }
};

// --- Chat Services ---
// Estrutura:
// chats/{chatId} { participants: [authorizedUserIdA, authorizedUserIdB], createdAt }
// chats/{chatId}/messages/{messageId} { senderId, text, createdAt }

const buildChatId = (a: string, b: string): string => {
  return [a, b].sort().join('_');
};

export const ensureChatRoom = async (userAId: string, userBId: string): Promise<string> => {
  const chatId = buildChatId(userAId, userBId);
  const chatRef = doc(db, 'chats', chatId);
  try {
    const snap = await getDoc(chatRef);
    if (!snap.exists()) {
      await setDoc(chatRef, {
        participants: [userAId, userBId],
        createdAt: new Date(),
      }, { merge: true });
    }
    return chatId;
  } catch (err) {
    console.error('❌ Erro ao garantir sala de chat:', err);
    throw err;
  }
};

export const sendChatMessage = async (
  chatId: string,
  senderId: string,
  text: string,
  attachments?: { type: 'image' | 'video' | 'audio' | 'pdf'; url: string; storagePath: string; name?: string; size?: number; contentType?: string; }[]
): Promise<void> => {
  try {
    const msgsRef = collection(db, 'chats', chatId, 'messages');
    await addDoc(msgsRef, {
      senderId,
      text,
      attachments: attachments && attachments.length ? attachments : [],
      createdAt: new Date(),
    });

    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      lastMessageAt: new Date(),
      lastMessageSenderId: senderId,
    });
  } catch (err) {
    console.error('❌ Erro ao enviar mensagem no chat:', err);
    throw err;
  }
};

export const deleteChatMessage = async (chatId: string, messageId: string): Promise<void> => {
  try {
    const msgRef = doc(db, 'chats', chatId, 'messages', messageId);
    const snap = await getDoc(msgRef);
    if (snap.exists()) {
      const data: any = snap.data();
      const attachments: any[] = Array.isArray(data.attachments) ? data.attachments : [];
      const deletions = attachments
        .filter(a => a && a.storagePath)
        .map(a => deleteObject(ref(storage, a.storagePath)).catch(() => undefined));
      if (deletions.length) {
        await Promise.allSettled(deletions);
      }
    }
    await deleteDoc(msgRef);
  } catch (err) {
    console.error('❌ Erro ao excluir mensagem do chat:', err);
    throw err;
  }
};

export const clearChatMessages = async (chatId: string): Promise<void> => {
  try {
    const msgsRef = collection(db, 'chats', chatId, 'messages');
    const snap = await getDocs(msgsRef);
    const deletions: Promise<any>[] = [];
    snap.forEach(d => {
      const data: any = d.data();
      const attachments: any[] = Array.isArray(data.attachments) ? data.attachments : [];
      attachments.forEach(a => {
        if (a && a.storagePath) {
          deletions.push(deleteObject(ref(storage, a.storagePath)).catch(() => undefined));
        }
      });
      deletions.push(deleteDoc(doc(db, 'chats', chatId, 'messages', d.id)));
    });
    await Promise.allSettled(deletions);
  } catch (err) {
    console.error('❌ Erro ao esvaziar conversa:', err);
    throw err;
  }
};

export const clearChatMessagesOlderThanToday = async (chatId: string): Promise<void> => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const msgsRef = collection(db, 'chats', chatId, 'messages');
    const q = query(msgsRef, orderBy('createdAt', 'asc'));
    const snap = await getDocs(q);
    const deletions: Promise<any>[] = [];
    snap.forEach(d => {
      const data: any = d.data();
      const created = data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || new Date(0));
      if (created < startOfDay) {
        const attachments: any[] = Array.isArray(data.attachments) ? data.attachments : [];
        attachments.forEach(a => {
          if (a && a.storagePath) {
            deletions.push(deleteObject(ref(storage, a.storagePath)).catch(() => undefined));
          }
        });
        deletions.push(deleteDoc(doc(db, 'chats', chatId, 'messages', d.id)));
      }
    });
    await Promise.allSettled(deletions);
  } catch (err) {
    console.error('❌ Erro ao limpar mensagens antigas:', err);
    throw err;
  }
};

export async function pinChatForUser(chatId: string, userId: string, pinned: boolean): Promise<void> {
  const chatRef = doc(db, 'chats', chatId);
  await updateDoc(chatRef, {
    [`pinnedBy.${userId}`]: !!pinned,
  });
}

export async function clearChatForUser(chatId: string, userId: string): Promise<void> {
  const chatRef = doc(db, 'chats', chatId);
  await updateDoc(chatRef, {
    [`clearUntil.${userId}`]: serverTimestamp(),
  });
}

// Mensagem: fixar/desafixar para um usuário
export async function pinChatMessageForUser(chatId: string, messageId: string, userId: string, pinned: boolean): Promise<void> {
  const msgRef = doc(db, 'chats', chatId, 'messages', messageId);
  await updateDoc(msgRef, {
    [`pinnedBy.${userId}`]: !!pinned,
  });
}

// Mensagem: ocultar/exibir para um usuário (excluir para mim)
export async function hideChatMessageForUser(chatId: string, messageId: string, userId: string, hidden: boolean): Promise<void> {
  const msgRef = doc(db, 'chats', chatId, 'messages', messageId);
  await updateDoc(msgRef, {
    [`hiddenBy.${userId}`]: !!hidden,
  });
}

// --- Group Chat Services ---
// Estrutura:
// groupChats/{groupId} { groupId, participants?: string[], createdAt }
// groupChats/{groupId}/messages/{messageId} { senderId, text, createdAt }

export const ensureGroupChatRoom = async (groupId: string, participants: string[] = []): Promise<string> => {
  const chatRef = doc(db, 'groupChats', groupId);
  try {
    const snap = await getDoc(chatRef);
    if (!snap.exists()) {
      await setDoc(chatRef, {
        groupId,
        participants,
        createdAt: new Date(),
      }, { merge: true });
    } else if (participants && participants.length > 0) {
      // Atualiza participantes se fornecidos
      await updateDoc(chatRef, { participants });
    }
    return groupId;
  } catch (err) {
    console.error('❌ Erro ao garantir sala de chat de grupo:', err);
    throw err;
  }
};

export const sendGroupChatMessage = async (
  groupId: string,
  senderId: string,
  text: string,
  attachments?: { type: 'image' | 'video' | 'audio' | 'pdf'; url: string; storagePath: string; name?: string; size?: number; contentType?: string; }[]
): Promise<void> => {
  try {
    const msgsRef = collection(db, 'groupChats', groupId, 'messages');
    await addDoc(msgsRef, {
      senderId,
      text,
      attachments: attachments && attachments.length ? attachments : [],
      createdAt: new Date(),
    });

    const chatRef = doc(db, 'groupChats', groupId);
    await updateDoc(chatRef, {
      lastMessageAt: new Date(),
      lastMessageSenderId: senderId,
    });
  } catch (err) {
    console.error('❌ Erro ao enviar mensagem no chat de grupo:', err);
    throw err;
  }
};

export const deleteGroupChatMessage = async (groupId: string, messageId: string): Promise<void> => {
  try {
    const msgRef = doc(db, 'groupChats', groupId, 'messages', messageId);
    const snap = await getDoc(msgRef);
    if (snap.exists()) {
      const data: any = snap.data();
      const attachments: any[] = Array.isArray(data.attachments) ? data.attachments : [];
      const deletions = attachments
        .filter(a => a && a.storagePath)
        .map(a => deleteObject(ref(storage, a.storagePath)).catch(() => undefined));
      if (deletions.length) {
        await Promise.allSettled(deletions);
      }
    }
    await deleteDoc(msgRef);
  } catch (err) {
    console.error('❌ Erro ao excluir mensagem do chat de grupo:', err);
    throw err;
  }
};

export const clearGroupChatMessages = async (groupId: string): Promise<void> => {
  try {
    const msgsRef = collection(db, 'groupChats', groupId, 'messages');
    const snap = await getDocs(msgsRef);
    const deletions: Promise<any>[] = [];
    snap.forEach(d => {
      const data: any = d.data();
      const attachments: any[] = Array.isArray(data.attachments) ? data.attachments : [];
      attachments.forEach(a => {
        if (a && a.storagePath) {
          deletions.push(deleteObject(ref(storage, a.storagePath)).catch(() => undefined));
        }
      });
      deletions.push(deleteDoc(doc(db, 'groupChats', groupId, 'messages', d.id)));
    });
    await Promise.allSettled(deletions);
  } catch (err) {
    console.error('❌ Erro ao esvaziar conversa de grupo:', err);
    throw err;
  }
};

export const clearGroupChatMessagesOlderThanToday = async (groupId: string): Promise<void> => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const msgsRef = collection(db, 'groupChats', groupId, 'messages');
    const q = query(msgsRef, orderBy('createdAt', 'asc'));
    const snap = await getDocs(q);
    const deletions: Promise<any>[] = [];
    snap.forEach(d => {
      const data: any = d.data();
      const created = data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || new Date(0));
      if (created < startOfDay) {
        const attachments: any[] = Array.isArray(data.attachments) ? data.attachments : [];
        attachments.forEach(a => {
          if (a && a.storagePath) {
            deletions.push(deleteObject(ref(storage, a.storagePath)).catch(() => undefined));
          }
        });
        deletions.push(deleteDoc(doc(db, 'groupChats', groupId, 'messages', d.id)));
      }
    });
    await Promise.allSettled(deletions);
  } catch (err) {
    console.error('❌ Erro ao limpar mensagens antigas do grupo:', err);
    throw err;
  }
};

export async function clearGroupChatForUser(groupId: string, userId: string): Promise<void> {
  const chatRef = doc(db, 'groupChats', groupId);
  await updateDoc(chatRef, {
    [`lastViewed.${userId}`]: serverTimestamp(),
    [`clearUntil.${userId}`]: serverTimestamp(),
  });
}

export async function pinGroupChatMessageForUser(groupId: string, messageId: string, userId: string, pinned: boolean): Promise<void> {
  const msgRef = doc(db, 'groupChats', groupId, 'messages', messageId);
  await updateDoc(msgRef, {
    [`pinnedBy.${userId}`]: !!pinned,
  });
}

export async function hideGroupChatMessageForUser(groupId: string, messageId: string, userId: string, hidden: boolean): Promise<void> {
  const msgRef = doc(db, 'groupChats', groupId, 'messages', messageId);
  await updateDoc(msgRef, {
    [`hiddenBy.${userId}`]: !!hidden,
  });
}