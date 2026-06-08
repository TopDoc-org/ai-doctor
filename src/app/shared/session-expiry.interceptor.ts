import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { PartnerAuthService } from '../partner/services/partner-auth.service';
import { AdminAuthService } from '../admin/services/admin-auth.service';
import { OwnerAuthService } from '../owner/services/owner-auth.service';

// Catches expired/invalid Bearer tokens on the partner & admin consoles. When a
// dashboard request returns 401 (token TTL elapsed — partner guards only check
// token presence, not expiry), we clear the stale session and bounce to the
// matching login with `?expired=1`, which renders a "session timed out" banner.
// Login/signup 401s (wrong credentials) are left to the forms to message.
@Injectable()
export class SessionExpiryInterceptor implements HttpInterceptor {
  constructor(
    private router: Router,
    private partnerAuth: PartnerAuthService,
    private adminAuth: AdminAuthService,
    private ownerAuth: OwnerAuthService
  ) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((err: unknown) => {
        if (err instanceof HttpErrorResponse && err.status === 401) {
          const url = req.url || '';
          const isAuthAttempt = /\/login\b|\/signup\b|pwdLogin/i.test(url);
          if (!isAuthAttempt) {
            if (/\/owner\//.test(url)) {
              this.ownerAuth.logout();
              this.router.navigate(['/owner/login'], { queryParams: { expired: 1 } });
            } else if (/\/partner\//.test(url)) {
              this.partnerAuth.logout();
              this.router.navigate(['/partner/login'], { queryParams: { expired: 1 } });
            } else if (/\/admin\//.test(url)) {
              this.adminAuth.logout();
              this.router.navigate(['/admin/login'], { queryParams: { expired: 1 } });
            }
          }
        }
        return throwError(() => err);
      })
    );
  }
}
