import { Component, OnInit, Input } from '@angular/core';
import { environment } from 'src/environments/environment';
import { UserService } from 'src/app/services/user.service';
import { FeedService } from 'src/app/services/feed.service';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-connect-req-popover',
  templateUrl: './connect-req-popover.component.html',
  styleUrls: ['./connect-req-popover.component.scss'],
})
export class ConnectReqPopoverComponent implements OnInit {
  @Input() source: string;
  public baseUri: string;
  public requests: Array<string>;
  public connections: Array<any>;

  constructor(
    private userService: UserService,
    private feedService: FeedService,
    private modalController: ModalController
  ) {
    this.baseUri = environment.blobStorage.storageUri;
  }

  ngOnInit() {
    this.userService.returnUser().subscribe(user => {
      this.requests = user.account.connect_requests;
    });

    this.userService.returnSuggestedConnections().subscribe(connections => {
      this.connections = connections;
    });
  }

  onConnectRequestResponse(ev, connect) {

    // if ev then request has been accepted, if not then it has been rejected:
    if (ev) {
      this.userService.acceptConnectionRequest(connect).subscribe(res => {
        if (res.ok) {
          this.feedService.setUserFeed(res.body, true);

          const index = this.requests.indexOf(connect);
          if (index > -1) {
            this.requests.splice(index, 1);
          }
        }
      });
    } else {
      this.userService.declineConnectionRequest(connect);
    }
  }

  onCloseModal() {
    this.modalController.dismiss();
  }

}
