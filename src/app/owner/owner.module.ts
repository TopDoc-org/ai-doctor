import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { OwnerRoutingModule } from './owner-routing.module';
import { OwnerLoginComponent } from './pages/owner-login/owner-login.component';
import { OwnerShellComponent } from './pages/owner-shell/owner-shell.component';
import { OwnerHomeComponent } from './pages/owner-home/owner-home.component';
import { OwnerCampaignsComponent } from './pages/owner-campaigns/owner-campaigns.component';
import { OwnerClinicsComponent } from './pages/owner-clinics/owner-clinics.component';

@NgModule({
  declarations: [
    OwnerLoginComponent,
    OwnerShellComponent,
    OwnerHomeComponent,
    OwnerCampaignsComponent,
    OwnerClinicsComponent,
  ],
  imports: [CommonModule, FormsModule, OwnerRoutingModule],
})
export class OwnerModule {}
