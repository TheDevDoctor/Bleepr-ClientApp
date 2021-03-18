import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserMediaModalPage } from './user-media-modal.page';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CommonComponentsModule } from 'src/app/common-components/common-components.module';
import { ImageCardComponent } from './image-card/image-card.component';
import { VideoCardComponent } from './video-card/video-card.component';
import { ImagePreviewComponent } from './image-preview/image-preview.component';
import { FilterPopoverComponent } from './filter-popover/filter-popover.component';
import { DocumentCardComponent } from './document-card/document-card.component';



@NgModule({
  declarations: [
    UserMediaModalPage,
    ImageCardComponent,
    VideoCardComponent,
    ImagePreviewComponent,
    FilterPopoverComponent,
    DocumentCardComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReactiveFormsModule,
    CommonComponentsModule
  ]
})
export class UserMediaModalModule { }
