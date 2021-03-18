import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import { AuthService } from 'src/app/services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription, Subject } from 'rxjs';

import { AnimationController } from '@ionic/angular';
import { MonitoringService } from 'src/app/services/monitoring/monitoring.service';
import { takeUntil } from 'rxjs/operators';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-loading-page',
  templateUrl: './loading-page.page.html',
  styleUrls: ['./loading-page.page.scss'],
})
export class LoadingPage implements OnInit {
  @ViewChild('bleeprB') bleeprB: ElementRef<HTMLImageElement>;
  @ViewChild('bleeprInner') bleeprInner: ElementRef<HTMLImageElement>;
  @ViewChild('bleeprMiddle') bleeprMiddle: ElementRef<HTMLImageElement>;
  @ViewChild('bleeprOuter') bleeprOuter: ElementRef<HTMLImageElement>;

  // user: any;
  newUserInfo: any;
  subscription: Subscription;
  isUser$: Subject<boolean> = new Subject<boolean>();
  returnUrl: string;
  dontRoute = false;
  private token$: Subject<string> = new Subject<string>();

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private animationCtrl: AnimationController,
    private monitoringService: MonitoringService
  ) { }

  ngOnInit() {
    // if reroute is from a new user will detect info and create user:
    this.route.queryParams.subscribe(params => {

      // if new user info provided create new user (will only be true when route is from sign up page):
      if (this.router.getCurrentNavigation().extras.state) {
        if (this.router.getCurrentNavigation().extras.state.user) {
          this.newUserInfo = this.router.getCurrentNavigation().extras.state.user;
          this.createNewUser(this.newUserInfo);
        }
      }

      // if return url in params set the url to return to:
      if (params.returnUrl) {
        this.returnUrl = params.returnUrl;

      // if router is auth link then this is returned from the sign in process. Extract the params and sort the auth response.
      // Only needed if web login. Native is all handled by plugin.
      } else if (Capacitor.getPlatform() === 'web' && this.router.url.split('?')[0] === '/auth') {
        this.authService.sortAuthResponse(params);
      }
    });
  }

  ionViewDidEnter() {
    const innerAnimation = this.animationCtrl.create()
      .addElement(this.bleeprInner.nativeElement)
      .duration(2000)
      .iterations(Infinity)
      .keyframes([
        { offset: 0, transform: 'rotate(0)' },
        { offset: 0.35, transform: 'rotate(160deg)' },
        { offset: 0.6, transform: 'rotate(220deg)' },
        { offset: 1, transform: 'rotate(360deg)' }
      ]);
    innerAnimation.play();

    const middleAnimation = this.animationCtrl.create()
      .addElement(this.bleeprMiddle.nativeElement)
      .duration(2500)
      .iterations(Infinity)
      .keyframes([
        { offset: 0, transform: 'rotate(0)' },
        { offset: 0.6, transform: 'rotate(-170deg)' },
        { offset: 0.8, transform: 'rotate(-220deg)' },
        { offset: 1, transform: 'rotate(-360deg)' }
      ]);
    middleAnimation.play();

    const outerAnimation = this.animationCtrl.create()
      .addElement(this.bleeprOuter.nativeElement)
      .duration(1500)
      .iterations(Infinity)
      .keyframes([
        { offset: 0, transform: 'rotate(0)' },
        { offset: 0.4, transform: 'rotate(170deg)' },
        { offset: 0.6, transform: 'rotate(220deg)' },
        { offset: 1, transform: 'rotate(360deg)' }
      ]);
    outerAnimation.play();
  }

  ionViewWillEnter() {
    // Trigger take user
    this.isUser$.next(false);
    // check that token is present, if not then user should be logged in, will automatically unsubscribe once token is present:
    this.authService.token.pipe(takeUntil(this.token$)).subscribe(token => {
      if (token) {
        this.userService.returnUser().pipe(
          takeUntil(this.isUser$)
        ).subscribe(user => {
          this.checkUserStatus(user);
        });
        this.token$.next(token);

      // if the current router uri is auth then should not attempt to log in again.
      } else if (this.router.url.split('?')[0] !== '/auth') {
        this.authService.login();
      } else {
        this.monitoringService.logException(new Error('Authentication failed.'), 1);
      }
    });
  }

  /**
   * Check if the user is new, if so route to sign-up
   * @param userDoc the user's user doc
   */
  async checkUserStatus(userDoc) {
    if (userDoc === null) {
      if (!this.newUserInfo) {
        this.router.navigate(['/sign-up']);
      }
    } else if (userDoc !== undefined) {
      this.isUser$.next(true);
      console.log(this.returnUrl);
      this.router.navigate([this.returnUrl ? this.returnUrl : '/home/feed'], { replaceUrl: true });
    }
  }

  private createNewUser(newUserInfo) {

    const userDoc = {
      id: this.authService.user.oid,
      email: this.authService.user.primaryEmail,
      firstname: this.authService.user.firstname,
      surname: this.authService.user.surname,
      profession: newUserInfo.profession,
      grade: newUserInfo.grade,
      specialty: newUserInfo.specialty,
      primary_hospital: newUserInfo.hospital,
      primary_location: newUserInfo.location
    };

    const mailChimpDoc = {
      'first-name': this.authService.user.firstname,
      'last-name': this.authService.user.surname,
      email: this.authService.user.primaryEmail,
      country: '',
      profession: newUserInfo.profession,
      specialty: newUserInfo.specialty,
      grade: newUserInfo.grade
    };

    this.userService.createNewUser(userDoc, mailChimpDoc);
  }
}
