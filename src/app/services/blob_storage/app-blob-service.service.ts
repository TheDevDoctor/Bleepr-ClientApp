import { Injectable } from '@angular/core';
import { TransferProgressEvent } from '@azure/core-http';
import { BlobStorageService } from './blob-storage.service';
import { BlobFileRequest } from 'src/app/models/azure-storage';
import { BlobServiceClient, BlockBlobClient } from '@azure/storage-blob';
import { SasGeneratorService } from './sas-generator.service';
import { from, Subscriber, Observable } from 'rxjs';
import { CachingService } from '../caching.service';
import { distinctUntilChanged } from 'rxjs/operators';
import * as uuid from 'uuid';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AppBlobService {
  private sasData: any;

  constructor(
    private sasGenerator: SasGeneratorService,
    private cachingService: CachingService
  ) {
    this.sasGenerator.getSasToken().subscribe(sasInfo => {
      this.sasData = sasInfo;
    });
  }

  public checkBlobExists(filename, container) {

    // check if filename was checked to exist in the last 5 minutes.
    const obs = this.cachingService.checkObsCache(filename, 'blobExists', 300);
    if (obs) {
      return obs;
    }

    // if not in cache check exists.
    return this.getExists(filename, container);
  }

  public listBlobs(container: string, maxItems = 20, continuation = null, prefix: string = null) {
    return this.listBlobsInContainer(container, maxItems, continuation, prefix);
  }

  public uploadBlob(container: string, file: File | Blob, type?: string, guid?: string, metadata?: any) {
    if (!guid) {
      guid = uuid.v4();
    }

    const prefix = this.getDocumentPrefix(type);
    return this.uploadBlobToContainer(container, file, guid, prefix, metadata);
  }

  public downloadBlob(filename: string, container: string) {
    return this.returnDownloadBlob(filename, container);
  }

  public getBlobMetadata(filename: string, container: string): any {
    return this.returnBlobMetadata(filename, container);
  }

  private getDocumentPrefix(type) {
    if (type) {
      if (type === 'image') {
        return 'media/images/';
      } else if (type === 'video') {
        return 'media/videos/';
      } else {
        return 'documents/';
      }
    } else {
      return '';
    }
  }

  private returnDownloadBlob(filename: string, container: string) {
    const blobServiceClient = new BlobServiceClient(`${this.sasData.storageUri}?${this.sasData.storageAccessToken}`);
    const containerClient = blobServiceClient.getContainerClient(container);
    const blobClient = containerClient.getBlockBlobClient(filename);
    return from(blobClient.download());
  }

  private returnBlobMetadata(filename: string, container: string) {
    const blobServiceClient = new BlobServiceClient(`${this.sasData.storageUri}?${this.sasData.storageAccessToken}`);
    const containerClient = blobServiceClient.getContainerClient(container);
    const blobClient = containerClient.getBlockBlobClient(filename);
    return from(blobClient.getProperties());
  }

  private getExists(filename, container) {
    this.getSasToken();
    // Create a new BlobServiceClient
    const blobServiceClient = new BlobServiceClient(`${this.sasData.storageUri}?${this.sasData.storageAccessToken}`);

    // Get a container client from the BlobServiceClient
    const containerClient = blobServiceClient.getContainerClient(container);
    const blobClient = containerClient.getBlockBlobClient(filename);
    const obs = from(blobClient.exists());
    this.cachingService.addToObsCache(filename, 'blobExists', obs);
    return obs;
  }

  private listBlobsInContainer(container, maxItems, continuation, prefix = null) {
    const blobServiceClient = new BlobServiceClient(`${this.sasData.storageUri}?${this.sasData.storageAccessToken}`);
    const containerName = container;
    const containerClient = blobServiceClient.getContainerClient(container);

    const req: any = { maxPageSize: maxItems };
    if (continuation) {
      req.continuationToken = continuation;
    }

    const listOptions: any = {
      includeMetadata: true
    };
    if (prefix) {
      listOptions.prefix = prefix + '/';
    }

    const iterator = containerClient.listBlobsFlat(listOptions).byPage(req);
    return from(iterator.next());
  }

  private async uploadBlobToContainer(container: string, file: File | Blob, guid: string, prefix: string, metadata: any) {
    this.getSasToken();

    // Create a unique name for the blob
    const blobServiceClient = new BlobServiceClient(`${this.sasData.storageUri}?${this.sasData.storageAccessToken}`);
    const containerClient = blobServiceClient.getContainerClient(container);

    // if container does not exist create the container
    const exists = await containerClient.exists();
    if (!exists) {
      await containerClient.create();
    }

    // Get a block blob client
    const blockBlobClient = containerClient.getBlockBlobClient(prefix + guid);

    return this.uploadFile(blockBlobClient, file, guid, container, prefix, metadata);
  }

  // tslint:disable-next-line:max-line-length
  private uploadFile(blockBlobClient: BlockBlobClient, file: File | Blob, guid: string, container: string, prefix: string, metadata: any) {
    this.getSasToken();
    return new Observable<{ loadedBytes: number, progress: number, guid: string, uri: string }>(observer => {
      blockBlobClient
        .uploadBrowserData(file, {
          onProgress: this.onProgress(observer, file, guid),
          blobHTTPHeaders: {
            blobContentType: file.type
          },
          metadata
        })
        .then(
          this.onUploadComplete(observer, file, guid, prefix, container),
          this.onUploadError(observer)
        );
    }).pipe(distinctUntilChanged());
  }

  // tslint:disable-next-line:max-line-length
  private onProgress(observer: Subscriber<{ loadedBytes: number, progress: number, guid: string, uri: string }>, file: File | Blob, guid: string) {
    return progress => {
      const progData = {
        loadedBytes: progress.loadedBytes,
        progress: parseInt(((progress.loadedBytes / file.size) * 100).toString(), 10),
        guid,
        uri: null
      };
      observer.next(progData);
    };
  }

  private onUploadError(observer: Subscriber<{ loadedBytes: number, progress: number, guid: string, uri: string }>) {
    return (error: any) => observer.error(error);
  }

  // tslint:disable-next-line:max-line-length
  private onUploadComplete(observer: Subscriber<{ loadedBytes: number, progress: number, guid: string, uri: string }>, file: File | Blob, guid: string, prefix: string, container: string) {
    return progress => {
      const progData = {
        loadedBytes: file.size,
        progress: 100,
        guid,
        uri: environment.blobStorage.storageUri + container + '/' + prefix + guid
      };
      observer.next(progData);
      observer.complete();
    };
  }

  private getSasToken() {
    const subs = this.sasGenerator.getSasToken().subscribe(sas => {
      this.sasData = sas;
    });
  }


  /**
   * A function to copy a file from one container to another.
   * @param filePath the path to the file you with to copy (minus the container).
   * @param fromContainer the container that containes the file to copy.
   * @param toFilename the filename you wish to set for the new file (without a path).
   * @param toContainer the container you wish to copy the file to.
   * @param fileType the type of file that is being copied.
   */
  // tslint:disable-next-line:max-line-length
  public async copyBlobToContainer(filePath: string, fromContainer: string, toFilename: string, toContainer: string, fileType: 'image' | 'video' | 'document') {
    const downloadPromise = this.downloadBlob(filePath, fromContainer).toPromise();

    let blobPromise;
    await downloadPromise.then(async (res) => {
      blobPromise = res.blobBody;
    });

    let blobFile;
    await blobPromise.then(blob => {
      blobFile = blob;
    });

    return this.uploadBlob(toContainer, blobFile, fileType, toFilename, null);
  }
}
