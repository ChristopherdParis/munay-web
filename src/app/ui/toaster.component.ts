import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toaster',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pointer-events-none fixed right-4 top-4 z-[60] flex w-[320px] flex-col gap-2">
      <div
        *ngFor="let toast of toastService.toasts()"
        class="pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg transition-all"
        [ngClass]="{
          'border-success/60 bg-success text-success-foreground': toast.type === 'success',
          'border-destructive/60 bg-destructive text-destructive-foreground': toast.type === 'error',
          'border-border bg-card text-card-foreground': toast.type === 'info'
        }"
      >
        <span class="text-sm font-medium">{{ toast.message }}</span>
      </div>
    </div>
  `,
})
export class ToasterComponent {
  constructor(readonly toastService: ToastService) {}
}
