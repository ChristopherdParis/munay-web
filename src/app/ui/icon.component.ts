import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

type IconNode =
  | { tag: 'path'; attrs: { d: string } }
  | { tag: 'rect'; attrs: { x: string; y: string; width: string; height: string; rx?: string; ry?: string } }
  | { tag: 'circle'; attrs: { cx: string; cy: string; r: string } }
  | { tag: 'line'; attrs: { x1: string; y1: string; x2: string; y2: string } }
  | { tag: 'polyline'; attrs: { points: string } };

export type IconName =
  | 'layout-grid'
  | 'clipboard-list'
  | 'chef-hat'
  | 'settings'
  | 'users'
  | 'coffee'
  | 'shopping-bag'
  | 'arrow-left'
  | 'plus'
  | 'minus'
  | 'send'
  | 'trash-2'
  | 'check-circle'
  | 'clock'
  | 'utensils-crossed'
  | 'pencil'
  | 'x'
  | 'check';

const ICONS: Record<IconName, IconNode[]> = {
  'layout-grid': [
    { tag: 'rect', attrs: { width: '7', height: '7', x: '3', y: '3', rx: '1' } },
    { tag: 'rect', attrs: { width: '7', height: '7', x: '14', y: '3', rx: '1' } },
    { tag: 'rect', attrs: { width: '7', height: '7', x: '14', y: '14', rx: '1' } },
    { tag: 'rect', attrs: { width: '7', height: '7', x: '3', y: '14', rx: '1' } },
  ],
  'clipboard-list': [
    { tag: 'rect', attrs: { width: '8', height: '4', x: '8', y: '2', rx: '1', ry: '1' } },
    {
      tag: 'path',
      attrs: {
        d: 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2',
      },
    },
    { tag: 'path', attrs: { d: 'M12 11h4' } },
    { tag: 'path', attrs: { d: 'M12 16h4' } },
    { tag: 'path', attrs: { d: 'M8 11h.01' } },
    { tag: 'path', attrs: { d: 'M8 16h.01' } },
  ],
  'chef-hat': [
    {
      tag: 'path',
      attrs: {
        d: 'M17 21a1 1 0 0 0 1-1v-5.35c0-.457.316-.844.727-1.041a4 4 0 0 0-2.134-7.589 5 5 0 0 0-9.186 0 4 4 0 0 0-2.134 7.588c.411.198.727.585.727 1.041V20a1 1 0 0 0 1 1Z',
      },
    },
    { tag: 'path', attrs: { d: 'M6 17h12' } },
  ],
  settings: [
    {
      tag: 'path',
      attrs: {
        d: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z',
      },
    },
    { tag: 'circle', attrs: { cx: '12', cy: '12', r: '3' } },
  ],
  users: [
    { tag: 'path', attrs: { d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' } },
    { tag: 'circle', attrs: { cx: '9', cy: '7', r: '4' } },
    { tag: 'path', attrs: { d: 'M22 21v-2a4 4 0 0 0-3-3.87' } },
    { tag: 'path', attrs: { d: 'M16 3.13a4 4 0 0 1 0 7.75' } },
  ],
  coffee: [
    { tag: 'path', attrs: { d: 'M10 2v2' } },
    { tag: 'path', attrs: { d: 'M14 2v2' } },
    {
      tag: 'path',
      attrs: {
        d: 'M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1',
      },
    },
    { tag: 'path', attrs: { d: 'M6 2v2' } },
  ],
  'shopping-bag': [
    { tag: 'path', attrs: { d: 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z' } },
    { tag: 'path', attrs: { d: 'M3 6h18' } },
    { tag: 'path', attrs: { d: 'M16 10a4 4 0 0 1-8 0' } },
  ],
  'arrow-left': [
    { tag: 'path', attrs: { d: 'm12 19-7-7 7-7' } },
    { tag: 'path', attrs: { d: 'M19 12H5' } },
  ],
  plus: [
    { tag: 'path', attrs: { d: 'M5 12h14' } },
    { tag: 'path', attrs: { d: 'M12 5v14' } },
  ],
  minus: [{ tag: 'path', attrs: { d: 'M5 12h14' } }],
  send: [
    {
      tag: 'path',
      attrs: {
        d: 'M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z',
      },
    },
    { tag: 'path', attrs: { d: 'm21.854 2.147-10.94 10.939' } },
  ],
  'trash-2': [
    { tag: 'path', attrs: { d: 'M3 6h18' } },
    { tag: 'path', attrs: { d: 'M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6' } },
    { tag: 'path', attrs: { d: 'M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2' } },
    { tag: 'line', attrs: { x1: '10', y1: '11', x2: '10', y2: '17' } },
    { tag: 'line', attrs: { x1: '14', y1: '11', x2: '14', y2: '17' } },
  ],
  'check-circle': [
    { tag: 'path', attrs: { d: 'M21.801 10A10 10 0 1 1 17 3.335' } },
    { tag: 'path', attrs: { d: 'm9 11 3 3L22 4' } },
  ],
  clock: [
    { tag: 'circle', attrs: { cx: '12', cy: '12', r: '10' } },
    { tag: 'polyline', attrs: { points: '12 6 12 12 16 14' } },
  ],
  'utensils-crossed': [
    { tag: 'path', attrs: { d: 'm16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8' } },
    { tag: 'path', attrs: { d: 'M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7' } },
    { tag: 'path', attrs: { d: 'm2.1 21.8 6.4-6.3' } },
    { tag: 'path', attrs: { d: 'm19 5-7 7' } },
  ],
  pencil: [
    {
      tag: 'path',
      attrs: {
        d: 'M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z',
      },
    },
    { tag: 'path', attrs: { d: 'm15 5 4 4' } },
  ],
  x: [
    { tag: 'path', attrs: { d: 'M18 6 6 18' } },
    { tag: 'path', attrs: { d: 'm6 6 12 12' } },
  ],
  check: [{ tag: 'path', attrs: { d: 'M20 6 9 17l-5-5' } }],
};

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="h-full w-full"
      aria-hidden="true"
    >
      <ng-container *ngFor="let node of nodes">
        <path *ngIf="node.tag === 'path'" [attr.d]="node.attrs.d"></path>
        <rect
          *ngIf="node.tag === 'rect'"
          [attr.x]="node.attrs.x"
          [attr.y]="node.attrs.y"
          [attr.width]="node.attrs.width"
          [attr.height]="node.attrs.height"
          [attr.rx]="node.attrs.rx"
          [attr.ry]="node.attrs.ry"
        ></rect>
        <circle
          *ngIf="node.tag === 'circle'"
          [attr.cx]="node.attrs.cx"
          [attr.cy]="node.attrs.cy"
          [attr.r]="node.attrs.r"
        ></circle>
        <line
          *ngIf="node.tag === 'line'"
          [attr.x1]="node.attrs.x1"
          [attr.y1]="node.attrs.y1"
          [attr.x2]="node.attrs.x2"
          [attr.y2]="node.attrs.y2"
        ></line>
        <polyline *ngIf="node.tag === 'polyline'" [attr.points]="node.attrs.points"></polyline>
      </ng-container>
    </svg>
  `,
  host: {
    class: 'inline-flex',
  },
})
export class IconComponent {
  @Input({ required: true }) name!: IconName;

  get nodes(): IconNode[] {
    return ICONS[this.name] ?? [];
  }
}
