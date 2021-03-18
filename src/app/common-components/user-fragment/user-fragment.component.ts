import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { environment } from 'src/environments/environment';
import { UsersService } from 'src/app/services/users.service';
import { SasGeneratorService } from 'src/app/services/blob_storage/sas-generator.service';
import { AppBlobService } from 'src/app/services/blob_storage/app-blob-service.service';

@Component({
  selector: 'app-user-fragment',
  templateUrl: './user-fragment.component.html',
  styleUrls: ['./user-fragment.component.scss'],
})
export class UserFragmentComponent implements OnChanges {

  @Input() userId: string;
  @Input() fragment: any;
  @Input() routable = true;

  baseUri: string;
  name: string;
  position: string;
  sasToken: string;

  public profilePic = 'assets/blank_user.svg';

  constructor(
    private usersService: UsersService,
    private sasGenerator: SasGeneratorService,
    private appBlobService: AppBlobService
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    this.baseUri = environment.blobStorage.storageUri;

    if (this.userId) {
      this.usersService.getUserFragment(this.userId).subscribe(frag => {
        this.setFragmentValues(frag.body);
      });
    } else if (this.fragment) {
      this.setFragmentValues(this.fragment);
      this.userId = this.fragment.userId;
    } else {
      console.log('No fragment data was supplied');
    }

    this.sasGenerator.getSasToken().subscribe(req => {
      this.sasToken = req.storageAccessToken;
    });

    this.appBlobService.checkBlobExists(this.userId, 'profile-pictures').subscribe(exists => {
      if (exists) {
        this.profilePic = this.baseUri + 'profile-pictures/' + this.userId + '?' + this.sasToken;
      }
    });
  }

  private setFragmentValues(frag) {
    const fragment = frag;
    this.name = fragment.firstname + ' ' + fragment.surname;
    if (fragment.specialty && fragment.grade) {
      this.position = fragment.specialty + ' ' + fragment.grade;
    } else {
      this.position = fragment.profession;
    }
  }
}
