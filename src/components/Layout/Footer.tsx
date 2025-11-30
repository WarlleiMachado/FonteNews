import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../hooks/useApp';

const Footer: React.FC = () => {
  const { settings } = useApp();

  return (
    <footer className="bg-jkd-bg-sec border-t border-jkd-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-jkd-text text-center sm:text-left">
            {settings.copyrightText}
          </p>
          <div className="flex items-center space-x-4 text-sm">
            <Link to="/terms" className="text-jkd-text hover:text-church-primary transition-colors">
              Termos de Uso
            </Link>
            <Link to="/privacy" className="text-jkd-text hover:text-church-primary transition-colors">
              Política de Privacidade
            </Link>
            <Link to="/cookies" className="text-jkd-text hover:text-church-primary transition-colors">
              Política de Cookies
            </Link>
            {/* Ponto discreto para acessar o site replicado */}
            <Link
              to="/site"
              aria-hidden="true"
              tabIndex={-1}
              className="w-2 h-2 rounded-full bg-black opacity-10 hover:opacity-20 focus:opacity-20 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
