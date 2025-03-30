import { useLayoutEffect } from 'react';

/**
 * Hook para optimizar el rendimiento de la SPA
 * Evita reflows y repaints innecesarios
 */
const usePerformanceOptimizer = () => {
  useLayoutEffect(() => {
    // 1. Evitar Cumulative Layout Shift
    document.documentElement.style.scrollPaddingTop = '80px';

    // 2. Optimizar scroll principal
    if ('scrollBehavior' in document.documentElement.style) {
      document.documentElement.style.scrollBehavior = 'smooth';
    }

    // 3. Optimizar renderizado de contenido
    const style = document.createElement('style');
    style.textContent = `
      .optimize-animation * {
        animation-duration: 0.001s !important;
        animation-delay: 0s !important;
        transition-duration: 0.001s !important;
      }
    `;
    document.head.appendChild(style);

    // 4. Añadir clase para rendimiento y quitarla en la primera interacción
    document.documentElement.classList.add('optimize-animation');
    
    const removeOptimization = () => {
      document.documentElement.classList.remove('optimize-animation');
      ['click', 'touchstart'].forEach(eventType => {
        document.removeEventListener(eventType, removeOptimization);
      });
    };
    
    ['click', 'touchstart'].forEach(eventType => {
      document.addEventListener(eventType, removeOptimization, { once: true });
    });

    return () => {
      document.head.removeChild(style);
      ['click', 'touchstart'].forEach(eventType => {
        document.removeEventListener(eventType, removeOptimization);
      });
    };
  }, []);
};

export default usePerformanceOptimizer;
