import React, { useState, useEffect, useRef } from 'react';
import { HelpCircle, User, Edit, Shield, Bell, FileText, Users, Send, Church, Video, Settings, Link as LinkIcon, Play, Calendar, Newspaper, Palette, Reply, MessageCircle, CheckCircle, Crown, Images, CalendarDays } from 'lucide-react';

const topics = [
    { id: 'introducao', title: 'Introdução', icon: <HelpCircle size={16} /> },
    { id: 'como-comecar', title: 'Como começar', icon: <HelpCircle size={16} /> },
    { id: 'funcoes', title: 'Perfis de acesso', icon: <Users size={16} /> },
    { id: 'painel-lider', title: 'Painel', icon: <User size={16} /> },
    { id: 'alertas-chat', title: 'Mensagens e alertas', icon: <Bell size={16} /> },
    { id: 'admin-aprovacoes', title: 'Aprovações (Admin)', icon: <CheckCircle size={16} /> },
    { id: 'admin-solicitacoes', title: 'Solicitações (Admin)', icon: <FileText size={16} /> },
    { id: 'admin-usuarios', title: 'Usuários', icon: <Users size={16} /> },
    { id: 'admin-lideres', title: 'Líderes (Admin)', icon: <Crown size={16} /> },
    { id: 'admin-chat', title: 'Mensagens (Admin)', icon: <MessageCircle size={16} /> },
    { id: 'admin-cultos', title: 'Cultos', icon: <Church size={16} /> },
    { id: 'admin-roteiros', title: 'Roteiros (Editor/Admin)', icon: <Edit size={16} /> },
    { id: 'admin-video', title: 'Vídeo News', icon: <Video size={16} /> },
    { id: 'admin-configuracoes', title: 'Configurações', icon: <Settings size={16} /> },
    { id: 'galeria', title: 'Galeria de Imagens', icon: <Images size={16} /> },
    { id: 'ticker-conscientizacao', title: 'Conscientização no Ticker', icon: <Newspaper size={16} /> },
    { id: 'formularios', title: 'Formulários', icon: <Calendar size={16} /> },
    { id: 'area-publica', title: 'Site público', icon: <LinkIcon size={16} /> }
];

const HelpSection: React.FC<{ id: string; title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ id, title, icon, children }) => (
    <section id={id} className="mb-12 scroll-mt-24">
        <div className="bg-jkd-bg-sec rounded-lg border border-jkd-border">
            <div className="p-6 border-b border-jkd-border">
                <h2 className="text-xl font-bold text-jkd-heading flex items-center gap-3">
                    {icon}
                    {title}
                </h2>
            </div>
            <div className="p-6 prose prose-sm dark:prose-invert max-w-none text-jkd-text leading-relaxed">
                {children}
            </div>
        </div>
    </section>
);


const HelpTab: React.FC = () => {
    const [activeTopic, setActiveTopic] = useState('introducao');
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = contentRef.current?.scrollTop || 0;
            let currentTopicId = '';
            
            for (const topic of topics) {
                const element = document.getElementById(topic.id);
                if (element && element.offsetTop - 100 <= scrollPosition) {
                    currentTopicId = topic.id;
                }
            }
            if (currentTopicId) {
                setActiveTopic(currentTopicId);
            }
        };

        const contentElement = contentRef.current;
        contentElement?.addEventListener('scroll', handleScroll);
        return () => contentElement?.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTopic = (id: string) => {
        const element = document.getElementById(id);
        element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setActiveTopic(id);
    };

    return (
        <div className="flex flex-col md:flex-row gap-8">
            <aside className="md:w-1/3 lg:w-1/4">
                <div className="sticky top-24">
                    <h3 className="text-lg font-semibold text-jkd-heading mb-4">Tópicos de Ajuda</h3>
                    <nav className="space-y-1">
                        {topics.map(topic => (
                            <button
                                key={topic.id}
                                onClick={() => scrollToTopic(topic.id)}
                                className={`w-full text-left flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                                    activeTopic === topic.id
                                        ? 'bg-church-primary/10 text-church-primary font-semibold'
                                        : 'text-jkd-text hover:bg-jkd-bg-sec'
                                }`}
                            >
                                {topic.icon}
                                <span>{topic.title}</span>
                            </button>
                        ))}
                    </nav>
                </div>
            </aside>

            <main ref={contentRef} className="md:w-2/3 lg:w-3/4 max-h-[calc(100vh-12rem)] overflow-y-auto pr-4">
                <HelpSection id="introducao" title="Introdução" icon={<HelpCircle size={20}/>}> 
                    <h3>Bem-vindo ao Fonte News</h3>
                    <p>Este guia explica, em linguagem simples, como usar o Fonte News para organizar e divulgar as atividades da igreja. Aqui você encontra orientações para criar programações, gerenciar cultos, enviar mensagens e ajustar as configurações visuais do site.</p>
                    <p>Você não precisa conhecer termos técnicos. Cada seção descreve o essencial, com passos práticos para você concluir suas tarefas com segurança.</p>
                </HelpSection>

                <HelpSection id="como-comecar" title="Como começar" icon={<HelpCircle size={20}/>}> 
                    <h3>Passo a passo</h3>
                    <ul>
                        <li><strong>Entrar:</strong> Faça login pelo menu superior. Se ainda não tem acesso, solicite autorização na tela de login.</li>
                        <li><strong>Navegar:</strong> Use o menu superior (Home, News, Cultos, Agenda) ou acesse o <strong>Painel</strong> para as tarefas de líder/editor.</li>
                        <li><strong>Criar programação:</strong> No Painel, escolha <em>Nova Programação</em>, preencha os dados e salve.</li>
                        <li><strong>Enviar para aprovação:</strong> Programações criadas por líderes ficam como <em>Pendente</em> até um administrador aprovar.</li>
                        <li><strong>Mensagens:</strong> Use a área de <em>Mensagens</em> para falar com administradores ou responder conversas.</li>
                        <li><strong>Ajuda rápida:</strong> Se tiver dúvidas, volte a esta página e abra o tópico correspondente.</li>
                    </ul>
                </HelpSection>

                <HelpSection id="galeria" title="Galeria de Imagens" icon={<Images size={20}/>}> 
                    <p>A <strong>Galeria</strong> é o lugar onde você encontra e organiza imagens para usar nas criações de <strong>Programações</strong> e <strong>Cultos</strong>.</p>
                    <ul>
                        <li><strong>Galeria (Painel):</strong> Acesse pelo menu lateral do Painel para <em>buscar</em>, <em>filtrar por tipo</em>, <em>copiar o link</em> da imagem e <em>enviar</em> novas imagens (até <strong>5MB</strong>).</li>
                        <li><strong>Galeria Light (Formulários):</strong> Nos formulários de Nova Programação e Novo Culto, use o botão <em>Galeria</em> ao lado do campo de imagem para visualizar e inserir o link rapidamente.</li>
                    </ul>
                    <h3>Como usar</h3>
                    <ul>
                        <li><strong>Copiar link:</strong> Clique no ícone de copiar. No modo Light, o botão <em>Inserir</em> coloca o link direto no campo.</li>
                        <li><strong>Enviar imagem:</strong> Use o botão <em>Upload</em> para adicionar arquivos nos formatos <em>JPG</em>, <em>PNG</em> ou <em>SVG</em> (até 5MB).</li>
                        <li><strong>Quem pode enviar:</strong> Administradores, editores e líderes logados.</li>
                    </ul>
                    <h3>Boas práticas</h3>
                    <ul>
                        <li>Dê nomes claros às imagens para facilitar a busca.</li>
                        <li>Prefira <em>PNG</em> para logos com transparência e <em>JPG</em> para fotos.</li>
                        <li>Mantenha proporções adequadas ao uso: 1:1 ou 9:16 para cards; 16:9 para banners/overlays.</li>
                    </ul>
                </HelpSection>

                <HelpSection id="funcoes" title="Perfis de acesso" icon={<Users size={20}/>}> 
                    <p>O sistema possui três níveis de acesso:</p>
                    <ul>
                        <li><strong>Administrador <Shield size={14} className="inline"/>:</strong> Tem acesso total a todas as áreas, incluindo configurações, gerenciamento de líderes e aprovação de conteúdo. As contas <code>secretaria.adfdevidalaranjeiras@gmail.com</code> e <code>fontedevidalaranjeiras@gmail.com</code> são administradores protegidos e não podem ser alterados ou excluídos.</li>
                        <li><strong>Editor <Edit size={14} className="inline"/>:</strong> Possui as mesmas permissões de um Líder, mas com o acesso adicional ao menu de <strong>Roteiros</strong>, podendo criar e gerenciar os scripts de gravação.</li>
                        <li><strong>Líder <User size={14} className="inline"/>:</strong> Pode criar e gerenciar suas próprias programações (que necessitam de aprovação), editar seu perfil e se comunicar com os administradores.</li>
                    </ul>
                </HelpSection>

                <HelpSection id="painel-lider" title="Painel" icon={<User size={20}/>}> 
                    <p>Acessível após o login, o painel é a área de trabalho dos líderes e editores.</p>
                    <h3>Programações</h3>
                    <p>Líderes podem criar "Novas Programações", que podem ser de diversos tipos (Aviso, Evento, Retiro, etc.). Toda programação criada por um líder entra em um status de <strong>"Pendente"</strong> e só se torna pública após a aprovação de um administrador.</p>
                    <h3>Caixa de Entrada</h3>
                    <p>Nesta aba, o usuário pode visualizar todas as mensagens enviadas pela administração, <strong>responder</strong> a elas <Reply size={14} className="inline"/>, ou iniciar uma <strong>nova conversa</strong> com um administrador específico.</p>
                    <h3>Meu Perfil</h3>
                    <p>Clicando no avatar no canto superior direito, o usuário pode acessar "Meu Perfil" para atualizar seu nome e a URL da sua foto de perfil.</p>
                </HelpSection>

                <HelpSection id="alertas-chat" title="Mensagens e alertas" icon={<Bell size={20}/>}> 
                    <p>O topo do site mostra ícones com contagens para te avisar sobre novidades. Eles só aparecem quando há algo novo para ver.</p>
                    <ul>
                        <li><strong>Ícone de Conversas (balão):</strong> aparece apenas quando há mensagens não lidas. Clique para ir direto ao <em>Painel</em> na aba <strong>Chat</strong>.</li>
                        <li><strong>Ícone de Sino (Admin):</strong> exclusivo para administradores. Mostra a soma de itens <em>pendentes</em> de <strong>Aprovações</strong> + <strong>Solicitações</strong>. Clique para abrir o <em>Admin</em>.</li>
                        <li><strong>Badges na aba "Chat":</strong> também indicam novas atividades dentro do Painel.</li>
                        <li><strong>Indicadores dentro das conversas:</strong> destacam mensagens novas de forma clara, sem atrapalhar a leitura.</li>
                    </ul>
                    <p>Dica: se não houver itens novos, os ícones ficam ocultos para manter a tela limpa.</p>
                </HelpSection>

                <HelpSection id="admin-aprovacoes" title="Aprovações (Admin)" icon={<CheckCircle size={20}/>}> 
                    <p>Esta é a primeira tela do painel administrativo. Aqui, você verá uma lista de todas as programações criadas por líderes que estão aguardando sua análise. Você pode:</p>
                    <ul>
                        <li><strong>Aprovar:</strong> A programação se tornará pública e visível para todos na página inicial e na agenda.</li>
                        <li><strong>Rejeitar:</strong> A programação será marcada como rejeitada e não será publicada.</li>
                    </ul>
                </HelpSection>

                <HelpSection id="admin-solicitacoes" title="Solicitações (Admin)" icon={<FileText size={20}/>}> 
                    <p>Quando um líder não autorizado tenta fazer login, ele tem a opção de "Solicitar Autorização". Todos os pedidos aparecem nesta aba.</p>
                    <p>Ao <strong>Aprovar</strong> uma solicitação, um novo líder é criado automaticamente no sistema com status "Ativo". O acesso do líder passa a depender do status e das autorizações atribuídas.</p>
                </HelpSection>

                <HelpSection id="admin-usuarios" title="Usuários" icon={<Users size={20}/>}> 
                    <p>Aqui você acompanha, de forma simples, quem está usando o site agora e como foi a movimentação em dias anteriores.</p>
                    <h3>Quem está online agora</h3>
                    <ul>
                        <li><strong>Administradores, Editores e Líderes:</strong> mostram quantas pessoas desses perfis estão usando o sistema neste momento.</li>
                        <li><strong>Leitores:</strong> pessoas que entraram com login apenas para navegar e ler.</li>
                        <li><strong>Visitantes:</strong> pessoas navegando sem login. Contamos cada visitante uma vez, mesmo que abra várias abas.</li>
                    </ul>
                    <h3>Visitas por dia</h3>
                    <ul>
                        <li><strong>Calendário:</strong> cada dia exibe o total de visitas. Ao selecionar um dia, você vê a soma e como ela se divide por perfil (administrador, editor, líder, leitor e visitante).</li>
                        <li><strong>Números rápidos:</strong> os pequenos números no calendário ajudam a identificar dias mais movimentados.</li>
                    </ul>
                    <h3>Gráficos</h3>
                    <ul>
                        <li><strong>Últimos dias:</strong> os gráficos mostram a evolução de visitas e a participação de cada perfil, facilitando a visualização de tendências.</li>
                    </ul>
                    <h3>Dicas de leitura</h3>
                    <ul>
                        <li>Use os números para identificar horários de pico e planejar comunicação.</li>
                        <li>Se algum valor parecer diferente do esperado, atualize a página e confira novamente mais tarde.</li>
                    </ul>
                </HelpSection>

                <HelpSection id="admin-lideres" title="Líderes (Admin)" icon={<Crown size={20}/>}>
                    <p>Esta aba centraliza todo o gerenciamento de líderes.</p>
                    <ul>
                        <li><strong>Adicionar Novo Líder:</strong> Crie contas para líderes, editores ou outros administradores. É obrigatório definir <strong>nome</strong>, <strong>e-mail</strong>, <strong>telefone</strong>, <strong>função</strong> e atribuí-lo a pelo menos um "Ministério / Departamento".</li>
                        <li><strong>Gerenciar Status:</strong> Você pode <strong>Ativar/Inativar</strong> ou <strong>Bloquear/Desbloquear</strong> um líder. Um líder inativo ou bloqueado não pode fazer login.</li>
                        <li><strong>Ministério / Departamento:</strong> Ao criar ou editar um líder, você pode criar novos grupos ou atribuir o líder a grupos existentes. Esses grupos são usados para enviar mensagens direcionadas.</li>
                        <li><strong>Status Online:</strong> Um círculo verde indica que o líder está logado no app, enquanto o vermelho indica que está offline.</li>
                    </ul>
                </HelpSection>

                <HelpSection id="admin-chat" title="Mensagens (Admin)" icon={<MessageCircle size={20}/>}> 
                    <p>Ferramenta de chat (comunicação de duas vias) entre Administradores e Líderes/Editors.</p>
                    <ul>
                        <li><strong>Campo de Busca de Líderes:</strong> Use a barra de busca (topo da lista de líderes) para encontrar líderes por <em>nome</em>, <em>e-mail</em> ou <em>ministério/departamento</em>. A busca é dinâmica e filtra resultados conforme você digita.</li>
                        <li><strong>Seleção por Ministério / Departamento:</strong> Selecione um grupo inteiro para iniciar conversas em massa. É possível escolher um ou mais ministérios/departamentos e iniciar um chat coletivo com todos os membros selecionados.</li>
                        <li><strong>Iniciar Chat:</strong> Selecione líderes individualmente, utilize a busca para filtrá-los, ou selecione um grupo por ministério/departamento para iniciar conversas em grupo.</li>
                        <li><strong>Caixa de Entrada:</strong> Leia e gerencie conversas recebidas, mantendo toda a comunicação centralizada por tópicos (threads).</li>
                        <li><strong>Alertas:</strong> Indicadores destacam novas mensagens e itens não lidos no cabeçalho, na aba "Chat" e dentro das conversas, de forma clara e automática.</li>
                    </ul>
                    </HelpSection>

                <HelpSection id="admin-cultos" title="Cultos" icon={<Church size={20}/>}>
                    <p>Gerencie os cultos regulares da igreja que aparecem na página "Cultos".</p>
                    <ul>
                        <li><strong>Logo da Página:</strong> Defina uma imagem personalizada que aparecerá no topo da página de cultos.</li>
                        <li><strong>Gerenciar Cultos:</strong> Adicione, edite ou remova cultos. Use o editor de recorrência avançado para definir os dias e horários.</li>
                        <li><strong>Recorrência Mensal Avançada:</strong> Agora é possível definir recorrências como "toda primeira segunda-feira do mês" ou "todo último domingo do mês".</li>
                    </ul>
                </HelpSection>

                <HelpSection id="admin-roteiros" title="Roteiros (Editor/Admin)" icon={<Edit size={20}/>}> 
                    <p>Esta seção é uma ferramenta de planejamento para as gravações do Fonte News, acessível apenas por Admins e Editores.</p>
                    <ul>
                        <li><strong>Criar Roteiro:</strong> Crie um script com título, conteúdo, data da programação associada e o mês da gravação.</li>
                        <li><strong>Status:</strong> Defina o status do roteiro como "Rascunho", "Pronto" ou "Revisado".</li>
                        <li><strong>Ações:</strong> Você pode visualizar, editar, baixar como .txt ou excluir um roteiro.</li>
                        <li><strong>Histórico:</strong> Na tela de edição, a aba "Histórico" mostra quem fez alterações e quando.</li>
                    </ul>
                </HelpSection>

                <HelpSection id="admin-video" title="Vídeo News" icon={<Video size={20}/>}> 
                    <p>Configure o botão de vídeo <Play size={14} className="inline"/> que aparece na página inicial.</p>
                    <ul>
                        <li><strong>Habilitar/Desabilitar:</strong> Ative ou desative o botão.</li>
                        <li><strong>Fonte do Vídeo:</strong> Escolha entre uma URL do <strong>YouTube</strong> ou uma <strong>URL Direta</strong> de um arquivo de vídeo (MP4, etc.).</li>
                        <li><strong>Upload (MP4, MOV):</strong> Envie um arquivo de vídeo e use a URL direta gerada na opção <strong>URL Direta</strong> acima. Recomenda-se formatos MP4 ou MOV.</li>
                        <li><strong>Autoplay:</strong> O vídeo configurado tocará automaticamente ao ser aberto.</li>
                    </ul>
                </HelpSection>

                <HelpSection id="admin-configuracoes" title="Configurações" icon={<Settings size={20}/>}> 
                    <p>Personalize a identidade visual e o comportamento do aplicativo.</p>
                    <ul>
                        <li><strong>Aparência:</strong> Defina o "Nome da Igreja" (subtítulo da home), a URL do logo do cabeçalho e a "Cor Principal" <Palette size={14} className="inline"/> que afeta botões, links e detalhes em todo o site.</li>
                        <li><strong>Destaque News (Slideshow):</strong> Adicione imagens por link ou upload para o topo da Home. Configure o <em>efeito</em> (fade ou slide) e a <em>duração</em> da transição. <em>Dica:</em> use proporções 1:1 (quadrado) ou 9:16 (vertical) para melhor enquadramento.</li>
                        <li><strong>Faixa de Notícias (Ticker) <Newspaper size={14} className="inline"/>:</strong> Controle a faixa animada que aparece abaixo do cabeçalho. Você pode ligar/desligar, definir a direção, a velocidade e o conteúdo (programações da semana, mês ou ano). A faixa também suporta o <em>Calendário de Conscientização</em> (veja seção dedicada abaixo) para exibir um texto curto e um logo mensal.</li>
                        <li><strong>Informações de Contato:</strong> Preencha os dados da secretaria, que serão exibidos na página inicial.</li>
                        <li><strong>Copyright:</strong> Edite o texto que aparece no rodapé.</li>
                        <li><strong>Destaque Countdown:</strong> O overlay do countdown pode ser definido por evento (via formulário). Se o evento não tiver imagem específica, o sistema usa a <em>Imagem de Fundo (Parallax)</em> global como padrão. <em>Diretriz de tamanho:</em> use proporção 16:9 (ex.: 1920×1080). O texto do countdown é sempre branco sólido e permanece acima do overlay.</li>
                        <li><strong>Countdown: Overlay com Fade Cíclico:</strong> Ative/desative globalmente o efeito de overlay e ajuste os tempos: <em>visível</em>, <em>oculto</em>, <em>fade-in</em> e <em>fade-out</em>. Valores padrão: visível 30s, oculto 15s, fade-in 5s, fade-out 5s. Aplica-se a todos os countdowns novos.</li>
                    </ul>
                </HelpSection>

                <HelpSection id="ticker-conscientizacao" title="Conscientização no Ticker" icon={<CalendarDays size={20}/>}> 
                    <p>Esta funcionalidade permite destacar campanhas de conscientização (como <em>Outubro Rosa</em>, <em>Novembro Azul</em>) diretamente na Faixa de Notícias, exibindo um <strong>texto curto</strong> e um <strong>logo mensal</strong>.</p>
                    <h3>Como configurar</h3>
                    <ul>
                        <li><strong>Caminho:</strong> Acesse <em>Admin → Configurações → Faixa de Notícias (Ticker)</em>.</li>
                        <li><strong>Texto da campanha:</strong> Defina um texto conciso (ex.: "Outubro Rosa — Prevenção e Cuidado").</li>
                        <li><strong>Imagem do mês:</strong> Escolha entre <em>link</em> ou <em>upload</em>.
                            – <em>Formato sugerido:</em> PNG com fundo transparente, proporção <strong>1:1</strong> (quadrado), até 5MB.</li>
                        <li><strong>Prioridade:</strong> Ative para exibir o calendário de conscientização <em>antes</em> do conteúdo normal do ticker; desative para exibir <em>depois</em>.</li>
                    </ul>
                    <h3>Comportamento</h3>
                    <ul>
                        <li><strong>Exibição:</strong> O logo é mostrado em tamanho compacto (≈24px) ao lado do texto.</li>
                        <li><strong>Integração:</strong> Aparece junto ao conteúdo configurado do ticker (semana/mês/ano), respeitando a <em>direção</em> e a <em>velocidade</em> definidas.</li>
                        <li><strong>Marquee contínuo:</strong> O conteúdo é duplicado para garantir movimento contínuo sem cortes.</li>
                        <li><strong>Ocultação automática:</strong> Se <em>texto</em> e <em>imagem</em> estiverem vazios, o bloco de conscientização não é exibido.</li>
                    </ul>
                    <h3>Boas práticas</h3>
                    <ul>
                        <li>Prefira logos limpos e com fundo transparente.</li>
                        <li>Mantenha o texto curto para leitura confortável na faixa em movimento.</li>
                        <li>Evite imagens muito detalhadas que percam legibilidade em tamanho reduzido.</li>
                    </ul>
                </HelpSection>

                <HelpSection id="formularios" title="Formulários" icon={<Calendar size={20}/>}> 
                    <p>Ao criar uma nova Programação ou Culto, você encontrará dois campos de imagem:</p>
                    <ul>
                        <li><strong>Imagem Principal:</strong> A imagem base do evento (antes chamada de "Imagem (URL)"). Pode ser fornecida por URL ou upload. <em>Diretriz:</em> prefira proporções 1:1 (quadrado) ou 9:16 (vertical).</li>
                        <li><strong>Destaque Countdown:</strong> Uma imagem opcional para servir de overlay no countdown desse evento. Aceita URL ou upload. Se não definido, o countdown usará a imagem global de Parallax. <em>Diretriz:</em> proporção 16:9 para melhor compatibilidade com o layout do countdown.</li>
                    </ul>
                    <p>Essas imagens refletem na Home: o <em>Destaque News</em> funciona como slideshow configurado nas <strong>Configurações</strong>, e o <em>Destaque Countdown</em> aparece quando há um evento próximo ou em andamento. Quando o <strong>overlay cíclico</strong> está ativado nas Configurações, o overlay do countdown fará fade-in/out e alternará entre visível e oculto no ciclo definido.</p>
                </HelpSection>

                <HelpSection id="area-publica" title="Site público" icon={<LinkIcon size={20}/>}> 
                    <p>Funcionalidades visíveis para todos os visitantes do site.</p>
                    <ul>
                        <li><strong>Countdown:</strong> Mostra uma contagem regressiva para a próxima programação. O overlay (se definido) pode realizar <em>fade cíclico</em> conforme as Configurações, mantendo todos os textos/números em branco sólido e acima do fundo/overlay.</li>
                        <li><strong>Mini Calendário <Calendar size={14} className="inline"/>:</strong> Exibe um calendário compacto na home, destacando os dias com atividades.</li>
                        <li><strong>Agenda:</strong> Uma página com um calendário completo e filtros avançados para pesquisar programações por período (dia, semana, mês, ano) ou por tipo.</li>
                        <li><strong>Rodapé:</strong> Acesse os links de <strong>Termos de Uso</strong> e <strong>Política de Privacidade</strong> pelo rodapé.</li>
                        <li><strong>Botão "Voltar ao Topo":</strong> Um botão flutuante com um indicador de progresso de rolagem que leva o usuário suavemente de volta ao topo.</li>
                        <li><strong>Tags de Prioridade:</strong> As etiquetas <em>Baixa</em>, <em>Média</em> e <em>Alta</em> aparecem apenas para Líderes logados em suas contas; visitantes não as veem.</li>
                    </ul>
                </HelpSection>
            </main>
        </div>
    );
};

export default HelpTab;
