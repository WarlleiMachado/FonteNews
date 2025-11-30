import React from 'react';
import { createPortal } from 'react-dom';

interface ImageModalProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ src, alt, onClose }) => {
  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70" onClick={onClose}>
      <div className="max-w-5xl max-h-[85vh] p-2" onClick={(e) => e.stopPropagation()}>
        <img src={src} alt={alt || ''} className="max-h-[80vh] max-w-[90vw] object-contain rounded-lg shadow-lg" />
        <button
          onClick={onClose}
          className="mt-3 inline-flex items-center px-4 py-2 rounded-md bg-church-primary text-white hover:bg-church-primary/90 transition-colors"
        >
          Fechar
        </button>
      </div>
    </div>,
    document.body
  );
};

export default ImageModal;