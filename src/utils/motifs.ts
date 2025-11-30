export type MotifOption = { value: string; label: string };

export const MOTIF_OPTIONS: MotifOption[] = [
  { value: 'saude', label: 'Saúde' },
  { value: 'familia', label: 'Família' },
  { value: 'trabalho', label: 'Trabalho' },
  { value: 'financas', label: 'Finanças' },
  { value: 'espiritual', label: 'Espiritual' },
  { value: 'emocional', label: 'Emocional' },
  { value: 'relacionamento', label: 'Relacionamento' },
  { value: 'libertacao', label: 'Libertação' },
  { value: 'ministerio', label: 'Ministério' },
  { value: 'outros', label: 'Outros' },
];

export const motifLabel = (value: string): string => {
  const found = MOTIF_OPTIONS.find(o => o.value === value);
  return found ? found.label : value;
};

export const motifValues = (): string[] => MOTIF_OPTIONS.map(o => o.value);