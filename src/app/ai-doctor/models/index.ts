export type Role = 'user' | 'assistant';

export interface ChatMessage {
  role: Role;
  text: string;
  intent?: string;
}

export interface PossibleCause {
  cause: string;
  likelihood?: string;
  note?: string;
}

export interface Soap {
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
}

export interface PlanItem {
  name: string;
  why?: string;
}

export interface CarePlan {
  labs?: PlanItem[];
  imaging?: PlanItem[];
  management?: string[];
  referral?: string;
  whenToSeekUrgent?: string;
}

export interface Report {
  summary: string;
  assessmentIntro?: string;
  possibleCauses: PossibleCause[];
  plan?: CarePlan;
  soap: Soap;
  suggestedSpecialty: string;
  disclaimer?: string;
  generatedAt?: string;
}

export interface Doctor {
  name: string;
  rating?: number | null;
  userRatingsTotal?: number | null;
  address?: string;
  phone?: string | null;
  website?: string | null;
  category?: string | null;
  hours?: string | null;
  openNow?: boolean | null;
  placeId?: string;
  mapsUrl?: string;
}

// Backend /message response (discriminated by `type`).
export interface MessageResponse {
  intent: string;
  type:
    | 'question'
    | 'report'
    | 'emergency'
    | 'refusal'
    | 'medicine_info'
    | 'general_health'
    | 'out_of_scope'
    | 'find_doctor';
  message?: string;
  question?: string;
  report?: Report;
  emergencyNumbers?: { all: string; ambulance: string };
  sources?: any[];
  suggestedSpecialty?: string | null;
  needsLocation?: boolean;
  nextAction?: string;
  askedCount?: number;
  progress?: number;
  stepsLeft?: number;
  disclaimer?: string;
}

export interface DoctorsResponse {
  doctors: Doctor[];
  needsLocation?: boolean;
  cached?: boolean;
  specialty?: string;
  error?: string;
  disclaimer?: string;
}

export interface GeoLocation {
  lat: number | null;
  lng: number | null;
  city: string | null;
  district?: string | null;
  state?: string | null;
}
