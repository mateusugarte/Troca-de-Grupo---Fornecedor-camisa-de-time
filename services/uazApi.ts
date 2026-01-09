import { UazApiResponse } from '../types';

const API_URL = 'https://aurea-group.uazapi.com/group/inviteInfo';
const API_TOKEN = '7ac1c763-8119-4e02-9021-89c6e48a694d';

export const fetchGroupInviteInfo = async (linkOuCodigo: string): Promise<any> => {
  console.log('Iniciando coleta para:', linkOuCodigo);
  
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
    console.log('Dados brutos recebidos:', rawData);

    if (!response.ok) {
      return {
        _debug_error: true,
        _status: response.status,
        _raw: rawData,
        message: rawData.message || `Erro HTTP ${response.status}`
      };
    }

    // Função auxiliar para buscar campos JID e Name em qualquer profundidade do JSON
    const findInObject = (obj: any, keyToFind: string): any => {
      if (!obj || typeof obj !== 'object') return null;
      
      // Busca direta (Case Sensitive)
      if (obj[keyToFind] !== undefined) return obj[keyToFind];
      
      // Busca Case Insensitive nas chaves do nível atual
      for (const k in obj) {
        if (k.toLowerCase() === keyToFind.toLowerCase()) return obj[k];
      }

      // Busca recursiva em objetos filhos
      for (const k in obj) {
        if (typeof obj[k] === 'object' && obj[k] !== null) {
          const found = findInObject(obj[k], keyToFind);
          if (found !== null) return found;
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
      _raw: rawData 
    };
  } catch (err: any) {
    console.error('Falha crítica na requisição:', err);
    return {
      _debug_error: true,
      _is_network_error: true,
      message: err.message
    };
  }
};