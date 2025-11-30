import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../contexts/ToastContext';
import { db, storage } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { PrayerRequest, PrayerSettings } from '../../types';
import { MOTIF_OPTIONS, motifLabel } from '../../utils/motifs';

const PrayerForm: React.FC = () => {
  const { user, firebaseUser } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    name: '', email: '', phone: '', motif: 'saude', motifOther: '', wantsVisit: false,
    street: '', number: '', district: '', city: '', state: '', isPrivate: false, hideName: false, text: '', imageFile: null as File | null, imageUrl: '',
    affiliation: '' as '' | 'membro' | 'visitante' | 'outro',
  });
  const [loading, setLoading] = useState(false);
  const [showUploadOverlay, setShowUploadOverlay] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as any;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setForm(prev => ({ ...prev, imageFile: file }));
  };

  const handleUploadClick = () => {
    if (!user && !firebaseUser) {
      setShowUploadOverlay(true);
      return;
    }
    fileInputRef.current?.click();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    // Validações obrigatórias (exceto imagem)
    if (!form.text.trim()) {
      showToast('error', 'O campo Pedido é obrigatório.');
      return;
    }
    if (!form.isPrivate && !form.hideName && !form.name.trim()) {
      showToast('error', 'Informe seu nome ou marque "Reservado".');
      return;
    }
    if (!form.email.trim()) {
      showToast('error', 'Informe seu e-mail.');
      return;
    }
    if (!form.phone.trim()) {
      showToast('error', 'Informe seu telefone.');
      return;
    }
    if (form.motif === 'outros' && !form.motifOther.trim()) {
      showToast('error', 'Especifique o Motivo em "Outros".');
      return;
    }
    if (!form.affiliation) {
      showToast('error', 'Selecione o campo "Vínculo com a Igreja".');
      return;
    }
    if (form.wantsVisit) {
      if (!form.street.trim() || !form.number.trim() || !form.district.trim() || !form.city.trim() || !form.state.trim()) {
        showToast('error', 'Preencha todos os campos de endereço para visita.');
        return;
      }
    }
    try {
      setLoading(true);
      const prayersCol = collection(db, 'prayers');
      const baseDoc: any = {
        name: form.name.trim(),
        motif: form.motif,
        wantsVisit: !!form.wantsVisit,
        isPrivate: !!form.isPrivate,
        hideName: !!form.hideName,
        text: form.text,
        status: 'pending',
        prayCount: 0,
        prayedBy: [],
        createdAt: serverTimestamp(),
        affiliation: form.affiliation,
      };

      if (form.email) baseDoc.email = form.email;
      if (form.phone) baseDoc.phone = form.phone;
      if (form.motif === 'outros' && form.motifOther) baseDoc.motifOther = form.motifOther;
      // Dono: sempre usar UID do Firebase para obedecer às regras de segurança
      if (firebaseUser?.uid || user?.firebaseUid) baseDoc.ownerUserId = (firebaseUser?.uid || user?.firebaseUid)!;

      if (form.wantsVisit) {
        const addr: any = {};
        if (form.street) addr.street = form.street;
        if (form.number) addr.number = form.number;
        if (form.district) addr.district = form.district;
        if (form.city) addr.city = form.city;
        if (form.state) addr.state = form.state;
        if (Object.keys(addr).length > 0) baseDoc.address = addr;
      }

      const docRef = await addDoc(prayersCol, baseDoc);
      // Imagem por URL (não salva no Storage, apenas usa o link)
      if (!form.imageFile && form.imageUrl.trim()) {
        try {
          await updateDoc(doc(db, 'prayers', docRef.id), { imageUrl: form.imageUrl.trim() });
        } catch (e) {
          console.warn('Falha ao salvar imageUrl no pedido:', e);
        }
      }
      // Upload de imagem (somente se usuário logado); pode falhar por permissão (Storage)
      if ((user || firebaseUser) && form.imageFile) {
        try {
          const sRef = storageRef(storage, `images/prayers/${docRef.id}/${form.imageFile.name}`);
          await uploadBytes(sRef, form.imageFile);
          const url = await getDownloadURL(sRef);
          await updateDoc(doc(db, 'prayers', docRef.id), { imageUrl: url });
        } catch (uploadErr) {
          console.warn('Falha ao anexar imagem do pedido (provável permissão de Storage):', uploadErr);
          // Não interromper o fluxo: pedido já foi criado; apenas avisar com warning
          showToast('warning', 'pedido enviado sem imagem, permissões de upload restrita');
        }
      } else if (!form.imageUrl.trim()) {
        // Usuário deslogado sem URL fornecida
        showToast('warning', 'pedido enviado sem imagem, permissões de upload restrita');
      }

      // Outbox de e-mail: envia notificação para admins configurados
      const settingsSnap = await getDoc(doc(db, 'prayer_settings', 'default'));
      const settingsData = settingsSnap.exists() ? (settingsSnap.data() as PrayerSettings) : null;
      const recipients = settingsData?.notificationEmails?.filter(Boolean) || [];
      if (recipients.length > 0) {
        await addDoc(collection(db, 'outbox_emails'), {
          to: recipients,
          subject: `Novo Pedido de Oração: ${form.isPrivate ? 'Privado' : (form.hideName ? 'Reservado' : form.name)}`,
          body: `Motivo: ${motifLabel(form.motif)}${form.motif === 'outros' ? ` (${form.motifOther})` : ''}\n` +
                `Pedido:\n${form.text}\n\n` +
                `Contato: ${form.email || ''} ${form.phone || ''}`,
          createdAt: serverTimestamp(),
          meta: { prayerId: docRef.id }
        });
      }

      showToast('success', 'Pedido enviado com sucesso!');
      setForm({ name: '', email: '', phone: '', motif: 'saude', motifOther: '', wantsVisit: false,
        street: '', number: '', district: '', city: '', state: '', isPrivate: false, hideName: false, text: '', imageFile: null, imageUrl: '', affiliation: '' });
    } catch (err) {
      const e: any = err || {};
      console.error('❌ Erro ao enviar pedido:', e);
      const code = e.code || e.name || 'erro-desconhecido';
      const msg = e.message || 'Falha ao salvar no Firestore.';
      showToast('error', `Erro ao enviar pedido: ${code}. ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="relative bg-jkd-bg-sec border border-jkd-border rounded-lg p-4 space-y-3">
      {/* Overlay semelhante ao bloco da Secretaria */}
      <div className="absolute inset-0 rounded-lg bg-transparent pointer-events-none" />
      <h2 className="text-lg font-semibold text-jkd-heading">Faça seu Pedido de Oração</h2>
      {/* Toggle Privado/Público */}
      <div className="flex items-center justify-center">
        <div className="inline-flex rounded-md border border-jkd-border bg-jkd-bg overflow-hidden text-xs sm:text-sm">
          <button type="button" onClick={() => setForm(prev => ({ ...prev, isPrivate: true, hideName: false }))} className={`px-3 py-1.5 ${form.isPrivate ? 'bg-church-primary text-white hover:bg-church-primary/90' : 'text-jkd-text hover:bg-jkd-border/30'}`}>Privado (Visível apenas para Pastores)</button>
          <button type="button" onClick={() => setForm(prev => ({ ...prev, isPrivate: false }))} className={`px-3 py-1.5 ${!form.isPrivate ? 'bg-church-primary text-white hover:bg-church-primary/90' : 'text-jkd-text hover:bg-jkd-border/30'}`}>Público (Formar uma corrente de Oração)</button>
        </div>
      </div>
      <p className="mt-1 text-[11px] text-jkd-text/80 text-center">(Seus dados pessoais nunca serão exibidos)</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input name="name" value={form.name} onChange={handleChange} placeholder="Seu nome" className="w-full px-3 py-2 rounded-md border border-jkd-border bg-jkd-bg text-jkd-text" />
        <input name="email" value={form.email} onChange={handleChange} placeholder="Seu e-mail" className="w-full px-3 py-2 rounded-md border border-jkd-border bg-jkd-bg text-jkd-text" />
        <input name="phone" value={form.phone} onChange={handleChange} placeholder="Seu telefone" className="w-full px-3 py-2 rounded-md border border-jkd-border bg-jkd-bg text-jkd-text" />
        <select name="motif" value={form.motif} onChange={handleChange} className="w-full px-3 py-2 rounded-md border border-jkd-border bg-jkd-bg text-jkd-text">
          {MOTIF_OPTIONS.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
        </select>

        {form.motif === 'outros' && (
          <input name="motifOther" value={form.motifOther} onChange={handleChange} placeholder="Especifique o Motivo (Outros) *" className="w-full sm:col-span-2 px-3 py-2 rounded-md border border-jkd-border bg-jkd-bg text-jkd-text" />
        )}
        <label className="flex flex-col sm:col-span-2 text-jkd-text text-xs md:text-sm">
          <span className="flex items-center gap-2"><input type="checkbox" name="wantsVisit" checked={form.wantsVisit} onChange={handleChange} /> <span>Desejo receber visita (se aplicável)</span></span>
          <span className="mt-1 text-[11px] text-jkd-text/80">(Seu endereço não será exibido)</span>
        </label>
        <select name="affiliation" value={form.affiliation} onChange={handleChange} className="w-full px-3 py-2 rounded-md border border-jkd-border bg-jkd-bg text-jkd-text" required>
          <option value="">Vínculo com a Igreja: *</option>
          <option value="membro">Membro</option>
          <option value="visitante">Visitante</option>
          <option value="outro">Outro</option>
        </select>
      </div>
      {form.wantsVisit && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input name="street" value={form.street} onChange={handleChange} placeholder="Rua" className="w-full px-3 py-2 rounded-md border border-jkd-border bg-jkd-bg text-jkd-text" />
          <input name="number" value={form.number} onChange={handleChange} placeholder="Número" className="w-full px-3 py-2 rounded-md border border-jkd-border bg-jkd-bg text-jkd-text" />
          <input name="district" value={form.district} onChange={handleChange} placeholder="Bairro" className="w-full px-3 py-2 rounded-md border border-jkd-border bg-jkd-bg text-jkd-text" />
          <input name="city" value={form.city} onChange={handleChange} placeholder="Cidade" className="w-full px-3 py-2 rounded-md border border-jkd-border bg-jkd-bg text-jkd-text" />
          <input name="state" value={form.state} onChange={handleChange} placeholder="Estado" className="w-full px-3 py-2 rounded-md border border-jkd-border bg-jkd-bg text-jkd-text" />
        </div>
      )}
      { !form.isPrivate && (
        <label className="flex items-center gap-2 text-jkd-text text-xs md:text-sm">
          <input type="checkbox" name="hideName" checked={form.hideName} onChange={handleChange} /> Não quero que meu nome seja exibido (Seu nome será Reservado)
        </label>
      )}
      <textarea name="text" value={form.text} onChange={handleChange} placeholder="Escreva seu pedido" className="w-full px-3 py-2 rounded-md border border-jkd-border bg-jkd-bg text-jkd-text min-h-28" />
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm text-jkd-text">Imagem (Opcional)</p>
          <button type="button" onClick={handleUploadClick} className="px-3 py-2 rounded-md bg-jkd-bg border border-jkd-border text-jkd-text">Upload</button>
        </div>
        <div className="flex items-center gap-3">
          {form.imageFile && <span className="text-jkd-text text-sm">{form.imageFile.name}</span>}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </div>
        <input name="imageUrl" value={form.imageUrl} onChange={handleChange} placeholder="URL da imagem (se não estiver logado)" className="w-full px-3 py-2 rounded-md border border-jkd-border bg-jkd-bg text-jkd-text" />
      </div>
      <button type="submit" disabled={loading} className="px-4 py-2 rounded-md bg-church-primary text-white hover:bg-church-primary/90">
        {loading ? 'Enviando...' : 'Enviar Pedido'}
      </button>
      <p className="text-xs text-jkd-text">Ao enviar, você concorda em exibir seu pedido no mural.</p>

      {showUploadOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowUploadOverlay(false)} />
          <div className="relative bg-jkd-bg rounded-lg border border-jkd-border w-full max-w-sm mx-4 p-4 text-center">
            <img src="/mural-de-oracao/assets/images/icons/login.svg" alt="Login necessário" className="mx-auto w-16 h-16 mb-2 opacity-80" />
            <p className="text-sm text-jkd-heading font-semibold">Faça login para enviar imagem por Upload</p>
            <p className="text-xs text-jkd-text mt-1">Se preferir, cole a URL da imagem.</p>
            <button type="button" className="mt-3 px-3 py-2 rounded-md bg-jkd-bg border border-jkd-border text-jkd-text" onClick={() => setShowUploadOverlay(false)}>
              Entendi
            </button>
          </div>
        </div>
      )}
    </form>
  );
};

export default PrayerForm;