import { Component, OnInit, ViewChild } from '@angular/core';
import { StateService } from '../../services/state.service';
import { FeedService } from '../../services/feed.service';
import { environment } from 'src/environments/environment';
import { UserService } from 'src/app/services/user.service';
import { ModalController, IonInfiniteScroll } from '@ionic/angular';
import { Plugins } from '@capacitor/core';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { UsersService } from 'src/app/services/users.service';
import { HelperService } from 'src/app/services/helper.service';
import { SasGeneratorService } from 'src/app/services/blob_storage/sas-generator.service';
import { AboutEditPage } from 'src/app/modals/about-edit/about-edit.page';
import { UserMediaModalPage } from 'src/app/modals/user-media-modal/user-media-modal.page';
import { AppBlobService } from 'src/app/services/blob_storage/app-blob-service.service';
import { InfoEditPage } from 'src/app/modals/info-edit/info-edit.page';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MonitoringService } from 'src/app/services/monitoring/monitoring.service';
import { AnalyticsService } from 'src/app/services/analytics.service';

const { Camera } = Plugins;

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
  @ViewChild(IonInfiniteScroll) infiniteScroll: IonInfiniteScroll;

  // profile variables
  public profileId: string;
  public fragment: any;
  public profile: any;
  public editable: boolean;

  public bleeps: any[];
  public bleepStats: {};
  public bleepLikes: {};
  public isInfiniteScroll = true;

  // platform variables
  public currentPlatform: string;
  public user: any;
  public baseUri: string;
  public sasToken: string;
  public position: string;
  public isConnection = false;
  public isConnectRequest = false;
  public isConnectPending = false;
  public smallScreen: boolean;
  public headerHidden: boolean;
  private continuationToken: string;
  public connectionStatus: string;

  public profilePic = 'assets/blank_user.svg';

  constructor(
    private stateService: StateService,
    private feedService: FeedService,
    private userService: UserService,
    private usersService: UsersService,
    public route: ActivatedRoute,
    public helper: HelperService,
    public sasGenerator: SasGeneratorService,
    private modalController: ModalController,
    private appBlobService: AppBlobService,
    private observer: BreakpointObserver,
    private router: Router,
    private monitoringService: MonitoringService,
    private analyticsService: AnalyticsService
  ) {
    this.stateService.getCurrentPlatform().subscribe(plat => this.currentPlatform = plat);
    this.baseUri = environment.blobStorage.storageUri;
  }

  ngOnInit() {
    this.observer.observe('(max-width: 540px)').subscribe(result => {
      this.smallScreen = result.matches;

      // if changes screen size need to enforce showing of header:
      if (this.smallScreen === false) {
        this.headerHidden = false;
      }
    });

    // get profile ID from route params:
    this.profileId = this.route.snapshot.params.id;

    this.sasGenerator.getSasToken().subscribe(req => {
      this.sasToken = req.storageAccessToken;
    });

    this.userService.returnUser().subscribe(user => {
      this.user = user;
      if (user.fragment.userId === this.profileId) {
        // if self user get own account and set editability to true:
        this.fragment = user.fragment;
        this.profile = user.profile;
        this.editable = true;
        this.getBleeps(this.fragment.userId);
        if (this.user.profilePic) {
          this.profilePic = this.user.profilePic + '?' + this.sasToken;
        }
        this.setUserPosition(this.fragment);


      } else {
        // if other user get fragment and profile file and set editability to false:
        this.usersService.getUserFragment(this.profileId).subscribe(res => {
          this.fragment = res.body;
          this.getBleeps(this.fragment.userId);
          this.setUserPosition(this.fragment);
          this.connectionStatus = this.userService.checkConnectionStatus(this.fragment.userId);
        });
        this.usersService.getUserProfile(this.profileId).subscribe(res => this.profile = res.body);
        this.editable = false;

        this.appBlobService.checkBlobExists(this.profileId, 'profile-pictures').subscribe(exists => {
          if (exists) {
            this.profilePic = environment.blobStorage.storageUri + 'profile-pictures/' + this.profileId + '?' + this.sasToken;
          }
        });
      }
    });
  }

  ionViewDidEnter() {
    // send view event for timer;
    if (this.user.fragment.userId !== this.profileId) {
      this.analyticsService.sendEvent('profile_view', this.user.fragment.userId, this.profileId);
    }
  }

  ionViewDidLeave() {
    this.continuationToken = undefined;
  }

  setUserPosition(fragment) {
    if (this.fragment.specialty && this.fragment.grade) {
      this.position = this.fragment.specialty + ' ' + this.fragment.grade;
    } else {
      this.position = this.fragment.profession;
    }
  }

  /**
   * Get bleeps for specific user, gets 5 bleeps at a time.
   * @param id string: this is the id of the user to get the bleeps for
   * and continuationToken (string). If this is the first call then set the continuationToken to null.
   */
  getBleeps(id) {
    if (this.continuationToken !== null) {
      this.userService.getBleeps(id, 5, this.continuationToken).subscribe(p => {
        if (p.ok) {
          if (p.body._count > 0) {
            this.getBleepMetadata(p.body.Documents);

            if (!this.bleeps) {
              this.bleeps = [];
            }

            this.bleeps = this.bleeps.concat(p.body.Documents);
            this.continuationToken = p.headers.get('x-ms-continuation');
            if (this.continuationToken === null) {
              this.isInfiniteScroll = false;
            }
          } else {
            this.bleeps = [];
            this.isInfiniteScroll = false;
          }

          this.infiniteScroll.complete();
        }
      });
    }

  }

  getBleepMetadata(bleeps) {
    this.feedService.fetchBleepsLikesData(bleeps).subscribe(data => {
      const databaseLikes = this.helper.convertArrayToDict(data.body.Documents);
      this.bleepLikes = { ...this.bleepLikes, ...databaseLikes };
    });
    this.feedService.fetchBleepStatsData(bleeps).subscribe(data => {
      const databaseStats = this.helper.convertArrayToDict(data.body.Documents);
      this.bleepStats = { ...this.bleepStats, ...databaseStats };
    });
  }

  // Profile Pic Functions:
  getPhoto() {
    this.presentMediaModal('image');
  }

  async presentMediaModal(type) {
    const modal = await this.modalController.create({
      component: UserMediaModalPage,
      componentProps: {
        fileType: type
      }
    });
    modal.onDidDismiss()
      .then((data) => {
        if (data.data) {
          const mediaData = data.data;

          if (mediaData.type === 'image') {
            this.userService.setProfilePic(mediaData.guid, mediaData.uri);
          }
        }
      });
    return await modal.present();
  }

  userUpdated(ev) {
    this.userService.updateUserProfile(this.profile).subscribe();
  }

  async presentEditModal() {
    const modal = await this.modalController.create({
      component: AboutEditPage
    });
    return await modal.present();
  }

  async presentInfoEditModal() {
    const modal = await this.modalController.create({
      component: InfoEditPage
    });
    return await modal.present();
  }

  public onRequestConnection() {
    this.monitoringService.logEvent('clicked-requestConnection', { userId: this.fragment.userId });
    this.userService.sendConnectRequest(this.fragment.userId).subscribe(res => {
      if (!res.ok) {
        // Add UI to display error to user
        this.monitoringService.logException(new Error(`Error sending connection request to ${this.fragment.userId}`));
      }
    });
    this.isConnectPending = true;
  }

  public onAcceptConnection() {
    this.monitoringService.logEvent('clicked-acceptConnection', { userId: this.fragment.userId });
    this.userService.acceptConnectionRequest(this.fragment.userId).subscribe(res => {
      if (res.ok) {
        this.isConnection = true;
        this.isConnectRequest = false;
      } else {
        // Add UI to display error to user
        this.monitoringService.logException(new Error(`Error accepting connection request for ${this.fragment.userId}`));
      }
    });
  }

  public onDeclineConnection() {
    this.monitoringService.logEvent('clicked-declineConnection', { userId: this.fragment.userId });
    this.userService.declineConnectionRequest(this.fragment.userId);
    this.isConnectRequest = false;
  }

  public onScroll(event) {
    // used a couple of "guards" to prevent unnecessary assignments if scrolling in a direction and the var is set already:
    if (event.detail.deltaY > 0 && this.headerHidden) { return; }
    if (event.detail.deltaY < 0 && !this.headerHidden) { return; }
    if (event.detail.deltaY > 0) {
      this.headerHidden = true;
    } else {
      this.headerHidden = false;
    }
  }

  loadData(event) {
    this.getBleeps(this.profileId);
  }

  onHeaderSearch(ev) {
    const searchText = ev;

    if (searchText) {
      const navigationExtras: NavigationExtras = { state: { search: searchText } };
      this.router.navigate(['/home/search'], navigationExtras);
    }
  }
}
