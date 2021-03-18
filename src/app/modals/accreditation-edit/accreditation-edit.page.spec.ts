import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { AccreditationEditPage } from './accreditation-edit.page';

describe('AccreditationEditPage', () => {
  let component: AccreditationEditPage;
  let fixture: ComponentFixture<AccreditationEditPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AccreditationEditPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(AccreditationEditPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
