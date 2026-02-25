import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IconComponent, IconName } from './ui/icon.component';
import { ToasterComponent } from './ui/toaster.component';
import { TenantService } from './lib/tenant.service';

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
    { to: '/restaurants', label: 'Negocios', icon: 'shopping-bag' },
    { to: '/admin', label: 'Menu', icon: 'settings' },
    { to: '/history', label: 'Historial', icon: 'clipboard-list' },
  ];

  constructor(readonly tenant: TenantService) {}
}
