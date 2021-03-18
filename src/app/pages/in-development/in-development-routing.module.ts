import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { InDevelopmentPage } from './in-development.page';

const routes: Routes = [
  {
    path: '',
    component: InDevelopmentPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InDevelopmentPageRoutingModule {}
