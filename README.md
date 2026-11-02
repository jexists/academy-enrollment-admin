# hanbit-math-admin

수학학원 "한빛수학" 어드민 — 원장(신청 승인·학생·반·강사·회계·직원·기록)과 강사(내 스케줄·출결·성적·보강). Next.js 16 + Tailwind 4.

## 실행
```bash
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=백엔드 주소
npm install
npm run dev -- --port 3201
```
- 확인: `npm run build`
- 공용 컴포넌트(`src/components/ui`)와 `src/app/globals.css`는 코어 웹 저장소와 같은 파일이다.

## 배포 (Vercel)
- 환경 변수 `NEXT_PUBLIC_API_URL`에 Render 백엔드 주소.
