import { Component, OnInit, Output, ViewChild, ElementRef, Input } from '@angular/core';
import { PopoverController, IonInput, ModalController } from '@ionic/angular';
import { environment } from 'src/environments/environment';
import { SasGeneratorService } from 'src/app/services/blob_storage/sas-generator.service';
import { subscribeOn } from 'rxjs/operators';
import { UserMediaModalPage } from 'src/app/modals/user-media-modal/user-media-modal.page';

@Component({
  selector: 'app-publish-popover',
  templateUrl: './publish-popover.component.html',
  styleUrls: ['./publish-popover.component.scss'],
})
export class PublishPopoverComponent implements OnInit {
  tagInput: string;
  tags: string[] = [];
  review: boolean;

  public displayImage: any;
  @Input() feedImage: any;
  @Input() user: any;

  constructor(
    private popoverController: PopoverController,
    private sasGenerator: SasGeneratorService,
    private modalController: ModalController) { }

  ngOnInit() {
    this.sasGenerator.getSasToken().subscribe(sas => {
      if (this.feedImage && this.feedImage.source === 'blob') {
        this.displayImage = environment.blobStorage.storageUri + 
          this.user + '/media/images/' + this.feedImage.id + '?' + sas.storageAccessToken;
      } else if (this.feedImage && this.feedImage.id) {
        this.displayImage = this.feedImage.id;
      }
    });
  }

  onPublish() {
    const pubData = { tags: this.tags, feedImage: this.feedImage };
    this.popoverController.dismiss(pubData);
  }

  public addTag() {
    this.tagInput = this.tagInput.trim();
    const index = this.tags.indexOf(this.tagInput);

    if (this.tagInput && this.tags.length < 5 && index === -1) {
      this.tags.push(this.tagInput);
    }
  }

  public removeTag(i) {
    if (this.tags.length > i) {
      this.tags.splice(i, 1);
    }
  }

  public onChangePicture() {
    this.presentMediaModal();
  }


  async presentMediaModal(caller?: string) {
    const modal = await this.modalController.create({
      component: UserMediaModalPage
    });

    modal.onDidDismiss()
      .then((data) => {
        if (data.data) {
          const mediaData = data.data;
          this.feedImage = {
            source: mediaData.source,
            id: mediaData.source === 'unsplash' ? mediaData.uri : mediaData.guid
          };
          this.displayImage = mediaData.safeUri;
        }
      });

    return await modal.present();
  }
}
