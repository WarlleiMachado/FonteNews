import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../hooks/useApp';

const PrivacyPolicy: React.FC = () => {
  const { settings } = useApp();
  return (
    <div className="min-h-screen bg-jkd-bg py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-jkd-bg-sec rounded-lg border border-jkd-border p-8">
          <h1 className="text-3xl font-bold text-jkd-heading mb-6">Política de Privacidade</h1>
          
          <div className="space-y-6 text-jkd-text">
            <p>
              A sua privacidade é importante para nós. Esta política descreve quais dados coletamos, como usamos, com quem compartilhamos, por quanto tempo armazenamos e como você pode exercer seus direitos.
            </p>

            <h2 className="text-xl font-semibold text-jkd-heading">Dados pessoais coletados</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Identificação: nome completo, e-mail, telefone.</li>
              <li>Perfil de usuário: papel (admin, líder, editor), ministério/departamento.</li>
              <li>Conteúdo e atividades: avisos publicados, roteiros, interações administrativas.</li>
              <li>Dados técnicos: datas/horários de acesso, dispositivo/navegador (dados agregados para desempenho).</li>
              <li>Mídias: avatar ou arquivos enviados para galerias (quando aplicável).</li>
            </ul>

            <h2 className="text-xl font-semibold text-jkd-heading">Como e por que usamos</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Autenticação e autorização de usuários.</li>
              <li>Operação do painel e publicação de conteúdo pelos líderes.</li>
              <li>Comunicações internas e organização de ministérios/departamentos.</li>
              <li>Segurança, auditoria interna e prevenção de abusos.</li>
              <li>Melhoria de desempenho e experiência do aplicativo.</li>
            </ul>

            <h2 className="text-xl font-semibold text-jkd-heading">Com quem compartilhamos</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Equipe autorizada da igreja (administradores e líderes), de forma restrita ao necessário.</li>
              <li>Serviços de infraestrutura: Firebase (Auth, Firestore, Storage) para autenticação, armazenamento e sincronização de dados.</li>
              <li>Autoridades, quando exigido por lei ou ordem judicial.</li>
            </ul>

            <h2 className="text-xl font-semibold text-jkd-heading">Por quanto tempo armazenamos</h2>
            <p>Armazenamos os dados enquanto sua conta estiver ativa ou enquanto necessário para cumprir finalidades legais e operacionais. Ao solicitar exclusão, dados operacionais podem ser retidos por período limitado para conformidade e auditoria.</p>

            <h2 className="text-xl font-semibold text-jkd-heading">Como solicitar exclusão/atualização</h2>
            <p>
              Para exercer seus direitos (acesso, correção, exclusão), entre em contato pelos canais oficiais abaixo. Após validação, sua solicitação será processada dentro de prazo razoável.
            </p>
            <div className="rounded-lg border border-jkd-border bg-jkd-bg p-4 text-sm">
              <p><span className="font-medium">E-mail:</span> {settings?.contactInfo?.email || '—'}</p>
              <p><span className="font-medium">Telefone:</span> {settings?.contactInfo?.phone || '—'}</p>
              <p><span className="font-medium">Endereço:</span> {settings?.contactInfo?.address || '—'}</p>
            </div>

            <h2 className="text-xl font-semibold text-jkd-heading">Encarregado de Dados (DPO)</h2>
            <p>
              Se houver DPO nomeado, o contato será divulgado nos canais oficiais. Enquanto isso, utilize o e-mail da secretaria informado acima.
            </p>

            <div className="text-sm">
              Veja também a <Link to="/cookies" className="text-church-primary hover:underline">Política de Cookies</Link> e os {' '}
              <Link to="/terms" className="text-church-primary hover:underline">Termos de Uso</Link>.
            </div>

            <p className="pt-2 text-xs text-jkd-text/70">Última atualização: Outubro de 2025.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
