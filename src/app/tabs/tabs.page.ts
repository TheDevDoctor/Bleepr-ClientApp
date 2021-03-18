import { Component, ViewChild, ElementRef, OnInit, AfterViewInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { BleepModalPage } from '../pages/new-bleep-modal/post.page';
import { ActionSheetController } from '@ionic/angular';
import { Platform } from '@ionic/angular';
import { StateService } from '../services/state.service';
import { CrossrefService } from '../services/crossref.service';
import { UserService } from '../services/user.service';
import { Router } from '@angular/router';
import { MonitoringService } from '../services/monitoring/monitoring.service';


@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss']
})
export class TabsPage {

  public currentPlatform: string;
  public currentTab: string;
  public userId: string;

  constructor(
    public modalController: ModalController,
    public actionSheetController: ActionSheetController,
    private stateService: StateService,
    private router: Router,
    private userService: UserService,
    private monitoringService: MonitoringService
    ) {
    this.stateService.getCurrentPlatform().subscribe(plat => this.currentPlatform = plat);
    this.userService.returnUser().subscribe(usr => {
      this.userId = usr.fragment.userId;
      this.monitoringService.setUserId(this.userId);
    });
  }

  async presentModal(type: number) {
    const components = [BleepModalPage, BleepModalPage];
    const modal = await this.modalController.create({
      component: components[type]
    });
    return await modal.present();
  }

  async presentActionSheet() {
    // Log the interaction as an event
    this.monitoringService.logEvent('clicked-bleepButton');
    // Create the action sheet display
    const actionSheet = await this.actionSheetController.create({
      buttons: [{
        text: 'New Bleep',
        handler: () => {
          // Log the interaction as an event
          this.monitoringService.logEvent('clicked-bleepButton-newBleep');
          this.presentModal(0);
        }
      }, {
        text: 'New Article',
        handler: () => {
          // Log the interaction as an event
          this.monitoringService.logEvent('clicked-bleepButton-newArticle');
          this.goToArticle();
        }
      }, {
        text: 'Cancel',
        role: 'cancel',
        handler: () => {
          // Log the interaction as an event
          this.monitoringService.logEvent('clicked-bleepButton-cancel');
        }
      }]
    });
    await actionSheet.present();
  }

  public createPost() {
    this.presentActionSheet();
  }

  public goToArticle() {
    this.router.navigate(['article-editor']);
  }

  public tabChanged(ev) {
    this.currentTab = ev.tab;
  }
}
