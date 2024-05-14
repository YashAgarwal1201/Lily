export type Message = {
  id: string | number;
  text: string;
  type: string;
  timestamp: string;
};

export interface FeedbackFormType {
  name: string;
  email: string;
  message: string;
}
