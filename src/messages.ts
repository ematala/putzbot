import { getTrashItems } from "./utils";

// static messages
export const welcomeMessage =
  "Hi 👋🏽 Bitte registriere dich mit /register <passwort>";
export const roomieIsOnboardedMessage = (name: string) =>
  `Moin ${name}, du kannst jetzt loslegen 🚀`;
export const roomieIsDoneMessage = "Du bist für diese Woche fertig 👍🏽";
export const roomieIsAlreadyDoneMessage = "Du bist schon fertig 🥳";
export const dutyIsDoneMessage =
  "Super, du hast deinen Dienst für diese Woche erledigt! 🍻";
export const roomieHasNoDutyMessage = "Du hast noch keinen Dienst 🤔";
export const noDutiesMessage = "Es gibt noch keine Dienste";
export const reminderIsSentMessage =
  "Ich habe die anderen daran erinnert ihre Dienste zu machen.";
export const helpMessage = [
  "/register <password> - Registrieren (Passwort erforderlich)",
  "/get - Den eigenen Dienst anzeigen",
  "/getall - Alle Dienste anzeigen",
  "/remind - Die anderen an ihre Dienste erinnern",
  "/done - Den eigenen Dienst als erledigt markieren",
  "/rotate - Dienste rotieren",
  "/help - Hilfe anzeigen",
].join("\n");

// dynamic messages
export const getTrashReminderMessage = async () =>
  ["Hey, du musst den Müll rausbringen 🚛 \n", ...(await getTrashItems())].join(
    "\n"
  );
export const getDutiesRotatedMessage = (title: string, description: string) =>
  `Neue Woche neue Dienste 😍\n\nDu bist diese Woche dran mit ${title} (${description})`;
export const getReminderMessage = (name: string, title: string) =>
  `Hey ${name}, du hast deinen Dienst (${title}) diese Woche noch nicht erledigt! 😒`;
export const getOwnDutyMessage = (title: string, description: string) =>
  `Du bist dran mit ${title} (${description})`;
export const getAllDutiesMessage = (
  done: boolean,
  name: string,
  title: string,
  description: string
) =>
  done
    ? `✅ ${name} ist fertig`
    : `${name} ist dran mit ${title} (${description})`;
