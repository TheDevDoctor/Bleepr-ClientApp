import { Injectable } from '@angular/core';
import { from, OperatorFunction, Subject } from 'rxjs';
import { map, mergeMap, startWith, switchMap } from 'rxjs/operators';
import { BlobContainerRequest, BlobItemUpload } from '../../models/azure-storage';
import { BlobSharedViewStateService } from './blob-shared-view-state.service';
import { BlobStorageService } from './blob-storage.service';

@Injectable({
  providedIn: 'root'
})
export class BlobUploadsViewStateService {

  private uploadQueueInner$ = new Subject<any[]>();

  uploadedItems$ = this.uploadQueue$.pipe(
    mergeMap(file => this.uploadFile(file)),
    this.blobState.scanEntries()
  );

  get uploadQueue$() {
    return this.uploadQueueInner$
      .asObservable()
      .pipe(mergeMap(files => from(files)));
  }

  constructor(
    private blobStorage: BlobStorageService,
    private blobState: BlobSharedViewStateService,
  ) {
  }


  uploadItems(files: Array<{ file: File, filename: string, container: string }>): void {
    this.uploadQueueInner$.next(files);
  }

  // hard coded container name as not sure how he was getting container name before.
  // Not sure his method is needed, should just send with uploadItems();
  private uploadFile = (file: any) =>
    this.blobState.getStorageOptionsWithContainer().pipe(
      switchMap(options =>
        this.blobStorage
          .uploadToBlobStorage(file.file, {
            ...options,
            filename: file.filename,
            containerName: file.container
          })
          .pipe(
            this.mapUploadResponse(file, options),
            this.blobState.finaliseBlobChange(options.containerName)
          )
      )
    )

  private mapUploadResponse = (
    fileData: any,
    options: BlobContainerRequest
  ): OperatorFunction<number, BlobItemUpload> => source =>
      source.pipe(
        map(progress => ({
          filename: fileData.filename,
          containerName: options.containerName,
          progress: parseInt(((progress / fileData.file.size) * 100).toString(), 10)
        })),
        startWith({
          filename: fileData.filename,
          containerName: options.containerName,
          progress: 0
        })
      )
}
