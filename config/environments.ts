import 'dotenv/config';

export type TargetEnvironment = 'staging' | 'production';
export type QaRole = 'tenant' | 'admin';

const targetEnv = (process.env.TARGET_ENV || 'staging') as TargetEnvironment;
if (!['staging', 'production'].includes(targetEnv)) {
  throw new Error(`TARGET_ENV must be staging or production, received ${targetEnv}`);
}

const baseUrl = targetEnv === 'production'
  ? process.env.MYCONDO_BASE_URL
  : process.env.MYCONDO_STAGING_URL;

if (!baseUrl) {
  throw new Error(`Missing URL for TARGET_ENV=${targetEnv}. Set MYCONDO_${targetEnv === 'production' ? 'BASE' : 'STAGING'}_URL.`);
}

const role = (process.env.QA_ROLE || 'tenant') as QaRole;
const email = role === 'admin' ? process.env.QA_ADMIN_EMAIL : process.env.QA_TENANT_EMAIL;
const password = role === 'admin' ? process.env.QA_ADMIN_PASSWORD : process.env.QA_TENANT_PASSWORD;

export const env = {
  targetEnv,
  baseUrl: baseUrl.replace(/\/$/, ''),
  role,
  email,
  password,
  expectedLanguage: (process.env.MYCONDO_EXPECTED_LANGUAGE || 'de').toLowerCase(),
  forbiddenEnglishTerms: process.env.MYCONDO_FORBIDDEN_ENGLISH_TERMS
    ? process.env.MYCONDO_FORBIDDEN_ENGLISH_TERMS.split(',').map((value) => value.trim()).filter(Boolean)
    : [],
  protectedCopy: process.env.MYCONDO_PROTECTED_COPY
    ? process.env.MYCONDO_PROTECTED_COPY.split('|').map((value) => value.trim()).filter(Boolean)
    : [],
  ignoredUrlPatterns: process.env.MYCONDO_IGNORED_URL_PATTERNS
    ? process.env.MYCONDO_IGNORED_URL_PATTERNS.split(',').map((value) => value.trim()).filter(Boolean)
    : [],
  ignoredConsolePatterns: process.env.MYCONDO_IGNORED_CONSOLE_PATTERNS
    ? process.env.MYCONDO_IGNORED_CONSOLE_PATTERNS.split(',').map((value) => value.trim()).filter(Boolean)
    : [],
};

export function requireCredentials(): { email: string; password: string } {
  if (!env.email || !env.password) {
    throw new Error(`Missing QA credentials for role ${env.role}. Set the corresponding QA_* variables.`);
  }
  return { email: env.email, password: env.password };
}

export function assertProductionReadOnly(action: string): void {
  if (env.targetEnv === 'production') {
    throw new Error(`Blocked unsafe action on production: ${action}`);
  }
}
