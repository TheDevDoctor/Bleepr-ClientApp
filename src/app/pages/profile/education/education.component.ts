import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { EducationEditPage } from 'src/app/modals/education-edit/education-edit.page';
import { AppDataService } from 'src/app/services/app-data.service';
import { AppBlobService } from 'src/app/services/blob_storage/app-blob-service.service';
import { environment } from 'src/environments/environment';
import { SasGeneratorService } from 'src/app/services/blob_storage/sas-generator.service';

@Component({
  selector: 'app-education',
  templateUrl: './education.component.html',
  styleUrls: ['./education.component.scss'],
})
export class EducationComponent implements OnInit {
  @Input()
  set education(val: any[]) {
    this.icons = [];
    val.map(ed => {
      const blobName = ed.university.toLowerCase().replace(/ /g, '_');
      this.blobExists.checkBlobExists(blobName, 'app-icons').subscribe(exists => {
        if (exists) {
          this.icons.push(`app-icons/${blobName}`);
        } else {
          this.icons.push(null);
        }
      });

    });
    this._education = val;
  }

  get education(): any[] {
    return this._education;
  }

  // tslint:disable-next-line:variable-name
  private _education: any[];
  public icons: string[] = [];
  @Input() editable: boolean;
  @Output() updated: EventEmitter<boolean> = new EventEmitter();

  reposition = false;
  showEditButton = false;
  public baseUri: string;
  public sasToken: string;

  constructor(
    public modalController: ModalController,
    private blobExists: AppBlobService,
    private sasGenerator: SasGeneratorService
  ) { }

  ngOnInit() {
    this.baseUri = environment.blobStorage.storageUri;

    this.sasGenerator.getSasToken().subscribe(req => {
      this.sasToken = req.storageAccessToken;
    });
  }

  async presentEditModal(index) {
    const modal = await this.modalController.create({
      component: EducationEditPage,
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

    this.array_move(this._education, ev.detail.from, ev.detail.to);
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
