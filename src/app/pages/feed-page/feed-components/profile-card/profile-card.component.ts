import { Component, OnInit, Input } from '@angular/core';
import { User } from 'src/app/models/auth-types';
import { UserService } from 'src/app/services/user.service';
import { environment } from 'src/environments/environment';
import { SasGeneratorService } from 'src/app/services/blob_storage/sas-generator.service';
import { BleepModalPage } from 'src/app/pages/new-bleep-modal/post.page';
import { ModalController } from '@ionic/angular';
import { MonitoringService } from 'src/app/services/monitoring/monitoring.service';

@Component({
  selector: 'app-profile-card',
  templateUrl: './profile-card.component.html',
  styleUrls: ['./profile-card.component.scss'],
})
export class ProfileCardComponent implements OnInit {

  @Input() user: any;
  baseUri: string;
  sasToken: string;

  constructor(
    private sasGenerator: SasGeneratorService,
    private modalController: ModalController,
    private monitoringService: MonitoringService
  ) {}

  ngOnInit() {
    this.baseUri = environment.blobStorage.storageUri;

    this.sasGenerator.getSasToken().subscribe(req => {
      this.sasToken = req.storageAccessToken;
    });
  }

  async presentModal() {
    const post = BleepModalPage;
    const modal = await this.modalController.create({
      component: post
    });
    return await modal.present();
  }

  onNewBleep() {
    this.monitoringService.logEvent('clicked-profile-newBleep');
    this.presentModal();
  }

}
