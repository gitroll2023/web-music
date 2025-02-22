# 계시록 뮤직 웹앱 PRD

## 1. 개요
- 제품명: 계시록 찬양
- 목적: 계시록 각 장별 찬양을 들을 수 있는 모바일 웹앱
- 주요 기능: 챕터별 음악 재생, 가사 표시, 다크모드 지원
- 타겟: 개인 사용

## 2. 기술 스택
### Frontend
- Framework: Next.js 14
- Language: TypeScript
- Styling: Tailwind CSS
- Hosting: Vercel
- Asset Storage: 프로젝트 내 public 폴더



### 데이터 구조
typescript
interface Song {
order: string; // "1-1", "1-2" 형식
chapter: number; // 1, 2, 3 등
title: string; // "계 1:1~8 첫번째 곡" 형식
url: string; // "/songs/1-1.mp3" 형식 (public 폴더 기준)
duration: string; // "3:59" 형식
lyrics?: string; // 가사 텍스트
}
interface LyricLine {
time: number; // 타임스탬프 (초 단위)
text: string; // 가사 텍스트
}
## 3. 파일 구조
### 오디오 파일
- 위치: `/public/songs/`
- 형식: `{order}.mp3` (예: 1-1.mp3)

### 가사 파일
- 위치: `/public/lyrics/`
- 형식: `{order}.txt` (예: 1-1.txt)

## 4. 주요 기능
### 메인 화면
- 챕터별 곡 목록 표시
- 현재 재생 중인 곡 하단 고정 표시
- 재생/일시정지 컨트롤
- 시크바를 통한 구간 이동
- 현재 재생 시간 및 총 재생 시간 표시
- 볼륨 조절 기능
- 처음으로 돌아가기 기능

### 가사 기능
- 가사 표시/숨김 토글
- 자동 스크롤 기능
  - 현재 재생 구간에 맞춰 자동 스크롤
  - 자동 스크롤 ON/OFF 토글
- 가사 폰트 크기 조절 (14px ~ 30px)
- 가사 배경 그라데이션 효과
  - 다크모드: 블루-퍼플-핑크 그라데이션
  - 라이트모드: 파스텔 톤 그라데이션

### 테마 설정
- 다크모드/라이트모드 지원
- 설정 탭에서 테마 변경 가능
- 모드별 최적화된 UI
  - 다크모드: 어두운 배경, 밝은 텍스트
  - 라이트모드: 밝은 배경, 어두운 텍스트

### 상태 저장 (LocalStorage)
- 마지막 재생 상태 저장
  - 재생 중이던 곡
  - 재생 위치
  - 볼륨 설정
- 사용자 설정 저장
  - 다크모드 설정
  - 가사 폰트 크기
  - 자동 스크롤 상태

### 곡 목록 표시
- 챕터별 그룹화
- 순서 번호 표시
- 제목 표시
- 재생 시간 표시
- 현재 재생 중인 곡 하이라이트

### 플레이리스트 기능
- 재생목록 관리
  - 곡 추가/제거
  - 드래그 앤 드롭으로 순서 변경
  - 전체 삭제
  - 셔플 기능
  - 반복 재생 모드 (없음/한곡/전체)
  
- 플레이리스트 UI 개선
  - 현재 재생 중인 곡 하이라이트
  - 곡 순서 번호 표시
  - 챕터 정보 표시
  - 재생 시간 표시
  - 드래그 핸들 아이콘
  - 삭제 버튼
  
- 플레이리스트 상호작용
  - 곡 클릭 시 바로 재생
  - 드래그로 순서 변경 시 시각적 피드백
  - 삭제 시 확인 메시지
  - 플레이리스트 저장/불러오기

## 5. UI/UX 디자인
### 레이아웃
- 모바일 우선 디자인 (max-width: 768px)
- 하단 고정 플레이어
- 스크롤 가능한 곡 목록
- 전체화면 가사 보기

### 컬러 팔레트
- Primary: #3B82F6 (블루)
- Dark Mode:
  - Background: #000000
  - Text: #FFFFFF
  - Secondary: rgba(255, 255, 255, 0.6)
- Light Mode:
  - Background: #FFFFFF
  - Text: #1F2937
  - Secondary: #6B7280