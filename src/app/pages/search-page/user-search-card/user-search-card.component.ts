import { Component, OnInit, Input } from '@angular/core';
import { AppBlobService } from 'src/app/services/blob_storage/app-blob-service.service';
import { environment } from 'src/environments/environment';
import { SasGeneratorService } from 'src/app/services/blob_storage/sas-generator.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-user-search-card',
  templateUrl: './user-search-card.component.html',
  styleUrls: ['./user-search-card.component.scss'],
})
export class UserSearchCardComponent implements OnInit {
  @Input() fragment: any;
  @Input() connectionStatus: any;

  public profilePic = 'assets/blank_user.svg';
  public position: string;
  private doNotRoute: boolean;

  constructor(
    private appBlobService: AppBlobService,
    private sasGenerator: SasGeneratorService,
    private userService: UserService) { }

  ngOnInit() {
    this.sasGenerator.getSasToken().subscribe(req => {
      this.appBlobService.checkBlobExists(this.fragment.userId, 'profile-pictures').subscribe(exists => {
        if (exists) {
          this.profilePic = environment.blobStorage.storageUri + 'profile-pictures/' + this.fragment.userId + '?' + req.storageAccessToken;
        }
      });
    });

    this.setUserPosition(this.fragment);
  }


  setUserPosition(fragment) {
    if (this.fragment.specialty && this.fragment.grade) {
      this.position = this.fragment.specialty + ' ' + this.fragment.grade;
    } else {
      this.position = this.fragment.profession;
    }
  }

  public onRequestConnection() {
    this.userService.sendConnectRequest(this.fragment.userId).subscribe(res => {
      if (res.ok) {
        this.fragment.connectStatus = 'requested';
      }
    });
  }

  public onAcceptConnection() {
    this.userService.acceptConnectionRequest(this.fragment.userId).subscribe(res => {
      if (res.ok) {
        this.fragment.connectStatus = 'connection';
      }
    });
  }

  public onDeclineConnection() {
    this.userService.declineConnectionRequest(this.fragment.userId);
    this.fragment.connectStatus = null;
  }
}
