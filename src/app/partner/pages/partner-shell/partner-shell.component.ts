import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { PartnerAuthService } from '../../services/partner-auth.service';

@Component({
  selector: 'app-partner-shell',
  templateUrl: './partner-shell.component.html',
})
export class PartnerShellComponent {
  constructor(public auth: PartnerAuthService, private router: Router) {}

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/partner/login']);
  }
}
