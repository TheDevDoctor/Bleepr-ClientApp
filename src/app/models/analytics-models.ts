import * as uuid from 'uuid';

export class AnalyticEvent {
    constructor(
        public resourceId: string,
        public userId: string,
        public eventType: string,
        public timestamp: number = Date.now(),
        public id: string = uuid.v4(),
        public readTime?: number
    ) { }
}
