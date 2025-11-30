import React from 'react';
import { Link } from 'react-router-dom';

const CookiePolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-jkd-bg py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-jkd-bg-sec rounded-lg border border-jkd-border p-8">
          <h1 className="text-3xl font-bold text-jkd-heading mb-6">🍪 Política de Cookies</h1>

          <div className="space-y-6 text-jkd-text">
            <p>
              Esta Política explica o que são cookies, quais tipos utilizamos, as finalidades e como você pode gerenciar suas preferências. 
              Cookies são pequenos arquivos armazenados no seu dispositivo para ajudar o site a funcionar, lembrar suas escolhas e melhorar sua experiência.
            </p>

            <h2 className="text-xl font-semibold text-jkd-heading">Tipos de cookies que utilizamos</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <span className="font-medium">Necessários</span>: Essenciais para o funcionamento do site (por exemplo, manter sessão, segurança, disponibilidade). Não podem ser desativados.
              </li>
              <li>
                <span className="font-medium">Desempenho</span>: Ajudam a medir uso e melhorar recursos (por exemplo, métricas de páginas e carregamento). Coletam dados agregados e anônimos.
              </li>
              <li>
                <span className="font-medium">Marketing</span>: Usados para personalizar conteúdo e campanhas. Podem criar perfis anônimos de interesse.
              </li>
            </ul>

            <h2 className="text-xl font-semibold text-jkd-heading">Finalidade de cada tipo</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Necessários: garantir funcionalidades básicas, segurança e estabilidade.</li>
              <li>Desempenho: entender como o site é utilizado e melhorar conteúdo e performance.</li>
              <li>Marketing: oferecer experiências mais relevantes e comunicações alinhadas a interesses.</li>
            </ul>

            <h2 className="text-xl font-semibold text-jkd-heading">Gerenciamento de preferências</h2>
            <p>
              Você pode <span className="font-medium">aceitar todos</span>, <span className="font-medium">recusar</span> ou <span className="font-medium">configurar preferências</span> diretamente no banner de consentimento exibido no rodapé. 
              A qualquer momento, limpe os dados do navegador para redefinir seu consentimento ou acesse novamente esta página.
            </p>

            <div className="text-sm">
              Consulte também nossa <Link to="/privacy" className="text-church-primary hover:underline">Política de Privacidade</Link> e nossos 
              {' '}<Link to="/terms" className="text-church-primary hover:underline">Termos de Uso</Link>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicy;