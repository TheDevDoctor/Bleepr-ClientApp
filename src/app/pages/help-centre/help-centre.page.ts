import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { HelpContentViewerModal } from './help-content-viewer/help-content-viewer.modal';
import { ActivatedRoute } from '@angular/router';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-help-centre',
  templateUrl: './help-centre.page.html',
  styleUrls: ['./help-centre.page.scss'],
})
export class HelpCentrePage implements OnInit {

  private docRoute: string;
  private routableDocuments = [
    'privacy-policy',
    'terms-and-conditions'
  ];

  constructor(
    public modalController: ModalController,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    // Check the route parameter for a document to open, if valid open it
    this.docRoute = this.route.snapshot.paramMap.get('document');
    if (this.docRoute) {
      if (this.routableDocuments.includes(this.docRoute)) {
        this.presentContentModal(this.docRoute);
      }
    }
  }

  /**
   * Present the content the user has clicked on in a modal
   * @param title the title to display
   * @param docName the name of the document to open (i.e. 'privacy-policy')
   */
  async presentContentModal(docName: string) {
    const docURI = `./assets/help-centre/${docName}.md`;
    const modal = await this.modalController.create({
      component: HelpContentViewerModal,
      cssClass: 'document-modal',
      componentProps: {
        docLink: docURI
      }
    });
    return await modal.present();
  }

}
