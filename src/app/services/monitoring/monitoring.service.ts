import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Router, ResolveEnd, ActivatedRouteSnapshot } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Injectable({ providedIn: 'root' }) // Inject in root as singleton
/**
 * Monitoring service: for sending telemetry and logging to Application Insights
 */
export class MonitoringService {

  private routerSubscription: Subscription;
  private appInsights: ApplicationInsights;

  constructor(private router: Router) {
    this.appInsights = new ApplicationInsights({
      config: {
        // Change our intrumentation key per environment (internal, alpha, beta, prod)
        instrumentationKey: environment.monitoring.appInsights.instrumentationKey,
        autoTrackPageVisitTime: true,
        enableAjaxErrorStatusText: true
      }
    });
    this.appInsights.loadAppInsights();
    // Subscribe to router snapshots to track user's page views
    this.createRouterSubscription();
  }

  // App Insights internal setup methods ===================================================

  /**
   * Subscribe to the Angular Router so we can track page views and log to App Insights
   */
  private createRouterSubscription() {
    this.routerSubscription = this.router.events.pipe(filter(event => event instanceof ResolveEnd)).subscribe((event: ResolveEnd) => {
      const activatedComponent = this.getActivatedComponent(event.state.root);
      if (activatedComponent) {
        this.logPageView(`${activatedComponent.name} ${this.getRouteTemplate(event.state.root)}`, event.urlAfterRedirects);
      }
    });
  }

  /**
   * Get the route snapshot
   * @param snapshot the activated route snapshot from the router
   */
  private getActivatedComponent(snapshot: ActivatedRouteSnapshot): any {
    if (snapshot.firstChild) {
      return this.getActivatedComponent(snapshot.firstChild);
    }

    return snapshot.component;
  }

  /**
   * Get the routing path
   * @param snapshot the activated route snapshot
   */
  private getRouteTemplate(snapshot: ActivatedRouteSnapshot): string {
    let path = '';
    if (snapshot.routeConfig) {
      path += snapshot.routeConfig.path;
    }

    if (snapshot.firstChild) {
      return path + this.getRouteTemplate(snapshot.firstChild);
    }

    return path;
  }

  // App Insights public methods ===================================================================

  /**
   * Track the user's session by a userId
   * @param userId the current user's userId
   */
  public setUserId(userId: string) {
    this.appInsights.setAuthenticatedUserContext(userId);
  }

  /**
   * Clear the current user's session
   */
  public clearUserId() {
    this.appInsights.clearAuthenticatedUserContext();
  }

  /**
   * Log a page view for tracking the user's journey
   * @param name the page name
   * @param url URL of the page
   */
  public logPageView(name?: string, url?: string) { // option to call manually
    this.appInsights.trackPageView({
      name,
      uri: url
    });
  }

  /**
   * Log an event for tracking (i.e. notifications clicked, profile clicked)
   * @param name the event name
   * @param properties any properties to log along with the event
   */
  public logEvent(name: string, properties?: { [key: string]: any }) {
    this.appInsights.trackEvent({ name }, properties);
  }

  /**
   * Log a numeric value that is not associated with a specific event. Typically used to send regular reports of performance indicators.
   * To send a single measurement, just use the name and average fields of {@link IMetricTelemetry}.
   * @param name name of the metric to log (i.e. timeToLoadComments)
   * @param average average of the measurement to log (i.e. timeInSeconds)
   * @param properties custom properties of the metric
   */
  public logMetric(name: string, average: number, properties?: { [key: string]: any }) {
    this.appInsights.trackMetric({ name, average }, properties);
  }

  /**
   * Log an exception for tracing
   * @param exception the exception to log
   * @param severityLevel the severity of the exception (i.e. critical)
   */
  public logException(exception: Error, severityLevel?: number) {
    this.appInsights.trackException({ exception, severityLevel });
    console.error(exception);
  }

  /**
   * Log a trace for diagnostics traceability
   * @param message the diagnostics message
   * @param properties custom properties to include in the log
   */
  public logTrace(message: string, properties?: { [key: string]: any }) {
    this.appInsights.trackTrace({ message }, properties);
  }
}
