document.addEventListener('DOMContentLoaded', () => {
    // Add scroll listener for fade-in animations
    const elementsToFadeIn = document.querySelectorAll('.fade-in-up');

    // Initial check for elements in viewport on load
    checkFadeIn();

    window.addEventListener('scroll', checkFadeIn);

    function checkFadeIn() {
        const triggerBottom = window.innerHeight * 0.9;

        elementsToFadeIn.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;

            if (elementTop < triggerBottom) {
                // Add visible class if element is scrolled into view
                element.classList.add('visible');
            }
        });
    }

    // Navbar blur effect on scroll
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(10, 15, 22, 0.95)';
            navbar.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.5)';
        } else {
            navbar.style.background = 'rgba(10, 15, 22, 0.8)';
            navbar.style.boxShadow = 'none';
        }
    });
});
