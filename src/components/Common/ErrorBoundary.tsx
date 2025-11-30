import React from 'react';

interface State {
  hasError: boolean;
  error?: any;
}

class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, State> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, info: any) {
    console.error('Captured error in ErrorBoundary:', error, info);
    // Optionally send to reporting endpoint
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-2xl text-center">
            <h1 className="text-2xl font-bold mb-4">Algo deu errado</h1>
            <p className="mb-4">Ocorreu um erro inesperado. Por favor atualize a página ou entre em contato com a equipe técnica.</p>
            <pre className="text-xs text-left bg-gray-100 p-3 rounded-md overflow-auto">{String(this.state.error)}</pre>
          </div>
        </div>
      );
    }
    return this.props.children as React.ReactElement;
  }
}

export default ErrorBoundary;
