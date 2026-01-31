/**
 * ServiceGrid Component - Grid de enlaces a servicios
 */

export class ServiceGrid {
    constructor(container, services = []) {
        this.container = container;
        this.services = services;
    }

    /**
     * Inicializa el componente
     */
    init() {
        this.render();
    }

    /**
     * Renderiza el grid de servicios
     */
    render() {
        if (this.services.length === 0) {
            this.container.innerHTML = `
                <div style="text-align: center; color: var(--text-muted); padding: 2rem;">
                    No hay servicios configurados.<br>
                    <span style="font-size: 0.875rem;">Edita config.js para añadir servicios.</span>
                </div>
            `;
            return;
        }

        const servicesHTML = this.services
            .map(service => this.createServiceCard(service))
            .join('');

        this.container.innerHTML = servicesHTML;

        // Añadir event listeners para animaciones
        this.addInteractivity();
    }

    /**
     * Crea el HTML de una tarjeta de servicio
     * @param {Object} service - Datos del servicio
     * @returns {string} - HTML de la tarjeta
     */
    createServiceCard(service) {
        const { name, url, icon, category } = service;

        return `
            <a href="${this.escapeHtml(url)}"
               target="_blank"
               rel="noopener noreferrer"
               class="service-card"
               data-category="${category || 'general'}"
               title="${this.escapeHtml(name)}">
                <div class="service-icon">${icon || '🔗'}</div>
                <div class="service-name">${this.escapeHtml(name)}</div>
            </a>
        `;
    }

    /**
     * Escapa caracteres HTML para prevenir XSS
     * @param {string} text - Texto a escapar
     * @returns {string} - Texto escapado
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Añade interactividad a las tarjetas
     */
    addInteractivity() {
        const cards = this.container.querySelectorAll('.service-card');

        cards.forEach(card => {
            // Efecto de ripple al hacer click
            card.addEventListener('click', e => {
                this.createRipple(e, card);
            });

            // Efecto de tilt en hover (opcional)
            card.addEventListener('mousemove', e => {
                this.handleTilt(e, card);
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
            });
        });
    }

    /**
     * Crea efecto ripple
     * @param {Event} e - Evento click
     * @param {HTMLElement} card - Elemento tarjeta
     */
    createRipple(e, card) {
        const ripple = document.createElement('span');
        const rect = card.getBoundingClientRect();

        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
        `;

        // Añadir keyframes si no existen
        if (!document.querySelector('#ripple-styles')) {
            const style = document.createElement('style');
            style.id = 'ripple-styles';
            style.textContent = `
                @keyframes ripple {
                    to {
                        transform: scale(2);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        card.style.position = 'relative';
        card.style.overflow = 'hidden';
        card.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
    }

    /**
     * Maneja efecto tilt en hover
     * @param {Event} e - Evento mousemove
     * @param {HTMLElement} card - Elemento tarjeta
     */
    handleTilt(e, card) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const tiltX = (y - centerY) / 10;
        const tiltY = (centerX - x) / 10;

        card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-3px)`;
    }

    /**
     * Filtra servicios por categoría
     * @param {string} category - Categoría a filtrar (null = todas)
     */
    filterByCategory(category) {
        const cards = this.container.querySelectorAll('.service-card');

        cards.forEach(card => {
            if (!category || card.dataset.category === category) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    }

    /**
     * Limpia el componente
     */
    destroy() {
        this.container.innerHTML = '';
    }
}
