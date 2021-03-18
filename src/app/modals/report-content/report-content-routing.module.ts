import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ReportContentPage } from './report-content.page';

const routes: Routes = [
  {
    path: '',
    component: ReportContentPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReportContentPageRoutingModule {}
