jQuery(document).ready(function($) {
    const container = $('#fsc_container');
    if (!container.length) return;

    const FonteSlideCourse = {
        slides: [], settings: {}, totalSlides: 0, currentIndex: 0,
        slideInterval: null, isAnimating: false, dom: {},
        
        // Propriedades para a funcionalidade de arrastar
        isDragging: false,
        startX: 0,
        dragThreshold: 50, // Mínimo de pixels para considerar um arraste válido

        init: function() {
            this.slides = fs_data.slides || [];
            this.settings = fs_data.settings || {};
            this.totalSlides = this.slides.length;
            if (this.totalSlides < 1) { container.hide(); return; }
            this.cacheDOMElements();
            this.createSlides();
            this.bindCoreEvents();
            this.initSliderState();
            this.Popup.init(this);
            this.Particles.init(this);
        },

        cacheDOMElements: function() {
            this.dom.imageWrapper = container.find('.fsc-image-wrapper');
            this.dom.backgroundDiv = container.find('.fsc-background');
            this.dom.textWrapper = container.find('.fsc-text-wrapper');
            this.dom.category = this.dom.textWrapper.find('.fsc-category');
            this.dom.title = this.dom.textWrapper.find('.fsc-title');
            this.dom.readMore = this.dom.textWrapper.find('.fsc-read-more');
        },

        createSlides: function() {
            this.slides.forEach((slide, index) => {
                const page = $('<div>').addClass('fsc-page').data('index', index);
                const card = $('<div>').addClass('fsc-card').css('background-image', `url(${slide.image})`);
                page.append(card);
                this.dom.imageWrapper.append(page);
            });
            this.dom.pages = this.dom.imageWrapper.find('.fsc-page');
        },
        
        updateText: function() { /* ...código sem alterações... */
            const slide = this.slides[this.currentIndex];
            this.dom.textWrapper.addClass('is-exiting');
            setTimeout(() => {
                this.dom.textWrapper.addClass('is-entering');
                this.dom.category.text(slide.category);
                this.dom.title.text(slide.title);
                this.dom.readMore.attr({ 'href': slide.link || '#', 'target': slide.target || '_self' });
                void this.dom.textWrapper[0].offsetWidth; 
                this.dom.textWrapper.removeClass('is-exiting is-entering');
            }, 300); 
        },

        updateBackground: function() { /* ...código sem alterações... */
            const slide = this.slides[this.currentIndex];
            const backgroundUrl = slide.background || slide.image || this.settings.background_image;
            if (backgroundUrl) this.dom.backgroundDiv.css('background-image', `url(${backgroundUrl})`);
        },

        updateClasses: function() { /* ...código sem alterações... */
            this.dom.pages.each((i, el) => {
                const page = $(el);
                const pageIndex = page.data('index');
                let diff = pageIndex - this.currentIndex;
                if (Math.abs(diff) > this.totalSlides / 2) {
                    diff = diff > 0 ? diff - this.totalSlides : diff + this.totalSlides;
                }
                let newClass = 'hidden';
                if (diff === 0) newClass = 'current';
                else if (diff === 1) newClass = 'future0';
                else if (diff === 2) newClass = 'future1';
                else if (diff === -1) newClass = 'past0';
                else if (diff === -2) newClass = 'past1';
                el.className = 'fsc-page';
                page.addClass(newClass);
            });
        },

        updateSlider: function(newIndex) {
            if (this.isAnimating) return;
            this.isAnimating = true;
            this.currentIndex = (newIndex + this.totalSlides) % this.totalSlides;
            this.updateText();
            this.updateBackground();
            this.updateClasses();
            this.resumeAutoplay();
            setTimeout(() => { this.isAnimating = false; }, 700);
        },
        
        navigate: function(direction) { this.updateSlider(this.currentIndex + direction); },
        pauseAutoplay: function() { clearInterval(this.slideInterval); },
        
        resumeAutoplay: function() {
            this.pauseAutoplay();
            const transitionTime = parseInt(this.settings.transition_time, 10) || 6000;
            if (transitionTime > 0) {
                this.slideInterval = setInterval(() => this.navigate(1), transitionTime);
            }
        },

        bindCoreEvents: function() {
            container.find('.fsc-next').on('click', () => this.navigate(1));
            container.find('.fsc-prev').on('click', () => this.navigate(-1));
            this.dom.imageWrapper.on('mouseenter', () => this.pauseAutoplay());
            this.dom.imageWrapper.on('mouseleave', () => this.resumeAutoplay());

            // --- INÍCIO: LÓGICA DE ARRASTAR ---
            const dragArea = this.dom.imageWrapper;

            // Eventos de Mouse
            dragArea.on('mousedown', (e) => this.dragStart(e));
            $(window).on('mousemove', (e) => this.dragMove(e));
            $(window).on('mouseup', (e) => this.dragEnd(e));

            // Eventos de Toque
            dragArea.on('touchstart', (e) => this.dragStart(e));
            dragArea.on('touchmove', (e) => this.dragMove(e));
            dragArea.on('touchend', (e) => this.dragEnd(e));
        },

        // --- INÍCIO: NOVAS FUNÇÕES DE ARRASTAR ---
        dragStart: function(e) {
            if (this.isAnimating) return;
            this.isDragging = true;
            this.dom.imageWrapper.addClass('is-dragging');
            // Unifica o tratamento de mouse e toque
            this.startX = e.type === 'touchstart' ? e.originalEvent.touches[0].pageX : e.pageX;
            // Previne comportamentos padrão como seleção de imagem
            e.preventDefault();
        },

        dragMove: function(e) {
            if (!this.isDragging) return;
            // Previne o scroll da página enquanto arrasta o slide
            e.preventDefault();
        },

        dragEnd: function(e) {
            if (!this.isDragging) return;
            this.isDragging = false;
            this.dom.imageWrapper.removeClass('is-dragging');

            const endX = e.type === 'touchend' ? e.originalEvent.changedTouches[0].pageX : e.pageX;
            const dragDistance = endX - this.startX;

            // Se o arraste foi longo o suficiente, navega.
            if (Math.abs(dragDistance) > this.dragThreshold) {
                if (dragDistance < 0) {
                    this.navigate(1); // Arrastou para a esquerda -> Próximo slide
                } else {
                    this.navigate(-1); // Arrastou para a direita -> Slide anterior
                }
            } else {
                // Se foi um arraste curto, considera um clique para abrir o popup.
                // Verifica se o clique foi sobre o slide central.
                if ($(e.target).closest('.fsc-page').hasClass('current')) {
                    this.Popup.open(this.slides[this.currentIndex]);
                }
            }
        },
        // --- FIM: NOVAS FUNÇÕES DE ARRASTAR ---

        initSliderState: function() { /* ...código sem alterações... */
            this.isAnimating = true;
            const firstSlide = this.slides[0];
            this.dom.category.text(firstSlide.category);
            this.dom.title.text(firstSlide.title);
            this.dom.readMore.attr({'href': firstSlide.link || '#', 'target': firstSlide.target || '_self'});
            this.updateBackground();
            this.updateClasses();
            this.resumeAutoplay();
            setTimeout(() => { this.isAnimating = false; }, 700);
        },
        
        Popup: {
            parentSlider: null, dom: {},
            init: function(parentSlider) { this.parentSlider = parentSlider; this.cacheDOMElements(); this.bindEvents(); },
            cacheDOMElements: function() { /* ...código sem alterações... */
                this.dom.overlay = $('#fsc_popup_overlay');
                this.dom.image = this.dom.overlay.find('img');
                this.dom.openLinkButton = this.dom.overlay.find('.fsc-popup-open-link');
                this.dom.closeButton = this.dom.overlay.find('.fsc-popup-close-action');
                this.dom.content = this.dom.overlay.find('.fsc-popup-content');
            },
            open: function(slideData) { /* ...código sem alterações... */
                if (!slideData || !slideData.image) return;
                this.parentSlider.pauseAutoplay();
                this.dom.image.attr('src', slideData.image);
                if (slideData.link) {
                    this.dom.openLinkButton.attr('href', slideData.link).attr('target', slideData.target || '_self').show();
                } else {
                    this.dom.openLinkButton.hide();
                }
                this.dom.overlay.addClass('is-visible');
            },
            close: function() { /* ...código sem alterações... */
                this.dom.overlay.removeClass('is-visible');
                this.parentSlider.resumeAutoplay();
            },
            bindEvents: function() {
                // O clique agora é tratado pela lógica do dragEnd, então não precisamos mais de um evento aqui.
                this.dom.overlay.on('click', (e) => { if ($(e.target).is(this.dom.overlay)) this.close(); });
                this.dom.closeButton.on('click', (e) => { e.preventDefault(); this.close(); });
                this.dom.content.on('click', e => e.stopPropagation());
            }
        },

        Particles: { /* ...código sem alterações... */
            init: function() {
                if (container.data('particles-enabled') !== true || typeof gsap === 'undefined') return;
                const canvas = document.getElementById("fsc_magic-dust");
                if (!canvas) return;
                const ctx = canvas.getContext("2d"); const resolution = window.devicePixelRatio || 1; let sprites = []; let createMagicDust;
                function resizeCv() { const cvWidth = container.width(); const cvHeight = container.height(); canvas.width = cvWidth * resolution; canvas.height = cvHeight * resolution; canvas.style.width = cvWidth + "px"; canvas.style.height = cvHeight + "px"; ctx.scale(resolution, resolution); }
                resizeCv();
                $(window).on('resize', resizeCv);
                createMagicDust = (x, y, n) => { for (let i = 0; i < n; i++) { sprites.push(createSprite(x, y)); } };
                gsap.ticker.add(renderCv);
                function createSprite(x, y) { const texture = createShape(); const duration = randomNr(1.7, 5); const tl = gsap.timeline({ onComplete: () => { sprites = sprites.filter(s => s.animation !== tl); }}); const sprite = { animation: tl, texture: texture.canvas, width: texture.width, height: texture.height, alpha: 0, rotation: randomNr(0, 360), scale: randomNr(0.1, 0.5), originX: 0.5, originY: 0.5, x: x, y: y }; tl.to(sprite, 0.3, { alpha: 1, ease: Power0.easeIn }).to(sprite, duration, { rotation: randomNr(-360, 360), scale: 0, physics2D: { velocity: randomNr(50, 150), angle: randomNr(0, 360), gravity: 100 } }, 0).to(sprite, duration * 0.75, { alpha: 0, delay: duration * 0.25 }, 0); return sprite; }
                function createShape() { const canvas = document.createElement("canvas"); const context = canvas.getContext("2d"); const widthSpr = randomInt(30, 50); canvas.width = widthSpr * resolution; canvas.height = widthSpr * resolution; const radius = (widthSpr / 2) * resolution; const gradient = context.createRadialGradient(radius, radius, 0, radius, radius, radius); const i = Math.random(); if (i < 0.33) { gradient.addColorStop(0, "rgba(177,255,252,0.75)"); gradient.addColorStop(0.15, "rgba(177,255,252,0.1)"); } else if (i < 0.66) { gradient.addColorStop(0, "rgba(202,76,255,0.6)"); gradient.addColorStop(0.1, "rgba(202,76,255,0.1)"); } else { gradient.addColorStop(0, "rgba(102,219,214,0.6)"); gradient.addColorStop(0.1, "rgba(102,219,214,0.1)"); } gradient.addColorStop(0.65, "rgba(0,0,0,0)"); context.fillStyle = gradient; context.fillRect(0, 0, canvas.width, canvas.height); return { canvas: canvas, width: widthSpr, height: widthSpr }; }
                function renderCv() { const cvWidth = canvas.width / resolution; const cvHeight = canvas.height / resolution; ctx.clearRect(0, 0, cvWidth, cvHeight); for (let i = sprites.length - 1; i >= 0; i--) { const sprite = sprites[i]; if (!sprite.alpha) continue; ctx.save(); ctx.translate(sprite.x, sprite.y); ctx.rotate(sprite.rotation * (Math.PI / 180)); ctx.scale(sprite.scale, sprite.scale); ctx.globalAlpha = sprite.alpha; ctx.drawImage(sprite.texture, -sprite.width/2, -sprite.height/2, sprite.width, sprite.height); ctx.restore(); } }
                function randomNr(min, max) { return min + (max - min) * Math.random(); }
                function randomInt(min, max) { return Math.floor(min + (max - min + 1) * Math.random()); }
                container.on('mousemove', function(e) { if (createMagicDust) { const rect = this.getBoundingClientRect(); createMagicDust(e.clientX - rect.left, e.clientY - rect.top, 3); } });
            }
        }
    };

    FonteSlideCourse.init();
});