import { bootstrapApplication } from '@angular/platform-browser';
import { isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { AppComponent } from './app/app.component';
import { appProviders } from './app/providers/app.providers';
import { appRoutes } from './app/app.routes';

async function clearDevelopmentBrowserCaches(): Promise<void> {
  if (!isDevMode() || typeof window === 'undefined') {
    return;
  }

  if (!['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    return;
  }

  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }

  if ('caches' in window) {
    const cacheKeys = await caches.keys();
    await Promise.all(cacheKeys.map((cacheKey) => caches.delete(cacheKey)));
  }
}

void clearDevelopmentBrowserCaches()
  .catch(() => undefined)
  .then(() =>
    bootstrapApplication(AppComponent, {
      providers: [
        provideRouter(appRoutes),
        provideServiceWorker('ngsw-worker.js', {
          enabled: !isDevMode(),
          registrationStrategy: 'registerWhenStable:30000'
        }),
        ...appProviders
      ]
    })
  )
  .catch((error: unknown) => {
    console.error('Erreur au démarrage de l\'application Angular :', error);
  });
