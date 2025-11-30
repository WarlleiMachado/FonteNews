import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import app from '../lib/firebase';

const storage = getStorage(app);

export const uploadImage = async (file: File, path: string): Promise<string> => {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Erro no upload da imagem:", error);
    throw new Error("Falha no upload da imagem.");
  }
};

export const uploadUserAvatar = async (file: File, userId: string): Promise<string> => {
  try {
    // Validação básica de tamanho (máx. 5MB)
    const MAX_SIZE_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      throw new Error('Arquivo muito grande. Tamanho máximo permitido é 5MB.');
    }

    // Usar caminho específico para avatares do usuário (liberado por regras de Storage)
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `images/avatars/${userId}/${Date.now()}-${safeFileName}`;
    const storageRef = ref(storage, path);

    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Erro no upload do avatar:', error);
    const message = error instanceof Error ? error.message : 'Falha no upload do avatar.';
    throw new Error(message);
  }
};

export const uploadVideoNews = async (file: File): Promise<string> => {
  try {
    // Validação básica: tipos de vídeo comuns e tamanho até ~200MB
    const allowedTypes = ['video/mp4', 'video/quicktime'];
    if (file.type && !allowedTypes.includes(file.type)) {
      throw new Error('Formato inválido. Use arquivos MP4 ou MOV.');
    }
    const MAX_SIZE_BYTES = 200 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      throw new Error('Arquivo muito grande. Tamanho máximo permitido é 200MB.');
    }

    // Caminho sob "documents" (liberado para admins pelas regras de Storage)
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `documents/videos/news/${Date.now()}-${safeFileName}`;
    const storageRef = ref(storage, path);

    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Erro no upload de vídeo news:', error);
    const message = error instanceof Error ? error.message : 'Falha no upload do vídeo.';
    throw new Error(message);
  }
};

export const uploadAudio = async (file: File, pathPrefix: string): Promise<string> => {
  try {
    const allowedTypes = ['audio/mpeg', 'audio/mp3'];
    if (file.type && !allowedTypes.includes(file.type)) {
      throw new Error('Formato inválido. Use arquivos MP3.');
    }
    const MAX_SIZE_BYTES = 20 * 1024 * 1024; // até 20MB
    if (file.size > MAX_SIZE_BYTES) {
      throw new Error('Arquivo muito grande. Tamanho máximo permitido é 20MB.');
    }

    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${pathPrefix}/${Date.now()}-${safeFileName}`;
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Erro no upload de áudio:', error);
    const message = error instanceof Error ? error.message : 'Falha no upload do áudio.';
    throw new Error(message);
  }
};

// Removido: funções específicas de upload/exclusão da Bíblia

export const uploadChatAttachment = async (file: File, userId: string): Promise<{ url: string; storagePath: string; contentType?: string; size?: number; name?: string; }> => {
  try {
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `images/uploads/${userId}/chat/${Date.now()}-${safeFileName}`;
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return {
      url: downloadURL,
      storagePath: path,
      contentType: file.type,
      size: file.size,
      name: safeFileName,
    };
  } catch (error) {
    console.error('Erro no upload de anexo do chat:', error);
    const message = error instanceof Error ? error.message : 'Falha no upload do anexo.';
    throw new Error(message);
  }
};
