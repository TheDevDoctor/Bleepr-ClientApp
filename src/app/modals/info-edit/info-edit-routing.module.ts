import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { InfoEditPage } from './info-edit.page';

const routes: Routes = [
  {
    path: '',
    component: InfoEditPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InfoEditPageRoutingModule {}
