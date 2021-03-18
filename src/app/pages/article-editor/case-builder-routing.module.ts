import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CaseBuilderPage } from './case-builder.page';

const routes: Routes = [
  {
    path: '',
    component: CaseBuilderPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CaseBuilderPageRoutingModule {}
