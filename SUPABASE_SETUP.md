# Supabase 설정 가이드

## 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에서 계정 생성 및 로그인
2. "New Project" 클릭하여 새 프로젝트 생성
3. 프로젝트 이름, 데이터베이스 비밀번호 설정
4. 프로젝트 생성 완료까지 대기 (약 2분)

## 2. 데이터베이스 테이블 생성

1. Supabase Dashboard에서 "SQL Editor" 메뉴 클릭
2. "New query" 클릭
3. `supabase-schema.sql` 파일의 내용을 복사하여 붙여넣기
4. "Run" 버튼 클릭하여 실행

## 3. 환경변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 환경변수 찾는 방법:

1. Supabase Dashboard에서 "Settings" → "API" 메뉴 클릭
2. "Project URL"을 `NEXT_PUBLIC_SUPABASE_URL`에 복사
3. "anon public" 키를 `NEXT_PUBLIC_SUPABASE_ANON_KEY`에 복사

## 4. 개발 서버 재시작

환경변수를 추가한 후 개발 서버를 재시작하세요:

```bash
npm run dev
```

## 기능 설명

### 저장하기
1. 주사위를 트레이에 추가
2. 세트 이름 입력
3. "저장" 버튼 클릭
4. 공유 링크가 자동으로 생성됨

### 불러오기
1. "세트 불러오기" 버튼 클릭
2. 공유 링크의 ID 입력 (예: `/share/abc123` → `abc123`)
3. 주사위 세트가 트레이에 로드됨

### 공유하기
1. 저장 후 생성된 공유 링크 복사
2. 링크를 다른 사람에게 전달
3. 링크 클릭 시 자동으로 주사위 세트가 로드되고 메인 페이지로 이동
