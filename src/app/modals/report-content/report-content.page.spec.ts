import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ReportContentPage } from './report-content.page';

describe('ReportContentPage', () => {
  let component: ReportContentPage;
  let fixture: ComponentFixture<ReportContentPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReportContentPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(ReportContentPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
