import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { AnalyticEvent } from '../models/analytics-models';
import { read } from 'fs';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private events = {
    bleep_view: new Map<string, boolean>(),
    article_view: new Map<string, boolean>(),
    profile_view: new Map<string, boolean>(),
    article_read_time: new Map<string, boolean>(),
  };

  constructor(private databaseService: DatabaseService) { }

  /**
   * Send an event to the the events collection in cosmos db.
   * @param eventType type of event to send.
   * @param userId the userId the event is related to.
   * @param resourceId the resource id the event is related to.
   */
  public sendEvent(eventType: string, userId: string, resourceId: string, readTime?: number) {
    // ensure event has not already been sent
    if (this.events[eventType].has(resourceId)) { return; }

    // create the event
    const event = new AnalyticEvent(resourceId, userId, eventType);

    if (readTime) {
      event.readTime = readTime;
    }

    // send event to database
    this.events[eventType].set(resourceId, true);
    this.databaseService.createIfNotExists(event, 'events', resourceId).subscribe(res => {
      // if unsuccessful remove from events as it has technically not happened.
      if (!res.ok) {
        this.events[eventType].delete(resourceId);
      }
    });

  }
}
