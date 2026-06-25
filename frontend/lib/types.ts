export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
export type BodyType = 'none' | 'raw' | 'form-data' | 'x-www-form-urlencoded';
export type RawBodyType = 'JSON' | 'Text';
export type AuthType = 'none' | 'bearer' | 'basic' | 'apikey';

export interface KeyValue {
  key: string;
  value: string;
  enabled: boolean;
}

export interface AuthData {
  token?: string;
  username?: string;
  password?: string;
  apiKeyKey?: string;
  apiKeyValue?: string;
  apiKeyAddTo?: 'header' | 'query';
}

export interface Collection {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface SavedRequest {
  id: number;
  collection_id: number;
  name: string;
  description: string;
  method: HttpMethod;
  url: string;
  headers: string;    // JSON-serialised KeyValue[]
  params: string;     // JSON-serialised KeyValue[]
  body_type: BodyType;
  body_content: string;
  body_raw_type: RawBodyType;
  auth_type: AuthType;
  auth_data: string;  // JSON-serialised AuthData
  created_at: string;
  updated_at: string;
}

export interface EnvVariable {
  id: number;
  environment_id: number;
  key: string;
  value: string;
  current_value: string;
  is_enabled: boolean;
}

export interface Environment {
  id: number;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  variables: EnvVariable[];
}

export interface HistoryItem {
  id: number;
  method: HttpMethod;
  url: string;
  headers: string;
  params: string;
  body_type: BodyType;
  body_content: string;
  body_raw_type: RawBodyType;
  auth_type: AuthType;
  auth_data: string;
  response_status: number | null;
  response_time: number | null;
  response_size: number | null;
  response_headers: string;
  response_body: string;
  response_error: string | null;
  sent_at: string;
}

export interface RunResponse {
  status: number | null;
  status_text: string;
  time_ms: number;
  size_bytes: number;
  headers: Record<string, string>;
  body: string;
  error: string | null;
}

// A tab in the request builder
export interface RequestTab {
  id: string;               // unique tab id
  title: string;
  description?: string;
  isDirty: boolean;
  method: HttpMethod;
  url: string;
  headers: KeyValue[];
  params: KeyValue[];
  body_type: BodyType;
  body_content: string;
  body_raw_type: RawBodyType;
  auth_type: AuthType;
  auth_data: AuthData;
  // If this tab was opened from a saved request
  savedRequestId?: number;
  collectionId?: number;
  // response
  response?: RunResponse;
  loading?: boolean;
}

export interface AppSettings {
  followRedirects: boolean;
  sendCookies: boolean;
  sslVerification: boolean;
  timeout: number;
  darkTheme: boolean;
}

