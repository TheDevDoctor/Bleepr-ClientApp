import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { PublicationEditPage } from './publication-edit.page';

describe('PublicationEditPage', () => {
  let component: PublicationEditPage;
  let fixture: ComponentFixture<PublicationEditPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PublicationEditPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(PublicationEditPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
