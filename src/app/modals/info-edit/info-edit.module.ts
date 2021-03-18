import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { InfoEditPageRoutingModule } from './info-edit-routing.module';

import { InfoEditPage } from './info-edit.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    InfoEditPageRoutingModule,
    ReactiveFormsModule
  ],
  declarations: [InfoEditPage]
})
export class InfoEditPageModule {}
