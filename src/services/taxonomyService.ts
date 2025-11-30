import { db } from '../lib/firebase';
import { collection, addDoc, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';

export type TaxonomyType = 'tema' | 'topico' | 'tipo' | 'prioridade';

export interface TaxonomyItem {
  id: string;
  name: string;
  type: TaxonomyType;
}

const TAXONOMY_COLLECTION = 'taxonomies';

export async function listTaxonomies(type?: TaxonomyType): Promise<TaxonomyItem[]> {
  try {
    const colRef = collection(db, TAXONOMY_COLLECTION);
    const q = type ? query(colRef, where('type', '==', type)) : colRef;
    const snap = await getDocs(q);
    const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    return items.sort((a, b) =>
      String(a.name || '').localeCompare(String(b.name || ''), 'pt-BR', { sensitivity: 'base' })
    );
  } catch (err) {
    console.error('Erro ao listar taxonomias:', err);
    return [];
  }
}

export async function createTaxonomy(name: string, type: TaxonomyType): Promise<string> {
  const colRef = collection(db, TAXONOMY_COLLECTION);
  const docRef = await addDoc(colRef, { name: name.trim(), type });
  return docRef.id;
}

export async function deleteTaxonomy(id: string): Promise<void> {
  const ref = doc(db, TAXONOMY_COLLECTION, id);
  await deleteDoc(ref);
}