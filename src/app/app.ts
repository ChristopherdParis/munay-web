import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { IconComponent, IconName } from './ui/icon.component';
import { ToasterComponent } from './ui/toaster.component';
import { TenantService } from './lib/tenant.service';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterModule, IconComponent, ToasterComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly navItems: Array<{ to: string; label: string; icon: IconName; exact?: boolean }> = [
    { to: '/', label: 'Tables', icon: 'layout-grid', exact: true },
    { to: '/kitchen', label: 'Kitchen', icon: 'chef-hat' },
    { to: '/admin', label: 'Menu', icon: 'settings' },
    { to: '/history', label: 'Historial', icon: 'clipboard-list' },
  ];

  readonly isOwnerRoute = signal(false);

  constructor(readonly tenant: TenantService, router: Router) {
    this.isOwnerRoute.set(router.url.startsWith('/owner'));
    router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event) => {
      const url = (event as NavigationEnd).urlAfterRedirects;
      this.isOwnerRoute.set(url.startsWith('/owner'));
    });
  }
}
