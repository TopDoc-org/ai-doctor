import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TriageShellComponent } from './pages/triage-shell/triage-shell.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { ChangePinPanelComponent } from './components/change-pin-panel/change-pin-panel.component';

const routes: Routes = [
  { path: '', component: TriageShellComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'change-pin', component: ChangePinPanelComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AiDoctorRoutingModule {}
