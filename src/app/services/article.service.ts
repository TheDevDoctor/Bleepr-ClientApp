import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import * as uuid from 'uuid';
import { BehaviorSubject, Subject, Observable, of } from 'rxjs';
import { mergeMap, groupBy, reduce, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { SasGeneratorService } from './blob_storage/sas-generator.service';
import { Article } from '../models/article-types';
import { HttpClient } from '@angular/common/http';
import { BleepsService } from './bleeps.service';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class ArticleService {
  // article: any;
  article$: Subject<any> = new Subject<any>();
  articleSaved$: Subject<boolean> = new Subject();

  savedArticles: any = { draft: [], review: [], published: [] };
  savedArticles$: BehaviorSubject<any> = new BehaviorSubject(this.savedArticles);

  currentArticle: Article;
  currentArticle$: BehaviorSubject<Article> = new BehaviorSubject(this.currentArticle);

  editArticle: boolean;
  editArticle$: BehaviorSubject<boolean> = new BehaviorSubject(this.editArticle);

  sasToken: string;

  constructor(
    private databaseService: DatabaseService,
    private sasGenerator: SasGeneratorService,
    private http: HttpClient,
    private bleepsService: BleepsService,
    public toastController: ToastController
  ) {
    this.sasGenerator.getSasToken().subscribe(request => this.sasToken = request.storageAccessToken);
  }

  public updateArticle(article, source) {
    if (source === 'load') {
      const sasArticle = this.addSasToContent(article);
      this.article$.next(sasArticle);
    } else if (source === 'save') {
      const dbArticle = this.removeSasFromContent(article);
      this.saveArticle(dbArticle);

      // need to re-add this or it will break history behaviour in editor as can't undo image delete without sas:
      this.addSasToContent(article);
    }
  }

  private removeSasFromContent(article) {
    // set article images to blank array as this is where they are appended:
    article.images = [];

    if (article.content) {
      article.content.forEach(item => {
        if (item.hasOwnProperty('insert')) {
          if (item.insert.hasOwnProperty('image')) {
            // check that not an unsplash image:
            if (item.insert.image.url.indexOf(environment.blobStorage.storageUri) !== -1) {
              const withoutSas = item.insert.image.url.split('?')[0];
              const splitUri = withoutSas.split('/');
              const imgGuid = splitUri[splitUri.length - 1];
              item.insert.image.url = imgGuid;
              article.images.push({ source: 'blob', id: imgGuid});
            } else {
              article.images.push({ source: 'unsplash', id: item.insert.image.url});
            }
          } else if (item.insert.hasOwnProperty('video')) {
            if (item.insert.video.url.indexOf(environment.blobStorage.storageUri) !== -1) {
              const withoutSas = item.insert.video.url.split('?')[0];
              const splitUri = withoutSas.split('/');
              const vidGuid = splitUri[splitUri.length - 1];
              item.insert.video.url = vidGuid;
            }
          }
        }
      });
    }
    return article;
  }

  private addSasToContent(article: Article) {
    if (article.content) {
      if (!this.sasToken) {
        console.log('There is no sas token to update article document');
        return null;
      }
      article.content.forEach(item => {
        if (item.hasOwnProperty('insert')) {
          if (item.insert.hasOwnProperty('image')) {
            // check that not an unsplash image:
            if (item.insert.image.url.indexOf('https://images.unsplash.com/') === -1) {
              const guid = item.insert.image.url;
              item.insert.image.url = `${environment.blobStorage.storageUri + article.createdById}/media/images/${guid}?${this.sasToken}`;
            }
          } else if (item.insert.hasOwnProperty('video')) {
            if (item.insert.video.url.indexOf('https://') === -1) {
              const guid = item.insert.video.url;
              item.insert.video.url = `${environment.blobStorage.storageUri + article.createdById}/media/videos/${guid}?${this.sasToken}`;
            }
          }
        }
      });
    }
    return article;
  }

  public saveArticle(article) {
    this.sendArticleToDatabase(article);
  }

  public onDeleteArticle(article, type) {
    const toast = this.confirmArticleDeletionToast();

    return toast.then(role => {
      if (role.role === 'yes') {
        this.databaseService.deleteDocument(article.id, 'articles', article.id, 'articles').subscribe(
          res => {
            if (res.ok) {
              if (article.bleep) {
                this.bleepsService.getBleep(article.bleep).subscribe(bleep => {
                  if (bleep) {
                    this.bleepsService.deleteBleep(bleep, false).subscribe(deleteBleep => console.log(deleteBleep));
                  }
                });
              }

              const index = this.savedArticles[type].findIndex((e) => e.id === article.id);
              if (index > -1) {
                this.savedArticles[type].splice(index, 1);
              }
              this.savedArticles$.next(this.savedArticles);
            }
            return res;
          }
        );
      }
    });
  }

  private sendArticleToDatabase(article) {
    // article.id = uuid.v4();
    // tslint:disable-next-line:max-line-length
    this.databaseService.createOrUpdateDocument(article, environment.cosmosDB.articlesContainerId, article.id, 'articles').subscribe(res => {
      if (res.status === 200) {
        this.articleSaved = true;

        // if published article then present toast.
        if (article.stage === 'published') {
          this.presentBasicToast('Your article has been published.', 'tertiary');
        }
      } else {
        this.articleSaved = false;
        this.presentBasicToast('We were unable to save your article, please try again', 'danger');
      }
    });
  }

  set articleSaved(saved) {
    this.articleSaved$.next(saved);
  }

  public isArticleSaved() {
    return this.articleSaved$.asObservable();
  }

  public getUserArticles(user) {
    this.savedArticles = { draft: [], review: [], published: [] };
    this.databaseService.queryArticlesCrossPartition(`SELECT * FROM articles WHERE ARRAY_CONTAINS(articles.authors, "${user}")`)
      .subscribe(data => {
        if (data.status === 200) {
          data.body.Documents.forEach(item => {
            this.savedArticles[item.stage].push(item);
          });
          this.savedArticles$.next(this.savedArticles);
        } else {

        }
      });
  }

  getArticle(id) {

    if (this.currentArticle && this.currentArticle.id === id) {
      return;
    }

    this.databaseService.getDocument(id, 'articles', id).subscribe(res => {
      if (res.ok) {
        const article = { ...res.body };
        this.currentArticle = this.addSasToContent(article);
        this.currentArticle$.next(this.currentArticle);
      }
    });

  }

  public editPublishedArticle() {
    this.editArticle = true;
    this.editArticle$.next(this.editArticle);
  }

  public doneEditPublishedArticle() {
    this.editArticle = false;
    this.editArticle$.next(this.editArticle);
  }

  public isEditArticle() {
    return this.editArticle$.asObservable();
  }

  public getArticlePreview(id) {
    return this.databaseService.getArticlePreview(id);
  }

  public returnUserArticles() {
    return this.savedArticles$.asObservable();
  }

  public returnCurrentArticle(): Observable<Article> {
    return this.currentArticle$.asObservable();
  }

  public setCurrentArticle(article) {
    this.currentArticle = article;
    this.currentArticle$.next(this.currentArticle);
  }

  // UNSPLASH FUNCTIONS ================================================================================

  public queryUnsplash(query: string, page: number): Observable<any> {
    return this.http.get(`https://api.unsplash.com/search/photos?page=${page}&query=${query}&per_page=20`,
      { headers: { Authorization: 'Client-ID 8pt9JMu1EbZXGZyBY_6pcVATvouUD7AL-lLxbs-lW70' } });
  }


  // TOASTS ============================================================================================================
  private async presentBasicToast(message, color) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color
    });
    toast.present();
  }

  private async confirmArticleDeletionToast() {
    const toast = await this.toastController.create({
      message: 'Are you sure you want to delete your article? This will delete the article from your feed and any associated interactions.',
      color: 'danger',
      position: 'middle',
      cssClass: 'article-deletion-toast',
      buttons: [
        {
          side: 'end',
          text: 'Yes',
          role: 'yes'
        },
        {
          side: 'end',
          text: 'No',
          role: 'no'
        }
      ]
    });

    toast.present();

    return toast.onDidDismiss();
  }
}
