import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  isMenuOpen = false;
  activeRoute = '';

  constructor(private readonly router: Router) {
    // Detectar la ruta activa
    this.activeRoute = this.router.url;

    // Suscribirse a cambios de ruta
    this.router.events.subscribe(() => {
      this.activeRoute = this.router.url;
    });
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  isActive(route: string): boolean {
    return (
      this.activeRoute === route ||
      (route === '/' && this.activeRoute === '/home')
    );
  }
}
