import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HelpCentrePage } from './help-centre.page';

const routes: Routes = [
  {
    path: '',
    component: HelpCentrePage
  },
  {
    path: ':document',
    component: HelpCentrePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HelpCentreRoutingModule {}
