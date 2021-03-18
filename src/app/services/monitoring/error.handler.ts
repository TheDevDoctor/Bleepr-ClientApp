import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { MonitoringService } from './monitoring.service';

@Injectable()
export class ErrorHandlerService implements ErrorHandler {

    // Use Injector to access MonitoringService singleton to prevent any standard service injection exceptions throwing us into 
    // recursive loop: https://tutorialsforangular.com/2020/02/03/adding-azure-application-insights-to-your-angular-app/ 
    constructor(private injector : Injector) {
    }

    handleError(error: Error) {
        this.injector.get<MonitoringService>(MonitoringService).logException(error); // Log exception
    }
}