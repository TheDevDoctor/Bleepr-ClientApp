import { Component, OnInit, Input, OnChanges } from '@angular/core';
import { environment } from 'src/environments/environment';
import { SasGeneratorService } from 'src/app/services/blob_storage/sas-generator.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ModalController } from '@ionic/angular';
import { ImagePreviewPage } from 'src/app/modals/image-preview/image-preview.page';
import { BleepsService } from 'src/app/services/bleeps.service';
import { Plugins } from '@capacitor/core';

const { Browser } = Plugins;


@Component({
  selector: 'app-bleep-types',
  templateUrl: './bleep-types.component.html',
  styleUrls: ['./bleep-types.component.scss'],
})
export class BleepTypesComponent implements OnChanges {
  @Input() bleep: any;

  public baseImgUri: string;
  public sasToken: string;
  public youtubeSafeUri: SafeUrl;
  public linkPreview: any;

  constructor(
    private sasGenerator: SasGeneratorService,
    public domSanitizer: DomSanitizer,
    private modalController: ModalController,
    private bleepsService: BleepsService,
  ) { }

  ngOnChanges() {
    this.sasGenerator.getSasToken().subscribe(req => {
      this.sasToken = req.storageAccessToken;
    });
    this.baseImgUri = environment.blobStorage.storageUri + `${this.bleep.createdById}/`;

    if (this.bleep.type === 'video' && this.bleep.video[0].type === 'youtube') {
      this.youtubeSafeUri = this.domSanitizer.bypassSecurityTrustResourceUrl(this.bleep.video[0].source);
    }

    if (this.bleep.type === 'link' && this.bleep.link.length > 0) {
      this.bleepsService.getLinkPreview(this.bleep.link[0]).subscribe(data => {
        this.linkPreview = data;
      });
    }
  }

  public onImagePreview() {
    if (this.bleep.image[0].type === 'blob') {
      this.presentImagePreview(this.baseImgUri + 'media/images/' + this.bleep.image[0].source + '?' + this.sasToken);
    } else if (this.bleep.image[0].type === 'unsplash') {
      this.presentImagePreview(this.bleep.image[0].source);
    }
  }

  async presentImagePreview(image) {
    const modal = await this.modalController.create({
      component: ImagePreviewPage,
      cssClass: 'image-preview',
      swipeToClose: true,
      componentProps: {
        source: image
      }
    });

    return await modal.present();
  }

  async goToLink(link) {
    await Browser.open({ url: link });
  }
}
