import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { HelpCentrePage } from './help-centre.page';
import { HelpCentreRoutingModule } from './help-centre-routing.module'
import { HelpContentViewerModal } from './help-content-viewer/help-content-viewer.modal';
import { MarkdownModule } from 'ngx-markdown';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HelpCentreRoutingModule,
    MarkdownModule.forChild()
  ],
  declarations: [
    HelpCentrePage,
    HelpContentViewerModal
  ],
  entryComponents: [HelpContentViewerModal]
})
export class HelpCentreModule {}
