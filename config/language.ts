import { env } from './environments';

// These terms are observed in the current app or explicitly identified as regressions.
// Extend through MYCONDO_FORBIDDEN_ENGLISH_TERMS as approved wording is supplied.
export const defaultForbiddenEnglishTerms = [
  'Submit',
  'Cancel',
  'View Details',
  'Damage Report',
  'Meter Reading',
  'Overview',
  'All Drafts',
  'Bin',
  'Tenant Management',
  'Messages',
  'Damage Reports',
  'Documents',
  'Service Providers',
  'Settings',
  'Search',
  'Logout',
  'Languages',
  'Client Portal',
  'Sign in',
  'Welcome to',
  'The Future',
  'Choose Files',
  'New Announcements',
  'Announcements',
];

export const forbiddenEnglishTerms = [
  ...new Set([...defaultForbiddenEnglishTerms, ...env.forbiddenEnglishTerms]),
];

export const translationKeyPatterns = [
  /\b(?:common|dashboard|damage_report|meter_reading|auth|navigation|settings|tenant|message|document|service_provider)\.[a-z0-9_.-]+\b/gi,
  /\b[a-z]+(?:_[a-z]+)+\.[a-z0-9_.-]+\b/gi,
];

export const fallbackPatterns = [
  /\b(?:undefined|null|NaN|TODO|TBD|false)\b/gi,
  /\{\{[^}]+\}\}/g,
];

// German UI terms that must not leak into an English run.
export const germanUiTerms = [
  'Übersicht', 'Entwürfe', 'Papierkorb', 'Mieter', 'Posteingang', 'Gesendet',
  'Schäden', 'Dokumente', 'Dienstleister', 'Daten', 'Einstellungen', 'Konto',
  'Administrator', 'Passwort', 'Benachrichtigungen', 'Sprachen', 'Werkseinstellungen',
  'Über HausBuddy', 'Impressum', 'Datenschutz', 'Allgemeine Geschäftsbedingungen',
  'Abbrechen', 'Speichern', 'Löschen', 'Weiter', 'Zurück',
];
