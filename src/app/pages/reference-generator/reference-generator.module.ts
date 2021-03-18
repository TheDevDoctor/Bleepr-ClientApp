import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ReferenceGeneratorPageRoutingModule } from './reference-generator-routing.module';

import { ReferenceGeneratorPage } from './reference-generator.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReferenceGeneratorPageRoutingModule,
    ReactiveFormsModule
  ],
  declarations: [ReferenceGeneratorPage],
  entryComponents: [ReferenceGeneratorPage]
})
export class ReferenceGeneratorPageModule {}
