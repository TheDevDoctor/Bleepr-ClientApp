import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { SasGeneratorService } from 'src/app/services/blob_storage/sas-generator.service';
import { AppBlobService } from 'src/app/services/blob_storage/app-blob-service.service';
import { environment } from 'src/environments/environment';
import { UserService } from 'src/app/services/user.service';
import { UsersService } from 'src/app/services/users.service';
import { Router, NavigationExtras } from '@angular/router';
import { NotificationsService } from 'src/app/services/notifications.service';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss'],
})
export class NotificationComponent implements OnInit {
  @Output() notificationPressed: EventEmitter<any> = new EventEmitter();

  @Input() notification: any;
  @Input() notSeen: boolean;

  public profilePic = 'assets/blank_user.svg';
  public name: string;

  constructor(
    private sasGenerator: SasGeneratorService,
    private appBlobService: AppBlobService,
    private usersService: UsersService,
  ) { }

  ngOnInit() {
    this.usersService.getUserFragment(this.notification.userId).subscribe(fragment => {
      fragment = fragment.body;
      this.name = fragment.firstname + ' ' + fragment.surname;
    });

    this.sasGenerator.getSasToken().subscribe(req => {
      this.appBlobService.checkBlobExists(this.notification.userId, 'profile-pictures').subscribe(exists => {
        if (exists) {
          // tslint:disable-next-line:max-line-length
          this.profilePic = environment.blobStorage.storageUri + 'profile-pictures/' + this.notification.userId + '?' + req.storageAccessToken;
        }
      });
    });
  }

  public onNotificationPressed() {
    this.notificationPressed.emit(this.notification);
  }
}
