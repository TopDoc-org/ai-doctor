import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';

import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { ButtonModule } from 'primeng/button';

import { AiDoctorRoutingModule } from './ai-doctor-routing.module';
import { TriageShellComponent } from './pages/triage-shell/triage-shell.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { PinInputComponent } from './components/pin-input/pin-input.component';
import { AuthGateComponent } from './components/auth-gate/auth-gate.component';
import { ConsultHistoryComponent } from './components/consult-history/consult-history.component';
import { PinResetComponent } from './components/pin-reset/pin-reset.component';
import { ChangePinPanelComponent } from './components/change-pin-panel/change-pin-panel.component';

@NgModule({
  declarations: [
    TriageShellComponent,
    ProfileComponent,
    PinInputComponent,
    AuthGateComponent,
    ConsultHistoryComponent,
    PinResetComponent,
    ChangePinPanelComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AiDoctorRoutingModule,
    MatSidenavModule,
    MatListModule,
    InputTextModule,
    DropdownModule,
    CalendarModule,
    ButtonModule,
  ],
})
export class AiDoctorModule {}
