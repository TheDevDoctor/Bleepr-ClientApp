import { Component, NgZone } from '@angular/core';
import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { AuthService } from './services/auth.service';
import { MonitoringService } from './services/monitoring/monitoring.service';
import { SignalRService } from './services/signal-r.service';
import { Router } from '@angular/router';
import { Plugins } from '@capacitor/core';
const { App } = Plugins;

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent {

  constructor(
    private authService: AuthService,
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private monitoringService: MonitoringService,
    private signalR: SignalRService,
    private router: Router,
    private zone: NgZone
  ) {
    this.initializeApp();
  }

  private initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();
    });

    // Deep link detection:
    App.addListener('appUrlOpen', (data: any) => {
      this.zone.run(() => {
          console.log(data);
          // Example url: https://beerswift.app/tabs/tab2
          // slug = /tabs/tab2
          let slug: string;
          if (data.url.indexOf('.io') > -1) {
            slug = data.url.split('.io').pop();
          } else if (data.url.indexOf('.net') > -1) {
            slug = data.url.split('.net').pop();
          }

          console.log(data);

          // if there is a slug then navigate:
          if (slug) {
              this.router.navigateByUrl(slug);
          }
          // If no match, do nothing - let regular routing
          // logic take over
      });
  });
  }

}
