import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ReferenceGeneratorPage } from './reference-generator.page';

const routes: Routes = [
  {
    path: '',
    component: ReferenceGeneratorPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReferenceGeneratorPageRoutingModule {}
