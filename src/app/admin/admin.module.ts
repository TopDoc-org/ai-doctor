import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AdminRoutingModule } from './admin-routing.module';
import { AdminLoginComponent } from './pages/admin-login/admin-login.component';
import { AdminShellComponent } from './pages/admin-shell/admin-shell.component';
import { AdminOverviewComponent } from './pages/admin-overview/admin-overview.component';
import { AdminLeadsComponent } from './pages/admin-leads/admin-leads.component';

@NgModule({
  declarations: [
    AdminLoginComponent,
    AdminShellComponent,
    AdminOverviewComponent,
    AdminLeadsComponent,
  ],
  imports: [CommonModule, FormsModule, AdminRoutingModule],
})
export class AdminModule {}
