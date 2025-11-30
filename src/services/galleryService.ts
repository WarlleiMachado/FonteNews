import { getDownloadURL, listAll, ref, uploadBytes, deleteObject } from 'firebase/storage';
import { storage } from '../lib/firebase';

export type GalleryItem = {
  name: string;
  fullPath: string;
  url: string;
  contentType?: string;
  type?: 'principal' | 'countdown';
};

const GALLERY_BASE_PATH = 'images/galeria';
const GALLERY_TYPES = ['principal', 'countdown'] as const;
export type GalleryType = typeof GALLERY_TYPES[number];

export const listGalleryImages = async (type?: GalleryType): Promise<GalleryItem[]> => {
  // Se um tipo é fornecido, listar apenas a subpasta correspondente
  const basePath = type ? `${GALLERY_BASE_PATH}/${type}` : GALLERY_BASE_PATH;
  const baseRef = ref(storage, basePath);
  const res = await listAll(baseRef);
  const tasks = res.items.map(async (itemRef) => {
    const url = await getDownloadURL(itemRef);
    const name = itemRef.name;
    const itemType = (type || (itemRef.fullPath.includes('/countdown/') ? 'countdown' : 'principal')) as GalleryType;
    return { name, fullPath: itemRef.fullPath, url, type: itemType } as GalleryItem;
  });
  const items = await Promise.all(tasks);
  // Ordenar por nome para apresentação consistente
  return items.sort((a, b) => a.name.localeCompare(b.name));
};

export const uploadGalleryImage = async (file: File, type: GalleryType = 'principal'): Promise<string> => {
  // Validate type and size
  const allowed = ['image/jpeg', 'image/png', 'image/svg+xml'];
  if (file.type && !allowed.includes(file.type)) {
    throw new Error('Formato inválido. Use JPEG, JPG, PNG ou SVG.');
  }
  const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error('Imagem muito grande. Tamanho máximo permitido é 5MB.');
  }

  const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${GALLERY_BASE_PATH}/${type}/${Date.now()}_${safeFileName}`;
  const fileRef = ref(storage, path);
  const snapshot = await uploadBytes(fileRef, file);
  const url = await getDownloadURL(snapshot.ref);
  return url;
};

export const uploadGalleryImageFromUrl = async (imageUrl: string, type: GalleryType = 'principal'): Promise<string> => {
  // Tenta baixar a imagem e enviar como Blob para o Storage
  try {
    const response = await fetch(imageUrl, { mode: 'cors' });
    if (!response.ok) {
      throw new Error('Não foi possível baixar a imagem pela URL fornecida.');
    }
    const blob = await response.blob();
    const allowed = ['image/jpeg', 'image/png', 'image/svg+xml'];
    if (blob.type && !allowed.includes(blob.type)) {
      throw new Error('Formato inválido na URL. Use JPEG, JPG, PNG ou SVG.');
    }
    const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
    if (blob.size > MAX_SIZE_BYTES) {
      throw new Error('Imagem muito grande. Tamanho máximo permitido é 5MB.');
    }

    // Derivar nome a partir da URL
    const urlObj = new URL(imageUrl);
    const lastSegment = urlObj.pathname.split('/').pop() || 'imagem';
    const safeFileName = lastSegment.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${GALLERY_BASE_PATH}/${type}/${Date.now()}_${safeFileName}`;
    const fileRef = ref(storage, path);
    const snapshot = await uploadBytes(fileRef, blob);
    const url = await getDownloadURL(snapshot.ref);
    return url;
  } catch (err: any) {
    const msg = err?.message || 'Falha ao importar imagem por URL.';
    throw new Error(msg);
  }
};

export const deleteGalleryImage = async (fullPath: string): Promise<void> => {
  const fileRef = ref(storage, fullPath);
  await deleteObject(fileRef);
};