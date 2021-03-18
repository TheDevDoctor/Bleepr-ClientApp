import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { CaseBuilderPage } from './case-builder.page';

describe('CaseBuilderPage', () => {
  let component: CaseBuilderPage;
  let fixture: ComponentFixture<CaseBuilderPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CaseBuilderPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(CaseBuilderPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
