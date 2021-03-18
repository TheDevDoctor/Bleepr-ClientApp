import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  Plugins,
  PushNotification,
  PushNotificationToken,
  PushNotificationActionPerformed,
  Capacitor
} from '@capacitor/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { UserService } from './user.service';
import { Router, NavigationExtras } from '@angular/router';
import { UsersService } from './users.service';
import { ToastController } from '@ionic/angular';

const { PushNotifications } = Plugins;

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  private notifications: any;
  private notifications$: BehaviorSubject<any> = new BehaviorSubject(this.notifications);

  private userId: string;
  private userFragment: any;

  private currentNotification: string;
  private currentNotification$: BehaviorSubject<string> = new BehaviorSubject(this.currentNotification);

  private currentNotificationConversationId: string;
  private currentNotificationConversationId$: BehaviorSubject<string> = new BehaviorSubject(this.currentNotificationConversationId);

  private pushConnected: boolean;

  constructor(
    private databaseService: DatabaseService,
    private http: HttpClient,
    private router: Router,
    private toastController: ToastController
  ) { }

  private sendNotification(userId: string, notification: any) {
    const notificationId = `notifications-${userId}`;
    const sprocInputs = [notificationId, JSON.stringify(notification)];

    this.databaseService.callSproc('notifications', notificationId, 'addNotificationSproc', sprocInputs).subscribe();
  }

  public sendLikeNotification(contentId: string, userId: string, createdById: string, contentType: string, ts: number, commentId?: string) {
    const notification: any = {
      event: 'like',
      contentType,
      contentId,
      userId,
      ts
    };

    if (commentId) {
      notification.commentId = commentId;
    }

    this.sendNotification(createdById, notification);

    const message = `${this.userFragment.firstname + ' ' + this.userFragment.surname} has liked your ${contentType}`;

    this.databaseService.sendPushNotification(userId, createdById, message, 'interaction', 'interactionTemplate', notification).subscribe();
  }

  private getNotifications(userId) {
    const notificationId = `notifications-${userId}`;
    this.databaseService.getDocument(notificationId, 'notifications', notificationId).subscribe(res => {
      if (res.ok) {
        this.notifications = res.body;
        this.notifications$.next(this.notifications);
      }
    });
  }

  public setUserFragment(fragment: any) {
    this.userFragment = fragment;
  }

  public updateLastSeen(timestamp: number) {
    const sprocInputs = [this.notifications.id, String(timestamp)];
    this.databaseService.callSproc('notifications', this.notifications.id, 'updateTimestampSproc', sprocInputs).subscribe(res => {
      if (res.ok) {
        this.notifications.lastSeen = timestamp;
        this.notifications$.next(this.notifications);
      }
    });
  }

  public onGetNotifications(userId: string) {
    this.getNotifications(userId);
  }

  public returnNotifications(): Observable<any> {
    return this.notifications$.asObservable();
  }

  public setCurrentNotification(notification) {
    this.currentNotification = notification;
    this.currentNotification$.next(this.currentNotification);

    if (this.router.url !== '/single-bleep-view') {
      this.router.navigate(['single-bleep-view']);
    }
  }

  public getCurrentNotification() {
    return this.currentNotification$.asObservable();
  }

  public getCurrentNotificationConversationId() {
    return this.currentNotificationConversationId$.asObservable();
  }

  private registerWithNotificationHub(deviceToken: string) {
    const body = {
      platform: Capacitor.getPlatform() === 'ios' ? 'apns' : 'fcm',
      handle: deviceToken,
      installationId: Capacitor.getPlatform() + '_' + this.userId,
      userId: this.userId,
      tags: [this.userId]
    };

    this.http.put(`${environment.apiBaseURL}PushNotification/RegisterPushDevice`, body, { observe: 'response' }).subscribe(res => {
      if (res.ok) {
        console.log('Succesfully registered with notifications hub');
        this.pushConnected = true;
      }
    }
    );
  }

  private handleNotification(notification: PushNotification) {
    const notificationType = notification.data.type;

    if (notificationType === 'bleep') {
      const contentData = JSON.parse(notification.data.contentData);
      this.setCurrentNotification(contentData);
    } else if (notificationType === 'message') {
      const contentData = JSON.parse(notification.data.contentData);
      this.routeToConversation(contentData);
    }
  }

  private routeToConversation(message) {
    this.currentNotificationConversationId = message.conversationId;
    this.currentNotificationConversationId$.next(this.currentNotificationConversationId);

    if (this.router.url !== '/home/messaging') {
      this.router.navigate(['/home/messaging']);
    }
  }

  private handleForegroundNotification(notification: PushNotification) {
    this.presentForegroundNotification(notification);
  }

  async presentForegroundNotification(notification) {
    // Stop foreground notification showing if on current notification conversation:
    if (notification.data.type === 'message') {
      const contentData = JSON.parse(notification.data.contentData);
      if (contentData.conversationId === this.currentNotificationConversationId) {
        return;
      }
    }


    const toastConfig: any = {
      // message: Capacitor.getPlatform() === 'ios' ? notification.data.aps.alert : notification.data.message,
      position: 'bottom',
      color: 'tertiary',
      duration: 2000,
      buttons: [
        {
          text: 'View',
          handler: () => {
            this.handleNotification(notification);
          }
        }
      ]
    };

    if (Capacitor.getPlatform() === 'ios') {
      toastConfig.message = notification.data.aps.alert.body;
      if (notification.data.aps.alert.title) {
        toastConfig.header = notification.data.aps.alert.title;
      }
    } else if (Capacitor.getPlatform() === 'android') {
      toastConfig.message = notification.data.message;
      if (notification.data.title) {
        toastConfig.header = notification.data.title;
      }
    }

    const toast = await this.toastController.create(toastConfig);
    toast.present();
  }

  public connectToPushNotifications(userId: string) {

    // needed otherwise connection will be made multiple times in a session which is unneccesary.
    if (this.pushConnected) {
      return;
    }

    this.userId = userId;
    // Request permission to use push notifications
    // iOS will prompt user and return if they granted permission or not
    // Android will just grant without prompting
    PushNotifications.requestPermission().then(result => {
      if (result.granted) {
        // Register with Apple / Google to receive push via APNS/FCM
        PushNotifications.register();
      } else {
        // Show some error
      }
    });

    // On success, we should be able to receive notifications
    PushNotifications.addListener('registration',
      (token: PushNotificationToken) => {
        this.registerWithNotificationHub(token.value);
      }
    );

    // Some issue with our setup and push will not work
    PushNotifications.addListener('registrationError',
      (error: any) => {
        alert('Error on registration: ' + JSON.stringify(error));
      }
    );

    // Show us the notification payload if the app is open on our device
    PushNotifications.addListener('pushNotificationReceived',
      (notification: PushNotification) => {
        // this.handleNotification(notification);

        // Need to present notification in app on android I think.
        this.handleForegroundNotification(notification);
      }
    );

    // Method called when tapping on a notification
    PushNotifications.addListener('pushNotificationActionPerformed',
      (notification: PushNotificationActionPerformed) => {
        this.handleNotification(notification.notification);
      }
    );
  }
}

