import React, { useState, useEffect } from 'react';
import { db } from './lib/firebase'; // Ajustando o caminho para a configuração do Firebase
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { useToast } from './contexts/ToastContext';

// MUITO IMPORTANTE: Mude 'avisos' para o nome exato de uma coleção que você quer testar
const NOME_DA_COLECAO = 'avisos';

function TesteDelete() {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Função para buscar os dados da coleção
  const fetchItems = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, NOME_DA_COLECAO));
      const itemsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setItems(itemsList);
      console.log(`[SUCESSO] Itens da coleção "${NOME_DA_COLECAO}" carregados:`, itemsList);
    } catch (err) {
      console.error("[ERRO FATAL] Falha ao buscar itens do Firestore:", err);
      setError(`Falha ao carregar a coleção "${NOME_DA_COLECAO}". Verifique as regras de segurança e o console.`);
    } finally {
      setLoading(false);
    }
  };

  // Roda a função de busca quando o componente é montado
  useEffect(() => {
    fetchItems();
  }, []);

  // A função de exclusão mais simples e direta possível
  const handleDelete = async (id) => {
    if (!id) {
      showToast('error', 'ERRO: ID do item é inválido!');
      return;
    }
    
    console.log(`[AÇÃO] Tentando apagar o documento com ID: ${id} da coleção "${NOME_DA_COLECAO}"`);
    const docRef = doc(db, NOME_DA_COLECAO, id);

    try {
      await deleteDoc(docRef);
      showToast('success', `Documento ${id} foi excluído com sucesso!`);
      console.log(`[SUCESSO] O documento ${id} foi removido do Firestore.`);
      // Remove o item da lista na tela para dar feedback visual
      fetchItems(); // A forma mais simples de atualizar a lista
    } catch (err) {
      console.error(`[ERRO DE EXCLUSÃO] Ocorreu um erro ao apagar o documento ${id}:`, err);
      showToast('error', 'Falha ao apagar! Verifique console e regras de segurança.');
      setError(`Falha ao apagar o item ${id}.`);
    }
  };

  if (loading) {
    return <h1>Carregando itens de teste...</h1>;
  }

  if (error) {
    return <h1 style={{ color: 'red' }}>ERRO: {error}</h1>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', border: '2px solid red' }}>
      <h1>Componente de Teste Drástico - Exclusão</h1>
      <p>Coleção sendo testada: <strong>{NOME_DA_COLECAO}</strong></p>
      
      {items.length === 0 ? (
        <p>Nenhum item encontrado nesta coleção.</p>
      ) : (
        <ul>
          {items.map(item => (
            <li key={item.id} style={{ marginBottom: '10px', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
              <span>
                <strong>ID do Documento:</strong> {item.id} <br />
                {/* Tente mostrar algum dado do item, como o título. Adapte 'item.titulo' para um campo que exista. */}
                <strong>Título:</strong> {item.titulo || item.title || 'Sem título'} <br />
                <strong>Conteúdo:</strong> {item.conteudo || item.content || 'Sem conteúdo'}
              </span>
              <button
                onClick={() => handleDelete(item.id)}
                style={{ marginLeft: '20px', padding: '5px 10px', cursor: 'pointer', backgroundColor: 'red', color: 'white' }}
              >
                APAGAR ESTE ITEM
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default TesteDelete;