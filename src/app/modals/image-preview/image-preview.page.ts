import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { ModalController, IonSlides } from '@ionic/angular';

@Component({
  selector: 'app-image-preview',
  templateUrl: './image-preview.page.html',
  styleUrls: ['./image-preview.page.scss'],
})
export class ImagePreviewPage implements OnInit {
  @ViewChild('slider') slider;

  @Input() source: string;


  public sliderOptions = {
    zoom: {
      maxRatio: 5
    }
  };

  constructor(private modalController: ModalController) { }

  ionViewDidEnter() {
    this.slider.nativeElement.update();
  }

  ngOnInit() { }

  closeImagePreview() {
    this.modalController.dismiss();
  }

  ionViewDidLeave() {
    this.source = undefined;
  }

}
