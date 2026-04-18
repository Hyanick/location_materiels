import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { appProviders } from './app/providers/app.providers';
import { appRoutes } from './app/app.routes';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(appRoutes),
    ...appProviders
  ]
}).catch((error: unknown) => {
  console.error('Erreur au démarrage de l\'application Angular :', error);
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/ngsw-worker.js').catch((error: unknown) => {
      console.error('Impossible d’enregistrer le service worker :', error);
    });
  });
}
