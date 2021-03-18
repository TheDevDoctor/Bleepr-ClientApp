import { Component, OnInit, Input } from '@angular/core';
import { UsersService } from 'src/app/services/users.service';
import { environment } from 'src/environments/environment';
import { SasGeneratorService } from 'src/app/services/blob_storage/sas-generator.service';
import { AppBlobService } from 'src/app/services/blob_storage/app-blob-service.service';

@Component({
  selector: 'app-author-chip',
  templateUrl: './author-chip.component.html',
  styleUrls: ['./author-chip.component.scss'],
})
export class AuthorChipComponent implements OnInit {
  @Input() author: string;

  baseUri: string;
  sasToken: string;
  public authorPic = 'assets/blank_user.svg';

  name: string;

  constructor(
    private usersService: UsersService,
    private sasGenerator: SasGeneratorService,
    private appBlobService: AppBlobService
  ) {
    this.baseUri = environment.blobStorage.storageUri;
  }

  ngOnInit() {
    this.usersService.getUserFragment(this.author).subscribe(response => {
      const auth = response.body;
      this.name = auth.firstname + ' ' + auth.surname;
    });

    this.sasGenerator.getSasToken().subscribe(req => {
      this.sasToken = req.storageAccessToken;
    });

    this.appBlobService.checkBlobExists(this.author, 'profile-pictures').subscribe(exists => {
      if (exists) {
        this.authorPic = environment.blobStorage.storageUri + `profile-pictures/${this.author}?${this.sasToken}`;
      }
    });
  }

}
