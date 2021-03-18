import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ArticlesModalPage } from './articles-modal.page';

describe('ArticlesModalPage', () => {
  let component: ArticlesModalPage;
  let fixture: ComponentFixture<ArticlesModalPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ArticlesModalPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(ArticlesModalPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
