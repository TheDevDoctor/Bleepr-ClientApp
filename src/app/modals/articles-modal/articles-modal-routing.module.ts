import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ArticlesModalPage } from './articles-modal.page';

const routes: Routes = [
  {
    path: '',
    component: ArticlesModalPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ArticlesModalPageRoutingModule {}
