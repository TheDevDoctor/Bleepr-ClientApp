import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { EducationEditPage } from './education-edit.page';

describe('EducationEditPage', () => {
  let component: EducationEditPage;
  let fixture: ComponentFixture<EducationEditPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EducationEditPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(EducationEditPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
