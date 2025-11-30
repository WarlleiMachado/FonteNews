export type CourseSlide = {
  title: string;
  category?: string;
  imageUrl: string;
  linkUrl?: string;
  target?: '_self' | '_blank';
};

export const defaultCourseSlides: CourseSlide[] = [
  {
    title: 'Escola de Discípulos',
    category: 'Curso',
    imageUrl: 'https://images.unsplash.com/photo-1520975922284-7b11a39f4b29?q=80&w=1200&auto=format&fit=crop',
    linkUrl: '/site/cursos',
    target: '_self',
  },
  {
    title: 'Família em Foco',
    category: 'Curso',
    imageUrl: 'https://images.unsplash.com/photo-1531988042231-3c1a3e9f6a98?q=80&w=1200&auto=format&fit=crop',
    linkUrl: '/site/cursos',
    target: '_self',
  },
  {
    title: 'Liderança Servidora',
    category: 'Curso',
    imageUrl: 'https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?q=80&w=1200&auto=format&fit=crop',
    linkUrl: '/site/cursos',
    target: '_self',
  }
];