import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SingleBleepViewPage } from './single-bleep-view.page';

const routes: Routes = [
  {
    path: '',
    component: SingleBleepViewPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SingleBleepViewPageRoutingModule {}
