import { CommonModule } from '@angular/common';
import { Component, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../lib/store.service';
import { MenuItem } from '../lib/types';
import { IconComponent } from '../ui/icon.component';
import { ToastService } from '../ui/toast.service';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="container py-6">
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-foreground">Menu Management</h1>
          <p class="text-sm text-muted-foreground">{{ store.menuItems().length }} items</p>
        </div>
        <button
          *ngIf="!adding"
          (click)="startAdd()"
          class="touch-target flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 active:scale-[0.98]"
        >
          <app-icon class="h-4 w-4" name="plus"></app-icon>
          Add Item
        </button>
      </div>

      <div *ngIf="adding" class="mb-6">
        <ng-container *ngTemplateOutlet="formRow"></ng-container>
      </div>

      <div class="space-y-6">
        <section *ngFor="let group of groupedItems()">
          <h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{{ group.category }}</h2>
          <div class="space-y-2">
            <ng-container *ngFor="let item of group.items">
              <ng-container *ngIf="editing === item.id; else itemRow">
                <ng-container *ngTemplateOutlet="formRow"></ng-container>
              </ng-container>
              <ng-template #itemRow>
                <div class="flex items-center justify-between rounded-xl border bg-card p-4 transition-all hover:shadow-sm">
                  <div>
                    <div class="font-medium text-card-foreground">{{ item.name }}</div>
                    <div class="text-sm text-muted-foreground">\${{ item.price.toFixed(2) }}</div>
                  </div>
                  <div class="flex gap-2">
                    <button
                      (click)="startEdit(item)"
                      class="touch-target flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground hover:text-foreground"
                    >
                      <app-icon class="h-4 w-4" name="pencil"></app-icon>
                    </button>
                    <button
                      (click)="handleDelete(item.id)"
                      class="touch-target flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <app-icon class="h-4 w-4" name="trash-2"></app-icon>
                    </button>
                  </div>
                </div>
              </ng-template>
            </ng-container>
          </div>
        </section>
      </div>

      <ng-template #formRow>
        <div class="flex flex-col gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-end">
          <div class="flex-1">
            <label class="mb-1 block text-xs font-medium text-muted-foreground">Name</label>
            <input
              [(ngModel)]="form.name"
              name="name"
              class="touch-target w-full rounded-lg border bg-card px-3 py-2 text-sm text-card-foreground"
              placeholder="Item name"
            />
          </div>
          <div class="w-full sm:w-28">
            <label class="mb-1 block text-xs font-medium text-muted-foreground">Price ($)</label>
            <input
              [(ngModel)]="form.price"
              name="price"
              type="number"
              step="0.5"
              class="touch-target w-full rounded-lg border bg-card px-3 py-2 text-sm text-card-foreground"
              placeholder="0.00"
            />
          </div>
          <div class="w-full sm:w-36">
            <label class="mb-1 block text-xs font-medium text-muted-foreground">Category</label>
            <input
              [(ngModel)]="form.category"
              name="category"
              class="touch-target w-full rounded-lg border bg-card px-3 py-2 text-sm text-card-foreground"
              placeholder="Category"
            />
          </div>
          <div class="flex gap-2">
            <button
              (click)="save()"
              class="touch-target flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <app-icon class="h-4 w-4" name="check"></app-icon>
              Save
            </button>
            <button
              (click)="cancel()"
              class="touch-target flex items-center gap-1 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
            >
              <app-icon class="h-4 w-4" name="x"></app-icon>
              Cancel
            </button>
          </div>
        </div>
      </ng-template>
    </div>
  `,
})
export class AdminPageComponent {
  editing: string | null = null;
  adding = false;
  form = { name: '', price: '', category: '' };

  readonly categories = computed(() => {
    const items = this.store.menuItems();
    return [...new Set(items.map((item) => item.category))];
  });

  readonly groupedItems = computed(() => {
    const items = this.store.menuItems();
    return this.categories().map((category) => ({
      category,
      items: items.filter((item) => item.category === category),
    }));
  });

  constructor(readonly store: StoreService, private readonly toast: ToastService) {}

  startEdit(item: MenuItem): void {
    this.editing = item.id;
    this.adding = false;
    this.form = { name: item.name, price: item.price.toString(), category: item.category };
  }

  startAdd(): void {
    this.adding = true;
    this.editing = null;
    this.form = { name: '', price: '', category: this.categories()[0] ?? '' };
  }

  save(): void {
    if (!this.form.name || !this.form.price || !this.form.category) {
      this.toast.error('All fields are required');
      return;
    }

    if (this.editing) {
      this.store.updateMenuItem({
        id: this.editing,
        name: this.form.name,
        price: parseFloat(this.form.price),
        category: this.form.category,
      });
      this.toast.success('Item updated');
    } else {
      this.store.addMenuItem({
        name: this.form.name,
        price: parseFloat(this.form.price),
        category: this.form.category,
      });
      this.toast.success('Item added');
    }

    this.cancel();
  }

  cancel(): void {
    this.editing = null;
    this.adding = false;
    this.form = { name: '', price: '', category: '' };
  }

  handleDelete(id: string): void {
    this.store.deleteMenuItem(id);
    this.toast.success('Item deleted');
  }
}
