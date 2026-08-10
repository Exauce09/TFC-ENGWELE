/**
 * Normalise le champ `data` d'une réponse API AMEN (tableau, paginator, ou objet indexé).
 */
export function unwrapList(responseOrBody) {
  const body = responseOrBody?.data !== undefined && responseOrBody?.status !== undefined
    ? responseOrBody.data
    : responseOrBody;
  let list = body?.data;

  // Paginator Laravel : { data: [...], current_page, ... }
  if (list && typeof list === 'object' && !Array.isArray(list) && Array.isArray(list.data)) {
    list = list.data;
  }

  if (Array.isArray(list)) return list;
  if (list && typeof list === 'object') return Object.values(list);
  if (Array.isArray(body)) return body;
  return [];
}
