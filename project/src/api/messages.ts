import api from './client';
import { Message } from '../types';

export const messagesApi = {
  sendMessage: (data: { sender: string; receiver: string; content: string }) =>
    api.post<{ msg: string; message: Message }>('/messages', data),

  getConversation: (userId: string, otherId: string) =>
    api.get<{ conversation: Message[] }>(`/messages/${userId}/${otherId}`),

  chatbot: (message: string) =>
    api.post<{
      suggestions: never[]; reply: string 
}>('/chatbot', { message }),
};
