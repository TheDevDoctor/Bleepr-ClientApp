import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { PublicationEditPage } from 'src/app/modals/publication-edit/publication-edit.page';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-publication',
  templateUrl: './publication.component.html',
  styleUrls: ['./publication.component.scss'],
})
export class PublicationComponent implements OnInit {

  @Input() publication: any[];
  @Input() editable: boolean;

  @Output() updated: EventEmitter<boolean> = new EventEmitter();

  reposition = false;
  showEditButton = false;

  constructor(
    public modalController: ModalController
  ) { }

  ngOnInit() {}

  async presentEditModal(index) {
    const modal = await this.modalController.create({
      component: PublicationEditPage,
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

    this.array_move(this.publication, ev.detail.from, ev.detail.to);
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
