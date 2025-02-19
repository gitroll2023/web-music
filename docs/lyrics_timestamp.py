import os
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from datetime import datetime
import pygame
import time
import threading

class LyricsTimestampGenerator:
    def __init__(self):
        self.window = tk.Tk()
        self.window.title("가사 타임스탬프 생성기")
        self.window.geometry("1200x600")
        
        # 변수 초기화
        self.mp3_path = tk.StringVar()
        self.lyrics_path = tk.StringVar()
        
        # 재생 관련 변수
        self.playing = False
        self.current_pos = 0
        self.music_length = 0
        self.play_start_time = 0
        self.play_start_pos = 0
        self.should_update = False
        
        # pygame 초기화
        pygame.mixer.init()
        self.mixer = pygame.mixer
        self.sound = None
        
        # UI 초기화
        self.setup_ui()
        self.setup_keybindings()
    
    def setup_ui(self):
        # 메인 프레임을 좌우로 분할
        main_frame = ttk.PanedWindow(self.window, orient='horizontal')
        main_frame.pack(fill='both', expand=True, padx=10, pady=5)
        
        # 왼쪽 프레임 (컨트롤)
        left_frame = ttk.Frame(main_frame)
        main_frame.add(left_frame)
        
        # 오른쪽 프레임 (가사 목록)
        right_frame = ttk.Frame(main_frame)
        main_frame.add(right_frame)
        
        # === 왼쪽 프레임 내용 ===
        # 파일 선택 프레임
        file_frame = ttk.LabelFrame(left_frame, text="파일 선택", padding="10")
        file_frame.pack(fill="x", pady=5)
        
        # MP3 파일 선택
        mp3_frame = ttk.Frame(file_frame)
        mp3_frame.pack(fill="x", padx=5, pady=5)
        
        ttk.Label(mp3_frame, text="MP3 파일:").pack(side="left")
        mp3_entry = ttk.Entry(mp3_frame, textvariable=self.mp3_path)
        mp3_entry.pack(side="left", fill="x", expand=True, padx=5)
        ttk.Button(mp3_frame, text="찾아보기", command=self.select_mp3).pack(side="left")
        
        lyrics_frame = ttk.Frame(file_frame)
        lyrics_frame.pack(fill="x", padx=5, pady=5)
        
        ttk.Label(lyrics_frame, text="가사 파일:").pack(side="left")
        lyrics_entry = ttk.Entry(lyrics_frame, textvariable=self.lyrics_path)
        lyrics_entry.pack(side="left", fill="x", expand=True, padx=5)
        ttk.Button(lyrics_frame, text="찾아보기", command=self.select_lyrics).pack(side="left")
        
        # 재생 컨트롤 프레임
        control_frame = ttk.LabelFrame(left_frame, text="재생 컨트롤", padding="10")
        control_frame.pack(fill="x", pady=5)
        
        # 재생 시간 표시
        self.time_label = ttk.Label(control_frame, text="00:00 / 00:00")
        self.time_label.pack(side="top", pady=5)
        
        # 재생 진행바
        self.progress_var = tk.DoubleVar()
        self.progress_bar = ttk.Scale(
            control_frame,
            from_=0,
            to=100,
            orient="horizontal",
            variable=self.progress_var,
            command=self.seek_position
        )
        self.progress_bar.pack(fill="x", padx=5, pady=5)
        
        # 재생 컨트롤 버튼
        btn_frame = ttk.Frame(control_frame)
        btn_frame.pack(fill="x", padx=5)
        
        ttk.Button(btn_frame, text="◀◀ -5초 (A)", command=lambda: self.seek(-5)).pack(side="left", padx=2)
        ttk.Button(btn_frame, text="⏯ 재생/일시정지 (Space)", command=self.toggle_play).pack(side="left", padx=2)
        ttk.Button(btn_frame, text="▶▶ +5초 (D)", command=lambda: self.seek(5)).pack(side="left", padx=2)
        ttk.Button(btn_frame, text="⟲ 구간반복 (R)", command=self.repeat_section).pack(side="left", padx=2)
        
        # 현재 가사 표시
        current_frame = ttk.LabelFrame(left_frame, text="현재 가사", padding="10")
        current_frame.pack(fill="x", pady=5)
        
        self.current_lyrics_label = ttk.Label(current_frame, text="", wraplength=400)
        self.current_lyrics_label.pack(fill="both", expand=True, pady=10)
        
        # 가사 컨트롤 프레임
        lyrics_control_frame = ttk.Frame(left_frame)
        lyrics_control_frame.pack(fill="x", pady=5)
        
        ttk.Button(lyrics_control_frame, text="← 이전 가사", command=self.prev_line).pack(side="left", padx=5)
        self.timestamp_button = ttk.Button(lyrics_control_frame, text="타임스탬프 기록 (T)", command=self.mark_timestamp)
        self.timestamp_button.pack(side="left", padx=5)
        ttk.Button(lyrics_control_frame, text="다음 가사 →", command=self.next_line).pack(side="left", padx=5)
        ttk.Button(lyrics_control_frame, text="타임스탬프 저장", command=self.save_timestamps).pack(side="right", padx=5)
        
        # === 오른쪽 프레임 내용 (가사 목록) ===
        lyrics_list_frame = ttk.LabelFrame(right_frame, text="가사 목록", padding="10")
        lyrics_list_frame.pack(fill="both", expand=True)
        
        # 가사 목록 표시
        self.lyrics_list = tk.Listbox(lyrics_list_frame, width=80, height=20)
        self.lyrics_list.pack(side="left", fill="both", expand=True)
        
        # 스크롤바 추가
        scrollbar = ttk.Scrollbar(lyrics_list_frame, orient="vertical", command=self.lyrics_list.yview)
        self.lyrics_list.configure(yscrollcommand=scrollbar.set)
        
        scrollbar.pack(side="right", fill="y")
        
        # 가사 목록에 더블클릭 이벤트 추가
        self.lyrics_list.bind('<Double-Button-1>', self.on_lyrics_double_click)
        
        # 단축키 안내
        shortcuts_text = (
            "단축키 안내:\n"
            "Space: 재생/일시정지 | ←/→: 이전/다음 가사\n"
            "A/D: 5초 뒤로/앞으로 | R: 구간 반복 | T: 타임스탬프 기록"
        )
        self.shortcuts_label = ttk.Label(self.window, text=shortcuts_text)
        self.shortcuts_label.pack(pady=5)
        
        # 상태 표시줄
        self.status_label = ttk.Label(self.window, text="")
        self.status_label.pack(pady=5)

        # 단축키 바인딩
        self.window.bind("<space>", lambda e: self.toggle_play())
        self.window.bind("<Left>", lambda e: self.prev_line())
        self.window.bind("<Right>", lambda e: self.next_line())
        self.window.bind("a", lambda e: self.seek(-5))
        self.window.bind("A", lambda e: self.seek(-5))
        self.window.bind("d", lambda e: self.seek(5))
        self.window.bind("D", lambda e: self.seek(5))
        self.window.bind("r", lambda e: self.repeat_section())
        self.window.bind("R", lambda e: self.repeat_section())
        self.window.bind("t", lambda e: self.mark_timestamp())
        self.window.bind("T", lambda e: self.mark_timestamp())

    def setup_keybindings(self):
        pass
    
    def select_mp3(self):
        filename = filedialog.askopenfilename(
            title="MP3 파일 선택",
            filetypes=[("MP3 files", "*.mp3")]
        )
        if filename:
            self.mp3_path.set(filename.replace('/', '\\'))
            self.load_mp3()
    
    def select_lyrics(self):
        filename = filedialog.askopenfilename(
            title="가사 파일 선택",
            filetypes=[("Text files", "*.txt")]
        )
        if filename:
            self.lyrics_path.set(filename.replace('/', '\\'))
            self.load_lyrics()
    
    def load_mp3(self):
        """MP3 파일 로드"""
        try:
            pygame.mixer.music.load(self.mp3_path.get())
            self.sound = pygame.mixer.Sound(self.mp3_path.get())
            self.music_length = self.sound.get_length()
            self.current_pos = 0
            self.playing = False
            self.should_update = False
            
            # 파일 로드 후 자동 재생
            self.start_playback()
            
            self.status_label.config(text="MP3 파일이 로드되었습니다")
            self.window.after(1000, lambda: self.status_label.config(text=""))
        except Exception as e:
            messagebox.showerror("Error", f"MP3 파일을 불러오는 중 오류가 발생했습니다: {str(e)}")
    
    def load_lyrics(self):
        try:
            with open(self.lyrics_path.get(), 'r', encoding='utf-8') as f:
                loaded_lyrics = [line.strip() for line in f.readlines() if line.strip()]
            
            # 첫 줄에 빈 줄 추가
            self.lyrics = [""] + loaded_lyrics
            
            # 타임스탬프 리스트 초기화
            self.timestamps = ["" for _ in self.lyrics]
            
            self.current_line = 0
            
            # 가사 목록 초기화
            self.update_lyrics_list()
            
            self.update_current_lyrics()
        except Exception as e:
            messagebox.showerror("오류", f"가사 파일을 읽는 중 오류가 발생했습니다: {str(e)}")
    
    def toggle_play(self):
        """재생/일시정지 토글"""
        if not self.mp3_path.get():
            return
            
        if not self.playing:
            # 재생 시작
            pygame.mixer.music.play(start=self.current_pos)
            self.play_start_time = time.time()
            self.play_start_pos = self.current_pos
            self.playing = True
            self.should_update = True
            self.update_progress()
        else:
            # 일시정지
            pygame.mixer.music.pause()
            self.current_pos = self.play_start_pos + (time.time() - self.play_start_time)
            self.playing = False
            self.should_update = False
            
        # 상태 메시지 업데이트
        status = "재생 중" if self.playing else "일시정지"
        self.status_label.config(text=status)
        self.window.after(1000, lambda: self.status_label.config(text=""))
    
    def start_playback(self):
        """처음부터 또는 특정 위치에서 재생 시작"""
        if not self.mp3_path.get():
            return
            
        pygame.mixer.music.play(start=self.current_pos)
        self.play_start_time = time.time()
        self.play_start_pos = self.current_pos
        self.playing = True
        self.should_update = True
        self.update_progress()
    
    def update_progress(self):
        """재생 진행 상태 업데이트"""
        if self.should_update and self.playing:
            if pygame.mixer.music.get_busy():
                # 현재 위치 업데이트
                self.current_pos = self.play_start_pos + (time.time() - self.play_start_time)
                self.update_time_display()
                self.window.after(100, self.update_progress)
            else:
                # 재생이 끝났을 때
                self.playing = False
                self.should_update = False
                self.current_pos = 0
                self.update_time_display()
    
    def stop_playback(self):
        pygame.mixer.music.pause()
        self.playing = False
        self.should_update = False
    
    def seek(self, seconds):
        """현재 위치에서 앞/뒤로 이동"""
        if not self.mp3_path.get():
            return
            
        # 새로운 위치 계산 (현재 시간 기준)
        new_pos = max(0, min(self.current_pos + seconds, self.music_length))
        
        # 현재 재생 상태 저장
        was_playing = self.playing
        
        # 새로운 위치에서 재생
        pygame.mixer.music.play(start=new_pos)
        self.current_pos = new_pos
        self.play_start_pos = new_pos
        self.play_start_time = time.time()
        
        # 이전 상태 복원
        if not was_playing:
            pygame.mixer.music.pause()
            self.playing = False
            self.should_update = False
        else:
            self.playing = True
            self.should_update = True
            
        # 시간 표시 업데이트
        self.update_time_display()
    
    def seek_position(self, value):
        if not self.mp3_path.get():
            return
        
        # 드래그 중에는 업데이트하지 않음
        if pygame.mixer.music.get_busy():
            pos = float(value) * self.music_length / 100
            pygame.mixer.music.play(start=pos)
            self.current_pos = pos
            self.play_start_time = time.time() - pos
            if not self.playing:
                pygame.mixer.music.pause()
    
    def seek_relative(self, seconds):
        if not self.mp3_path.get():
            return
        
        new_pos = max(0, min(self.current_pos + seconds, self.music_length))
        pygame.mixer.music.play(start=new_pos)
        self.current_pos = new_pos
        self.update_time_display()
    
    def repeat_section(self):
        """현재 가사의 구간을 반복 재생"""
        if not self.mp3_path.get() or not self.lyrics_path.get():
            return
            
        # 현재 가사의 타임스탬프 확인
        current_timestamp = self.timestamps[self.current_line]
        if not current_timestamp:
            self.status_label.config(text="현재 가사에 타임스탬프가 없습니다")
            self.window.after(1000, lambda: self.status_label.config(text=""))
            return
            
        # 현재 가사의 시작 시간 계산
        time_str = current_timestamp[1:-1]  # 대괄호 제거
        minutes, seconds = time_str.split(':')
        seconds, milliseconds = seconds.split('.')
        start_time = int(minutes) * 60 + int(seconds) + int(milliseconds) / 100
        
        # 다음 가사의 타임스탬프 찾기
        end_time = self.music_length
        for i in range(self.current_line + 1, len(self.timestamps)):
            if self.timestamps[i]:
                next_time_str = self.timestamps[i][1:-1]
                next_minutes, next_seconds = next_time_str.split(':')
                next_seconds, next_milliseconds = next_seconds.split('.')
                end_time = int(next_minutes) * 60 + int(next_seconds) + int(next_milliseconds) / 100
                break
        
        # 구간 반복 시작
        self.current_pos = start_time
        pygame.mixer.music.play(start=start_time)
        self.playing = True
        self.update_time_display()
        
        # 구간 반복 타이머 설정
        repeat_duration = (end_time - start_time) * 1000  # 밀리초 단위로 변환
        self.window.after(int(repeat_duration), self.repeat_callback, start_time, end_time)
        
        # 상태 메시지 표시
        duration = end_time - start_time
        self.status_label.config(text=f"현재 가사 구간 ({duration:.1f}초) 반복 재생 중")
        
    def repeat_callback(self, start_time, end_time):
        """구간 반복 콜백"""
        if self.playing:
            self.current_pos = start_time
            pygame.mixer.music.play(start=start_time)
            repeat_duration = (end_time - start_time) * 1000
            self.window.after(int(repeat_duration), self.repeat_callback, start_time, end_time)
    
    def update_time_label(self):
        current = self.format_time(self.current_pos)
        total = self.format_time(self.music_length)
        self.time_label.config(text=f"{current} / {total}")
    
    def format_time(self, seconds):
        minutes = int(seconds // 60)
        seconds = int(seconds % 60)
        return f"{minutes:02d}:{seconds:02d}"
    
    def mark_timestamp(self):
        if self.playing:
            self.timestamps[self.current_line] = self.get_current_timestamp()
            # 가사 목록 업데이트
            self.update_lyrics_list()
            # 현재 가사 업데이트
            self.update_current_lyrics()
            # 상태 메시지 표시
            self.status_label.config(text=f"타임스탬프가 기록되었습니다: {self.timestamps[self.current_line]}")
            # 자동으로 다음 가사로 이동
            self.next_line()

    def get_current_timestamp(self):
        current_time = self.current_pos
        minutes = int(current_time // 60)
        seconds = int(current_time % 60)
        milliseconds = int((current_time % 1) * 100)  # 2자리 밀리초
        return f"[{minutes:02d}:{seconds:02d}.{milliseconds:02d}]"
    
    def update_lyrics_list(self):
        self.lyrics_list.delete(0, tk.END)
        for i, (timestamp, lyric) in enumerate(zip(self.timestamps, self.lyrics)):
            if timestamp:
                display_text = f"{timestamp} {lyric}"
            elif not lyric.strip():  # 가사가 비어있거나 공백만 있는 경우
                display_text = f"[00:00.00] {lyric}"
            else:
                display_text = f"[--:--:--] {lyric}"
            
            self.lyrics_list.insert(tk.END, display_text)
            
            # 현재 선택된 라인이면서 타임스탬프가 있는 경우만 파란색으로 표시
            if i == self.current_line and timestamp:
                self.lyrics_list.selection_set(i)
                self.lyrics_list.see(i)  # 현재 라인이 보이도록 스크롤
                self.lyrics_list.itemconfig(i, fg='blue')
            else:
                self.lyrics_list.itemconfig(i, fg='black')  # 다른 라인은 검정색으로
                
    def update_current_lyrics(self):
        if 0 <= self.current_line < len(self.lyrics):
            # 트리뷰에서 현재 가사 선택
            self.lyrics_list.selection_set(self.current_line)
            self.lyrics_list.see(self.current_line)
            
            current_text = self.lyrics[self.current_line]
            if self.timestamps[self.current_line]:
                current_text = f"{self.timestamps[self.current_line]} {current_text}"
                self.timestamp_button.config(state="disabled")
            else:
                self.timestamp_button.config(state="normal")
            self.current_lyrics_label.config(text=current_text)
    
    def prev_line(self):
        if self.current_line > 0:
            self.current_line -= 1
            self.update_current_lyrics()
    
    def next_line(self):
        if self.current_line < len(self.lyrics) - 1:
            self.current_line += 1
            self.update_current_lyrics()
    
    def save_timestamps(self):
        if not self.lyrics_path.get() or not self.lyrics:
            messagebox.showwarning("경고", "저장할 가사가 없습니다.")
            return
            
        try:
            # 원본 파일 경로에서 디렉토리와 파일명 분리
            original_dir = os.path.dirname(self.lyrics_path.get())
            original_filename = os.path.basename(self.lyrics_path.get())
            filename_without_ext = os.path.splitext(original_filename)[0]
            
            # 현재 날짜와 시간을 파일명에 추가
            current_time = time.strftime("_%Y%m%d_%H%M%S")
            new_filename = f"{filename_without_ext}{current_time}.txt"
            save_path = os.path.join(original_dir, new_filename)
            
            # 타임스탬프와 가사를 함께 저장
            with open(save_path, 'w', encoding='utf-8') as f:
                for timestamp, lyric in zip(self.timestamps, self.lyrics):
                    if timestamp:
                        f.write(f"{timestamp} {lyric}\n")
                    else:
                        f.write(f"{lyric}\n")
            
            self.status_label.config(text=f"저장 완료: {new_filename}")
            self.window.after(3000, lambda: self.status_label.config(text=""))  # 3초 후 메시지 제거
            
        except Exception as e:
            messagebox.showerror("오류", f"저장 중 오류가 발생했습니다: {str(e)}")
    
    def update_time_display(self):
        if self.music_length > 0:
            minutes = int(self.current_pos // 60)
            seconds = int(self.current_pos % 60)
            current_time = f"{minutes:02d}:{seconds:02d}"
            
            total_minutes = int(self.music_length // 60)
            total_seconds = int(self.music_length % 60)
            total_time = f"{total_minutes:02d}:{total_seconds:02d}"
            
            self.time_label.config(text=f"{current_time} / {total_time}")
            
            # 프로그레스바 업데이트
            progress = (self.current_pos / self.music_length) * 100
            self.progress_var.set(progress)
    
    def on_lyrics_double_click(self, event):
        """가사 더블클릭 시 해당 위치로 이동"""
        selection = self.lyrics_list.selection()
        if not selection:
            return
            
        index = int(selection[0])
        if index < len(self.timestamps):
            # 선택한 가사의 타임스탬프로 이동
            timestamp = self.timestamps[index]
            if timestamp is not None:
                # 현재 재생 상태 저장
                was_playing = self.playing
                
                # 새로운 위치에서 재생 시작
                pygame.mixer.music.play(start=timestamp)
                self.current_pos = timestamp
                
                # 이전 상태가 일시정지였다면 다시 일시정지
                if not was_playing:
                    pygame.mixer.music.pause()
                else:
                    self.playing = True
                    self.should_update = True
                
                # 시간 표시 업데이트
                self.update_time_display()
    
    def run(self):
        self.window.mainloop()

if __name__ == "__main__":
    app = LyricsTimestampGenerator()
    app.run()
