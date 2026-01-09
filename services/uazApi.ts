
import { UazApiResponse } from '../types';

const API_URL = 'https://aurea-group.uazapi.com/group/inviteInfo';
const API_TOKEN = '7ac1c763-8119-4e02-9021-89c6e48a694d';

export const fetchGroupInviteInfo = async (linkOuCodigo: string): Promise<any> => {
  console.log('Solicitando link:', linkOuCodigo);
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'token': API_TOKEN
      },
      body: JSON.stringify({
        "invitecode": linkOuCodigo 
      })
    });

    const rawData = await response.json();
    console.log('Resposta da API recebida:', rawData);

    // Se o status HTTP não for 2xx (ex: 400, 401, 500)
    if (!response.ok) {
      return {
        _debug_error: true,
        _status: response.status,
        _raw: rawData,
        message: rawData.message || `Erro HTTP ${response.status}`
      };
    }

    // Tenta encontrar JID e Name em qualquer lugar do objeto (case-insensitive e aninhado)
    const findInObject = (obj: any, keyToFind: string): any => {
      if (!obj || typeof obj !== 'object') return null;
      if (obj[keyToFind]) return obj[keyToFind];
      
      for (const k in obj) {
        if (k.toLowerCase() === keyToFind.toLowerCase()) return obj[k];
        if (typeof obj[k] === 'object') {
          const found = findInObject(obj[k], keyToFind);
          if (found) return found;
        }
      }
      return null;
    };

    const JID = findInObject(rawData, 'JID');
    const Name = findInObject(rawData, 'Name');

    return {
      JID,
      Name,
      status: rawData.status || 'unknown',
      _raw: rawData // Mantemos o dado bruto para mostrar na tela
    };
  } catch (err: any) {
    console.error('Erro de rede ou CORS:', err);
    return {
      _debug_error: true,
      _is_network_error: true,
      message: err.message
    };
  }
};
