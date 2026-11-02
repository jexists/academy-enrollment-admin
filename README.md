# academy-enrollment-admin

수학학원 "한빛수학" 어드민 — 원장(신청 승인·학생·반·강사·회계·직원·기록)과 강사(내 스케줄·출결·성적·보강). Next.js 16 + Tailwind 4.

## 화면
- 원장: 신청 승인·거절·전화 신청·환불 확정, 학생 등록·학적·상담 메모, 반 관리(달력·휴강·보충), 수업 시간표 생성(강사 시간 겹침), 강사 관리, 출결, 보강 확정·보강 잡기, 회계(납부 체크·형제 할인·미납)
- 강사: 담당 반 출결 입력(지각 도착 시각), 보강 보기

## 실행
```bash
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=백엔드 주소
npm install
npm run dev -- --port 3201
```
- 확인: `npm run build`
- 공용 컴포넌트(`src/components/ui`)와 `src/app/globals.css`는 코어 웹 저장소와 같은 파일이다.

## 로그인
- `/login` — 이메일 + 비밀번호. 원장·강사 계정만 들어올 수 있다.
- 로컬에서는 로그인 화면 아래 **데모 계정 버튼**을 누르면 바로 로그인된다 (백엔드 `DEMO_LOGIN=true`일 때만 보임).
- 임시 비밀번호 계정은 `/change-password`로 먼저 보낸다.

## 배포 (Vercel)
- 환경 변수 `NEXT_PUBLIC_API_URL`에 Render 백엔드 주소.
