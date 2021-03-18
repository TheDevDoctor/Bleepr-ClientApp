import { Component, OnInit, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-in-development',
  templateUrl: './in-development.page.html',
  styleUrls: ['./in-development.page.scss'],
})
export class InDevelopmentPage implements OnInit {
  @Input() source: string;
  @Input() title: string;

  constructor(private modalController: ModalController) { }

  ngOnInit() {
  }

  onDismissModal() {
    this.modalController.dismiss();
  }

}
