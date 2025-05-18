import { Component, EventEmitter, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styles: []
})
export class SidebarComponent {
  isSidebarOpen = true;
  @Output() toggleSidebarEvent = new EventEmitter<void>();

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
    this.toggleSidebarEvent.emit();
  }
}
