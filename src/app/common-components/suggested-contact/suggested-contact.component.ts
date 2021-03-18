import { Component, OnInit, Input } from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import { SasGeneratorService } from 'src/app/services/blob_storage/sas-generator.service';
import { AppBlobService } from 'src/app/services/blob_storage/app-blob-service.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-suggested-contact',
  templateUrl: './suggested-contact.component.html',
  styleUrls: ['./suggested-contact.component.scss'],
})
export class SuggestedContactComponent implements OnInit {
  @Input() connection: any;

  public addingConnection: boolean;
  public profilePic = 'assets/blank_user.svg';

  constructor(
    private userService: UserService,
    private sasGenerator: SasGeneratorService,
    private appBlobService: AppBlobService
  ) { }

  ngOnInit() {
    this.connection.profilePic = 'assets/blank_user.svg';
    this.sasGenerator.getSasToken().subscribe(req => {
      this.appBlobService.checkBlobExists(this.connection.userId, 'profile-pictures').subscribe(exists => {
        if (exists) {
          this.profilePic = environment.blobStorage.storageUri + `profile-pictures/${this.connection.id}?${req.storageAccessToken}`;
        }
      });
    });
  }

  addConnection(connect) {
    this.addingConnection = true;
    this.userService.sendConnectRequest(connect.id).subscribe(res => {
      if (res.ok) {
        console.log(res);
      }
    });
  }

}
