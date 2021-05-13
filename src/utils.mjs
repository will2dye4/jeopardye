export class WebsocketEvent {
  constructor(eventType, payload) {
    this.eventType = eventType;
    this.payload = payload;
  }
}

export function titleizeCategoryName(categoryName) {
  return categoryName.toTitleCase();
}

export function sanitizeQuestionText(text) {
  /* remove backslashes and HTML style tags (<b>, </b>, <i>, </i>, <u>, </u>) */
  return text.replaceAll(/\\|<\/?[biu]>/g, '');
}

export function checkSubmittedAnswer(correctAnswer, submittedAnswer) {
  /* TODO */
  return submittedAnswer.toLowerCase() === correctAnswer.toLowerCase();
}
