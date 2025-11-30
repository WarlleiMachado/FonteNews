import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, auth } from '../lib/firebase';

/**
 * Faz upload de uma imagem para o Firebase Storage no diretório de modo manutenção
 * @param file - Arquivo de imagem a ser enviado
 * @returns Promise com a URL pública da imagem e o caminho no storage
 */
export const uploadMaintenanceImage = async (file: File): Promise<{ url: string; storagePath: string }> => {
  try {
    console.log('📤 [MaintenanceImageService] Iniciando upload de imagem para modo manutenção');
    console.log('📤 [MaintenanceImageService] Arquivo recebido:', {
      name: file?.name,
      size: file?.size,
      type: file?.type,
      exists: !!file
    });
    
    // Verificar autenticação
    if (!auth.currentUser) {
      console.error('❌ [MaintenanceImageService] Usuário não autenticado');
      throw new Error('Usuário não autenticado. Faça login novamente.');
    }
    
    console.log('✅ [MaintenanceImageService] Usuário autenticado:', auth.currentUser.uid);

    // Validar tipo de arquivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Tipo de arquivo inválido. Use apenas JPG, PNG, GIF ou WebP.');
    }

    // Validar tamanho (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('Arquivo muito grande. Máximo permitido: 5MB.');
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const userId = auth.currentUser.uid;
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `maintenance_${userId}_${timestamp}.${fileExtension}`;
    
    // Caminho no storage: maintenance-images/{userId}/{filename}
    const storagePath = `maintenance-images/${userId}/${fileName}`;
    const storageRef = ref(storage, storagePath);

    console.log('📁 [MaintenanceImageService] Caminho no storage:', storagePath);
    console.log('📊 [MaintenanceImageService] Tamanho do arquivo:', file.size, 'bytes');
    console.log('🎨 [MaintenanceImageService] Tipo do arquivo:', file.type);

    // Fazer upload
    const snapshot = await uploadBytes(storageRef, file);
    console.log('✅ [MaintenanceImageService] Upload concluído:', snapshot.metadata.name);

    // Obter URL pública
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('🔗 [MaintenanceImageService] URL pública obtida:', downloadURL);

    return {
      url: downloadURL,
      storagePath: storagePath
    };

  } catch (error) {
    console.error('❌ [MaintenanceImageService] Erro ao fazer upload da imagem:', error);
    throw error;
  }
};

/**
 * Deleta uma imagem do Firebase Storage
 * @param storagePath - Caminho completo da imagem no storage
 */
export const deleteMaintenanceImage = async (storagePath: string): Promise<void> => {
  try {
    console.log('🗑️ [MaintenanceImageService] Deletando imagem do storage:', storagePath);
    
    if (!storagePath || !storagePath.startsWith('maintenance-images/')) {
      console.warn('⚠️ [MaintenanceImageService] Caminho inválido, ignorando exclusão:', storagePath);
      return;
    }

    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
    
    console.log('✅ [MaintenanceImageService] Imagem deletada com sucesso:', storagePath);
  } catch (error) {
    // Se a imagem já foi deletada ou não existe, não lançar erro
    if (error.code === 'storage/object-not-found') {
      console.log('ℹ️ [MaintenanceImageService] Imagem já foi deletada ou não existe:', storagePath);
      return;
    }
    
    console.error('❌ [MaintenanceImageService] Erro ao deletar imagem:', error);
    throw error;
  }
};

/**
 * Converte uma imagem base64 em arquivo e faz upload
 * @param base64String - String base64 da imagem
 * @param fileName - Nome do arquivo (opcional)
 * @returns Promise com a URL pública e o caminho no storage
 */
export const uploadMaintenanceImageFromBase64 = async (
  base64String: string, 
  fileName?: string
): Promise<{ url: string; storagePath: string }> => {
  try {
    console.log('📸 [MaintenanceImageService] Convertendo base64 para arquivo');
    
    // Remover o prefixo data:image/...;base64, se existir
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
    
    // Converter para blob
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    
    // Detectar tipo MIME
    let mimeType = 'image/jpeg';
    if (base64String.includes('data:image/png')) {
      mimeType = 'image/png';
    } else if (base64String.includes('data:image/gif')) {
      mimeType = 'image/gif';
    } else if (base64String.includes('data:image/webp')) {
      mimeType = 'image/webp';
    }
    
    const blob = new Blob([byteArray], { type: mimeType });
    
    // Gerar nome do arquivo
    const timestamp = Date.now();
    const extension = mimeType.split('/')[1];
    const finalFileName = fileName || `maintenance_image_${timestamp}.${extension}`;
    
    // Criar arquivo
    const file = new File([blob], finalFileName, { type: mimeType });
    
    console.log('📄 [MaintenanceImageService] Arquivo criado a partir de base64:', {
      name: finalFileName,
      type: mimeType,
      size: file.size
    });
    
    // Fazer upload do arquivo
    return await uploadMaintenanceImage(file);
    
  } catch (error) {
    console.error('❌ [MaintenanceImageService] Erro ao converter base64 ou fazer upload:', error);
    throw new Error('Erro ao processar imagem. Verifique se a imagem está em formato válido.');
  }
};