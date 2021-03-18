import { Injectable } from '@angular/core';
import { Platform, AlertController } from '@ionic/angular';
import { BehaviorSubject, Observable, fromEvent } from 'rxjs';
import { debounceTime, map, startWith } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class StateService {
  currentPlatform: string;
  currentPlatform$: BehaviorSubject<string> = new BehaviorSubject(this.currentPlatform);
  screenSizeChanged$: Observable<any>;

  constructor(
    public platform: Platform,
    public alertController: AlertController
  ) {
    if (this.platform.is('iphone') || this.platform.is('android')) {
      this.currentPlatform = 'mobile';
      this.currentPlatform$.next(this.currentPlatform);
    } else if (this.platform.is('desktop') || this.platform.is('mobileweb')) {
      this.currentPlatform = 'desktop';
      this.currentPlatform$.next(this.currentPlatform);
    } else {
      this.presentAlert(this.platform.platforms().join(', '));
    }
  }

  async presentAlert(platforms: string) {
    const alert = await this.alertController.create({
      header: 'No Platform',
      message: platforms,
      buttons: ['OK']
    });

    await alert.present();
  }

  getCurrentPlatform() {
    return this.currentPlatform$.asObservable();
  }
}
