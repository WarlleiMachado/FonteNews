import React, { useState } from 'react';
import PopupForm from './PopupForm';
import AnimatedButton from '../Common/AnimatedButton';
import { PlusCircle } from 'lucide-react';

interface Props {
  popupId: string;
  label?: string;
  className?: string;
}

const OpenFormButton: React.FC<Props> = ({ popupId, label = 'Abrir formulário', className }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <AnimatedButton onClick={() => setOpen(true)} className={className || 'px-4 py-2 bg-church-primary text-white rounded-lg hover:bg-church-primary/90'}>
        <PlusCircle size={16} />
        <span>{label}</span>
      </AnimatedButton>
      {open && <PopupForm popupId={popupId} onClose={() => setOpen(false)} />}
    </>
  );
};

export default OpenFormButton;