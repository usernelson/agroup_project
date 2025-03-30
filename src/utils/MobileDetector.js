import { useEffect } from 'react';

// Función para detectar dispositivos móviles
export const isMobileDevice = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  
  // Verificar si es iOS o Android
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
  return mobileRegex.test(userAgent.toLowerCase());
};

// Hook para detectar orientación y tipo de dispositivo
export const useMobileDetection = () => {
  useEffect(() => {
    const isMobile = isMobileDevice();
    const isPortrait = window.innerHeight > window.innerWidth;
    
    // Añadir clases al body para aplicar estilos específicos
    document.body.classList.toggle('is-mobile', isMobile);
    document.body.classList.toggle('is-portrait', isPortrait);
    
    // Log para depuración
    console.log('[MobileDetector] Device info:', {
      isMobile,
      isPortrait,
      userAgent: navigator.userAgent,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight
    });
    
    // Manejar cambios de orientación
    const handleOrientationChange = () => {
      const newIsPortrait = window.innerHeight > window.innerWidth;
      document.body.classList.toggle('is-portrait', newIsPortrait);
      console.log('[MobileDetector] Orientation changed:', {
        isPortrait: newIsPortrait,
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight
      });
    };
    
    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);
};

export default useMobileDetection;
