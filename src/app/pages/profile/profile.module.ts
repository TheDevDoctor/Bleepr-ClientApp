import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ProfilePageRoutingModule } from './profile-routing.module';

import { ProfilePage } from './profile.page';
import { CommonComponentsModule } from '../../common-components/common-components.module';
import { AboutComponent } from './about/about.component';
import { ExperienceComponent } from './experience/experience.component';
import { EducationComponent } from './education/education.component';
import { AccreditationComponent } from './accreditation/accreditation.component';
import { PublicationComponent } from './publication/publication.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ProfilePageRoutingModule,
    CommonComponentsModule
  ],
  declarations: [
    ProfilePage,
    AboutComponent,
    ExperienceComponent,
    EducationComponent,
    AccreditationComponent,
    PublicationComponent
  ]
})
export class ProfilePageModule {}
