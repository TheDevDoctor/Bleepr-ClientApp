import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Platform, ModalController, PopoverController } from '@ionic/angular';
import { Plugins, CameraResultType } from '@capacitor/core';
import { UserService } from 'src/app/services/user.service';
import { DomSanitizer } from '@angular/platform-browser';
import Quill from 'quill';
import { ImageBlot } from 'src/app/editor/blots/ImageBlot';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import 'quill-mention';
import { BlobUploadsViewStateService } from 'src/app/services/blob_storage/blob-uploads-view-state.service';
import { Observable, Subject, Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ImageLoadingBlot } from 'src/app/editor/blots/imageLoadingBlot';
import { VideoBlot } from 'src/app/editor/blots/VideoBlot';
import { DividerBlot } from 'src/app/editor/blots/dividerBlot';
import { ReferenceBlot } from 'src/app/editor/blots/referenceBlot';
import { UserListPage } from '../user-list/user-list.page';
import { ArticleService } from 'src/app/services/article.service';
import { Article } from 'src/app/models/article-types';
import Deletion from 'src/app/editor/modules/deletion';
import * as uuid from 'uuid';
import { ReferenceGeneratorPage } from '../reference-generator/reference-generator.page';
import { ActivatedRoute, Router } from '@angular/router';
import { PublishPopoverComponent } from './publish-popover/publish-popover.component';
import { SasGeneratorService } from 'src/app/services/blob_storage/sas-generator.service';
import { BleepsService } from 'src/app/services/bleeps.service';
import { BleepModalPage } from '../new-bleep-modal/post.page';
import { UnsplashModalComponent } from 'src/app/modals/unsplash-modal/unsplash-modal.component';
import { YoutubeVideoBlot } from 'src/app/editor/blots/youtubeVideoBlot';
import { UserMediaModalPage } from 'src/app/modals/user-media-modal/user-media-modal.page';

const { Camera } = Plugins;

Quill.register('modules/deletion', Deletion);

@Component({
  selector: 'app-case-builder',
  templateUrl: './case-builder.page.html',
  styleUrls: ['./case-builder.page.scss'],
})
export class CaseBuilderPage implements OnInit {

  private editor: Quill;
  private user: any;
  private articleChanged: Subject<any> = new Subject<any>();
  // this is needed to keep track of the references when reformatting.
  private references: any = {};
  private uploads$: Observable<any>;

  @ViewChild('editorToolbar') editorToolbar;
  @ViewChild('scrollContainer') scrollContainer;
  @ViewChild('articleHeader') articleHeader: ElementRef;

  private rangeTracker: any;
  private currentScroll: any;
  private subscriptions: any[];

  public theme;
  public article: Article;
  public isSaved: boolean;
  public sasToken: string;
  public headerImage: any = {
    url: '',
    safeUri: '',
    filename: '',
    blobFile: null,
    style: 'normal'
  };
  public isEdit: boolean;


  // this is needed to keep track of the references when reformatting.
  public actionContainerDisplay = false;
  public actionTop: number;
  public actionLeft: number;
  public actionOpacity = 0;
  public baseUri: string;

  public modules = {
    syntax: true,
    deletion: { container: '#counter', unit: 'word', refs: this.references },
    history: {
      userOnly: true
    },
    toolbar: '#quill-toolbar',
    mention: {
      allowedChars: /^[A-Za-z\sÅÄÖåäö]*$/,
      onSelect: (item, insertItem) => {
        const editor = this.editor.quillEditor as Quill;
        insertItem(item);
        // necessary because quill-mention triggers changes as 'api' instead of 'user'
        this.editor.insertText(this.editor.getLength() - 1, '', 'user');
      },
      source: (searchTerm, renderList) => {
        const values = [
          { id: 1, value: 'Fredrik Sundqvist' },
          { id: 2, value: 'Patrik Sjölin' },
          { id: 3, value: 'Alex Staton' },
          { id: 4, value: 'James Griffin' }
        ];

        if (searchTerm.length === 0) {
          renderList(values, searchTerm);
        } else {
          const matches = [];

          values.forEach((entry) => {
            if (entry.value.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1) {
              matches.push(entry);
            }
          });
          renderList(matches, searchTerm);
        }
      }
    }
  };


  constructor(
    private platform: Platform,
    private userService: UserService,
    private domSanitizer: DomSanitizer,
    private blobState: BlobUploadsViewStateService,
    public modalController: ModalController,
    private articleService: ArticleService,
    private route: ActivatedRoute,
    private popoverController: PopoverController,
    private router: Router,
    private sasGenerator: SasGeneratorService
  ) { }

  ngOnInit() {

    Quill.register(ImageBlot);
    Quill.register(ImageLoadingBlot);
    Quill.register(VideoBlot);
    Quill.register(DividerBlot);
    Quill.register(ReferenceBlot);
    Quill.register(YoutubeVideoBlot);

    if (this.platform.is('ios') || this.platform.is('android')) {
      this.theme = 'snow';
    } else {
      this.theme = 'bubble';
    }
  }

  ionViewWillEnter() {
    const sasSubs = this.sasGenerator.getSasToken().subscribe(req => {
      this.sasToken = req.storageAccessToken;
    });

    const id = this.route.snapshot.paramMap.get('id');

    let articleSubs: Subscription;
    if (id) {
      this.articleService.getArticle(id);
      articleSubs = this.articleService.returnCurrentArticle().subscribe(article => {
        this.article = article;
        if (this.article) {
          this.isSaved = true;
          if (this.article.headerImage && this.article.headerImage.id) {
            // tslint:disable-next-line:max-line-length
            if (this.article.headerImage.source === 'blob') {
              // tslint:disable-next-line:max-line-length
              this.headerImage.url = `${environment.blobStorage.storageUri + this.article.createdById}/media/images/${this.article.headerImage.id}?${this.sasToken}`;
              this.headerImage.safeUri = this.domSanitizer.bypassSecurityTrustResourceUrl(this.headerImage.url);
            } else {
              this.headerImage.url = this.article.headerImage.id;
              this.headerImage.safeUri = this.domSanitizer.bypassSecurityTrustResourceUrl(this.headerImage.url);
            }
          }
        }
      });
    }

    this.articleService.isEditArticle().subscribe(isEdit => this.isEdit = isEdit);

    const userSubs = this.userService.returnUser().subscribe(user => {
      this.user = user;
      if (user && !id) {
        this.article = new Article(this.user.fragment);
        this.articleService.articleSaved = true;
      }
    });

    const savedSubs = this.articleService.isArticleSaved().subscribe(saved => {
      this.isSaved = saved;
      if (this.isSaved && ((this.article.stage === 'published') || (this.article.stage === 'review')) && !this.isEdit) {
        this.router.navigate(['article-viewer', this.article.id]);
      }
    });

    // custom debounce for the purposes of continuous article saving.
    const artChangedSubs = this.articleChanged.pipe(
      debounceTime(1000)
    ).subscribe(article => {
      this.article = article;
      this.article.edited = Date.now();
      this.saveArticle(this.article);
    });

    this.subscriptions = [sasSubs, articleSubs, userSubs, savedSubs, artChangedSubs];
  }

  public cancelHeaderImage() {
    this.headerImage = {
      url: '',
      safeUri: '',
      filename: '',
      blobFile: null,
      style: 'normal'
    };
    this.article.headerImage = null;
    this.saveArticle(this.article);
  }

  segmentChanged($event) {
    this.headerImage.style = $event.detail.value;
    this.article.headerImage.width = $event.detail.value;
    this.articleService.articleSaved = false;
    this.articleChanged.next(this.article);
  }

  onEditorCreated(quill: Quill) {
    this.editor = quill;
    const toolbar = quill.getModule('toolbar');
    toolbar.addHandler('image', this.onAddImage.bind(this));
    toolbar.addHandler('video', this.onAddVideo.bind(this));

    // this.editor.setAttribute('no-blur', true);
    this.editor.root.setAttribute('no-blur', true);

    // toolbar.bolb();


    this.editor.setContents(this.article.content);

    // This was in deletion module but had to move out as could not sort references from module.
    this.editor.on('text-change', (delta, oldContents, source) => {
      const currentContents = quill.getContents();

      const deleted = currentContents.diff(oldContents);

      // check for reference being deleted to remove formatting.
      for (const del of deleted.ops) {
        if (this.hasProp(del, 'attributes') && this.hasProp(del, 'insert') && this.hasProp(del.attributes, 'reference')) {
          // if deleted of type reference then check if the element has been removed from the DOM, i.e. completely deleted.
          // If yes, then element has been removed and references need to be ordered.
          const inDoc = document.getElementById(del.attributes.reference.id) !== null;
          if (!inDoc) {
            this.sortReference();
          }
        }
      }

      // check for reference delete being undone so that references can be resorted.
      for (const i in delta.ops) {
        if (Number(i) < delta.ops.length) {
          if (this.hasProp(delta.ops[i], 'attributes') && this.hasProp(delta.ops[i], 'retain')
            && this.hasProp(delta.ops[i].attributes, 'reference')) {
            this.sortReference();
          }
        }
      }
    });
  }

  contentPasted() {
    let range = this.editor.getSelection(true);
    if (!range) {
      range = this.rangeTracker;
    }
    const bounds = this.editor.getBounds(range.index);
    this.setScroll(bounds);
  }

  // DIVIDER FUNCTION:
  handleDivider() {
    const range = this.editor.getSelection(true);
    this.editor.insertEmbed(range.index, 'divider', true, 'user');
    this.editor.setSelection(range.index + 1, Quill.sources.SILENT);
  }

  // REFERENCE FUNCTIONS:

  handleReference() {
    const format = this.editor.getFormat();
    const range = this.editor.getSelection();

    // if already has refence format, remove. If completely removed from doc then sort references.
    if (this.hasProp(format, 'reference')) {
      this.editor.removeFormat(range.index, range.index + range.length);
      const inDoc = document.getElementById(format.reference.id) !== null;
      if (!inDoc) {
        this.sortReference();
      }
    } else {
      this.presentReferenceGenerator(range);
    }
  }

  async presentReferenceGenerator(range) {
    const modal = await this.modalController.create({
      component: ReferenceGeneratorPage,
      cssClass: 'user-list-custom-modal',
      componentProps: {
        authors: this.article.references
      }
    });

    // when modal is closed add chosen reference to article.
    modal.onDidDismiss()
      .then((ref) => {
        this.addReference(range, ref.data);
      });

    return await modal.present();
  }

  // add reference to article.
  addReference(range, reference) {

    // store reference in references dictionary based on unique doi.
    this.references[reference.doi] = reference;

    // create a guid for id of blots so that both can be deleted when referenceSuper is deleted.
    const id = uuid.v4();
    const data = { reference, id, index: 1 };
    // this.editor.formatText(range.index, range.length, 'reference', data, 'user');
    this.sortReference();
  }

  sortReference() {
    this.article.references = [];
    const range = this.editor.getSelection();
    const contents = this.editor.getContents();
    contents.ops.forEach((item) => {
      if (this.hasProp(item, 'attributes')) {
        if (this.hasProp(item.attributes, 'reference')) {
          // push reference to article references, need to check if already in this appropriately.
          const doi = item.attributes.reference.reference.doi;
          const refIndex = this.isInArray(this.article.references, item.attributes.reference.reference, 'doi');
          if (refIndex === -1) {
            this.article.references.push(this.references[doi]);
            item.attributes.reference.index = String(this.article.references.length);
          } else {
            item.attributes.reference.index = String(refIndex + 1);
          }
        }
      }
    });
    this.editor.setContents(contents);
    if (range) {
      this.editor.setSelection(range.index);
    }
  }

  createAuthorString(reference) {
    let authStr = '';
    reference.authors.forEach((author, index) => {
      const initial = author.firstname.split(/\s/).reduce((response, word) => response += word.slice(0, 1), '');
      authStr += author.surname + ' ' + initial;
      if (index === reference.authors.length - 1) {
        authStr += '. ';
      } else {
        authStr += ', ';
      }
    });

    return authStr;
  }

  // MEDIA FUNCTIONS: =========================================================================================================
  onAddHeaderImage() {
    this.presentMediaModal('image', 'header');
  }

  onAddImage() {
    this.presentMediaModal('image');
  }

  onAddVideo() {
    this.presentMediaModal('video');
  }

  async presentMediaModal(type, caller?: string) {
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
            if (caller === 'header') {
              this.addHeaderImage(mediaData);
            } else {
              this.addMedia(mediaData);
            }
            // this.addMediaItem(mediaData);
          }
        }
      });

    return await modal.present();
  }

  private addMedia(mediaData) {
    if (mediaData.type === 'image') {
      this.addServerImage(mediaData);
    } else if (mediaData.type === 'video') {
      this.addServerVideo(mediaData);
    } else if (mediaData.type === 'document') {

    }
  }

  addServerImage(mediaData) {
    let range = this.editor.getSelection(true);
    if (!range) {
      range = this.rangeTracker;
    }
    // Insert the server saved image
    let value;
    if (mediaData.source === 'blob') {
      value = { alt: '', url: `${mediaData.uri}?${this.sasToken}`, caption: '' };
    } else {
      value = { alt: '', url: mediaData.uri, caption: '' };
    }
    this.editor.insertEmbed(range.index, 'image', value, 'user');
    this.editor.insertText(range.index + 1, '\n', 'user');
    range.index++;
    this.editor.setSelection(range, 'api');
  }

  addServerVideo(mediaData) {

    let range = this.editor.getSelection(true);
    if (!range) {
      range = this.rangeTracker;
    }
    // Insert the server saved image
    let value;
    if (mediaData.source === 'blob') {
      value = { url: `${mediaData.uri}?${this.sasToken}` };
      this.editor.insertEmbed(range.index, 'video', value, 'user');
      this.editor.insertText(range.index + 1, '\n', 'user');
    } else if (mediaData.source === 'youtube') {
      value = { url: mediaData.uri };
      this.editor.insertEmbed(range.index, 'youtubeVideo', value, 'user');
      this.editor.insertText(range.index + 1, '\n', 'user');
    }
    range.index++;
    this.editor.setSelection(range, 'user');
  }

  addHeaderImage(mediaData): void {
    if (mediaData.source === 'blob') {
      this.headerImage = {
        url: mediaData.uri,
        safeUri: this.domSanitizer.bypassSecurityTrustResourceUrl(`${mediaData.uri}?${this.sasToken}`),
        style: 'normal',
      };
      this.article.headerImage = { id: mediaData.guid, width: 'normal', source: mediaData.source };
    } else if (mediaData.source === 'unsplash') {
      this.headerImage = {
        url: mediaData.uri,
        safeUri: this.domSanitizer.bypassSecurityTrustResourceUrl(mediaData.uri),
        style: 'normal'
      };
      this.article.headerImage = { id: mediaData.uri, width: 'normal', source: mediaData.source };
    }
    this.articleChanged.next(this.article);
  }

  // HELPERS:

  hasProp(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
  }

  isInArray(arr, obj, key) {
    return arr.findIndex((e) => e[key] === obj[key]);
  }


  // ACTION BUTTON FUNCTIONS:

  onEditorChanged(content) {
    if (this.editor) {
      const range = this.editor.getSelection();
      if (range) {
        this.rangeTracker = range;
      }

      if (range) {
        // get blot on current line of editor to get text length value.
        const [blot, textLength] = this.editor.getLine(range.index);

        // hide action button if text, otherwise reset position, also hide container if visible.
        this.actionContainerDisplay = false;

        if (textLength === 0) {
          this.actionOpacity = 1;
          const bounds = this.editor.getBounds(range.index);

          // fixing autoscrolling issue!
          this.setScroll(bounds);
          // this.scrollContainer.scrollByPoint(0, bounds.height + 29, 0);
          this.actionTop = bounds.top - 12;
        } else {
          this.actionOpacity = 0;
        }
      }
    }
  }

  actionButtonPressed() {
    if (this.actionContainerDisplay === false) {
      this.actionContainerDisplay = true;
    } else {
      this.actionContainerDisplay = false;
    }
  }


  // ARTICLE AUTHOR FUNCTIONS:
  async presentAuthorList() {
    const modal = await this.modalController.create({
      component: UserListPage,
      cssClass: 'user-list-custom-modal',
      componentProps: {
        authors: this.article.authors
      }
    });

    modal.onDidDismiss()
      .then((data) => {
        this.article.authors = data.data;
        this.articleChanged.next(this.article);
      });

    return await modal.present();
  }

  // SAVING FUNCTIONS:
  saveArticle(article) {
    this.articleService.updateArticle(article, 'save');
  }

  editorContentChanged(editorCont) {
    this.articleService.articleSaved = false;
    this.article.content = editorCont.content.ops;
    this.articleChanged.next(this.article);
  }

  onTitleChanged(title) {
    this.articleService.articleSaved = false;
    this.article.title = title.detail.value;
    this.articleChanged.next(this.article);
  }

  // PUBLISHING FUNCTIONS:
  onPublish() {
    if (this.isEdit) {
      this.article.edited = Date.now();
      this.articleService.doneEditPublishedArticle();
      this.saveArticle(this.article);
    } else {
      this.checkFeedImagePresent();
      this.presentPublishPopover();
    }
  }

  checkFeedImagePresent() {
    if (this.article.headerImage) {
      this.article.feedImage = this.article.headerImage;
    } else if (this.article.images.length > 0) {
      this.article.feedImage = this.article.images[0];
    } else {
      this.article.feedImage = null;
    }
  }

  async presentPublishPopover() {
    const popover = await this.popoverController.create({
      component: PublishPopoverComponent,
      translucent: true,
      cssClass: 'publish-menu-popover',
      componentProps: {
        feedImage: this.article.feedImage,
        user: this.article.createdById
      }
    });

    popover.onDidDismiss().then(data => {
      if (data.data) {
        this.article.feedImage = data.data.feedImage;
        this.presentBleepModal(data);
      }
    });

    return await popover.present();
  }

  private addOptionsToArticle(data) {
    this.article.published = Date.now();
    this.article.stage = 'published';


    this.article.public = true;
    this.article.privacy = 'public';
    this.article.tags = data.data.tags;
    this.article.bleep = this.article.id;
    this.article.inFeed = data.data.feed;
  }

  async presentBleepModal(bleepOptions) {
    const modal = await this.modalController.create({
      component: BleepModalPage,
      componentProps: {
        article: this.article
      }
    });

    modal.onDidDismiss()
      .then((data) => {
        if (data.data) {
          if (data.data.bleepSent) {
            this.addOptionsToArticle(bleepOptions);
            this.saveArticle(this.article);
          }
        }
      });

    return await modal.present();
  }




  // Unsplash Functions:
  public openUnsplashModal() {
    this.presentUnsplashModal();
  }

  private async presentUnsplashModal() {
    const range = this.editor.getSelection(true);
    if (range) {
      this.rangeTracker = range;
    }

    const modal = await this.modalController.create({
      component: UnsplashModalComponent,
      componentProps: {
        search: 'medical'
      }
    });

    modal.onDidDismiss()
      .then((data) => {
        if (data.data) {
          const imageData = data.data;
          this.addUnsplashImage(imageData);
        }
      });

    return await modal.present();
  }

  async addUnsplashImage(imageData) {
    this.actionContainerDisplay = false;

    const image = {
      url: imageData.urls.regular,
      caption: `Photo by ${imageData.user.name} on Unsplash`,
      alt: imageData.alt_description
    };

    let range = this.editor.getSelection(true);
    if (!range) {
      range = this.rangeTracker;
    }

    this.editor.insertEmbed(range.index, 'image', image, 'user');
    this.editor.insertText(range.index + 1, '\n', 'user');

    range.index++;
    this.editor.setSelection(range, 'api');
  }

  // Scrolling functions =========================================
  public scrollEvent(ev) {
    this.currentScroll = ev;
  }

  private setScroll(bounds) {
    let scrollHeight;
    let scrollPosition;
    if (this.currentScroll) {
      scrollHeight = this.currentScroll.target.offsetHeight;
      scrollPosition = this.currentScroll.detail.currentY;
    } else {
      scrollHeight = this.scrollContainer.el.offsetHeight;
      scrollPosition = 0;
    }
    const editorTopDistance = bounds.top;
    const headerHeight = this.articleHeader.nativeElement.offsetHeight;

    const cursorPosition = headerHeight + editorTopDistance;
    const scrollDifference = (cursorPosition + 100) - (scrollHeight + scrollPosition);
    if (scrollDifference > 0) {
      this.scrollContainer.scrollByPoint(0, scrollDifference, 0);
    }
  }


  ionViewWillLeave() {
    this.article = null;
    this.articleService.setCurrentArticle(this.article);
    this.subscriptions.forEach(subs => subs.unsubscribe());
  }
}
