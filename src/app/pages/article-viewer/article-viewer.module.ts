import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ArticleViewerPageRoutingModule } from './article-viewer-routing.module';

import { ArticleViewerPage } from './article-viewer.page';
import { CommonComponentsModule } from 'src/app/common-components/common-components.module';
import { QuillModule } from 'ngx-quill';
import { AuthorComponent } from './author/author.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ArticleViewerPageRoutingModule,
    CommonComponentsModule,
    QuillModule.forRoot(),
  ],
  declarations: [
    ArticleViewerPage,
    AuthorComponent
  ]
})
export class ArticleViewerPageModule {}
