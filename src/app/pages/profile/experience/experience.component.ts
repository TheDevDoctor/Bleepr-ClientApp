import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ExperienceEditPage } from 'src/app/modals/experience-edit/experience-edit.page';
import { SasGeneratorService } from 'src/app/services/blob_storage/sas-generator.service';
import { AppBlobService } from 'src/app/services/blob_storage/app-blob-service.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-experience',
  templateUrl: './experience.component.html',
  styleUrls: ['./experience.component.scss'],
})
export class ExperienceComponent implements OnInit {
  @Input() editable: boolean;

  @Input()
  set experience(val: any[]) {
    this.icons = [];
    val.map(ex => {
      const blobName = ex.institution.toLowerCase().trim().replace(/ /g, '_');
      this.appBlobService.checkBlobExists(blobName, 'app-icons').subscribe(exists => {
        if (exists) {
          this.icons.push(environment.blobStorage.storageUri + `app-icons/${blobName}`);
          // ex.icon = environment.blobStorage.storageUri + `app-icons/${blobName}`;
        } else {
          this.icons.push(null);
        }
      });
    });
    this._experience = val;
  }

  get experience(): any[] {
    return this._experience;
  }

  // tslint:disable-next-line:variable-name
  private _experience: any[];
  public icons: string[] = [];
  public sasToken: string;

  @Output() updated: EventEmitter<boolean> = new EventEmitter();

  reposition = false;
  showEditButton = false;

  constructor(
    public modalController: ModalController,
    public appBlobService: AppBlobService,
    public sasGenerator: SasGeneratorService
  ) { }

  ngOnInit() {
    this.sasGenerator.getSasToken().subscribe(req => {
      this.sasToken = req.storageAccessToken;
    });
  }

  async presentEditModal(index) {
    const modal = await this.modalController.create({
      component: ExperienceEditPage,
      componentProps: {
        dataIndex: index
      }
    });
    return await modal.present();
  }

  doReorder(ev: any) {
    // Finish the reorder and position the item in the DOM based on
    // where the gesture ended. This method can also be called directly
    // by the reorder group
    ev.detail.complete();

    this.array_move(this.experience, ev.detail.from, ev.detail.to);
  }

  array_move(arr, oldIndex, newIndex) {
    while (oldIndex < 0) {
      oldIndex += arr.length;
    }
    while (newIndex < 0) {
      newIndex += arr.length;
    }
    if (newIndex >= arr.length) {
      let k = newIndex - arr.length + 1;
      while (k--) {
        arr.push(undefined);
      }
    }
    arr.splice(newIndex, 0, arr.splice(oldIndex, 1)[0]);
    return arr; // for testing purposes
  }

  allowPositionEdit() {
    if (this.reposition) {
      this.updated.emit(true);
    }

    this.reposition = !this.reposition;
  }

  allowEditButton() {
    this.showEditButton = !this.showEditButton;
  }

}
