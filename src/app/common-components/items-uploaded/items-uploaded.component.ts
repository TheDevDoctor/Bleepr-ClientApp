import { Component } from '@angular/core';
import { BlobUploadsViewStateService } from '../../services/blob_storage/blob-uploads-view-state.service';

@Component({
  selector: 'app-items-uploaded',
  template: `
    <div style="display: none">
      <h3>Uploads</h3>
      <div *ngFor="let upload of uploads$ | async">
        <pre>{{ upload | json }}</pre>
      </div>
    </div>
  `
})
export class ItemsUploadedComponent {
  uploads$ = this.blobState.uploadedItems$;
  constructor(private blobState: BlobUploadsViewStateService) { }
}
