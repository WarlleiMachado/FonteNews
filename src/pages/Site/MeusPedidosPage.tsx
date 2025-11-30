import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import PrayerCards from '../../components/PedidoDeOracao/PrayerCards';
import PrayerPopup from '../../components/PedidoDeOracao/PrayerPopup';
import PedidoIcon from '../../components/Common/PedidoIcon';

const MeusPedidosPage: React.FC = () => {
  const { user, firebaseUser } = useAuth();
  const isLogged = useMemo(() => !!(user || firebaseUser), [user, firebaseUser]);

  return (
    <div className="min-h-screen bg-jkd-bg py-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-start justify-between">
          <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-jkd-heading flex items-center gap-2">
        <PedidoIcon className="h-16 w-16 text-church-primary" />
        Meus Pedidos
      </h1>
            <p className="text-jkd-text mt-1">Aqui aparecem os seus pedidos de oração.</p>
          </div>
          <div>
            <Link to="/site/pedido-de-oracao" className="px-3 py-2 rounded-md border border-jkd-border text-jkd-heading hover:bg-jkd-bg">
              Voltar
            </Link>
          </div>
        </div>

        <div className="mt-6">
          <div className="bg-jkd-bg-sec rounded-lg border border-jkd-border p-4">
            {isLogged ? (
              <div className="space-y-4">
                <p className="text-sm text-jkd-text">Somente você vê seus pedidos nesta área.</p>
                <PrayerCards mode="mine" />
              </div>
            ) : (
              <p className="text-jkd-text">Faça login para ver seus pedidos.</p>
            )}
          </div>
        </div>
      </div>

      <PrayerPopup />
    </div>
  );
};

export default MeusPedidosPage;