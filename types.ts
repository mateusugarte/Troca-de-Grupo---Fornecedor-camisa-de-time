
export interface GroupSettings {
  id: number;
  group_id: string;
  group_name: string;
}

export interface UazApiResponse {
  JID: string;
  Name: string;
  status: string;
  [key: string]: any;
}
