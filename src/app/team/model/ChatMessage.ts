export interface ChatMessage {
    entryText: string;
    username: string;
    userId: string;
    chatId: number;
    createdAt?: Date;
}
