export interface ChatMessage {
    entryText: string;
    username: string;
    userId: string | number;
    chatId: number;
    createdAt?: Date;
}
