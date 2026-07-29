import { createContext, use, useState, type PropsWithChildren } from 'react';

/**
 * 세션 상태. 라우팅 게이트가 이 값 하나로 결정된다.
 * - loading:    저장된 토큰을 확인하는 중 (아직 아무 화면도 그리면 안 됨)
 * - signedOut:  로그인 필요 → (auth)
 * - needsSetup: 계정은 있으나 프로필 미완성 → (setup)
 * - signedIn:   정상 → (app)
 */
export type SessionStatus = 'loading' | 'signedOut' | 'needsSetup' | 'signedIn';

type SessionContextValue = {
  status: SessionStatus;
  signIn: () => void;
  signUp: () => void;
  completeSetup: () => void;
  signOut: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: PropsWithChildren) {
  // TODO: 서버 붙일 때 SecureStore의 토큰을 읽어 초기 상태를 정한다.
  const [status, setStatus] = useState<SessionStatus>('signedOut');

  return (
    <SessionContext
      value={{
        status,
        signIn: () => setStatus('signedIn'),
        signUp: () => setStatus('needsSetup'),
        completeSetup: () => setStatus('signedIn'),
        signOut: () => setStatus('signedOut'),
      }}>
      {children}
    </SessionContext>
  );
}

export function useSession() {
  const value = use(SessionContext);
  if (!value) {
    throw new Error('useSession은 SessionProvider 안에서만 쓸 수 있다');
  }
  return value;
}
