export const REFRESH_TOKEN_STORE = Symbol('REFRESH_TOKEN_STORE');

export interface RefreshTokenStore {
  // zapisz, że dany jti (tego usera) jest ważny, z czasem życia w sekundach
  save(userId: string, jti: string, ttlSeconds: number): Promise<void>;

  // czy TEN konkretny jti jest wciąż ważny?
  exists(userId: string, jti: string): Promise<boolean>;

  // usuń jeden refresh (rotacja / logout z tego urządzenia)
  remove(userId: string, jti: string): Promise<void>;

  // usuń wszystkie refreshe usera (logout ze wszystkich / reakcja na re-use)
  removeAllForUser(userId: string): Promise<void>;
}
