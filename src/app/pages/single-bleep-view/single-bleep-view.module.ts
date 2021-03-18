import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SingleBleepViewPageRoutingModule } from './single-bleep-view-routing.module';

import { SingleBleepViewPage } from './single-bleep-view.page';
import { CommonComponentsModule } from 'src/app/common-components/common-components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SingleBleepViewPageRoutingModule,
    CommonComponentsModule
  ],
  declarations: [SingleBleepViewPage]
})
export class SingleBleepViewPageModule {}
