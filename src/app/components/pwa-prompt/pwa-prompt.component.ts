import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PwaService } from '../../services/pwa.service';

@Component({
  selector: 'app-pwa-prompt',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pwa-prompt.component.html',
  styleUrl: './pwa-prompt.component.scss'
})
export class PwaPromptComponent implements OnInit {
  showInstallPrompt = false;
  showUpdatePrompt = false;

  constructor(private pwaService: PwaService) {}

  ngOnInit(): void {
    // Suscribirse a los observables del servicio PWA
    this.pwaService.installPromptEvent$.subscribe(value => {
      this.showInstallPrompt = value;
    });

    this.pwaService.updateAvailable$.subscribe(value => {
      this.showUpdatePrompt = value;
    });
  }

  installPwa(): void {
    this.pwaService.installPwa().then(result => {
      console.log('Resultado de instalación:', result);
    });
  }

  updatePwa(): void {
    this.pwaService.updateApplication();
  }
}
