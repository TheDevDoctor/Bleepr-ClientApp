import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PipesModule } from './pipes/pipes.module';
import { BleepModalPageModule } from './pages/new-bleep-modal/post.module';
import { Camera } from '@ionic-native/camera/ngx';
import { AuthService } from './services/auth.service';
import { OAuthModule } from 'angular-oauth2-oidc';
import { UserListPageModule } from './pages/user-list/user-list.module';
import { ReferenceGeneratorPageModule } from './pages/reference-generator/reference-generator.module';
import { ModalsModule } from './modals/modals.module';
import { UserMediaModalModule } from './modals/user-media-modal/user-media-modal.module';
import { LayoutModule } from '@angular/cdk/layout';
import { ErrorHandlerService } from './services/monitoring/error.handler';
import { MarkdownModule } from 'ngx-markdown';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';


@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    UserListPageModule,
    ReferenceGeneratorPageModule,
    HttpClientModule,
    BleepModalPageModule,
    ModalsModule,
    UserMediaModalModule,
    LayoutModule,
    OAuthModule.forRoot(),
    MarkdownModule.forRoot()
  ],
  providers: [
    StatusBar,
    SplashScreen,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: ErrorHandler, useClass: ErrorHandlerService },
    PipesModule,
    Camera,
    AuthService,
    InAppBrowser
  ],
  exports: [],
  bootstrap: [AppComponent],
  schemas: [],
})
export class AppModule { }
