class Minesweeper {
    constructor() {
        this.board = [];
        this.mineCount = 0;
        this.rows = 9;
        this.cols = 9;
        this.isGameOver = false;
        this.timer = 0;
        this.timerInterval = null;
        this.firstClick = true;

        // DOM 요소
        this.boardElement = document.getElementById('gameBoard');
        this.mineCountElement = document.getElementById('mineCount');
        this.timerElement = document.getElementById('timer');
        this.difficultySelect = document.getElementById('difficulty');
        this.newGameBtn = document.getElementById('newGameBtn');

        // 이벤트 리스너
        this.newGameBtn.addEventListener('click', () => this.startNewGame());
        this.difficultySelect.addEventListener('change', () => this.startNewGame());

        // 초기 게임 시작
        this.startNewGame();
    }

    startNewGame() {
        // 타이머 초기화
        clearInterval(this.timerInterval);
        this.timer = 0;
        this.timerElement.textContent = '0';
        this.firstClick = true;
        this.isGameOver = false;

        // 난이도에 따른 설정
        const difficulty = this.difficultySelect.value;
        switch(difficulty) {
            case 'beginner':
                this.rows = 9;
                this.cols = 9;
                this.mineCount = 10;
                break;
            case 'intermediate':
                this.rows = 16;
                this.cols = 16;
                this.mineCount = 40;
                break;
            case 'expert':
                this.rows = 16;
                this.cols = 30;
                this.mineCount = 99;
                break;
        }

        // 보드 초기화
        this.initializeBoard();
        this.mineCountElement.textContent = this.mineCount;
        this.renderBoard();
    }

    initializeBoard() {
        this.board = [];
        for(let i = 0; i < this.rows; i++) {
            this.board[i] = [];
            for(let j = 0; j < this.cols; j++) {
                this.board[i][j] = {
                    isMine: false,
                    isRevealed: false,
                    isFlagged: false,
                    neighborMines: 0
                };
            }
        }
    }

    placeMines(firstClickRow, firstClickCol) {
        let minesPlaced = 0;
        while(minesPlaced < this.mineCount) {
            const row = Math.floor(Math.random() * this.rows);
            const col = Math.floor(Math.random() * this.cols);
            
            // 첫 클릭 위치와 주변 8칸에는 지뢰를 놓지 않음
            if(!this.board[row][col].isMine && 
               !(Math.abs(row - firstClickRow) <= 1 && Math.abs(col - firstClickCol) <= 1)) {
                this.board[row][col].isMine = true;
                minesPlaced++;
            }
        }

        // 주변 지뢰 수 계산
        this.calculateNeighborMines();
    }

    calculateNeighborMines() {
        for(let i = 0; i < this.rows; i++) {
            for(let j = 0; j < this.cols; j++) {
                if(!this.board[i][j].isMine) {
                    let count = 0;
                    // 주변 8칸 확인
                    for(let di = -1; di <= 1; di++) {
                        for(let dj = -1; dj <= 1; dj++) {
                            const ni = i + di;
                            const nj = j + dj;
                            if(ni >= 0 && ni < this.rows && nj >= 0 && nj < this.cols) {
                                if(this.board[ni][nj].isMine) count++;
                            }
                        }
                    }
                    this.board[i][j].neighborMines = count;
                }
            }
        }
    }

    renderBoard() {
        this.boardElement.style.gridTemplateColumns = `repeat(${this.cols}, 30px)`;
        this.boardElement.innerHTML = '';

        for(let i = 0; i < this.rows; i++) {
            for(let j = 0; j < this.cols; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                
                // 셀 클릭 이벤트
                cell.addEventListener('click', () => this.handleClick(i, j));
                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.handleRightClick(i, j);
                });

                this.updateCellDisplay(cell, i, j);
                this.boardElement.appendChild(cell);
            }
        }
    }

    updateCellDisplay(cell, row, col) {
        const currentCell = this.board[row][col];
        
        if(currentCell.isRevealed) {
            cell.classList.add('revealed');
            if(currentCell.isMine) {
                cell.classList.add('mine');
                cell.textContent = '💣';
            } else if(currentCell.neighborMines > 0) {
                cell.textContent = currentCell.neighborMines;
                cell.setAttribute('data-number', currentCell.neighborMines);
            }
        } else if(currentCell.isFlagged) {
            cell.classList.add('flagged');
        }
    }

    handleClick(row, col) {
        if(this.isGameOver || this.board[row][col].isFlagged) return;

        if(this.firstClick) {
            this.firstClick = false;
            this.placeMines(row, col);
            this.startTimer();
        }

        const cell = this.board[row][col];
        if(cell.isMine) {
            this.gameOver();
            return;
        }

        this.revealCell(row, col);
        this.renderBoard();
        this.checkWin();
    }

    handleRightClick(row, col) {
        if(this.isGameOver || this.board[row][col].isRevealed) return;

        const cell = this.board[row][col];
        cell.isFlagged = !cell.isFlagged;
        
        // 남은 지뢰 수 업데이트
        let flagCount = 0;
        this.board.forEach(row => {
            row.forEach(cell => {
                if(cell.isFlagged) flagCount++;
            });
        });
        this.mineCountElement.textContent = this.mineCount - flagCount;

        this.renderBoard();
    }

    revealCell(row, col) {
        const cell = this.board[row][col];
        if(cell.isRevealed || cell.isFlagged) return;

        cell.isRevealed = true;

        if(cell.neighborMines === 0) {
            // 주변 8칸을 재귀적으로 열기
            for(let di = -1; di <= 1; di++) {
                for(let dj = -1; dj <= 1; dj++) {
                    const ni = row + di;
                    const nj = col + dj;
                    if(ni >= 0 && ni < this.rows && nj >= 0 && nj < this.cols) {
                        this.revealCell(ni, nj);
                    }
                }
            }
        }
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.timerElement.textContent = this.timer;
        }, 1000);
    }

    gameOver() {
        this.isGameOver = true;
        clearInterval(this.timerInterval);
        
        // 모든 지뢰 표시
        for(let i = 0; i < this.rows; i++) {
            for(let j = 0; j < this.cols; j++) {
                if(this.board[i][j].isMine) {
                    this.board[i][j].isRevealed = true;
                }
            }
        }
        
        this.renderBoard();

        // 파티클 효과 생성
        const createParticles = (cell) => {
            const numParticles = 10;
            const cellRect = cell.getBoundingClientRect();
            const centerX = cellRect.left + cellRect.width / 2;
            const centerY = cellRect.top + cellRect.height / 2;

            for (let i = 0; i < numParticles; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                
                // 랜덤 파티클 크기
                const size = Math.random() * 4 + 2;
                particle.style.width = `${size}px`;
                particle.style.height = `${size}px`;
                
                // 랜덤 방향
                const angle = (Math.PI * 2 * i) / numParticles;
                const velocity = 50 + Math.random() * 50;
                const tx = Math.cos(angle) * velocity;
                const ty = Math.sin(angle) * velocity;
                
                particle.style.left = `${centerX}px`;
                particle.style.top = `${centerY}px`;
                particle.style.setProperty('--tx', `${tx}px`);
                particle.style.setProperty('--ty', `${ty}px`);
                
                document.body.appendChild(particle);
                
                // 애니메이션 종료 후 파티클 제거
                particle.addEventListener('animationend', () => {
                    particle.remove();
                });
            }
        };

        // 폭발한 지뢰 셀에 파티클 효과 적용
        const mineCells = document.querySelectorAll('.cell.mine');
        mineCells.forEach(cell => {
            createParticles(cell);
        });

        setTimeout(() => alert('게임 오버!'), 1000);
    }

    checkWin() {
        let unrevealedSafeCells = 0;
        for(let i = 0; i < this.rows; i++) {
            for(let j = 0; j < this.cols; j++) {
                if(!this.board[i][j].isMine && !this.board[i][j].isRevealed) {
                    unrevealedSafeCells++;
                }
            }
        }

        if(unrevealedSafeCells === 0) {
            this.isGameOver = true;
            clearInterval(this.timerInterval);
            setTimeout(() => alert('승리!'), 100);
        }
    }
}

// 게임 인스턴스 생성
const game = new Minesweeper(); 