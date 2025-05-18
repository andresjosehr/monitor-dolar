import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  template: `
    <div class="flex h-screen bg-gray-100">
      <div [class.translate-x-0]="isSidebarOpen" [class.-translate-x-full]="!isSidebarOpen" class="transition-transform duration-300 ease-in-out">
        <app-sidebar (toggleSidebarEvent)="toggleSidebar()"></app-sidebar>
      </div>
      <main [class.ml-72]="isSidebarOpen" class="flex-1 overflow-y-auto p-3 transition-all duration-300 ease-in-out">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: []
})
export class MainLayoutComponent {
  isSidebarOpen = true;

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }
}
