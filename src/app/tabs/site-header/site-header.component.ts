import { Component, OnInit, Input, EventEmitter, Output, ViewChild } from '@angular/core';
import { PopoverController, ModalController, IonSearchbar } from '@ionic/angular';
import { UserPopoverComponent } from 'src/app/common-components/user-popover/user-popover.component';
import { UserService } from 'src/app/services/user.service';
import { ConnectReqPopoverComponent } from './connect-req-popover/connect-req-popover.component';
import { SasGeneratorService } from 'src/app/services/blob_storage/sas-generator.service';
import { InDevelopmentPage } from 'src/app/pages/in-development/in-development.page';
import { Router } from '@angular/router';
import { SearchService } from 'src/app/services/search.service';
import { NotificationsService } from 'src/app/services/notifications.service';
import { NotificationsPopoverComponent } from './notifications-popover/notifications-popover.component';
import { MonitoringService } from 'src/app/services/monitoring/monitoring.service';
import { AuthService } from 'src/app/services/auth.service';


@Component({
  selector: 'app-site-header',
  templateUrl: './site-header.component.html',
  styleUrls: ['./site-header.component.scss'],
})
export class SiteHeaderComponent implements OnInit {
  @Output() searchEntered: EventEmitter<string> = new EventEmitter();

  @ViewChild(IonSearchbar) searchbar;

  @Input() page: string;
  @Input() savedState?: boolean;
  @Input() isEdit?: boolean;
  @Input() navBack: boolean;

  @Output() publish: EventEmitter<boolean> = new EventEmitter();

  private currentPlatform: string;
  public user: any;
  public notifications: any;
  public newNotifications: number;

  public sasToken: string;
  public profilePic = 'assets/blank_user.svg';
  public searchText: string;

  constructor(
    public popoverController: PopoverController,
    public modalController: ModalController,
    public router: Router,
    private userService: UserService,
    private sasGenerator: SasGeneratorService,
    private searchService: SearchService,
    private notificationsService: NotificationsService,
    private monitoringService: MonitoringService,
    private authService: AuthService,
  ) { }

  ngOnInit() {
    this.sasGenerator.getSasToken().subscribe(req => {
      this.sasToken = req.storageAccessToken;

    });

    this.userService.returnUser().subscribe(user => {
      if (user) {
        this.user = user;
        if (this.user.profilePic) {
          this.profilePic = this.user.profilePic + '?' + this.sasToken;
        }
      }
    });

    this.searchService.getSearchText().subscribe(text => {
      this.searchText = text;
    });

    this.notificationsService.returnNotifications().subscribe(not => {
      if (not) {
        this.notifications = not.notifications;
        this.newNotifications = 0;
        // count new notifications:
        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < this.notifications.length; i++) {
          if (this.notifications[i].ts > not.lastSeen) {
            this.newNotifications++;
          } else {
            break;
          }
        }
      }
    });
  }


  onPublish() {
    this.publish.emit(true);
  }

  async presentUserPopover() {
    this.monitoringService.logEvent('clicked-openUserPopover');
    const popover = await this.popoverController.create({
      component: UserPopoverComponent,
      cssClass: 'user-menu-popover'
    });
    return await popover.present();
  }

  public onConnectRequestsDesktop() {
    this.monitoringService.logEvent('clicked-desktop-openConnectRequests');
    this.presentConnectReqPopover();
  }

  public onConnectRequestsMobile() {
    this.monitoringService.logEvent('clicked-mobile-openConnectRequests');
    this.presentConnectReqModal();
  }

  async presentConnectReqPopover() {
    const popover = await this.popoverController.create({
      component: ConnectReqPopoverComponent,
      cssClass: 'connect-req-menu-popover',
      componentProps: {
        source: 'popover'
      }
    });
    return await popover.present();
  }

  async presentConnectReqModal() {
    const modal = await this.modalController.create({
      component: ConnectReqPopoverComponent,
      componentProps: {
        source: 'modal'
      }
    });
    return await modal.present();
  }

  async presentNotificationsPopover() {
    this.monitoringService.logEvent('clicked-desktop-notifications');
    const popover = await this.popoverController.create({
      component: NotificationsPopoverComponent,
      cssClass: 'notifications-menu-popover',
      componentProps: {
        source: 'popover',
        title: 'Notifications'
      }
    });
    return await popover.present();
  }

  async presentNotificationsModal() {
    this.monitoringService.logEvent('clicked-mobile-notifications');
    const modal = await this.modalController.create({
      component: NotificationsPopoverComponent,
      componentProps: {
        source: 'modal',
        title: 'Notifications'
      }
    });
    return await modal.present();
  }

  async presentMessagingPopover() {
    this.monitoringService.logEvent('clicked-header-messaging');
    const popover = await this.popoverController.create({
      component: InDevelopmentPage,
      cssClass: 'messaging-menu-popover',
      componentProps: {
        source: 'popover',
        title: 'Messages'
      }
    });
    return await popover.present();
  }

  public presentNotifications() {
    this.router.navigate(['/home/in-development-notifications']);
  }

  public searchTextChanged(ev) {
    this.searchText = ev.detail.value;
    this.searchService.setSearchText(this.searchText);
  }

  public onSearchPressed() {
    this.monitoringService.logEvent('submitted-search', { searchText: this.searchText });
    if (this.searchText && this.searchText !== '') {
      this.searchEntered.emit(this.searchText);
    }
  }

  public logIn() {
    this.authService.login();
  }

  public signUp() {
    this.authService.login();
  }

}
