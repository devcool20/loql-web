export type ChatOfferPayload = {
  kind: 'loql_offer';
  version: 1;
  offerId: string;
  itemId: string;
  itemTitle: string;
  itemImage?: string | null;
  offeredPrice: number;
  durationHours: number;
  senderName?: string | null;
  state?: 'withdrawn';
  createdAt: string;
};

const CHAT_OFFER_MARKER = 'loql:offer:v1';

export const createChatOfferContent = (payload: Omit<ChatOfferPayload, 'kind' | 'version' | 'createdAt'>) => {
  return JSON.stringify({
    marker: CHAT_OFFER_MARKER,
    kind: 'loql_offer',
    version: 1,
    createdAt: new Date().toISOString(),
    ...payload,
  });
};

export const parseChatOfferContent = (content?: string | null): ChatOfferPayload | null => {
  if (!content) return null;

  try {
    const parsed = JSON.parse(content);
    const isOfferPayload = parsed?.kind === 'loql_offer' || parsed?.marker === CHAT_OFFER_MARKER;
    if (!isOfferPayload) return null;
    if (!parsed.offerId || !parsed.itemId || !parsed.itemTitle) return null;
    return parsed as ChatOfferPayload;
  } catch {
    return null;
  }
};

export const getChatMessagePreview = (content?: string | null) => {
  const offer = parseChatOfferContent(content);
  if (!offer) return content || '';
  if (offer.state === 'withdrawn') return `Withdrawn offer: ${offer.itemTitle}`;
  return `Offer: ${offer.itemTitle} for \u20B9${offer.offeredPrice}/day`;
};

export const markChatOfferWithdrawn = (content?: string | null) => {
  const offer = parseChatOfferContent(content);
  if (!offer) return content || '';
  return JSON.stringify({ ...offer, marker: 'loql:offer:v1', state: 'withdrawn' });
};
