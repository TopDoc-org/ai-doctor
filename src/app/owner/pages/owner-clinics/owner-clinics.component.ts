import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OwnerApiService } from '../../services/owner-api.service';
import { OwnerClinicRow } from '../../models';

@Component({
  selector: 'app-owner-clinics',
  templateUrl: './owner-clinics.component.html',
})
export class OwnerClinicsComponent implements OnInit {
  from = '';
  to = '';
  rows: OwnerClinicRow[] = [];
  loading = false;
  exporting = false;
  error = '';

  constructor(private api: OwnerApiService, private router: Router) {}

  ngOnInit(): void {
    const today = new Date();
    const past = new Date();
    past.setDate(today.getDate() - 30);
    this.to = this.fmt(today);
    this.from = this.fmt(past);
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.api.clinics({ from: this.from, to: this.to }).subscribe({
      next: (res) => {
        this.loading = false;
        this.rows = res.clinics || [];
      },
      error: () => {
        this.loading = false;
        this.error = 'Could not load clinics. Try again.';
      },
    });
  }

  convRate(r: { clicks: number; leads: number }): number {
    if (!r.clicks) return 0;
    return Math.round((r.leads / r.clicks) * 1000) / 10;
  }

  // Jump to the campaign explorer scoped to this clinic.
  viewCampaigns(c: OwnerClinicRow): void {
    this.router.navigate(['/owner/campaigns'], { queryParams: { clinicId: c.clinicId } });
  }

  exportCsv(): void {
    this.exporting = true;
    this.api.exportClinics({ from: this.from, to: this.to }).subscribe({
      next: (blob) => {
        this.exporting = false;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `clinics-${this.from}-to-${this.to}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.exporting = false;
        this.error = 'Export failed. Try again.';
      },
    });
  }

  private fmt(d: Date): string {
    return d.toISOString().slice(0, 10);
  }
}
