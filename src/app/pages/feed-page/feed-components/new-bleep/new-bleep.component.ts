import { Component, OnInit } from '@angular/core';
import { ModalController, ActionSheetController } from '@ionic/angular';
import { BleepModalPage } from 'src/app/pages/new-bleep-modal/post.page';

@Component({
  selector: 'app-new-bleep',
  templateUrl: './new-bleep.component.html',
  styleUrls: ['./new-bleep.component.scss'],
})
export class NewBleepComponent implements OnInit {

  constructor(
    public modalController: ModalController,
    public actionSheetController: ActionSheetController,
  ) { }

  ngOnInit() {}

  async presentModal() {
    const post = BleepModalPage;
    const modal = await this.modalController.create({
      component: post
    });
    return await modal.present();
  }

  newBleep() {
    this.presentModal();
  }

}
