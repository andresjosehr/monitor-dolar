import { Injectable } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { BehaviorSubject, Observable, filter, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PwaService {
  private deferredPrompt: any;
  private _installPromptEvent = new BehaviorSubject<boolean>(false);
  private _updateAvailable = new BehaviorSubject<boolean>(false);

  constructor(private swUpdate: SwUpdate) {
    this.initializeApp();
  }

  get installPromptEvent$(): Observable<boolean> {
    return this._installPromptEvent.asObservable();
  }

  get updateAvailable$(): Observable<boolean> {
    return this._updateAvailable.asObservable();
  }

  private initializeApp(): void {
    // Capturar el evento beforeinstallprompt para mostrar el botón de instalación
    window.addEventListener('beforeinstallprompt', (event: any) => {
      event.preventDefault();
      this.deferredPrompt = event;
      this._installPromptEvent.next(true);
    });

    // Detectar cuando la app se ha instalado
    window.addEventListener('appinstalled', () => {
      this._installPromptEvent.next(false);
      this.deferredPrompt = null;
      console.log('PWA fue instalada');
    });

    // Verificar si el Service Worker está habilitado
    if (this.swUpdate.isEnabled) {
      // Verificar actualizaciones al iniciar
      this.swUpdate.versionUpdates
        .pipe(
          filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'),
          map(() => true)
        )
        .subscribe(value => {
          this._updateAvailable.next(value);
        });

      // Configurar verificación periódica de actualizaciones (cada 6 horas)
      setInterval(() => {
        this.swUpdate.checkForUpdate().then(() => {
          console.log('Verificando actualizaciones...');
        }).catch(err => {
          console.error('Error al verificar actualizaciones:', err);
        });
      }, 6 * 60 * 60 * 1000);
    }
  }

  /**
   * Instala la PWA en el dispositivo
   */
  installPwa(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return Promise.resolve(false);
    }

    // Mostrar el diálogo de instalación
    this.deferredPrompt.prompt();

    return this.deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('Usuario aceptó la instalación');
        this.deferredPrompt = null;
        this._installPromptEvent.next(false);
        return true;
      } else {
        console.log('Usuario rechazó la instalación');
        return false;
      }
    });
  }

  /**
   * Actualiza la aplicación a la última versión
   */
  updateApplication(): void {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.activateUpdate().then(() => {
        window.location.reload();
      });
    }
  }
}
