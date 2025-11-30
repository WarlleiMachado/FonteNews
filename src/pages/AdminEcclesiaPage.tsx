import React from 'react'
import { useNavigate } from 'react-router-dom'

const AdminEcclesiaPage: React.FC = () => {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-jkd-bg py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-jkd-heading">Eclésia</h1>
            <p className="text-sm text-jkd-text mt-2">Gerenciamento de membros e visitantes</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="inline-flex items-center gap-2 bg-church-primary text-white px-4 py-2 rounded-lg hover:bg-church-primary/90"
          >
            Voltar ao Painel
          </button>
        </div>

        <div className="mt-6 bg-jkd-bg-sec rounded-lg border border-jkd-border p-6">
          <div className="text-jkd-text">Em breve</div>
        </div>
      </div>
    </div>
  )
}

export default AdminEcclesiaPage
