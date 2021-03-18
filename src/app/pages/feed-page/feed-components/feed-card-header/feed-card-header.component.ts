import { Component, Input } from '@angular/core';
import { PopoverController, ModalController } from '@ionic/angular';
import { OptionsPopoverComponent } from '../options-popover/options-popover.component';
import { FeedService } from 'src/app/services/feed.service';
import { BleepModalPage } from 'src/app/pages/new-bleep-modal/post.page';

@Component({
  selector: 'app-feed-card-header',
  templateUrl: './feed-card-header.component.html',
  styleUrls: ['./feed-card-header.component.scss'],
})
export class FeedCardHeaderComponent {
  @Input() bleep: any;
  @Input() editable: boolean;

  constructor(
    public popoverController: PopoverController,
    public modalController: ModalController,
    private feedService: FeedService
  ) { }

  async presentPopover(ev: any) {
    const popover = await this.popoverController.create({
      component: OptionsPopoverComponent,
      componentProps: {
        bleep: this.bleep,
        ownContent: this.editable
      },
      event: ev,
      translucent: true
    });

    popover.onWillDismiss().then(data => {
      if (data.data) {
        if (data.data.action === 'edit') {
          this.presentBleepModal(data.data.id);
        }
      }
    });

    return await popover.present();
  }

  async presentBleepModal(bleepId) {
    const modal = await this.modalController.create({
      component: BleepModalPage,
      componentProps: {
        bleep: this.feedService.getBleepFromFeed(bleepId)
      }
    });
    return await modal.present();
  }

}
