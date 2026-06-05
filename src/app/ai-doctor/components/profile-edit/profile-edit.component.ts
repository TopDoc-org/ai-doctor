import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { AiDoctorApiService } from '../../services/ai-doctor-api.service';
import { AiDoctorStateService } from '../../services/ai-doctor-state.service';

// Profile page: view + edit account details (name, gender). Mobile is the
// account identity and stays read-only. Loads current details via numCheck;
// saves via api.updateUser (backend endpoint assumed — see api service note).
@Component({
  selector: 'app-profile-edit',
  templateUrl: './profile-edit.component.html',
})
export class ProfileEditComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  name = '';
  gender = '';
  mobile = '';

  loading = true;
  saving = false;
  error = '';
  saved = false;

  constructor(
    public state: AiDoctorStateService,
    private api: AiDoctorApiService
  ) {}

  ngOnInit(): void {
    this.mobile = (this.state.userMobile || '').trim();
    this.name = this.state.userName || '';
    if (!this.mobile) {
      this.loading = false;
      return;
    }
    // Pull authoritative details (name/gender) for the number.
    this.api.numCheck(this.mobile).subscribe({
      next: (res) => {
        this.loading = false;
        const hit = res?.hits && res.hits > 0 ? res.results?.[0] : null;
        if (hit) {
          this.name = hit.name || this.name;
          this.gender = (hit.gender || '').toLowerCase();
        }
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  closePanel(): void {
    this.close.emit();
  }

  save(): void {
    const name = this.name.trim();
    if (!name) {
      this.error = 'Please enter your name.';
      return;
    }
    const userId = this.state.userId || '';
    if (!userId) {
      this.error = 'Could not find your account. Please log in again.';
      return;
    }
    const parts = name.split(/\s+/).filter(Boolean);
    const firstName = parts[0] || '';
    const lastName = parts.length > 1 ? parts.slice(1).join(' ') : firstName;

    this.error = '';
    this.saving = true;
    this.api
      .updateUser({
        userId,
        name,
        firstName,
        lastName,
        gender: this.gender || undefined,
        mobileNumber: this.mobile || undefined,
      })
      .subscribe({
        next: () => {
          this.saving = false;
          this.saved = true;
          this.state.userName = name;
          setTimeout(() => this.close.emit(), 1200);
        },
        error: (err) => {
          this.saving = false;
          this.error = err?.error?.message || 'Could not save your details. Please try again.';
        },
      });
  }
}
