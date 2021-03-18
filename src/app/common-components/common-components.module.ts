import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListItemComponent } from './list-item/list-item.component';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { PipesModule } from '../pipes/pipes.module';
import { InputFileComponent } from './input-component/input-component.component';
import { ItemsUploadedComponent } from './items-uploaded/items-uploaded.component';
import { BleepTypesComponent } from '../pages/feed-page/feed-components/bleep-types/bleep-types.component';
import { ShareCardComponent } from '../pages/feed-page/feed-components/share-card/share-card.component';
import { FeedCardHeaderComponent } from '../pages/feed-page/feed-components/feed-card-header/feed-card-header.component';
import { TimeagoModule } from 'ngx-timeago';
import { SuggestedConnectionsComponent } from './suggested-connections/suggested-connections.component';
import { FeedCardComponent } from '../pages/feed-page/feed-components/feed-card/feed-card.component';
import { FeedCardFooterComponent } from '../pages/feed-page/feed-components/feed-card-footer/feed-card-footer.component';
import { CommentsComponent } from '../pages/feed-page/feed-components/comments/comments.component';
import { FormsModule } from '@angular/forms';
import { SiteHeaderComponent } from '../tabs/site-header/site-header.component';
import { UserPopoverComponent } from './user-popover/user-popover.component';
import { ConnectRequestComponent } from './connect-request/connect-request.component';
import { InputDropdownComponent } from './input-dropdown/input-dropdown.component';
import { ArticleCardComponent } from '../pages/feed-page/feed-components/article-card/article-card.component';
import { UserFragmentComponent } from './user-fragment/user-fragment.component';
import { ProfileCompletionComponent } from './profile-completion/profile-completion.component';
import { ModalsModule } from '../modals/modals.module';
import { OptionsPopoverComponent } from '../pages/feed-page/feed-components/options-popover/options-popover.component';
import { TextInputDropdownComponent } from './text-input-dropdown/text-input-dropdown.component';
import { FilePlaceholderComponent } from './file-placeholder/file-placeholder.component';
import { HashtaggingDirective } from '../directives/hashtagging.directive';
import { SuggestedContactComponent } from './suggested-contact/suggested-contact.component';
import { InViewportModule } from 'ng-in-viewport';

@NgModule({
  declarations: [
    ListItemComponent,
    InputFileComponent,
    ItemsUploadedComponent,
    BleepTypesComponent,
    ShareCardComponent,
    FeedCardHeaderComponent,
    SuggestedConnectionsComponent,
    FeedCardComponent,
    FeedCardFooterComponent,
    CommentsComponent,
    ArticleCardComponent,
    SiteHeaderComponent,
    UserPopoverComponent,
    ConnectRequestComponent,
    InputDropdownComponent,
    UserFragmentComponent,
    ProfileCompletionComponent,
    OptionsPopoverComponent,
    TextInputDropdownComponent,
    FilePlaceholderComponent,
    HashtaggingDirective,
    SuggestedContactComponent
  ],
  exports: [
    ListItemComponent,
    InputFileComponent,
    ItemsUploadedComponent,
    BleepTypesComponent,
    ShareCardComponent,
    FeedCardHeaderComponent,
    SuggestedConnectionsComponent,
    FeedCardComponent,
    FeedCardFooterComponent,
    CommentsComponent,
    ArticleCardComponent,
    SiteHeaderComponent,
    UserPopoverComponent,
    ConnectRequestComponent,
    InputDropdownComponent,
    UserFragmentComponent,
    ProfileCompletionComponent,
    OptionsPopoverComponent,
    TextInputDropdownComponent,
    FilePlaceholderComponent,
    SuggestedContactComponent
  ],
  imports: [
    CommonModule,
    IonicModule,
    RouterModule,
    PipesModule,
    FormsModule,
    TimeagoModule.forChild(),
    InViewportModule
  ],
})
export class CommonComponentsModule { }
