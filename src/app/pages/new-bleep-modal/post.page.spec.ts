import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { BleepModalPage } from './post.page';

describe('BleepModalPage', () => {
  let component: BleepModalPage;
  let fixture: ComponentFixture<BleepModalPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BleepModalPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(BleepModalPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
