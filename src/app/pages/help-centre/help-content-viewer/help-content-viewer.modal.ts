import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-help-content-viewer',
  templateUrl: './help-content-viewer.modal.html'
})
export class HelpContentViewerModal {

  @Input() docLink: string;
  
  constructor(public modalController: ModalController) {}

  close() {
    // using the injected ModalController this page
    // can "dismiss" itself and optionally pass back data
    this.modalController.dismiss({
      'dismissed': true
    });
  }

}