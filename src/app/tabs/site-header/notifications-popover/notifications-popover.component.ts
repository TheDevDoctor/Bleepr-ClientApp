import { Component, OnInit, Input } from '@angular/core';
import { ModalController, PopoverController } from '@ionic/angular';
import { NotificationsService } from 'src/app/services/notifications.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-notifications-popover',
  templateUrl: './notifications-popover.component.html',
  styleUrls: ['./notifications-popover.component.scss'],
})
export class NotificationsPopoverComponent implements OnInit {
  @Input() source;

  notifications: any;
  lastSeen: any;

  constructor(
    private modalController: ModalController,
    private notificationsService: NotificationsService,
    public popoverController: PopoverController
  ) { }

  ngOnInit() {
    this.notificationsService.returnNotifications().subscribe(notifs => {
      if (notifs) {
        this.notifications = notifs.notifications;
        this.lastSeen = notifs.lastSeen;
      }
    });
  }

  onCloseModal() {
    this.notificationsService.updateLastSeen(Date.now());
    if (this.source === 'popover') {
      this.popoverController.dismiss();
    } else {
      this.modalController.dismiss();
    }
  }

  public onNotificationPressed(notification) {
    this.notificationsService.setCurrentNotification(notification);

    this.onCloseModal();
  }

}
