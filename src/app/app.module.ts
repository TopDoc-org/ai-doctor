import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { SessionExpiryInterceptor } from './shared/session-expiry.interceptor';

import { CarouselModule } from 'primeng/carousel';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LandingComponent } from './landing/landing.component';
import { LegalLayoutComponent } from './legal/legal-layout.component';
import { PrivacyComponent } from './legal/privacy.component';
import { TermsComponent } from './legal/terms.component';
import { DisclaimerComponent } from './legal/disclaimer.component';
import { TypingAnimationComponent } from './shared/typing-animation/typing-animation.component';

@NgModule({
  declarations: [
    AppComponent,
    LandingComponent,
    LegalLayoutComponent,
    PrivacyComponent,
    TermsComponent,
    DisclaimerComponent,
    TypingAnimationComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    AppRoutingModule,
    CarouselModule,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: SessionExpiryInterceptor, multi: true },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
