import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AboutEditPage } from './about-edit/about-edit.page';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ExperienceEditPage } from './experience-edit/experience-edit.page';
import { CommonComponentsModule } from '../common-components/common-components.module';
import { EducationEditPage } from './education-edit/education-edit.page';
import { AccreditationEditPage } from './accreditation-edit/accreditation-edit.page';
import { PublicationEditPage } from './publication-edit/publication-edit.page';
import { ArticlesModalPage } from './articles-modal/articles-modal.page';
import { SettingsPage } from './settings/settings.page';
import { UnsplashModalComponent } from './unsplash-modal/unsplash-modal.component';
import { UserMediaModalPage } from './user-media-modal/user-media-modal.page';
import { ArticlesModalPageModule } from './articles-modal/articles-modal.module';
import { Ionic4DatepickerModule } from '@logisticinfotech/ionic4-datepicker';
import { ImagePreviewPage } from './image-preview/image-preview.page';
import { InfoEditPageModule } from './info-edit/info-edit.module';
import { ReportContentPageModule } from './report-content/report-content.module';



@NgModule({
  declarations: [
    AboutEditPage,
    ExperienceEditPage,
    EducationEditPage,
    AccreditationEditPage,
    PublicationEditPage,
    ArticlesModalPage,
    SettingsPage,
    UnsplashModalComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReactiveFormsModule,
    CommonComponentsModule,
    Ionic4DatepickerModule,
    ArticlesModalPageModule,
    InfoEditPageModule,
    ReportContentPageModule
  ],
  entryComponents: [
    AboutEditPage,
    ExperienceEditPage,
    EducationEditPage,
    AccreditationEditPage,
    PublicationEditPage,
    ArticlesModalPage,
    SettingsPage
  ]
})
export class ModalsModule { }
