import { Component, OnInit, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { Animation, AnimationController } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.page.html',
  styleUrls: ['./landing-page.page.scss'],
})
export class LandingPage {

  public platform: string;

  // Elements to animate
  @ViewChild('phone') phoneElement: ElementRef<HTMLDivElement>;
  @ViewChild('content') contentElement: ElementRef<HTMLDivElement>;

  constructor(
    private animationCtrl: AnimationController,
    private authService: AuthService,
    private router: Router
    ) {
      this.platform = Capacitor.getPlatform();
   }

  ionViewWillEnter() {
    // Set element opacity to 0 before view enters so content only
    // appears after entrance animation
    this.phoneElement.nativeElement.style.opacity = '0';
    this.contentElement.nativeElement.style.opacity = '0';
  }

  ionViewDidEnter() {
    // Animate the entrance of the elements
    const phoneEntranceAnimation = this.animationCtrl.create()
      .addElement(this.phoneElement.nativeElement)
      .delay(500)
      .duration(500)
      .fromTo('transform', 'translateY(100px)', 'translateY(0px)')
      .fromTo('opacity', '0', '1');
    const contentEntranceAnimation = this.animationCtrl.create()
      .addElement(this.contentElement.nativeElement)
      .delay(700)
      .duration(500)
      .fromTo('transform', 'translateX(-100px)', 'translateX(0px)')
      .fromTo('opacity', '0', '1');

    phoneEntranceAnimation.play();
    contentEntranceAnimation.play();
  }

  /**
   * Initiate the login process (including refresh token check)
   */
  public goToAuthentication() {
    // Set redirect to landing page param to false
    this.authService.login(false);
    this.router.navigate(['/auth']);
  }

}
