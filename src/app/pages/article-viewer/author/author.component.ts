import { Component, OnInit, Input } from '@angular/core';
import { environment } from 'src/environments/environment';
import { UsersService } from 'src/app/services/users.service';
import { SasGeneratorService } from 'src/app/services/blob_storage/sas-generator.service';
import { AppBlobService } from 'src/app/services/blob_storage/app-blob-service.service';

@Component({
  selector: 'app-author',
  templateUrl: './author.component.html',
  styleUrls: ['./author.component.scss'],
})
export class AuthorComponent implements OnInit {
  public author: any;
  private sasToken: string;
  @Input() id: string;
  public authorProfilePic: string;

  constructor(
    private usersService: UsersService,
    private sasGenerator: SasGeneratorService,
    private appBlobService: AppBlobService
  ) {}

  ngOnInit() {
    this.usersService.getUserFragment(this.id).subscribe(response => {
      this.author = response.body;
    });

    this.appBlobService.checkBlobExists(this.id, 'profile-pictures').subscribe(exists => {
      if (exists) {
        this.authorProfilePic = environment.blobStorage.storageUri + `profile-pictures/${this.id}?${this.sasToken}`;
      }
    });

    this.sasGenerator.getSasToken().subscribe(req => {
      this.sasToken = req.storageAccessToken;
    });
  }
}
