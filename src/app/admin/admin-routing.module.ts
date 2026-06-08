import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { AdminLoginComponent } from './pages/admin-login/admin-login.component';
import { AdminShellComponent } from './pages/admin-shell/admin-shell.component';
import { AdminOverviewComponent } from './pages/admin-overview/admin-overview.component';
import { AdminLeadsComponent } from './pages/admin-leads/admin-leads.component';

const routes: Routes = [
  { path: 'login', component: AdminLoginComponent },
  {
    path: '',
    component: AdminShellComponent,
    canActivate: [AdminAuthGuard],
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      { path: 'overview', component: AdminOverviewComponent },
      { path: 'leads', component: AdminLeadsComponent },
    ],
  },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
