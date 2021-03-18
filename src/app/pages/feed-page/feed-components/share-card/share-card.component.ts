import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { DatabaseService } from 'src/app/services/database.service';
import { AnalyticsService } from 'src/app/services/analytics.service';

@Component({
  selector: 'app-share-card',
  templateUrl: './share-card.component.html',
  styleUrls: ['./share-card.component.scss'],
})
export class ShareCardComponent implements OnChanges {
  @Input() bleep: any;
  @Input() userFragment: any;

  sharedBleep: any;

  constructor(
    private databaseService: DatabaseService,
    private analyticsService: AnalyticsService) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    // get the shared bleep from its bleep Id.
    this.databaseService.getPost(this.bleep.id).subscribe(bleep => this.sharedBleep = bleep);
  }

  public onIntersection(ev) {
    if (ev.visible) {
      this.analyticsService.sendEvent('bleep_view', this.userFragment.id, this.bleep.id);
    }
  }
}
