import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import { Church, Calendar, Clock, ZoomIn } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ImageModal from '../components/Common/ImageModal';

const CultosPage: React.FC = () => {
    const { cultos, settings, getOccurrences } = useApp();
    const navigate = useNavigate();

    const upcomingServices = useMemo(() => {
        const today = new Date();
        const nextMonth = new Date();
        nextMonth.setMonth(today.getMonth() + 2);

        return cultos.flatMap(culto => {
            const occurrences = getOccurrences(culto.rruleString, today, nextMonth);
            return occurrences.slice(0, 4).map(date => ({
                ...culto,
                date
            }));
        }).sort((a, b) => {
        // Tratamento seguro de datas
        const aTime = a.date instanceof Date ? a.date.getTime() : 0;
        const bTime = b.date instanceof Date ? b.date.getTime() : 0;
        return aTime - bTime;
      });
    }, [cultos, getOccurrences]);

    const [modalImage, setModalImage] = useState<string | null>(null);

    return (
        <div className="min-h-screen bg-jkd-bg py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8 text-center">
                    <img 
                        src={settings.cultosLogoUrl} 
                        alt="Logo Cultos" 
                        className="h-20 w-auto mx-auto mb-4 object-contain"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://via.placeholder.com/200x80/ff652c/ffffff?text=CULTOS';
                        }}
                    />
                    <h1 className="text-4xl font-bold text-jkd-heading">Nossos Cultos</h1>
                    <p className="text-jkd-text mt-2 text-lg">
                        Participe conosco! Veja os horários dos nossos cultos regulares.
                    </p>
                </div>

                <div className="space-y-6">
                    {upcomingServices.length > 0 ? (
                        upcomingServices.map((service, index) => (
                            <div key={`${service.id}-${index}`} className="bg-jkd-bg-sec rounded-lg border border-jkd-border overflow-hidden flex flex-col sm:flex-row items-stretch">
                                {service.image && (
                                    <div className="sm:w-1/3 flex-shrink-0 relative group cursor-zoom-in" onClick={() => setModalImage(service.image!)}>
                                        <img src={service.image} alt={service.title} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="inline-flex items-center rounded-full bg-white/90 text-jkd-heading shadow px-2 py-1 text-xs font-medium">
                                                <ZoomIn className="h-3.5 w-3.5 mr-1" />
                                                Expandir
                                            </span>
                                        </div>
                                    </div>
                                )}
                                <div className="p-6 flex-grow flex flex-col sm:flex-row items-start gap-6">
                                    <div className="flex-shrink-0 text-center bg-church-primary/10 text-church-primary rounded-lg p-4 w-full sm:w-auto">
                                        <p className="text-sm font-bold uppercase">{format(service.date, 'MMM', { locale: ptBR })}</p>
                                        <p className="text-3xl font-bold">{format(service.date, 'dd')}</p>
                                        <p className="text-xs">{format(service.date, 'yyyy')}</p>
                                    </div>
                                    <div className="flex-grow cursor-pointer" onClick={() => navigate(`/culto/${service.id}`)}>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-xl font-semibold text-jkd-heading">{service.title}</h2>
                                            {service.isLive && (
                                                <a href="#" onClick={(e) => e.stopPropagation()} aria-label="Transmissão ao vivo" className="inline-flex items-center rounded-full bg-red-600 text-white shadow px-2 py-0.5 text-xs font-semibold hover:bg-red-700">Transmissão Ao Vivo</a>
                                            )}
                                        </div>
                                        <p className="text-jkd-text mt-1 line-clamp-3 break-anywhere">{service.description}</p>
                                        {(service as any)?.temaName && (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                <span className="px-2 py-0.5 rounded-full text-xs bg-jkd-bg border border-jkd-border text-jkd-text">Tema: {(service as any).temaName}</span>
                                            </div>
                                        )}
                                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-jkd-text">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={14} />
                                                <span>{format(service.date, "EEEE", { locale: ptBR })}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Clock size={14} />
                                                <span>{format(service.date, "HH:mm")}{(service as any)?.endTime ? ` — ${(service as any).endTime}` : ''}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 bg-jkd-bg-sec rounded-lg border border-jkd-border">
                            <Church className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-jkd-text">Nenhum culto agendado no momento.</p>
                        </div>
                    )}
                </div>
            </div>
            {modalImage && (
                <ImageModal src={modalImage} alt="Imagem do Culto" onClose={() => setModalImage(null)} />
            )}
        </div>
    );
};

export default CultosPage;
