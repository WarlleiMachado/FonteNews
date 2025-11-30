// Importa a Bíblia NVI do arquivo JSON para o Firestore
// Estrutura:
// - /livros/{id}: { nome, testamento, totalCapitulos, order }
// - /nvi/{id}/capitulos/{num}: { versiculos: { "1": "texto", ... } }

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Usa a service account local do projeto
const serviceAccountPath = path.join(__dirname, '..', 'fontenews-877a3-485d38363783.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Carrega JSON NVI
const nviPath = path.join(__dirname, '..', 'bible', 'bible-data', 'nvi.json');
const nvi = JSON.parse(fs.readFileSync(nviPath, 'utf8'));

// Lista canônica de livros em PT-BR (NVI)
// Índice 1..66; 1-39 VT, 40-66 NT
const BOOKS = [
  { id: 1, nome: 'Gênesis', testamento: 'VT' },
  { id: 2, nome: 'Êxodo', testamento: 'VT' },
  { id: 3, nome: 'Levítico', testamento: 'VT' },
  { id: 4, nome: 'Números', testamento: 'VT' },
  { id: 5, nome: 'Deuteronômio', testamento: 'VT' },
  { id: 6, nome: 'Josué', testamento: 'VT' },
  { id: 7, nome: 'Juízes', testamento: 'VT' },
  { id: 8, nome: 'Rute', testamento: 'VT' },
  { id: 9, nome: '1 Samuel', testamento: 'VT' },
  { id: 10, nome: '2 Samuel', testamento: 'VT' },
  { id: 11, nome: '1 Reis', testamento: 'VT' },
  { id: 12, nome: '2 Reis', testamento: 'VT' },
  { id: 13, nome: '1 Crônicas', testamento: 'VT' },
  { id: 14, nome: '2 Crônicas', testamento: 'VT' },
  { id: 15, nome: 'Esdras', testamento: 'VT' },
  { id: 16, nome: 'Neemias', testamento: 'VT' },
  { id: 17, nome: 'Ester', testamento: 'VT' },
  { id: 18, nome: 'Jó', testamento: 'VT' },
  { id: 19, nome: 'Salmos', testamento: 'VT' },
  { id: 20, nome: 'Provérbios', testamento: 'VT' },
  { id: 21, nome: 'Eclesiastes', testamento: 'VT' },
  { id: 22, nome: 'Cânticos', testamento: 'VT' },
  { id: 23, nome: 'Isaías', testamento: 'VT' },
  { id: 24, nome: 'Jeremias', testamento: 'VT' },
  { id: 25, nome: 'Lamentações', testamento: 'VT' },
  { id: 26, nome: 'Ezequiel', testamento: 'VT' },
  { id: 27, nome: 'Daniel', testamento: 'VT' },
  { id: 28, nome: 'Oséias', testamento: 'VT' },
  { id: 29, nome: 'Joel', testamento: 'VT' },
  { id: 30, nome: 'Amós', testamento: 'VT' },
  { id: 31, nome: 'Obadias', testamento: 'VT' },
  { id: 32, nome: 'Jonas', testamento: 'VT' },
  { id: 33, nome: 'Miquéias', testamento: 'VT' },
  { id: 34, nome: 'Naum', testamento: 'VT' },
  { id: 35, nome: 'Habacuque', testamento: 'VT' },
  { id: 36, nome: 'Sofonias', testamento: 'VT' },
  { id: 37, nome: 'Ageu', testamento: 'VT' },
  { id: 38, nome: 'Zacarias', testamento: 'VT' },
  { id: 39, nome: 'Malaquias', testamento: 'VT' },
  { id: 40, nome: 'Mateus', testamento: 'NT' },
  { id: 41, nome: 'Marcos', testamento: 'NT' },
  { id: 42, nome: 'Lucas', testamento: 'NT' },
  { id: 43, nome: 'João', testamento: 'NT' },
  { id: 44, nome: 'Atos', testamento: 'NT' },
  { id: 45, nome: 'Romanos', testamento: 'NT' },
  { id: 46, nome: '1 Coríntios', testamento: 'NT' },
  { id: 47, nome: '2 Coríntios', testamento: 'NT' },
  { id: 48, nome: 'Gálatas', testamento: 'NT' },
  { id: 49, nome: 'Efésios', testamento: 'NT' },
  { id: 50, nome: 'Filipenses', testamento: 'NT' },
  { id: 51, nome: 'Colossenses', testamento: 'NT' },
  { id: 52, nome: '1 Tessalonicenses', testamento: 'NT' },
  { id: 53, nome: '2 Tessalonicenses', testamento: 'NT' },
  { id: 54, nome: '1 Timóteo', testamento: 'NT' },
  { id: 55, nome: '2 Timóteo', testamento: 'NT' },
  { id: 56, nome: 'Tito', testamento: 'NT' },
  { id: 57, nome: 'Filemom', testamento: 'NT' },
  { id: 58, nome: 'Hebreus', testamento: 'NT' },
  { id: 59, nome: 'Tiago', testamento: 'NT' },
  { id: 60, nome: '1 Pedro', testamento: 'NT' },
  { id: 61, nome: '2 Pedro', testamento: 'NT' },
  { id: 62, nome: '1 João', testamento: 'NT' },
  { id: 63, nome: '2 João', testamento: 'NT' },
  { id: 64, nome: '3 João', testamento: 'NT' },
  { id: 65, nome: 'Judas', testamento: 'NT' },
  { id: 66, nome: 'Apocalipse', testamento: 'NT' },
];

// Mapeamento de aliases para nomes alternativos presentes no JSON
const NAME_ALIASES = {
  'Cântico dos Cânticos': ['Cânticos', 'Cantares'],
  'Cânticos': ['Cântico dos Cânticos', 'Cantares']
};

function resolveBookData(nviJson, canonicalName) {
  if (nviJson[canonicalName]) return nviJson[canonicalName];
  const aliases = NAME_ALIASES[canonicalName] || [];
  for (const alias of aliases) {
    if (nviJson[alias]) return nviJson[alias];
  }
  return null;
}

async function upsertLivro(docId, payload) {
  await db.collection('livros').doc(String(docId)).set(payload, { merge: true });
}

async function upsertCapitulo(version, bookId, chapterNumber, versiculos) {
  const ref = db.collection(version).doc(String(bookId)).collection('capitulos').doc(String(chapterNumber));
  await ref.set({ versiculos }, { merge: false });
}

async function main() {
  console.log('🚀 Iniciando importação da NVI para Firestore...');

  for (const book of BOOKS) {
    const bookData = resolveBookData(nvi, book.nome);
    if (!bookData) {
      console.warn(`⚠️ Livro não encontrado no JSON: ${book.nome}`);
      continue;
    }

    const capitulos = Object.keys(bookData);
    const totalCapitulos = capitulos.length;

    // Upsert metadados do livro
    await upsertLivro(book.id, {
      nome: book.nome,
      testamento: book.testamento,
      totalCapitulos,
      order: book.id,
      altNames: NAME_ALIASES[book.nome] || []
    });

    // Upsert documento raiz da versão (apenas metadados mínimos)
    await db.collection('nvi').doc(String(book.id)).set({ nome: book.nome }, { merge: true });

    // Usa batch por livro para reduzir roundtrips
    const batch = db.batch();

    for (const cap of capitulos) {
      const versMap = bookData[cap];
      if (!versMap || typeof versMap !== 'object') {
        console.warn(`⚠️ Capítulo malformado em ${book.nome} ${cap}`);
        continue;
      }
      const capRef = db.collection('nvi').doc(String(book.id)).collection('capitulos').doc(String(cap));
      batch.set(capRef, { versiculos: versMap }, { merge: false });
    }

    await batch.commit();
    console.log(`✅ Importado: ${book.nome} (${totalCapitulos} capítulos)`);
  }

  console.log('🎉 Importação concluída.');
}

main().catch((err) => {
  console.error('❌ Erro na importação:', err);
  process.exit(1);
});