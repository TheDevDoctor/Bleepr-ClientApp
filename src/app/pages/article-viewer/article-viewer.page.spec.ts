import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ArticleViewerPage } from './article-viewer.page';

describe('ArticleViewerPage', () => {
  let component: ArticleViewerPage;
  let fixture: ComponentFixture<ArticleViewerPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ArticleViewerPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(ArticleViewerPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
