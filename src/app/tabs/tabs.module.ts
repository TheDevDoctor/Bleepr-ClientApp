import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TabsPageRoutingModule } from './tabs-routing.module';

import { TabsPage } from './tabs.page';
import { SiteHeaderComponent } from './site-header/site-header.component';
import { CommonComponentsModule } from '../common-components/common-components.module';
import { ConnectReqPopoverComponent } from './site-header/connect-req-popover/connect-req-popover.component';
import { NotificationsPopoverComponent } from './site-header/notifications-popover/notifications-popover.component';
import { NotificationComponent } from './site-header/notifications-popover/notification/notification.component';
import { TimeagoModule } from 'ngx-timeago';


@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    TabsPageRoutingModule,
    CommonComponentsModule,
    TimeagoModule.forChild()
  ],
  exports: [],
  declarations: [
    TabsPage,
    ConnectReqPopoverComponent,
    NotificationsPopoverComponent,
    NotificationComponent
  ]
})
export class TabsPageModule { }
