import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessagingPage } from './messaging.page';
import { PipesModule } from '../../pipes/pipes.module';
import { CommonComponentsModule } from '../../common-components/common-components.module';
import { FormsModule } from '@angular/forms';
import { ManageGroupChatModal } from './manage-group-chat/manage-group-chat.modal';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    RouterModule.forChild([{ path: '', component: MessagingPage }]),
    PipesModule,
    CommonComponentsModule
  ],
  declarations: [
    MessagingPage,
    ManageGroupChatModal
  ],
  providers: []
})
export class MessagingPageModule { }
