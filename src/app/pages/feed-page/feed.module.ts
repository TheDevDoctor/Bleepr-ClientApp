import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeedPage } from './feed.page';
import { PipesModule } from '../../pipes/pipes.module';
import { CommonComponentsModule } from '../../common-components/common-components.module';
import { NewBleepComponent } from './feed-components/new-bleep/new-bleep.component';
import { ProfileCardComponent } from './feed-components/profile-card/profile-card.component';
import { HashtaggingDirective } from 'src/app/directives/hashtagging.directive';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    RouterModule.forChild([{ path: '', component: FeedPage }]),
    PipesModule,
    CommonComponentsModule
  ],
  declarations: [
    FeedPage,
    NewBleepComponent,
    ProfileCardComponent
  ]
})
export class Tab1PageModule { }
