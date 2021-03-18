import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { BleepModalPageRoutingModule } from './post-routing.module';

import { BleepModalPage } from './post.page';
import { NgxLinkifyjsService, NgxLinkifyjsModule } from 'ngx-linkifyjs';
import { CommonComponentsModule } from 'src/app/common-components/common-components.module';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    BleepModalPageRoutingModule,
    CommonComponentsModule
  ],
  declarations: [BleepModalPage],
  entryComponents: [BleepModalPage],
  providers: [NgxLinkifyjsService]
})
export class BleepModalPageModule {}
