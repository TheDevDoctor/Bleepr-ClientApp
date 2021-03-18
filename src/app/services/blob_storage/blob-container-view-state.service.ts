import { Injectable } from '@angular/core';
import { BlobStorageService } from './blob-storage.service';
import { BlobSharedViewStateService } from './blob-shared-view-state.service';
import { BlobStorageRequest } from 'src/app/models/azure-storage';

@Injectable({
  providedIn: 'root'
})
export class BlobContainerViewStateService {

  constructor(
    private blobService: BlobStorageService,
    private blobState: BlobSharedViewStateService) { }

  createUserContainer(containerName) {
    const obs = this.blobState.getStorageOptionsWithContainer().subscribe(data => {
      const options: BlobStorageRequest = {
        storageUri: data.storageUri,
        storageAccessToken: data.storageAccessToken
      };
      this.blobService.createContainer(options, containerName);
    });
    // this.blobStorageService.createContainer();
  }

}
