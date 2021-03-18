import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { UserService } from 'src/app/services/user.service';
import { NgxLinkifyjsService } from 'ngx-linkifyjs';
import { BleepsService } from 'src/app/services/bleeps.service';
import { environment } from 'src/environments/environment';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { SasGeneratorService } from 'src/app/services/blob_storage/sas-generator.service';
import { UserMediaModalPage } from 'src/app/modals/user-media-modal/user-media-modal.page';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { YoutubeService } from 'src/app/services/youtube.service';

@Component({
  selector: 'app-bleep-modal',
  templateUrl: './post.page.html',
  styleUrls: ['./post.page.scss'],
})
export class BleepModalPage implements OnInit {
  @ViewChild('fileInput') fileInput: ElementRef<
    HTMLInputElement
  >;
  @ViewChild('imageInput') imageInput: ElementRef<
    HTMLInputElement
  >;
  @ViewChild('videoInput') videoInput: ElementRef<
    HTMLInputElement
  >;

  public searchOptions = [
    {
      name: 'Add Image',
      color: 'primary',
      icon: 'images',
      active: true
    },
    {
      name: 'Add Video',
      color: 'secondary',
      icon: 'videocam',
      active: true
    },
    {
      name: 'Add File',
      color: 'success',
      icon: 'document',
      active: true
    }
  ];

  @Input() sharedBleep: any;
  @Input() articleId: any;
  @Input() article: any;
  @Input() bleep: any;

  public bleepForm: FormGroup;
  public canAddMedia: boolean;

  public sasToken: string;
  public bodyText: string;
  public linkPreview: any;
  public user: any;
  public baseUri: string;
  public isUploading: boolean;
  public youtubeVideo: SafeUrl;

  public profilePic = 'assets/blank_user.svg';

  constructor(
    public modalController: ModalController,
    public domSanitizer: DomSanitizer,
    private userService: UserService,
    private linky: NgxLinkifyjsService,
    private bleepsService: BleepsService,
    private fb: FormBuilder,
    private sasGenerator: SasGeneratorService,
    private youtubeService: YoutubeService,
  ) { }

  /**
   * Getter for referenceForm Authors property to resolve AoT build errors
   * @see https://github.com/angular/angular-cli/issues/6099
   */
  public get bleepFormImages() {
    return this.bleepForm.get('image') as FormArray;
  }

  public get bleepFormDocuments() {
    return this.bleepForm.get('document') as FormArray;
  }

  public get bleepFormVideos() {
    return this.bleepForm.get('video') as FormArray;
  }

  public get bleepFormTags() {
    return this.bleepForm.get('tags') as FormArray;
  }

  ngOnInit() {
    this.sasGenerator.getSasToken().subscribe(req => {
      this.sasToken = req.storageAccessToken;
    });

    this.userService.returnUser().subscribe(user => {
      this.user = user;
      if (this.user.profilePic) {
        this.profilePic = user.profilePic + '?' + this.sasToken;
      }
    });
    this.baseUri = environment.blobStorage.storageUri;

    this.createBleepForm();
  }

  createBleepForm() {
    this.bleepForm = this.fb.group({
      body: [null, [Validators.required]],
      type: ['basic', [Validators.required]],
      articleId: [null],
      image: this.fb.array([]),
      link: this.fb.array([]),
      video: this.fb.array([]),
      document: this.fb.array([]),
      tags: this.fb.array([]),
      shared: [null, [Validators.required]],
      privacy: ['public', [Validators.required]]
    });

    if (this.bleep) {
      this.setFormValue(this.bleep);
    }

    if (this.sharedBleep) {
      this.bleepForm.controls.type.setValue('share');
    } else if (this.articleId) {
      this.bleepForm.controls.articleId.setValue(this.articleId);
      this.bleepForm.controls.type.setValue('article');
    } else if (this.article) {
      this.bleepForm.controls.articleId.setValue(this.article.id);
      this.bleepForm.controls.type.setValue('article');
    }

    this.bleepForm.controls.image.valueChanges.subscribe(img => this.changeBleepType(img, 'image'));
    this.bleepForm.controls.video.valueChanges.subscribe(vid => this.changeBleepType(vid, 'video'));
    this.bleepForm.controls.document.valueChanges.subscribe(document => this.changeBleepType(document, 'document'));
    this.bleepForm.controls.body.valueChanges.pipe(
      debounceTime(200),
      distinctUntilChanged(),
    ).subscribe(text => this.bleepBodyChanged(text));
  }

  setFormValue(bleep) {
    const iterables = ['image', 'link', 'video', 'document'];
    iterables.forEach(option => {
      const arr = this.bleepForm.get(option) as FormArray;
      while (arr.length) {
        arr.removeAt(0);
      }
    });
    this.bleepForm.patchValue(bleep);
    iterables.forEach(option => {
      if (bleep[option]) {
        const arr = this.bleepForm.get(option) as FormArray;
        if (option === 'image' || option === 'video') {
          bleep[option].forEach(img => {
            if (option === 'image') {
              if (img.type === 'blob') {
                this.addItemToArray(option, this.buildResourceForm(img.source,
                  `${environment.blobStorage.storageUri + bleep.createdById}/media/images/${img.source}`, img.type));
              } else {
                this.addItemToArray(option, this.buildResourceForm(img.source, img.source, img.type));
              }
            } else if (option === 'video') {
              if (img.type === 'blob') {
                this.addItemToArray('video', this.buildResourceForm(img.source,
                  `${environment.blobStorage.storageUri + bleep.createdById}/media/videos/${img.source}`, img.type));
              } else if (img.type === 'youtube') {
                this.addItemToArray(option, this.buildResourceForm(img.source, img.source, img.type));
                this.youtubeVideo = this.domSanitizer.bypassSecurityTrustResourceUrl(img.source);
              }
            }
          });
        }
      }
    });
  }

  private changeBleepType(data, type) {
    if (data.length > 0) {
      this.bleepForm.controls.type.setValue(type);
    } else {
      this.bleepForm.controls.type.setValue('basic');
    }
  }

  addItemToArray(type: string, value: FormGroup) {
    const formArr = this.bleepForm.get(type) as FormArray;
    formArr.push(value);
  }

  public dismiss(bleepSent) {
    this.modalController.dismiss({
      dismissed: true,
      bleepSent
    });
  }

  public searchOptionPressed(i) {
    // this.searchOptions[i].func();
    if (i === 0) {
      this.getPhoto();
    } else if (i === 1) {
      this.getVideo();
    } else if (i === 2) {
      this.getDocument();
    }
  }

  getPhoto() {
    this.presentMediaModal('image');
  }
  getVideo() {
    this.presentMediaModal('video');
  }
  getDocument() {
    this.presentMediaModal('document');
  }

  async presentMediaModal(type = 'any') {
    const modal = await this.modalController.create({
      component: UserMediaModalPage,
      componentProps: {
        fileType: type
      }
    });

    modal.onDidDismiss()
      .then((data) => {
        if (data.data) {
          const mediaData = data.data;

          if (mediaData.type) {
            this.addMediaItem(mediaData);
          }
        }
      });

    return await modal.present();
  }

  private addMediaItem(mediaData) {
    if (mediaData.type === 'image') {
      this.addItemToArray('image', this.buildResourceForm(mediaData.guid, mediaData.uri, mediaData.source));
    } else if (mediaData.type === 'video') {
      this.addItemToArray('video', this.buildResourceForm(mediaData.guid, mediaData.uri, mediaData.source));
      if (mediaData.source === 'youtube') {
        this.youtubeVideo = this.domSanitizer.bypassSecurityTrustResourceUrl(mediaData.uri);
      }
    } else if (mediaData.type === 'document') {
      if (mediaData.source === 'blob') {
        this.addItemToArray('document', this.buildResourceForm(mediaData.guid, mediaData.uri, 'blob'));
      }
    }
  }

  buildResourceForm(guid: string, uri: string, source: string) {
    if (source === 'blob') {
      return this.fb.group({
        guid: [guid, [Validators.required]],
        uri: [`${uri}?${this.sasToken}`, [Validators.required]],
        source: [source, [Validators.required]]
      });
    } else {
      return this.fb.group({
        guid: [guid, [Validators.required]],
        uri: [uri, [Validators.required]],
        source: [source, [Validators.required]]
      });
    }
  }

  bleepBodyChanged(text) {
    // check for hastags:
    const regexp = /\B\#\w\w+\b/g;
    const result = text.match(regexp);
    let tags = [];
    if (result !== null) {
      tags = result.map(tag => (tag = tag.substring(1)));
    }
    this.bleepForm.setControl('tags', this.fb.array(tags));

    // check for links:
    if (this.bleepForm.controls.type.value === 'basic') {
      this.checkForLink(text);
    }
  }

  checkForLink(text) {
    const links: string[] = this.linky.find(text).map(lnk => lnk.value);
    let link: string;
    if (links.length > 0) {
      link = links[0];

      const youtubeLink = this.youtubeService.returnYoutubeEmbedLink(link);

      if (youtubeLink) {
        this.addMediaItem({ guid: null, uri: youtubeLink, source: 'youtube', type: 'video' });
      } else {
        this.bleepForm.setControl('link', this.fb.array(links));

        if (link && (!this.linkPreview || this.linkPreview.url !== link)) {
          this.bleepsService.getLinkPreview(link).subscribe(linkPrev => {
            this.linkPreview = linkPrev;
          });
        } else if (!link) {
          this.linkPreview = null;
        }

        // change the bleep type aslong as other media is not already loading;
        const currType = this.bleepForm.controls.type.value;
        if (currType === 'basic' || currType === 'link') {
          this.changeBleepType(links, 'link');
        }
      }
    }
  }

  removePhoto() {
    const formArr = this.bleepForm.get('image') as FormArray;
    formArr.clear();
  }

  removeVideo() {
    const formArr = this.bleepForm.get('video') as FormArray;
    formArr.clear();
  }

  sendBleep() {
    if (this.sharedBleep !== undefined) {
      // this.postType = 'share';
      this.bleepForm.controls.type.setValue('share');
      this.bleepForm.controls.shared.setValue(this.sharedBleep.id);
    }

    const data = this.bleepForm.value;

    this.isUploading = true;
    this.bleepsService.createBleep(data).subscribe(res => {
      if (res.ok) {
        this.isUploading = false;
        this.dismiss(true);
      }
    });
  }

  updateBleep() {
    this.bleepsService.updateBleep(this.bleep, this.bleepForm.value);
    this.dismiss(true);
  }

  privacyStatusChanged(ev) {
    console.log(ev);
  }
}
