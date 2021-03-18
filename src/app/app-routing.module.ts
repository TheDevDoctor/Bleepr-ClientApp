import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { IsUserGuardService } from './guards/user-doc-guard.service';


const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule),
    canActivate: [IsUserGuardService]
  },
  {
    path: 'sign-up',
    loadChildren: () => import('./pages/sign-up/sign-up.module').then(m => m.SignUpPageModule)
  },
  {
    path: 'loading-page',
    loadChildren: () => import('./pages/loading-page/loading-page.module').then(m => m.LoadingPageModule)
  },
  {
    path: 'auth',
    loadChildren: () => import('./pages/loading-page/loading-page.module').then(m => m.LoadingPageModule)
  },
  {
    path: 'oauth/auth',
    loadChildren: () => import('./pages/loading-page/loading-page.module').then(m => m.LoadingPageModule)
  },
  {
    path: 'article-editor/:id',
    loadChildren: () => import('./pages/article-editor/case-builder.module').then(m => m.CaseBuilderPageModule),
    canActivate: [IsUserGuardService]
  },
  {
    path: 'article-editor',
    loadChildren: () => import('./pages/article-editor/case-builder.module').then(m => m.CaseBuilderPageModule),
    canActivate: [IsUserGuardService]
  },
  {
    path: 'article-viewer/:id',
    loadChildren: () => import('./pages/article-viewer/article-viewer.module').then(m => m.ArticleViewerPageModule),
    canActivate: [IsUserGuardService]
  },
  {
    path: 'single-bleep-view',
    loadChildren: () => import('./pages/single-bleep-view/single-bleep-view.module').then(m => m.SingleBleepViewPageModule),
    canActivate: [IsUserGuardService]
  },
  {
    path: 'landing-page',
    loadChildren: () => import('./pages/landing-page/landing-page.module').then(m => m.LandingPageModule)
  },
  {
    path: 'help-centre',
    loadChildren: () => import('./pages/help-centre/help-centre.module').then(m => m.HelpCentreModule)
  },
  { path: 'privacy', redirectTo: 'help-centre/privacy-policy' },
  { path: 'terms-and-conditions', redirectTo: 'help-centre/terms-and-conditions' },
  { path: '', redirectTo: 'loading-page', pathMatch: 'full' },
  { path: '**', redirectTo: 'loading-page' }
];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule],
  providers: []
})
export class AppRoutingModule { }
