import { Component, OnInit, Input } from '@angular/core';
import { BlobDownloadsViewStateService } from 'src/app/services/blob_storage/blob-downloads-view-state.service';
import { environment } from 'src/environments/environment';
import { SasGeneratorService } from 'src/app/services/blob_storage/sas-generator.service';
import { Plugins } from '@capacitor/core';
import { AppBlobService } from 'src/app/services/blob_storage/app-blob-service.service';

const { Browser } = Plugins;


@Component({
  selector: 'app-file-placeholder',
  templateUrl: './file-placeholder.component.html',
  styleUrls: ['./file-placeholder.component.scss'],
})
export class FilePlaceholderComponent implements OnInit {
  @Input() uploading;
  @Input() guid: string;
  @Input() userId: string;

  public filename: string;

  sasToken: string;
  fileDownload: string;

  constructor(
    private appBlobService: AppBlobService,
    private sasGenerator: SasGeneratorService,
  ) { }

  ngOnInit() {
    this.sasGenerator.getSasToken().subscribe(sas => {
      this.sasToken = sas.storageAccessToken;
    });

    this.fileDownload = `${environment.blobStorage.storageUri + this.userId}/documents/${this.guid}?${this.sasToken}`;

    this.appBlobService.getBlobMetadata('documents/' + this.guid, this.userId).subscribe(data => {
      if (data.metadata.filename) {
        this.filename = data.metadata.filename;
      } else {
        this.filename = 'Unknown';
      }
    });
  }

  async downloadFile() {
    await Browser.open({ url: this.fileDownload });
  }

}
