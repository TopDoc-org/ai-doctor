import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { PartnerAuthService } from '../services/partner-auth.service';

// Blocks the partner dashboard until a clinic admin is logged in.
@Injectable({ providedIn: 'root' })
export class PartnerAuthGuard implements CanActivate {
  constructor(private auth: PartnerAuthService, private router: Router) {}

  canActivate(): boolean | UrlTree {
    if (this.auth.isLoggedIn) return true;
    return this.router.createUrlTree(['/partner/login']);
  }
}
