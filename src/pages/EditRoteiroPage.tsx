import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import RoteiroForm from '../components/Roteiros/RoteiroForm';

const EditRoteiroPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { getScriptById } = useApp();

    if (!id) {
        return <div className="p-8 text-center text-red-500">ID do roteiro não fornecido.</div>;
    }

    const script = getScriptById(id);

    if (!script) {
        return (
            <div className="p-8 text-center text-red-500">
                <p>Roteiro não encontrado.</p>
                <Link to="/roteiros" className="text-church-primary mt-4 inline-block">Voltar para Roteiros</Link>
            </div>
        );
    }

    return <RoteiroForm script={script} />;
};

export default EditRoteiroPage;
