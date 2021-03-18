import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { HelpCentrePage } from './help-centre.page';

describe('HelpCentrePage', () => {
  let component: HelpCentrePage;
  let fixture: ComponentFixture<HelpCentrePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HelpCentrePage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(HelpCentrePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
