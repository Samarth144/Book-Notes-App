document.addEventListener('DOMContentLoaded', () => {
    const headline = document.querySelector('.hero-headline');
    const subheadline = document.querySelector('.hero-subheadline');

    if (headline) {
        const words = headline.querySelectorAll('.word');
        const dots = headline.querySelectorAll('.dot');

        headline.style.opacity = 1;

        const timeline = anime.timeline({
            easing: 'easeOutExpo',
            loop: false,
        });

        timeline
            .add({
                targets: words[0],
                opacity: [0, 1],
                translateX: [-20, 0],
                duration: 500,
            })
            .add({
                targets: dots[0],
                translateY: [-60, 0],
                opacity: [0, 1],
                duration: 500,
                easing: 'easeOutBounce',
            }, '-=200')
            .add({
                targets: words[1],
                opacity: [0, 1],
                translateX: [-20, 0],
                duration: 500,
            }, '+=200')
            .add({
                targets: dots[1],
                translateY: [-60, 0],
                opacity: [0, 1],
                duration: 500,
                easing: 'easeOutBounce',
            }, '-=200')
            .add({
                targets: words[2],
                opacity: [0, 1],
                translateX: [-20, 0],
                duration: 500,
            }, '+=200')
            .add({
                targets: dots[2],
                translateY: [-60, 0],
                opacity: [0, 1],
                duration: 500,
                easing: 'easeOutBounce',
            }, '-=200')
            .add({
                targets: subheadline,
                opacity: [0, 1],
                translateY: [20, 0],
                duration: 800,
                easing: 'easeOutQuad',
            }, '+=500')
            .add({
                targets: '.hero-buttons',
                opacity: [0, 1],
                translateY: [20, 0],
                duration: 800,
                easing: 'easeOutQuad',
            }, '-=800'); // Start at the same time as the subheadline
    }

    function applyLiquidButtonEffect(btn) {
        const shimmer = btn.querySelector('.shimmer');

        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            shimmer.style.setProperty('--x', `${x}px`);
            shimmer.style.setProperty('--y', `${y}px`);
        });
    }

    const loginBtn = document.getElementById('liquidBtnLogin');
    if (loginBtn) {
        applyLiquidButtonEffect(loginBtn);
    }

    const registerBtn = document.getElementById('liquidBtnRegister');
    if (registerBtn) {
        applyLiquidButtonEffect(registerBtn);
    }

    if (document.body.classList.contains('app-page')) {
        document.addEventListener('mousemove', (e) => {
            document.body.style.setProperty('--x', `${e.clientX}px`);
            document.body.style.setProperty('--y', `${e.clientY}px`);
        });
    }
});

function resetAnimation() {
    const path = document.querySelector('.path');
    const tagline = document.querySelector('.tagline');

    // Reset styles to trigger reflow
    path.style.animation = 'none';
    if (tagline) tagline.style.animation = 'none';

    path.offsetHeight; /* trigger reflow */
    if (tagline) tagline.offsetHeight; /* trigger reflow */

    // Re-apply animations
    path.style.animation = 'scribbleAnim 1.2s cubic-bezier(0.37, 0, 0.63, 1) forwards 0.5s';
    if (tagline) tagline.style.animation = 'slideUp 0.5s ease-out forwards 1.5s';
}
