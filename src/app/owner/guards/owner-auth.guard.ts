import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { OwnerAuthService } from '../services/owner-auth.service';

// Blocks the creator console until an owner is logged in.
@Injectable({ providedIn: 'root' })
export class OwnerAuthGuard implements CanActivate {
  constructor(private auth: OwnerAuthService, private router: Router) {}

  canActivate(): boolean | UrlTree {
    if (this.auth.isLoggedIn) return true;
    return this.router.createUrlTree(['/owner/login']);
  }
}
