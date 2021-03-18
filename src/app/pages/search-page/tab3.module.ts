import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Tab3Page } from './tab3.page';
import { CommonComponentsModule } from '../../common-components/common-components.module';
import { UserSearchCardComponent } from './user-search-card/user-search-card.component';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    CommonComponentsModule,
    RouterModule.forChild([{ path: '', component: Tab3Page }])
  ],
  declarations: [
    Tab3Page,
    UserSearchCardComponent
  ]
})
export class Tab3PageModule {}
