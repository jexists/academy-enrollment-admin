# 한빛수학 어드민

수학학원 "한빛수학"의 원장·강사용 관리 웹이에요. 원장은 신청 승인과 학생·반·회계를 관리하고, 강사는 담당 반의 출결과 성적을 입력해요.

역할마다 메뉴와 권한을 나눠서, 강사는 자기 담당 반만 다룰 수 있어요. AX Campus 3회차 과제로 만든 서비스이고, 학원과 사람, 숫자는 모두 가상이에요.

## 관련 링크

| 구분 | 서비스 | GitHub 저장소 |
|---|---|---|
| 코어 웹 | [웹사이트 열기](https://academy-enrollment-web.vercel.app) | [academy-enrollment-web](https://github.com/jexists/academy-enrollment-web) |
| 어드민 | [웹사이트 열기](https://academy-enrollment-admin.vercel.app) | [academy-enrollment-admin](https://github.com/jexists/academy-enrollment-admin) (현재 저장소) |
| 백엔드 API | [서버 상태 보기](https://academy-enrollment-backend.onrender.com/health) | [academy-enrollment-backend](https://github.com/jexists/academy-enrollment-backend) |

**발표 자료**: [HTML 슬라이드 27장 보기](https://jexists.github.io/academy-enrollment-web/)

## 기술 스택

**Frontend**

<table>
  <tr>
    <td align="center" width="96"><picture><source media="(prefers-color-scheme: dark)" srcset="https://cdn.simpleicons.org/nextdotjs/ffffff"><img src="https://cdn.simpleicons.org/nextdotjs/000000" width="28" height="28" alt="Next.js"></picture><br><sub>Next.js</sub></td>
    <td align="center" width="96"><img src="https://cdn.simpleicons.org/react" width="28" height="28" alt="React"><br><sub>React</sub></td>
    <td align="center" width="96"><img src="https://cdn.simpleicons.org/typescript" width="28" height="28" alt="TypeScript"><br><sub>TypeScript</sub></td>
    <td align="center" width="96"><img src="https://cdn.simpleicons.org/tailwindcss" width="28" height="28" alt="Tailwind CSS"><br><sub>Tailwind CSS</sub></td>
  </tr>
</table>

**Deployment**

<table>
  <tr>
    <td align="center" width="96"><picture><source media="(prefers-color-scheme: dark)" srcset="https://cdn.simpleicons.org/vercel/ffffff"><img src="https://cdn.simpleicons.org/vercel/000000" width="28" height="28" alt="Vercel"></picture><br><sub>Vercel</sub></td>
  </tr>
</table>

## 주요 기능

- **대시보드**: 원장은 수입, 학생 수, 반별 정원, 미납, 보강 필요 학생을 보고, 강사는 오늘·이번 주 수업과 내 학생을 봐요.
- **신청 처리**: 수강 신청 승인·거절, 전화 신청 대리 등록, 환불 확정을 처리해요.
- **시간표 생성**: 반과 수업 시간을 만들 때 강사 시간이 겹치면 저장을 막아요. 휴강과 보충 수업도 관리해요.
- **출결·성적**: 강사가 담당 반 출결(지각 도착 시각 포함)과 성적을 입력하고, 보강 일정을 확인해요.
- **회계**: 납부 체크, 형제 할인, 미납 현황을 한 화면에서 관리해요.
- **기록 관리**: 변경 기록과 지운 데이터 되살리기, 챗봇 문의 기록을 볼 수 있어요.

## 대표 화면

<img src="https://raw.githubusercontent.com/jexists/academy-enrollment-web/main/docs/captures/22-admin-dashboard.png" width="720" alt="원장 대시보드">

<table>
  <tr>
    <td align="center"><img src="https://raw.githubusercontent.com/jexists/academy-enrollment-web/main/docs/captures/30-admin-attendance-B10.png" width="400" alt="강사 출결 입력"></td>
    <td align="center"><img src="https://raw.githubusercontent.com/jexists/academy-enrollment-web/main/docs/captures/32-admin-accounting-B12-C15.png" width="400" alt="회계 화면"></td>
  </tr>
  <tr>
    <td align="center"><sub>강사 출결 입력</sub></td>
    <td align="center"><sub>회계</sub></td>
  </tr>
</table>

## 프로젝트 구조

```text
src/
├── app/          # 경로별 페이지
├── features/     # 업무별 화면과 로직 (enrollments, attendance, accounting 등)
├── components/   # 공용 UI와 레이아웃
└── lib/          # API 호출, 로그인, 형식 변환
```

## 문서

- [API와 DB 구조](https://github.com/jexists/academy-enrollment-backend#readme)
