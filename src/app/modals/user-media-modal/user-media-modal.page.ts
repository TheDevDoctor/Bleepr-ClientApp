import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';
import { AppBlobService } from 'src/app/services/blob_storage/app-blob-service.service';
import { UserService } from 'src/app/services/user.service';
import { SasGeneratorService } from 'src/app/services/blob_storage/sas-generator.service';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { IonInfiniteScroll, ModalController, PopoverController } from '@ionic/angular';
import * as uuid from 'uuid';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { delay } from 'rxjs/operators';
import { FilterPopoverComponent } from './filter-popover/filter-popover.component';
import { MediaType } from '@ionic-native/camera/ngx';
import { UnsplashService } from 'src/app/services/unsplash.service';
import { YoutubeService } from 'src/app/services/youtube.service';

/**
 * HOW TO USE USER MEDIA MODAL:
 * 
 * Simple modal to use. Declared  as you would declare any other modal. Should you want to allow only a particular file type, then
 * you must declare it in the fileType component input variable. You can declare 3 file types; image, video, or document. Should you
 * not declare this variable then the modal will allow all file types to be returned.
 * 
 * One an item has been selected and the modal dismissed, the output will be returned as an object in the onDidDismiss() modal func.
 * 
 * The structure of this object is as follows:
 * 
 *    {
 *      type: 'video' | 'image' | 'document',
 *       source: 'blob' | 'unsplash' | 'youtube',
 *       guid: guid of blob item (null if unsplash or youtube),
 *       uri: uri (not safe URI and does not include SasToken),
 *       safeUri: Safe Uri including sastoken if blob, this value should be used for displaying the content in app,
 *       filename: the filename of a document, only relevant for documents, will be null if video or image
 *     };
 * 
 *   It is up to you how you handle the user media selected. Though some general rules:
 * 
 *   1) When storing in the database if the item is blob you should store its guid, if it is youtube or unsplash
 *   you should store its uri (not safeUri)
 * 
 *   2) The safe uri should be user for displaying the content within the app. This should always work.
 * 
 *   3) Filename is only relevant for documents, this is currently not editable but I hope to make it editable
 *   in the future.
 */
@Component({
  selector: 'app-user-media-modal',
  templateUrl: './user-media-modal.page.html',
  styleUrls: ['./user-media-modal.page.scss'],
})
export class UserMediaModalPage implements OnInit {
  @ViewChild(IonInfiniteScroll) infiniteScroll: IonInfiniteScroll;
  @ViewChild('fileInput') fileInput: ElementRef<HTMLInputElement>;

  // the file type that you would like to get, if left blank then user will be able to select all file types.
  // Declare this in component props when requesting a file if you want only on particlur file type. E.g. Images
  @Input() fileType: 'image' | 'video' | 'document' | 'any';

  /**
   * The container to upload to, if not supplied is set automatically
   */
  @Input() container;

  /**
   * The filename of the item to upload, if not supplied is set automatically
   */
  @Input() filename;

  /**
   * If set to false will not upload to blob if new file, this needs to be handled in code seperately.
   */
  @Input() autoUpload = true;

  @Input() unsplash = true;
  @Input() youtube = true;

  public blobs: any[];
  public baseUri: string = environment.blobStorage.storageUri;
  private userId: string;
  private continuationToken: string;
  public sasToken: string;
  public acceptType = '*';
  public blobUploading = false;
  public uploadProgress: number;
  public currentView = 'my media';
  public previousView;
  public filter: any = {
    documentsType: {
      excel: true,
      other: true,
      pdf: true,
      powerpoint: true,
      word: true
    },
    fileType: 'media',
    mediaType: {
      image: true,
      video: true
    }
  };

  unsplashTotalPages: number;
  unsplashResultCount: number;
  unsplashResults: any[] = [];
  unsplashCurrentPage: number;
  unsplashSearchText: string;

  private subscriptions: Subscription[];

  public mediaSelected: { type: string, source: string, guid: string, uri: string, safeUri: SafeUrl, filename: string, sasToken?: string, file?: File };

  constructor(
    private appBlobService: AppBlobService,
    private userService: UserService,
    private sasGenerator: SasGeneratorService,
    private modalController: ModalController,
    public domSanitizer: DomSanitizer,
    private popoverController: PopoverController,
    private unsplashService: UnsplashService,
    private youtubeService: YoutubeService
  ) { }

  ngOnInit() {}

  ionViewWillEnter() {
    this.sortFileType();

    const userSubs = this.userService.returnUser().subscribe(user => {
      this.userId = user.fragment.userId;
      this.getBlobs();

      if (!this.container) {
        this.container = this.userId;
      }
    });
    this.subscriptions = [userSubs];

    this.mediaSelected = null;
  }

  ionViewWillLeave() {
    // unsubscribe from each observable
    this.subscriptions.forEach(subs => {
      subs.unsubscribe();
    });
  }

  /*
    Sorts the file type depending on what is declared on the fileType input.
    If fileType is not given as input in componentProps, then will get any file.
  */
  sortFileType() {
    if (this.fileType === 'image') {
      this.filter.fileType = 'media';
      this.filter.mediaType.video = false;
      this.acceptType = 'image/*';
    } else if (this.fileType === 'video') {
      this.filter.fileType = 'media';
      this.filter.mediaType.image = false;
      this.acceptType = 'video/*';
    } else if (this.fileType === 'document') {
      this.filter.fileType = 'documents';
      // tslint:disable-next-line:max-line-length
      this.acceptType = '.pdf, .doc, .docx, .pptx, .ppt, .xls, .xlsx, .csv, .pages';
    } else {
      this.filter.fileType = 'media';
      this.filter.mediaType.image = true;
      this.filter.mediaType.video = true;
      this.acceptType = '*';
    }
  }

  private getBlobs() {
    let prefix = this.filter.fileType;

    if (this.filter.fileType === 'media') {
      if (this.filter.mediaType.image && !this.filter.mediaType.video) {
        prefix += '/images';
      } else if (!this.filter.mediaType.image && this.filter.mediaType.video) {
        prefix += '/videos';
      }
    }


    const sasSubs = this.sasGenerator.getSasToken().subscribe(sas => {
      this.sasToken = sas.storageAccessToken;

      const blobsList = this.appBlobService.listBlobs(this.userId, 20, this.continuationToken, prefix).subscribe(data => {
        data.value.segment.blobItems.map(blob => {
          blob.uri = `${data.value.serviceEndpoint + data.value.containerName}/${blob.name}`;
          const guidArr = blob.name.split('/');
          const guid = guidArr[guidArr.length - 1];
          blob.guid = guid;

          const arr = blob.properties.contentType.split('/');
          blob.mediaType = arr[0];
          blob.fileType = arr[arr.length - 1];

          if (blob.mediaType !== 'image' || blob.mediaType !== 'video') {
            blob.filename = blob.metadata.filename;
          }
        });
        if (!this.blobs) {
          this.blobs = [];
        }
        this.blobs = this.blobs.concat(data.value.segment.blobItems);
        this.continuationToken = data.value.continuationToken;
        this.infiniteScroll.complete();
        if (!this.continuationToken) {
          this.infiniteScroll.disabled = true;
        }
        sasSubs.unsubscribe();
        blobsList.unsubscribe();
      });
    });
  }

  public blobImageSelected(index) {
    this.mediaSelected = {
      type: 'image',
      source: 'blob',
      guid: this.blobs[index].guid,
      uri: this.blobs[index].uri,
      safeUri: this.domSanitizer.bypassSecurityTrustResourceUrl(this.blobs[index].uri + '?' + this.sasToken),
      filename: null
    };
    this.previewMedia();
  }

  public blobVideoSelected(index) {
    this.mediaSelected = {
      type: 'video',
      source: 'blob',
      guid: this.blobs[index].guid,
      uri: this.blobs[index].uri,
      safeUri: this.domSanitizer.bypassSecurityTrustResourceUrl(this.blobs[index].uri + '?' + this.sasToken),
      filename: null
    };
    this.previewMedia();
  }

  public blobDocumentSelected(index) {
    this.mediaSelected = {
      type: 'document',
      source: 'blob',
      guid: this.blobs[index].guid,
      uri: this.blobs[index].uri,
      safeUri: this.domSanitizer.bypassSecurityTrustResourceUrl(this.blobs[index].uri + '?' + this.sasToken),
      filename: this.blobs[index].filename
    };
    this.dismissModal(true);
  }

  private previewMedia() {
    this.setCurrentView('preview');
  }

  public cancelPreview() {
    this.setPreviousView();
    this.mediaSelected = null;
  }

  public onFilterPopover(ev) {
    this.presentFilterPopover(ev);
  }

  /**
   * Dismess the modal. If with data then dismiss with the media that has been selected.
   * @param withData: if true dismiss with the selected media item, otherwise just dismiss.
   */
  public dismissModal(withData: boolean) {
    if (withData) {
      this.modalController.dismiss(this.mediaSelected);
    } else {
      this.modalController.dismiss();
    }
  }

  public loadMoreResults(ev) {
    if (this.currentView === 'my media' || this.currentView === 'documents') {
      this.getBlobs();
    } else if (this.currentView === 'unsplash') {
      this.queryUnsplash();
    }
  }

  public onUploadFile() {
    this.fileInput.nativeElement.click();
  }

  /**
   * Called when a file is selected from the users device to upload. TODO: Currently restricted to one
   * file, but will want to expand this when the ability to display multiple in the UI is available
   * @param files: the files selected
   */
  public onSelectedFile(files) {
    const file = files[0];
    const uri = URL.createObjectURL(files[0]);
    const guid = uuid.v4();

    let type = file.type.split('/')[0];
    if (type !== 'image' && type !== 'video') {
      type = 'document';
    }

    this.mediaSelected = {
      type,
      source: 'local',
      guid,
      uri,
      safeUri: this.domSanitizer.bypassSecurityTrustResourceUrl(uri),
      filename: file.name,
      file
    };

    const metadata = { filename: file.name };

    if (this.autoUpload) {
      this.uploadFile(file, type, metadata);
      this.blobUploading = true;
    }

    this.setCurrentView('preview');
  }

  /**
   * Upload the file to blob storage
   * @param file the file to upload
   * @param fileType type of file uploaded
   * @param metadata (optional) metadata associated with file to be stored in blob metadata
   */
  private async uploadFile(file: File, fileType: string, metadata?: any) {

    if (!this.filename) {
      this.filename = uuid.v4();
    }

    const subscription = await this.appBlobService.uploadBlob(this.container, file, fileType, this.filename, metadata);
    subscription.subscribe(data => {
      this.uploadProgress = data.progress / 100;
      if (data.uri) {
        setTimeout(() => {
          this.mediaSelected = {
            type: fileType,
            source: 'blob',
            guid: data.guid,
            uri: `${data.uri}`,
            safeUri: this.domSanitizer.bypassSecurityTrustResourceUrl(data.uri + '?' + this.sasToken),
            sasToken: this.sasToken,
            filename: metadata.filename
          };
          this.blobUploading = false;
        }, 1000);
      }
    });
  }

  private async presentFilterPopover(ev: any) {
    const popover = await this.popoverController.create({
      component: FilterPopoverComponent,
      componentProps: {
        filterSettings: this.filter
      },
      event: ev,
      translucent: true
    });

    popover.onWillDismiss().then(data => {
      if (data.data) {
        const diff = this.checkFilterChanged(data.data);
        if (diff) {
          this.filter = data.data;
          this.blobs = [];
          this.continuationToken = null;
          this.getBlobs();
          this.infiniteScroll.disabled = false;
        }
      }
    });
    return await popover.present();
  }

  private checkFilterChanged(filt) {
    if (this.filter.fileType !== filt.fileType) {
      return true;
    }
    for (const el of Object.keys(filt.mediaType)) {
      if (filt.mediaType[el] !== this.filter.mediaType[el]) {
        return true;
      }
    }

    for (const el of Object.keys(filt.documentsType)) {
      if (filt.documentsType[el] !== this.filter.documentsType[el]) {
        return true;
      }
    }

    return false;
  }

  public onBackMyMedia() {
    this.setCurrentView('my media');
  }

  private setCurrentView(view) {
    this.previousView = this.currentView;
    this.currentView = view;
  }

  public setPreviousView() {
    this.currentView = this.previousView;
  }

  // UNSPLASH ============================================================================================================================
  public onSearchUnsplash() {
    this.setCurrentView('unsplash');
  }

  public unsplashSearchChanged(ev) {
    this.unsplashSearchText = ev.detail.value;
    this.unsplashCurrentPage = 1;
  }

  public unsplashSearchPressed(event) {
    this.infiniteScroll.disabled = false;
    this.queryUnsplash();
    if (this.unsplashResults.length > 0) {
      this.unsplashResults = [];
    }
  }

  private queryUnsplash() {
    if (this.unsplashSearchText.length > 1) {
      const subs = this.unsplashService.queryUnsplash(this.unsplashSearchText, this.unsplashCurrentPage).subscribe(data => {

        this.unsplashTotalPages = data.total_pages;
        this.unsplashResultCount = data.total;
        this.unsplashResults = this.unsplashResults.concat(data.results);
        this.unsplashCurrentPage++;
        this.infiniteScroll.complete();

        if (this.unsplashCurrentPage > this.unsplashTotalPages) {
          this.infiniteScroll.disabled = true;
        }
        subs.unsubscribe();
      });
    }
  }

  public unsplashImageSelected(i) {
    this.mediaSelected = {
      type: 'image',
      source: 'unsplash',
      guid: null,
      uri: this.unsplashResults[i].urls.regular,
      safeUri: this.domSanitizer.bypassSecurityTrustResourceUrl(this.unsplashResults[i].urls.regular),
      filename: this.unsplashResults[i].description
    };

    this.setCurrentView('preview');
  }

  ionDidDidLeave() {
    this.subscriptions.forEach(subs => subs.unsubscribe());
  }

  // YOUTUBE EMBED =====================================================================================================================
  public onEmbedYoutube() {
    this.mediaSelected = null;
    this.setCurrentView('youtube');
  }

  public onYoutubeLink(ev) {
    const link = ev.detail.value;
    const youtubeEmbed = this.youtubeService.returnYoutubeEmbedLink(link);
    if (youtubeEmbed) {
      this.mediaSelected = {
        type: 'video',
        source: 'youtube',
        guid: null,
        uri: youtubeEmbed,
        safeUri: this.domSanitizer.bypassSecurityTrustResourceUrl(youtubeEmbed),
        filename: null
      };
    } else {
      console.log('this is not a valid youtube line: ' + link);
    }
  }
}
