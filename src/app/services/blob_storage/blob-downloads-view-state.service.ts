import { Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { BlobDownloadResponseModel } from '@azure/storage-blob';
import { from, OperatorFunction, Subject } from 'rxjs';
import { map, mergeMap, startWith, switchMap } from 'rxjs/operators';
import { BlobContainerRequest, BlobItemDownload } from '../../models/azure-storage';
import { BlobSharedViewStateService } from './blob-shared-view-state.service';
import { BlobStorageService } from './blob-storage.service';

@Injectable({
  providedIn: 'root'
})
export class BlobDownloadsViewStateService {
  private downloadQueueInner$ = new Subject<any>();

  downloadedItems$ = this.downloadQueue$.pipe(
    mergeMap(filename => this.downloadFile(filename)),
    this.blobState.scanEntries()
  );

  get downloadQueue$() {
    return this.downloadQueueInner$.asObservable();
  }

  constructor(
    private blobStorage: BlobStorageService,
    private blobState: BlobSharedViewStateService,
    private sanitizer: DomSanitizer
  ) {}

  downloadItem(file: { filename: string, container: string }): void {
    this.downloadQueueInner$.next(file);
  }

  private downloadFile = (file: any) =>
    this.blobState.getStorageOptionsWithContainer(file.container).pipe(
      switchMap(options =>
        this.blobStorage
          .downloadBlobItem({
            ...options,
            filename: file.filename
          })
          .pipe(
            this.getDownloadUrlFromResponse(),
            this.mapDownloadResponse(file.filename, options)
          )
      )
    )

  private mapDownloadResponse = (
    filename: string,
    options: BlobContainerRequest
  ): OperatorFunction<string, BlobItemDownload> => source =>
    source.pipe(
      map(url => ({
        filename,
        containerName: options.containerName,
        url
      })),
      startWith({
        filename,
        containerName: options.containerName,
        url: ''
      })
    )

  private getDownloadUrlFromResponse = (): OperatorFunction<
    BlobDownloadResponseModel,
    string
  > => source =>
    source.pipe(
      switchMap(res =>
        from(res.blobBody).pipe(
          map(body => window.URL.createObjectURL(body)),
          map(url => this.sanitizer.bypassSecurityTrustUrl(url) as string)
        )
      )
    )
}
