<div align="center">

# 한빛수학 어드민

**원장·강사를 위한 학원 운영 관리 서비스**

수강 신청 승인, 학생·반·회계 관리, 담당 반 출결·성적 입력 제공

<a href="https://academy-enrollment-web.vercel.app"><img src="https://img.shields.io/badge/%EC%BD%94%EC%96%B4%20%EC%9B%B9%20%EB%B0%94%EB%A1%9C%EA%B0%80%EA%B8%B0-111827?style=for-the-badge&logo=vercel&logoColor=white" alt="코어 웹 바로가기"></a> <a href="https://academy-enrollment-admin.vercel.app"><img src="https://img.shields.io/badge/%EC%96%B4%EB%93%9C%EB%AF%BC%20%EB%B0%94%EB%A1%9C%EA%B0%80%EA%B8%B0-111827?style=for-the-badge&logo=vercel&logoColor=white" alt="어드민 바로가기"></a> <a href="https://academy-enrollment-backend.onrender.com/health"><img src="https://img.shields.io/badge/%EB%B0%B1%EC%97%94%EB%93%9C%20%EC%83%81%ED%83%9C%20%EB%B3%B4%EA%B8%B0-111827?style=for-the-badge&logo=render&logoColor=white" alt="백엔드 상태 보기"></a> <a href="https://jexists.github.io/academy-enrollment-web/"><img src="https://img.shields.io/badge/%EB%B0%9C%ED%91%9C%EC%9E%90%EB%A3%8C%20%EB%B3%B4%EB%9F%AC%EA%B0%80%EA%B8%B0-FF5D00?style=for-the-badge" alt="발표자료 보러가기"></a>

<sub>코어 웹 <a href="https://github.com/jexists/academy-enrollment-web">저장소</a> &nbsp;·&nbsp; <b>어드민</b> <a href="https://github.com/jexists/academy-enrollment-admin">저장소</a> &nbsp;·&nbsp; 백엔드 <a href="https://github.com/jexists/academy-enrollment-backend">저장소</a></sub>

</div>

> AX Campus 3회차 과제 결과물. 학원·인물·수치는 모두 가상.

## 기술 스택

| 구분 | 기술 |
|---|---|
| Frontend | ![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white) ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-0F172A?style=for-the-badge&logo=tailwindcss&logoColor=06B6D4) |
| Deployment | ![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white) |

## 주요 기능

| 기능 | 내용 |
|---|---|
| **대시보드** | 원장: 수입, 학생 수, 반별 정원, 미납, 보강 필요 학생 / 강사: 오늘·이번 주 수업, 담당 학생 |
| **신청 처리** | 수강 신청 승인·거절, 전화 신청 대리 등록, 환불 확정 |
| **시간표 생성** | 강사 시간 겹침 차단, 휴강·보충 수업 관리 |
| **출결·성적** | 담당 반 출결(지각 도착 시각 포함)·성적 입력, 보강 확인 |
| **회계** | 납부 체크, 형제 할인, 미납 현황 |
| **기록 관리** | 변경 기록, 삭제 데이터 복원, 챗봇 문의 기록 |

## 화면 캡처

<a href="https://github.com/jexists/academy-enrollment-web/blob/main/docs/%ED%95%9C%EB%B9%9B%EC%88%98%ED%95%99-%EB%8D%B0%EB%AA%A8.mp4"><img src="https://github.com/jexists/academy-enrollment-web/blob/main/docs/captures/00-demo-video.png?raw=true" alt="한빛수학 시연 영상 첫 화면" width="480"></a>

[시연 영상 보기](<https://github.com/jexists/academy-enrollment-web/blob/main/docs/%ED%95%9C%EB%B9%9B%EC%88%98%ED%95%99-%EB%8D%B0%EB%AA%A8.mp4>) (1분 41초, 음성 포함)

[원장 대시보드](https://github.com/jexists/academy-enrollment-web/blob/main/docs/captures/22-admin-dashboard.png) &nbsp;·&nbsp; [시간표 생성](https://github.com/jexists/academy-enrollment-web/blob/main/docs/captures/28-admin-timetable-new-B9.png) &nbsp;·&nbsp; [출결 입력](https://github.com/jexists/academy-enrollment-web/blob/main/docs/captures/30-admin-attendance-B10.png) &nbsp;·&nbsp; [회계](https://github.com/jexists/academy-enrollment-web/blob/main/docs/captures/32-admin-accounting-B12-C15.png) &nbsp;·&nbsp; [문의 기록](https://github.com/jexists/academy-enrollment-web/blob/main/docs/captures/42-admin-chat-logs.png)

전체 캡처 폴더: [academy-enrollment-web/docs/captures](https://github.com/jexists/academy-enrollment-web/tree/main/docs/captures)

## 프로젝트 구조

<details>
<summary>폴더 구조 보기</summary>

```text
src/
├── app/          # 경로별 페이지
├── features/     # 업무별 화면·로직 (enrollments, attendance, accounting 등)
├── components/   # 공용 UI·레이아웃
└── lib/          # API 호출, 로그인, 형식 변환
```

</details>

## 문서

[API·DB 구조](https://github.com/jexists/academy-enrollment-backend#readme)
