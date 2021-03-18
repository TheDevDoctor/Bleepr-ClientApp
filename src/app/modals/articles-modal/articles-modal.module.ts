import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ArticlesModalPageRoutingModule } from './articles-modal-routing.module';
import { TimeagoModule } from 'ngx-timeago';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { FilterPopoverComponent } from './filter-popover/filter-popover.component';

@NgModule({
  declarations: [
    FilterPopoverComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ArticlesModalPageRoutingModule,
    PipesModule,
    TimeagoModule,
    ReactiveFormsModule
  ]
})
export class ArticlesModalPageModule {}
