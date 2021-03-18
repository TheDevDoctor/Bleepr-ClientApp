import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { InDevelopmentPageRoutingModule } from './in-development-routing.module';

import { InDevelopmentPage } from './in-development.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    InDevelopmentPageRoutingModule
  ],
  declarations: [InDevelopmentPage]
})
export class InDevelopmentPageModule {}
