import { Component, OnInit, Input } from '@angular/core';
import { ArticleService } from 'src/app/services/article.service';
import { Router } from '@angular/router';
import { ModalController, PopoverController } from '@ionic/angular';
import { UserService } from 'src/app/services/user.service';
import { FilterPopoverComponent } from './filter-popover/filter-popover.component';

@Component({
  selector: 'app-articles-modal',
  templateUrl: './articles-modal.page.html',
  styleUrls: ['./articles-modal.page.scss'],
})
export class ArticlesModalPage implements OnInit {

  @Input() currentTab: string;
  public displayList: Array<any> = [];
  public actionOccuring: boolean;
  public articles: any;

  public filterSettings: { draft: boolean, review: boolean, published: boolean };

  constructor(
    private articleService: ArticleService,
    private router: Router,
    private userService: UserService,
    private modalController: ModalController,
    private popoverController: PopoverController
  ) { }

  ngOnInit() {
    this.filterSettings = { draft: false, review: false, published: false };
    this.filterSettings[this.currentTab] = true;

    this.articleService.returnUserArticles().subscribe(art => {
      this.articles = art;
      if (this.articles) {
        this.sortList(this.articles);
      }
    });
    this.userService.returnUser().subscribe(user => {
      this.articleService.getUserArticles(user.fragment.userId);
    });

  }

  public articlePressed(art) {
    if (art.stage === 'published' || art.stage === 'review') {
      this.router.navigate(['article-viewer', art.id]);
      this.modalController.dismiss();
    } else {
      this.router.navigate(['article-editor', art.id]);
      this.modalController.dismiss();
    }
  }

  public onCloseModal() {
    this.dismissModal();
  }

  private dismissModal() {
    this.modalController.dismiss();
  }

  public onDeleteArticle(index) {
    this.articleService.onDeleteArticle(this.displayList[index], this.currentTab);
  }

  public sortList(articles) {
    this.displayList = [];
    Object.keys(this.filterSettings).forEach(key => {
      if (this.filterSettings[key] === true) {
        this.displayList = this.displayList.concat(articles[key]);
      }
    });
    this.displayList.sort((a, b) =>  b.edited - a.edited);
  }

  public onOpenFilter(ev) {
    this.presentFilterPopover(ev);
  }

  private async presentFilterPopover(ev: any) {
    const popover = await this.popoverController.create({
      component: FilterPopoverComponent,
      componentProps: {
        filterOptions: this.filterSettings
      },
      event: ev
    });

    popover.onWillDismiss().then(data => {
      this.sortList(this.articles);
    });
    return await popover.present();
  }
}
