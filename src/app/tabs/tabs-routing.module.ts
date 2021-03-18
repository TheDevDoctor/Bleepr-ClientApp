import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'feed',
        children: [
          {
            path: '',
            loadChildren: () =>
              import('../pages/feed-page/feed.module').then(m => m.Tab1PageModule)
          }
        ]
      },
      {
        path: 'messaging',
        children: [
          {
            path: '',
            loadChildren: () =>
              import('../pages/messaging-page/messaging.module').then(m => m.MessagingPageModule)
          }
        ]
      },
      {
        path: 'search',
        children: [
          {
            path: '',
            loadChildren: () =>
              import('../pages/search-page/tab3.module').then(m => m.Tab3PageModule)
          }
        ]
      },
      {
        path: 'in-development-2',
        children: [
          {
            path: '',
            loadChildren: () =>
              import('../pages/in-development/in-development.module').then(m => m.InDevelopmentPageModule)
          }
        ]
      },
      {
        path: 'in-development-notifications',
        children: [
          {
            path: '',
            loadChildren: () =>
              import('../pages/in-development/in-development.module').then(m => m.InDevelopmentPageModule)
          }
        ]
      },
      {
        path: 'tab4',
        children: [
          {
            path: '',
            loadChildren: () =>
              import('../pages/search-page/tab3.module').then(m => m.Tab3PageModule)
          }
        ]
      },
      {
        path: 'profile',
        children: [
          {
            path: '',
            loadChildren: () =>
              import('../pages/profile/profile.module').then(m => m.ProfilePageModule)
          }
        ]
      },
      {
        path: 'profile/:id',
        children: [
          {
            path: '',
            loadChildren: () =>
              import('../pages/profile/profile.module').then(m => m.ProfilePageModule)
          }
        ]
      },
      {
        path: '',
        redirectTo: '/home/feed',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '',
    redirectTo: '/home/feed',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TabsPageRoutingModule { }
