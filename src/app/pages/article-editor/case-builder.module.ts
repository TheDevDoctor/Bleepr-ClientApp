import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CaseBuilderPageRoutingModule } from './case-builder-routing.module';

import { CaseBuilderPage } from './case-builder.page';
import { MediumEditorModule } from 'angular2-medium-editor';
import { QuillModule } from 'ngx-quill';
import { CommonComponentsModule } from 'src/app/common-components/common-components.module';
import { SiteHeaderComponent } from 'src/app/tabs/site-header/site-header.component';
import { AuthorChipComponent } from './author-chip/author-chip.component';
import { PublishPopoverComponent } from './publish-popover/publish-popover.component';

@NgModule({
  imports: [
    MediumEditorModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    CaseBuilderPageRoutingModule,
    QuillModule.forRoot(),
    CommonComponentsModule
  ],
  declarations: [
    CaseBuilderPage,
    AuthorChipComponent,
    PublishPopoverComponent
  ]
})
export class CaseBuilderPageModule { }
