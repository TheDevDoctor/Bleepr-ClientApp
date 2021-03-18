import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { AccreditationEditPage } from 'src/app/modals/accreditation-edit/accreditation-edit.page';
import { AppBlobService } from 'src/app/services/blob_storage/app-blob-service.service';
import { environment } from 'src/environments/environment';
import { SasGeneratorService } from 'src/app/services/blob_storage/sas-generator.service';

@Component({
  selector: 'app-accreditation',
  templateUrl: './accreditation.component.html',
  styleUrls: ['./accreditation.component.scss'],
})
export class AccreditationComponent implements OnInit {
  @Input() editable: boolean;

  @Input()
  set accreditation(val: any[]) {
    this.icons = [];
    val.map(ac => {
      const blobName = ac.organisation.toLowerCase().replace(/ /g, '_');
      this.appBlobService.checkBlobExists(blobName, 'app-icons').subscribe(exists => {
        if (exists) {
          this.icons.push(environment.blobStorage.storageUri + `app-icons/${blobName}`);
        } else {
          this.icons.push(null);
        }
      });

    });
    this._accreditation = val;
  }

  get accreditation(): any[] {
    return this._accreditation;
  }

  // tslint:disable-next-line:variable-name
  private _accreditation: any[];
  public sasToken: any;
  public icons: string[] = [];

  @Output() updated: EventEmitter<boolean> = new EventEmitter();

  reposition = false;
  showEditButton = false;

  constructor(
    public modalController: ModalController,
    public appBlobService: AppBlobService,
    public sasGenerator: SasGeneratorService) {

  }

  ngOnInit() {
    this.sasGenerator.getSasToken().subscribe(sas => this.sasToken = sas.storageAccessToken);
  }

  async presentEditModal(index) {
    const modal = await this.modalController.create({
      component: AccreditationEditPage,
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

    this.array_move(this.accreditation, ev.detail.from, ev.detail.to);
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
