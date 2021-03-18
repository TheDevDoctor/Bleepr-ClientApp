import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { AboutEditPage } from './about-edit.page';

describe('AboutEditPage', () => {
  let component: AboutEditPage;
  let fixture: ComponentFixture<AboutEditPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AboutEditPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(AboutEditPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
