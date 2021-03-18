import { Component, OnInit, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { AboutEditPage } from 'src/app/modals/about-edit/about-edit.page';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
})
export class AboutComponent implements OnInit {

  @Input() editable: boolean;
  @Input() about: string;

  constructor(public modalController: ModalController) { }

  ngOnInit() {}

  async presentEditModal() {
    const modal = await this.modalController.create({
      component: AboutEditPage
    });
    return await modal.present();
  }

}
