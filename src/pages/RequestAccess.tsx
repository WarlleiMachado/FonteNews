import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, CheckCircle } from 'lucide-react';
import { useApp } from '../hooks/useApp';

const RequestAccessPage: React.FC = () => {
    const { addLeaderRequest, ministryDepartments } = useApp();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        ministry: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        addLeaderRequest(formData);
        setTimeout(() => {
            setIsSubmitting(false);
            setIsSubmitted(true);
        }, 1000);
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-jkd-bg flex items-center justify-center py-12 px-4">
                <div className="max-w-md w-full text-center bg-jkd-bg-sec p-8 rounded-lg border border-jkd-border">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-jkd-heading">Solicitação Enviada!</h2>
                    <p className="mt-2 text-jkd-text">Sua solicitação de acesso foi enviada para a secretaria. Por gentileza, aguarde a aprovação. Caso não tenha logo uma resposta, procure a secretaria da igreja Fonte de Vida Laranjeiras.</p>
                    <button onClick={() => navigate('/login')} className="mt-6 w-full bg-church-primary text-white py-2 px-4 rounded-lg font-medium hover:bg-church-primary/90">
                        Voltar para o Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-jkd-bg py-8">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <Link to="/login" className="inline-flex items-center space-x-2 text-church-primary hover:text-church-primary/80 mb-4">
                        <ArrowLeft size={20} />
                        <span>Voltar para o Login</span>
                    </Link>
                    <h1 className="text-3xl font-bold text-jkd-heading">Solicitar Acesso de Líder</h1>
                    <p className="text-jkd-text mt-1">Preencha seus dados para que a secretaria possa autorizar seu acesso.</p>
                </div>

                <div className="bg-jkd-bg-sec rounded-lg border border-jkd-border p-8">
                    <div className="mb-6 text-sm text-jkd-text bg-jkd-bg rounded-lg p-4 border border-jkd-border">
                        <p>
                            Por gentileza, preencha seus dados e selecione seu Ministério / Departamento. Sua solicitação será analisada pela secretaria e você será avisado por e-mail quando a solicitação for aprovada. Caso não tenha logo uma resposta, por gentileza, procure a secretaria da Igreja Fonte de Vida Laranjeiras para mais informações.
                        </p>
                        <p className="mt-2">
                            Importante: o acesso a área de edição é exclusivo para Editores, Líderes ou Administradores com dados de acesso autorizados.
                        </p>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-jkd-heading mb-2">Nome Completo *</label>
                            <input type="text" id="name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full input-style" />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-jkd-heading mb-2">E-mail *</label>
                            <input type="email" id="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full input-style" />
                        </div>
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-jkd-heading mb-2">Telefone (WhatsApp) *</label>
                            <input type="tel" id="phone" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full input-style" />
                        </div>
                        <div>
                            <label htmlFor="ministry" className="block text-sm font-medium text-jkd-heading mb-2">Seu Ministério / Departamento *</label>
                            <select id="ministry" required value={formData.ministry} onChange={e => setFormData({...formData, ministry: e.target.value})} className="w-full input-style">
                                <option value="">Selecione um Ministério / Departamento</option>
                                {ministryDepartments.map(group => (
                                    <option key={group.id} value={group.name}>{group.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex justify-end pt-4">
                            <button type="submit" disabled={isSubmitting} className="inline-flex items-center space-x-2 bg-church-primary text-white px-6 py-2 rounded-lg hover:bg-church-primary/90 disabled:opacity-50">
                                <Send size={16} />
                                <span>{isSubmitting ? 'Enviando...' : 'Enviar Solicitação'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            <style>{`.input-style { @apply px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text focus:outline-none focus:ring-2 focus:ring-church-primary; }`}</style>
        </div>
    );
};

export default RequestAccessPage;
