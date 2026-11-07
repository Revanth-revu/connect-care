// src/main.ts

let isKannada = false;

const langBtn = document.getElementById('lang-toggle') as HTMLButtonElement;
const tagline = document.getElementById('text-tagline') as HTMLParagraphElement;
const subtitle = document.getElementById('text-subtitle') as HTMLParagraphElement;
const bookBtn = document.getElementById('text-btn') as HTMLAnchorElement;

if (langBtn) {
  langBtn.addEventListener('click', () => {
    isKannada = !isKannada;

    if (isKannada) {
      // Switch to Kannada
      langBtn.textContent = 'English';
      tagline.textContent = 'ಸಂಪರ್ಕಿಸುವ ಆರೈಕೆ'; 
      subtitle.textContent = 'ಬೆಂಗಳೂರು-ಮೊದಲ ಕ್ಲಿನಿಕ್ ಅಪಾಯಿಂಟ್ಮೆಂಟ್ಗಳು'; 
      bookBtn.textContent = 'ಈಗ ಬುಕ್ ಮಾಡಿ'; 
    } else {
      // Switch back to English
      langBtn.textContent = 'ಕನ್ನಡ (Kannada)';
      tagline.textContent = 'Care that connects.';
      subtitle.textContent = 'Bengaluru-first clinic appointments';
      bookBtn.textContent = 'Book Now';
    }
  });
}