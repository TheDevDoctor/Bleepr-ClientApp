export interface UserFragment {
    id: string;
    userId: string;
    sessionId?: string;
    type: string;
    firstname: string;
    surname: string;
    profession: string;
    specialty: string;
    grade: string;
}

export interface UserProfile {
    id: string;
    privacy: string;
    userId: string;
    type: string;
    primary_hospital: string;
    primary_location: string;
    connections: any;
    connect_requests: string[];
    connect_pending: string[];
    about: string;
    experience: any[];
    education: any[];
    accreditation: any[];
    publication: any[];
}

export interface UserAccount {
    id: string;
    userId: string;
    type: string;
    settings: any;
}
