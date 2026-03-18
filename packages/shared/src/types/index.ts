// Decode Result Types

export interface DecodeStep {
    decoderName: string;
    confidence: number;
    input: string;
    output: string;
    explanation: string;
}

export interface DecodeResult {
    originalInput: string;
    steps: DecodeStep[];
    finalOutput: string;
}

// User Types

export interface User {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    tier: 'free' | 'pro';
    createdAt: Date;
}

// Teams
export interface Team {
    id: string;
    name: string;
    slug: string;
    ownerId: string;
    members: TeamMember[];
}

export interface TeamMember {
    userId: string;
    role: 'owner' | 'admin' | 'member';
    joinedAt: Date;
}

// API Key Types

export interface ApiKey {
    id: string;
    userId: string;
    name: string;
    keyPrefix: string;
    permissions: string[];
    rateLimit: number;
    isActive: boolean;
    createdAt: Date;
}
