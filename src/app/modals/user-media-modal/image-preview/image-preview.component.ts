import { Component, OnInit, Input } from '@angular/core';
import { SasGeneratorService } from 'src/app/services/blob_storage/sas-generator.service';

@Component({
  selector: 'app-image-preview',
  templateUrl: './image-preview.component.html',
  styleUrls: ['./image-preview.component.scss'],
})
export class ImagePreviewComponent implements OnInit {
  @Input() mediaData: any;

  public sasToken: string;

  constructor(private sasGenerator: SasGeneratorService) {
    this.sasGenerator.getSasToken().subscribe(sas => {
      this.sasToken = sas.storageAccessToken;
    });
   }

  ngOnInit() {}

}
