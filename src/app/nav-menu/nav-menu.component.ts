import { Component } from '@angular/core';
import { AuthService } from '../_shared/services/auth.service';

@Component({
  selector: 'app-nav-menu',
  templateUrl: './nav-menu.component.html',
  styleUrls: ['./nav-menu.component.css']
})
export class NavMenuComponent {
  complexMenus= [{name: 'op', isOpen: false}, {name: 'cat', isOpen: false}, {name: 'ov', isOpen: false}];
  isExpanded = false;

  constructor(private authService: AuthService) {}

  toggleMenu(key: string): void {
    const selectedMenu = this.complexMenus.filter(m => m.name === key)[0];
    
    if (!selectedMenu.isOpen) {
      this.closeAllMenus();
    }
    selectedMenu.isOpen = !selectedMenu.isOpen;
  }

  isMenuOpen(key: string): boolean {
    return this.complexMenus.filter(m => m.name === key)[0].isOpen;
  }

  hasRole(role: string) {
    return this.authService.hasUserRole(role);
  }

  hasRoles(roles: string[]) {
    return this.authService.hasUserRoles(roles);
  }

  closeAllMenus(): void {
    this.complexMenus.forEach(m => m.isOpen = false);
  }

  logout(): void {
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('token');
  }

  collapse() {
    this.isExpanded = false;
  }

  toggle() {
    this.isExpanded = !this.isExpanded;
  }
}
