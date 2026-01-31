/**
 * ServiceGrid Component - Grid of service links
 */

export class ServiceGrid {
    constructor(container, services = []) {
        this.container = container;
        this.services = services;
    }

    /**
     * Initialize the component
     */
    init() {
        this.render();
    }

    /**
     * Render the service grid
     */
    render() {
        if (this.services.length === 0) {
            this.container.innerHTML = `
                <div style="text-align: center; color: var(--text-muted); padding: 2rem;">
                    No services configured.<br>
                    <span style="font-size: 0.875rem;">Edit config.js to add services.</span>
                </div>
            `;
            return;
        }

        const servicesHTML = this.services
            .map(service => this.createServiceCard(service))
            .join('');

        this.container.innerHTML = servicesHTML;

        // Add event listeners for animations
        this.addInteractivity();
    }

    /**
     * Create the HTML for a service card
     * @param {Object} service - Service data
     * @returns {string} - Card HTML
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
     * Escape HTML characters to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} - Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Add interactivity to cards
     */
    addInteractivity() {
        const cards = this.container.querySelectorAll('.service-card');

        cards.forEach(card => {
            // Ripple effect on click
            card.addEventListener('click', e => {
                this.createRipple(e, card);
            });

            // Tilt effect on hover (optional)
            card.addEventListener('mousemove', e => {
                this.handleTilt(e, card);
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
            });
        });
    }

    /**
     * Create ripple effect
     * @param {Event} e - Click event
     * @param {HTMLElement} card - Card element
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

        // Add keyframes if they don't exist
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
     * Handle tilt effect on hover
     * @param {Event} e - Mousemove event
     * @param {HTMLElement} card - Card element
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
     * Filter services by category
     * @param {string} category - Category to filter (null = all)
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
     * Clean up the component
     */
    destroy() {
        this.container.innerHTML = '';
    }
}
