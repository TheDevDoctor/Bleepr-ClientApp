import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BleepModalPage } from './post.page';

const routes: Routes = [
  {
    path: '',
    component: BleepModalPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BleepModalPageRoutingModule {}
