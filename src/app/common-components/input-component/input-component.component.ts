import { Component, ElementRef, ViewChild } from '@angular/core';
import { BlobUploadsViewStateService } from '../../services/blob_storage/blob-uploads-view-state.service';

@Component({
  selector: 'app-input-file',
  template: `
    <input
      style="display: none"
      type="file"
      #fileInput
      multiple="multiple"
      (change)="onSelected($event.target.files)"
    />
    <button (click)="showFileDialog()">Click here to Upload File</button>
  `
})
export class InputFileComponent {
  @ViewChild('fileInput') fileInput: ElementRef<
    HTMLInputElement
  >;

  constructor(private blobState: BlobUploadsViewStateService) {}

  onSelected(files: FileList): void {
    const fl = files[0];
    const testFl = [];
    testFl.push(fl);
    this.blobState.uploadItems(testFl);
    this.fileInput.nativeElement.value = '';
  }

  showFileDialog(): void {
    this.fileInput.nativeElement.click();
  }
}
