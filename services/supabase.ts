
import { createClient } from '@supabase/supabase-js';
import { GroupSettings } from '../types';

const SUPABASE_URL = 'https://kixueanwqnwwdipdifpg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_yankDZiabIOZTg7Fnm9N0A_EcwazpBT';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TABLE_NAME = 'GRUPO DE SOLICITAÇÃO PARA FORNECEDOR';

export const getGroupSettings = async (): Promise<GroupSettings | null> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Erro detalhado do Supabase:', error);
      throw error;
    }

    if (data && data.length > 0) {
      console.log('Dados carregados com sucesso:', data[0]);
      return data[0] as GroupSettings;
    }

    console.warn('A tabela está vazia ou não retornou dados.');
    return null;
  } catch (error) {
    console.error('Falha na comunicação com o Supabase:', error);
    throw error;
  }
};

export const updateGroupSettings = async (id: number, updates: any) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Erro ao atualizar registro:', error);
    throw error;
  }
  return data;
};
