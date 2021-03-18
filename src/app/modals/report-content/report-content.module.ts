import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ReportContentPageRoutingModule } from './report-content-routing.module';

import { ReportContentPage } from './report-content.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReportContentPageRoutingModule,
    ReactiveFormsModule
  ],
  declarations: [ReportContentPage]
})
export class ReportContentPageModule {}
