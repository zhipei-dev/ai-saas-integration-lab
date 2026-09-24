import { InvalidCaseStateError, type AppDb } from './db.js';
import { suggestionSchema, type AiProvider } from './provider.js';

export async function generateSuggestion(db: AppDb, provider: AiProvider, id: number) {
  const supportCase = db.getCase(id);
  if (!supportCase) return undefined;
  if (supportCase.status !== 'open') {
    throw new InvalidCaseStateError('Case is not open');
  }

  const suggestion = suggestionSchema.parse(await provider.suggest(supportCase));
  db.saveSuggestion(id, suggestion, provider.name);
  return suggestion;
}
