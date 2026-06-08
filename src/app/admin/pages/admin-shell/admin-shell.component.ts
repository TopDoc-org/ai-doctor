import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AdminAuthService } from '../../services/admin-auth.service';

@Component({
  selector: 'app-admin-shell',
  templateUrl: './admin-shell.component.html',
})
export class AdminShellComponent {
  constructor(public auth: AdminAuthService, private router: Router) {}

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/admin/login']);
  }
}
