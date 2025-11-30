import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { RRule } from 'rrule';

export const createSampleData = async () => {
  try {
    console.log('🌱 Criando dados de exemplo...');

    // Criar um culto de domingo
    const domingoRRule = new RRule({
      freq: RRule.WEEKLY,
      byweekday: [RRule.SU],
      byhour: [19],
      byminute: [0],
      dtstart: new Date()
    });

    const cultoData = {
      title: 'Culto de Domingo',
      description: 'Culto principal da igreja aos domingos',
      rruleString: domingoRRule.toString(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      image: null
    };

    await addDoc(collection(db, 'cultos'), cultoData);
    console.log('✅ Culto de domingo criado');

    // Criar um culto de quarta
    const quartaRRule = new RRule({
      freq: RRule.WEEKLY,
      byweekday: [RRule.WE],
      byhour: [20],
      byminute: [0],
      dtstart: new Date()
    });

    const cultoQuartaData = {
      title: 'Culto de Oração',
      description: 'Culto de oração às quartas-feiras',
      rruleString: quartaRRule.toString(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      image: null
    };

    await addDoc(collection(db, 'cultos'), cultoQuartaData);
    console.log('✅ Culto de quarta criado');

    // Criar um anúncio especial
    const eventoEspecialDate = new Date();
    eventoEspecialDate.setDate(eventoEspecialDate.getDate() + 7); // Próxima semana
    eventoEspecialDate.setHours(15, 0, 0, 0);

    const eventoRRule = new RRule({
      freq: RRule.DAILY,
      count: 1,
      dtstart: eventoEspecialDate
    });

    const eventoData = {
      title: 'Evento Especial da Igreja',
      content: 'Um evento especial que acontecerá na próxima semana',
      type: 'evento',
      status: 'approved',
      rruleString: eventoRRule.toString(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      authorId: 'admin',
      imageUrl: null
    };

    await addDoc(collection(db, 'announcements'), eventoData);
    console.log('✅ Evento especial criado');

    console.log('🎉 Dados de exemplo criados com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar dados de exemplo:', error);
  }
};