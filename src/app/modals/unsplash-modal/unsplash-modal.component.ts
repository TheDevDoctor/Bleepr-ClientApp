import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { ArticleService } from 'src/app/services/article.service';
import { ModalController, IonInfiniteScroll } from '@ionic/angular';

@Component({
  selector: 'app-unsplash-modal',
  templateUrl: './unsplash-modal.component.html',
  styleUrls: ['./unsplash-modal.component.scss'],
})
export class UnsplashModalComponent implements OnInit {
  @ViewChild(IonInfiniteScroll) infiniteScroll: IonInfiniteScroll;


  public imageResults = [];
  private searchText: string;
  private totalPages: number;
  public resultCount: number;

  currentPage = 1;

  constructor(
    private articleService: ArticleService,
    private modalController: ModalController
    ) { }

  ngOnInit() {}

  public searchPressed(event) {
    this.queryUnsplash();
    if (this.imageResults.length > 0) {
      this.imageResults = [];
    }
  }

  private queryUnsplash() {
    if (this.searchText.length > 1) {
      const subs = this.articleService.queryUnsplash(this.searchText, this.currentPage).subscribe(data => {
        this.totalPages = data.total_pages;
        this.resultCount = data.total;
        this.imageResults = this.imageResults.concat(data.results);
        this.currentPage++;
        this.infiniteScroll.complete();

        if (this.currentPage > this.totalPages) {
          this.infiniteScroll.disabled = true;
        }
        subs.unsubscribe();
      });
    }
  }

  public searchChanged(ev) {
    this.searchText = ev.detail.value;
    this.currentPage = 1;
  }

  public imageSelected(img) {
    this.modalController.dismiss(img);
  }

  public nextPage(ev) {
    this.queryUnsplash();
  }

}
