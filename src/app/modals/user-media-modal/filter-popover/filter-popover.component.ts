import { Component, OnInit, Input } from '@angular/core';
import { PopoverController } from '@ionic/angular';

@Component({
  selector: 'app-filter-popover',
  templateUrl: './filter-popover.component.html',
  styleUrls: ['./filter-popover.component.scss'],
})
export class FilterPopoverComponent implements OnInit {
  public filtSettings = { mediaType: null, documentsType: null, fileType: null };

  @Input()
  set filterSettings(val) {
    this.filtSettings.mediaType = { ...val.mediaType };
    this.filtSettings.documentsType = { ...val.documentsType };
    this.filtSettings.fileType = val.fileType;
  }

  public types: {
    media: string[],
    documents: string[]
  };

  constructor(private popoverController: PopoverController) { }

  ngOnInit() {
    this.types = { media: [], documents: [] };
    this.types.media = Object.keys(this.filtSettings.mediaType);
    this.types.documents = Object.keys(this.filtSettings.documentsType);
  }

  ionViewWillEnter() {

  }

  public onDonePressed() {
    this.popoverController.dismiss(this.filtSettings);
  }

}
