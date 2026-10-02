import { Routes } from '@angular/router';

export const PROJECT_ROUTES: Routes = [
  {
    path: '',
    title: 'Projects',
    loadComponent: () =>
      import('./pages/project-list/project-list-page').then((m) => m.ProjectListPage),
  },
  {
    path: 'new',
    title: 'New project',
    loadComponent: () =>
      import('./pages/project-form/project-form-page').then((m) => m.ProjectFormPage),
  },
  {
    path: ':id/edit',
    title: 'Edit project',
    loadComponent: () =>
      import('./pages/project-form/project-form-page').then((m) => m.ProjectFormPage),
  },
];
