import { Component, OnInit, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { FeedService } from 'src/app/services/feed.service';
import { BleepsService } from 'src/app/services/bleeps.service';

@Component({
  selector: 'app-report-content',
  templateUrl: './report-content.page.html',
  styleUrls: ['./report-content.page.scss'],
})
export class ReportContentPage implements OnInit {
  @Input() content: any;

  public reportForm: FormGroup;

  constructor(
    private modalController: ModalController,
    private fb: FormBuilder,
    private feedsService: FeedService,
    private bleepsService: BleepsService) { }

  ngOnInit() {
    this.buildReportForm();
  }

  public onCloseModal() {
    this.modalController.dismiss();
  }

  buildReportForm() {
    this.reportForm = this.fb.group(
      {
        issue: [null, [Validators.required]],
        description: [null, [Validators.required]],
      }
    );
  }

  removeFromFeed() {
    if (this.content.type !== 'comment') {
      this.feedsService.removeBleepFromFeed([this.content.id]);
      this.modalController.dismiss();
    }
  }

  onSubmitReport() {
    this.bleepsService.sendBleepReport(this.content, this.reportForm.value).subscribe(res => {
      if (res.ok) {
        this.feedsService.removeBleepFromFeed([this.content.id]);
        this.modalController.dismiss();
      }
    });
  }

}
