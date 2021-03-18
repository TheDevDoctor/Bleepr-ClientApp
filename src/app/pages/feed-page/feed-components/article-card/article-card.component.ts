import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ArticleService } from 'src/app/services/article.service';
import { Router } from '@angular/router';
import { SasGeneratorService } from 'src/app/services/blob_storage/sas-generator.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-article-card',
  templateUrl: './article-card.component.html',
  styleUrls: ['./article-card.component.scss'],
})
export class ArticleCardComponent implements OnChanges {
  @Input() articleId: string;
  @Input() article: any;
  public articlePreview: any;
  public image: any;
  public sasToken: string;

  constructor(
    private articleService: ArticleService,
    private router: Router,
    private sasGenerator: SasGeneratorService) { }

  ngOnChanges(changes: SimpleChanges): void {
    this.sasGenerator.getSasToken().subscribe(req => this.sasToken = req.storageAccessToken);
    if (!this.article) {
      this.articleService.getArticlePreview(this.articleId).subscribe(preview => {
        if (preview.ok) {
          this.articlePreview = preview.body.Documents[0];
          if (!this.articlePreview.published) {
            this.articlePreview.published = Date.now();
          }
          if (this.articlePreview.feedImage) {
            if (this.articlePreview.feedImage.source) {
              if (this.articlePreview.feedImage.source === 'unsplash') {
                this.image = this.articlePreview.feedImage.id;
              } else {
                // tslint:disable-next-line:max-line-length
                this.image = `${environment.blobStorage.storageUri + this.articlePreview.createdById}/media/images/${this.articlePreview.feedImage.id}?${this.sasToken}`;
              }

            }
          } else {
            this.image = null;
          }
        }
      });
    } else {
      this.articlePreview = this.article;
      if (!this.articlePreview.published) {
        this.articlePreview.published = Date.now();
      }
      if (this.articlePreview.feedImage) {
        if (this.articlePreview.feedImage.source) {
          if (this.articlePreview.feedImage.source === 'unsplash') {
            this.image = this.articlePreview.feedImage.id;
          } else {
            // tslint:disable-next-line:max-line-length
            this.image = `${environment.blobStorage.storageUri + this.articlePreview.createdById}/media/images/${this.articlePreview.feedImage.id}?${this.sasToken}`;
          }

        }
      } else {
        this.image = null;
      }
    }
  }

  goToArticle() {
    this.router.navigate(['article-viewer', this.articleId]);
  }

}
