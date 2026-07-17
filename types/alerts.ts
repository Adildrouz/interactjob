export type AlertType = "offres" | "concours" | "remote";
export type AlertLanguage = "fr" | "ar" | "en";
export type AlertStatus = "active" | "unsubscribed" | "bounced";
export type AlertEmailStatus = "sent" | "failed" | "bounced";

export interface AlertFilters {
  secteur?: string;
  ville?: string;
  niveau?: string;
  keywords?: string[];
}

export interface AlertSubscriber {
  _id?: string;
  email: string;
  alert_type: AlertType;
  filters: AlertFilters;
  language: AlertLanguage;
  status: AlertStatus;
  confirmed: boolean;
  confirm_token?: string | null;
  source_page: string;
  created_at: Date | string;
  confirmed_at?: Date | string | null;
  unsubscribed_at?: Date | string | null;
  last_email_sent_at?: Date | string | null;
  emails_sent_count: number;
  last_opened_at?: Date | string | null;
}

export type AlertEmailType = "confirmation" | "reconfirmation" | "digest";

export interface AlertEmailLog {
  _id?: string;
  run_id?: string | null;
  subscriber_id: string | null;
  email?: string;
  alert_type: AlertType;
  email_type?: AlertEmailType;
  offers_included: string[];
  sent_at: Date | string;
  status: AlertEmailStatus;
  error_reason?: string | null;
}
