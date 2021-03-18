import { Component, OnInit, Input } from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import { Router, ActivatedRoute } from '@angular/router';
import { BleepsService } from 'src/app/services/bleeps.service';
import { NotificationsService } from 'src/app/services/notifications.service';

@Component({
  selector: 'app-single-bleep-view',
  templateUrl: './single-bleep-view.page.html',
  styleUrls: ['./single-bleep-view.page.scss'],
})
export class SingleBleepViewPage implements OnInit {
  private nofitication;
  public commentId;
  public bleep;
  public bleepLikes;
  public bleepStats;

  public headerHidden: boolean;
  public userFragment: any;

  constructor(
    private userService: UserService,
    private bleepsService: BleepsService,
    private notificationsService: NotificationsService
  ) {
    this.userService.returnUser().subscribe(usr => {
      this.userFragment = usr.fragment;
    });
  }

  ngOnInit() {
    this.notificationsService.getCurrentNotification().subscribe(notification => {
      this.nofitication = notification;
      this.sortNotificationData(notification);
    });
  }

  sortNotificationData(notification) {
    this.bleepsService.getBleep(notification.contentId).subscribe(bleep => {
      this.bleep = bleep;
      this.getBleepMetadata(bleep.id);
    });
  }

  private getBleepMetadata(bleepId) {
    this.bleepsService.getBleepLikes(bleepId).subscribe(res => {
      this.bleepLikes = res.body;
    });

    this.bleepsService.getBleepStats(bleepId).subscribe(res => {
      this.bleepStats = res.body;
    });
  }

}
