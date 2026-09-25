import { Page } from '@playwright/test';
import {
  ignoredConsolePatterns,
  ignoredUrlPatterns,
  isIgnorableRequestAbort,
  matchesConfiguredPattern,
} from '../config/exclusions';

export type ConsoleIssue = { type: string; text: string; url?: string };
export type RequestIssue = { url: string; method: string; resourceType: string; failure?: string };
export type HttpIssue = { url: string; status: number; method: string; resourceType: string };

export type PageMonitor = {
  consoleErrors: ConsoleIssue[];
  pageErrors: string[];
  failedRequests: RequestIssue[];
  unexpectedResponses: HttpIssue[];
};

export function attachPageMonitoring(page: Page): PageMonitor {
  const monitor: PageMonitor = {
    consoleErrors: [],
    pageErrors: [],
    failedRequests: [],
    unexpectedResponses: [],
  };

  page.on('console', (message) => {
    if (message.type() !== 'error' || matchesConfiguredPattern(message.text(), ignoredConsolePatterns)) return;
    monitor.consoleErrors.push({ type: message.type(), text: message.text(), url: message.location().url });
  });

  page.on('pageerror', (error) => {
    if (!matchesConfiguredPattern(error.message, ignoredConsolePatterns)) monitor.pageErrors.push(error.message);
  });

  page.on('requestfailed', (request) => {
    const failure = request.failure()?.errorText;
    if (!matchesConfiguredPattern(request.url(), ignoredUrlPatterns)
      && !isIgnorableRequestAbort(request.resourceType(), request.url(), failure)) {
      monitor.failedRequests.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType(),
        failure,
      });
    }
  });

  page.on('response', (response) => {
    if (response.status() < 400 || matchesConfiguredPattern(response.url(), ignoredUrlPatterns)) return;
    monitor.unexpectedResponses.push({
      url: response.url(),
      status: response.status(),
      method: response.request().method(),
      resourceType: response.request().resourceType(),
    });
  });

  return monitor;
}

export function formatMonitor(monitor: PageMonitor): string {
  return JSON.stringify(monitor, null, 2);
}
