export interface ITurnstileOptions {
    secretKey: string;
    tokenResponse: (req) => string;
    onError?: (error) => void;
}