export type BeepOptions = {
  frequency: number;
  durationMs: number;
  sampleRate?: number;
  volume?: number;
};

function generateBeepWavBuffer(opts: BeepOptions): ArrayBuffer {
  const sampleRate = opts.sampleRate ?? 44100;
  const volume = opts.volume ?? 0.25;
  const numSamples = Math.floor((sampleRate * opts.durationMs) / 1000);
  const dataSize = numSamples * 2; // 16-bit mono
  const buffer = new ArrayBuffer(44 + dataSize);
  const dv = new DataView(buffer);
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) dv.setUint8(offset + i, str.charCodeAt(i));
  };
  let offset = 0;
  // RIFF header
  writeString(offset, "RIFF");
  offset += 4;
  dv.setUint32(offset, 36 + dataSize, true);
  offset += 4;
  writeString(offset, "WAVE");
  offset += 4;
  // fmt chunk
  writeString(offset, "fmt ");
  offset += 4;
  dv.setUint32(offset, 16, true); // PCM chunk size
  offset += 4;
  dv.setUint16(offset, 1, true); // audio format = PCM
  offset += 2;
  dv.setUint16(offset, 1, true); // channels = 1 (mono)
  offset += 2;
  dv.setUint32(offset, sampleRate, true); // sample rate
  offset += 4;
  dv.setUint32(offset, sampleRate * 2, true); // byte rate (sampleRate * blockAlign)
  offset += 4;
  dv.setUint16(offset, 2, true); // block align (channels * bytesPerSample)
  offset += 2;
  dv.setUint16(offset, 16, true); // bits per sample
  offset += 2;
  // data chunk
  writeString(offset, "data");
  offset += 4;
  dv.setUint32(offset, dataSize, true);
  offset += 4;

  // Sine wave with simple envelope
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const attack = Math.min(1, i / (sampleRate * 0.01)); // ~10ms
    const release = Math.min(1, (numSamples - i) / (sampleRate * 0.02)); // ~20ms
    const envelope = Math.min(attack, release);
    const sample = Math.sin(2 * Math.PI * opts.frequency * t) * envelope * volume;
    dv.setInt16(offset, Math.max(-1, Math.min(1, sample)) * 0x7fff, true);
    offset += 2;
  }

  return buffer;
}

export function generateBeepWavUrl(options?: Partial<BeepOptions>): string {
  const opts: BeepOptions = {
    frequency: options?.frequency ?? 880,
    durationMs: options?.durationMs ?? 180,
    sampleRate: options?.sampleRate ?? 44100,
    volume: options?.volume ?? 0.25,
  };
  const buffer = generateBeepWavBuffer(opts);
  const blob = new Blob([buffer], { type: "audio/wav" });
  return URL.createObjectURL(blob);
}

// Conveniências por tipo de alerta
export const defaultChatBeepUrl = () => '/Chat.mp3';
export const defaultApprovalsBeepUrl = () => '/aprova2.mp3';
export const defaultRequestsBeepUrl = () => '/solicita2.mp3';
export const defaultProgramStartBeepUrl = () => '/inicprogram.mp3';