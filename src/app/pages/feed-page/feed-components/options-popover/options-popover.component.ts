import { Component, OnInit, Input } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { BleepsService } from 'src/app/services/bleeps.service';
import { FeedService } from 'src/app/services/feed.service';
import { MonitoringService } from 'src/app/services/monitoring/monitoring.service';

@Component({
  selector: 'app-options-popover',
  templateUrl: './options-popover.component.html',
  styleUrls: ['./options-popover.component.scss'],
})
export class OptionsPopoverComponent implements OnInit {
  @Input() bleep: any;
  @Input() comment: any;
  @Input() ownContent: boolean;

  deletingBleep: boolean;

  constructor(
    private bleepsService: BleepsService,
    private popoverController: PopoverController,
    private feedsService: FeedService,
    private monitoringService: MonitoringService
  ) { }

  ngOnInit() {
    // Log the options popover click as an event
    if (this.bleep) {
      this.monitoringService.logEvent('clicked-bleepOptions', { bleepId: this.bleep.id });
    } else if (this.comment) {
      this.monitoringService.logEvent('clicked-commentOptions', { commentId: this.comment.id });
    }
  }

  deleteItem() {
    if (this.bleep) {
      // Log the interaction as an event
      this.monitoringService.logEvent('clicked-bleepOptions-delete');
      this.deleteBleep();
    } else if (this.comment) {
      this.monitoringService.logEvent('clicked-commentOptions-delete');
      this.deleteComment();
    }
  }

  editItem() {
    if (this.bleep) {
      this.editBleep();
    } else if (this.comment) {
      this.editComment();
    }
  }

  deleteBleep() {
    this.deletingBleep = true;

    this.bleepsService.deleteBleep(this.bleep).subscribe(res => {
      if (res.ok) {
        this.deletingBleep = false;
        this.popoverController.dismiss();
      }
    });
  }

  deleteComment() {
    this.deletingBleep = true;

    this.bleepsService.deleteComment(this.comment).subscribe(res => {
      if (res.ok) {
        this.deletingBleep = false;
        this.popoverController.dismiss({ action: 'delete', id: this.comment.id });
      }
    });
  }

  editBleep() {
    // this.bleepsService.editBleep(this.bleepId);
    this.popoverController.dismiss({ action: 'edit', id: this.bleep.id });
  }

  editComment() {
    this.popoverController.dismiss({ action: 'edit', id: this.comment.id });
  }

  public removeFromFeed() {
    this.feedsService.removeBleepFromFeed([this.bleep.id]);
    this.popoverController.dismiss();
  }

  public reportContent() {
    if (this.bleep) {
      this.monitoringService.logEvent('clicked-bleepOptions-reportBleep', { bleepId: this.bleep.id });
      this.bleepsService.reportBleep(this.bleep);
    } else if (this.comment) {
      this.monitoringService.logEvent('clicked-bleepOptions-reportComment', { commentId: this.comment.id });
      this.bleepsService.reportBleep(this.comment);
    }
    this.popoverController.dismiss();
  }
}
