import { PartnerOfferRecord } from '../models';

// Ready-made offers a clinic can start from. Shared by the Offers page (prefill
// the form) and the Overview "Active offers" picker (create + attach on check).
export const OFFER_TEMPLATES: PartnerOfferRecord[] = [
  { title: 'First Consultation Offer', discountText: 'Flat ₹200 off your first visit', specialty: '', description: 'A warm welcome for new patients booking their first consultation.', active: true },
  { title: 'Free Follow-up Visit', discountText: 'Free follow-up within 7 days', specialty: '', description: 'One complimentary follow-up within a week of the first consult.', active: true },
  { title: 'Full Body Health Checkup', discountText: '25% off the complete package', specialty: 'General Physician', description: 'Comprehensive preventive health screening at a special price.', active: true },
  { title: 'Senior Citizen Care', discountText: '15% off all consultations', specialty: '', description: 'Dedicated discount for patients aged 60 and above.', active: true },
  { title: 'Diabetes & BP Screening Combo', discountText: 'Combo screening at ₹499', specialty: 'General Physician', description: 'Blood sugar + blood pressure assessment with doctor review.', active: true },
  { title: 'Skin & Hair Consultation', discountText: '20% off your first visit', specialty: 'Dermatologist', description: 'Expert skin and hair assessment for new patients.', active: true },
  { title: 'Heart Health Check + ECG', discountText: 'Heart check with ECG at ₹999', specialty: 'Cardiologist', description: 'Cardiac risk assessment including ECG and consultation.', active: true },
  { title: 'Child Wellness & Vaccination', discountText: 'Free consult with any vaccination', specialty: 'Pediatrician', description: 'Routine child wellness visit and vaccination guidance.', active: true },
];
