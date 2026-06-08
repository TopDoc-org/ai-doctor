import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { OwnerAuthService } from '../../services/owner-auth.service';

@Component({
  selector: 'app-owner-shell',
  templateUrl: './owner-shell.component.html',
})
export class OwnerShellComponent {
  constructor(public auth: OwnerAuthService, private router: Router) {}

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/owner/login']);
  }
}
