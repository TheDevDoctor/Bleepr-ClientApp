import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { InfoEditPage } from './info-edit.page';

describe('InfoEditPage', () => {
  let component: InfoEditPage;
  let fixture: ComponentFixture<InfoEditPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InfoEditPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(InfoEditPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
