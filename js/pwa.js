let deferredPrompt;
const installBanner = document.getElementById('pwa-install-banner');
const installBtn = document.getElementById('btn-install');

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => {
        console.log('Service Worker registered with scope:', reg.scope);
      })
      .catch((err) => {
        console.error('Service Worker registration failed:', err);
      });
  });
}

// Capture Before Install Prompt Event
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the default browser UI banner
  e.preventDefault();
  // Save the event for manual triggering
  deferredPrompt = e;
  
  // Display our custom banner
  if (installBanner) {
    installBanner.classList.remove('hidden');
  }
});

// Bind Click Event on Custom Install Button
if (installBtn) {
  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    
    // Show prompt
    deferredPrompt.prompt();
    
    // Check user outcome
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA installation choice: ${outcome}`);
    
    // Reset deferred prompt
    deferredPrompt = null;
    
    // Hide banner
    if (installBanner) {
      installBanner.classList.add('hidden');
    }
  });
}

// Hide banner if app is already installed
window.addEventListener('appinstalled', (evt) => {
  console.log('BetterMe application installed successfully!');
  if (installBanner) {
    installBanner.classList.add('hidden');
  }
});
