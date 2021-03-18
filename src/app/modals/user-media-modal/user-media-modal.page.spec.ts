import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { UserMediaModalPage } from './user-media-modal.page';

describe('UserMediaModalPage', () => {
  let component: UserMediaModalPage;
  let fixture: ComponentFixture<UserMediaModalPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UserMediaModalPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(UserMediaModalPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
